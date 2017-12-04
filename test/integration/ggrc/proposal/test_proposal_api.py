# Copyright (C) 2017 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

""" """

from ggrc.models import all_models
from integration.ggrc import TestCase
from integration.ggrc.api_helper import Api
from integration.ggrc.models import factories


class TestProposalApi(TestCase):

  def setUp(self):
    super(TestProposalApi, self).setUp()
    self.api = Api()
    self.client.get("/login")

  def test_simple_get_proposal(self):
    with factories.single_commit():
      control = factories.ControlFactory()
      proposal = factories.ProposalFactory(instance=control,
                                           content={"field": "a"},
                                           agenda="agenda content")
    instance_dict = {"id": control.id, "type": control.type}
    resp = self.api.get(all_models.Proposal, proposal.id)
    self.assert200(resp)
    self.assertIn("proposal", resp.json)
    data = resp.json["proposal"]
    self.assertIn("content", data)
    self.assertIn("instance", data)
    self.assertIn("agenda", data)
    self.assertDictEqual(instance_dict, data["instance"])
    self.assertDictEqual({"field": "a"}, data["content"])
    self.assertEqual("agenda content", data["agenda"])

  def test_simple_create_proposal(self):
    new_title = "2"
    control = factories.ControlFactory(title="1")
    control_id = control.id
    control.title = new_title
    self.assertEqual(0, len(control.comments))
    resp = self.api.post(
        all_models.Proposal,
        {"proposal": {
            "instance": {
                "id": control.id,
                "type": control.type,
            },
            # "content": {"123": 123},
            "full_instance_content": control.log_json(),
            "agenda": "update title from 1 to 2",
            "context": None,
        }})
    self.assertEqual(201, resp.status_code)
    control = all_models.Control.query.get(control_id)
    self.assertEqual(1, len(control.proposals))
    self.assertEqual({"fields": {"title": "2"}},
                     control.proposals[0].content)
    self.assertEqual(1, len(control.comments))
    self.assertEqual("update title from 1 to 2",
                     control.comments[0].description)

  def test_simple_apply_status(self):
    with factories.single_commit():
      control = factories.ControlFactory(title="1")
      proposal = factories.ProposalFactory(
          instance=control,
          content={"fields": {"title": "2"}},
          agenda="agenda content")
    control_id = control.id
    proposal_id = proposal.id
    self.assertEqual(proposal.STATES.PROPOSED, proposal.status)
    revisions = all_models.Revision.query.filter(
        all_models.Revision.resource_type == control.type,
        all_models.Revision.resource_id == control.id
    ).all()
    self.assertEqual(1, len(revisions))
    self.assertEqual(0, len(control.comments))
    resp = self.api.put(
        proposal,
        {
            "proposal": {
                "status": proposal.STATES.APPLIED,
                "apply_reason": "approved",
            }
        })
    self.assert200(resp)
    control = all_models.Control.query.get(control_id)
    proposal = all_models.Proposal.query.get(proposal_id)
    self.assertEqual(proposal.STATES.APPLIED, proposal.status)
    self.assertEqual("2", control.title)
    revisions = all_models.Revision.query.filter(
        all_models.Revision.resource_type == control.type,
        all_models.Revision.resource_id == control.id
    ).all()
    self.assertEqual(2, len(revisions))
    self.assertEqual("2", revisions[-1].content['title'])
    self.assertEqual(1, len(control.comments))
    self.assertEqual("approved",
                     control.comments[0].description)

  def test_simple_decline_status(self):
    with factories.single_commit():
      control = factories.ControlFactory(title="1")
      proposal = factories.ProposalFactory(
          instance=control,
          content={"fields": {"title": "2"}},
          agenda="agenda content")
    control_id = control.id
    proposal_id = proposal.id
    revisions = all_models.Revision.query.filter(
        all_models.Revision.resource_type == control.type,
        all_models.Revision.resource_id == control.id
    ).all()
    self.assertEqual(proposal.STATES.PROPOSED, proposal.status)
    self.assertEqual(1, len(revisions))
    self.assertEqual(0, len(control.comments))
    resp = self.api.put(
        proposal,
        {
            "proposal": {
                "status": proposal.STATES.DECLINED,
                "decline_reason": "declined bla",
            }
        })
    self.assert200(resp)
    control = all_models.Control.query.get(control_id)
    proposal = all_models.Proposal.query.get(proposal_id)
    self.assertEqual(proposal.STATES.DECLINED, proposal.status)
    self.assertEqual("1", control.title)
    revisions = all_models.Revision.query.filter(
        all_models.Revision.resource_type == control.type,
        all_models.Revision.resource_id == control.id
    ).all()
    self.assertEqual(1, len(revisions))
    self.assertEqual(1, len(control.comments))
    self.assertEqual("declined bla",
                     control.comments[0].description)
