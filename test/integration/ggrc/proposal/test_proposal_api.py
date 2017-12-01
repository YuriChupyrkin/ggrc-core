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
                                           content={"field": "a"})
    resp = self.api.get(proposal, proposal.id)
    self.assert200(resp)


  def test_simple_create_proposal(self):
    new_title = "2"
    control = factories.ControlFactory(title="1")
    control_id = control.id
    control.title = new_title
    resp = self.api.post(
        all_models.Proposal,
        {"proposal": {
            "instance": {
                "id": control.id,
                "type": control.type,
            },
            "full_instance_content": control.log_json(),
            "agenda": "update title from 1 to 2",
        }})
    self.assert200(resp)
    control = all_models.Control.query.get(control_id)
    self.assertEqual(1, len(control.proposals))
    self.assertEqual({"fields": {"title": "2"}},
                     control.proposals[0].content)
