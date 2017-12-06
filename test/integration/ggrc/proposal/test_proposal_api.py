# Copyright (C) 2017 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

""" """
import ddt
import collections

from ggrc.models import all_models
from integration.ggrc import TestCase
from integration.ggrc.api_helper import Api
from integration.ggrc.models import factories


@ddt.ddt
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
    self.assertIn("fields", control.proposals[0].content)
    self.assertEqual({"title": "2"}, control.proposals[0].content["fields"])
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

  def test_proposal_for_acl(self):
    with factories.single_commit():
      control = factories.ControlFactory(title="1")
      role = factories.AccessControlRoleFactory(name="role")
      person = factories.PersonFactory()
    control_id = control.id
    role_id = role.id
    person_id = person.id
    control_content = control.log_json()
    control_content["access_control_list"] = [
        {"ac_role_id": role_id, "person": {"type": "Person", "id": person.id}}
    ]
    resp = self.api.post(
        all_models.Proposal,
        {"proposal": {
            "instance": {
                "id": control.id,
                "type": control.type,
            },
            # "content": {"123": 123},
            "full_instance_content": control_content,
            "agenda": "update access control roles",
            "context": None,
        }})
    self.assertEqual(201, resp.status_code)
    control = all_models.Control.query.get(control_id)
    self.assertEqual(1, len(control.proposals))
    self.assertIn("access_control_list", control.proposals[0].content)
    self.assertEqual({unicode(role_id): {"added": [person_id], "deleted": []}},
                     control.proposals[0].content["access_control_list"])
    self.assertEqual(1, len(control.comments))
    self.assertEqual("update access control roles",
                     control.comments[0].description)

  def test_proposal_delete_acl(self):
    with factories.single_commit():
      control = factories.ControlFactory(title="1")
      role = factories.AccessControlRoleFactory(name="role")
      person = factories.PersonFactory()
      factories.AccessControlListFactory(
          person=person,
          ac_role=role,
          object=control,
      )
    with factories.single_commit():
      latest_revision = all_models.Revision.query.filter(
          all_models.Revision.resource_id == control.id,
          all_models.Revision.resource_type == control.type
      ).order_by(
          all_models.Revision.created_at.desc()
      ).first()
      latest_revision.content = control.log_json()

    control_id = control.id
    role_id = role.id
    person_id = person.id
    control_content = control.log_json()
    control_content["access_control_list"] = []
    resp = self.api.post(
        all_models.Proposal,
        {"proposal": {
            "instance": {
                "id": control.id,
                "type": control.type,
            },
            # "content": {"123": 123},
            "full_instance_content": control_content,
            "agenda": "delete access control roles",
            "context": None,
        }})
    self.assertEqual(201, resp.status_code)
    control = all_models.Control.query.get(control_id)
    self.assertEqual(1, len(control.proposals))
    self.assertIn("access_control_list", control.proposals[0].content)
    self.assertEqual({unicode(role_id): {"added": [], "deleted": [person_id]}},
                     control.proposals[0].content["access_control_list"])
    self.assertEqual(1, len(control.comments))
    self.assertEqual("delete access control roles",
                     control.comments[0].description)

  def test_apply_acl(self):
    with factories.single_commit():
      control = factories.ControlFactory(title="1")
      role_1 = factories.AccessControlRoleFactory(
          name="role_1", object_type="Control")
      role_2 = factories.AccessControlRoleFactory(
          name="role_2", object_type="Control")
      role_3 = factories.AccessControlRoleFactory(
          name="role_3", object_type="Control")
      role_4 = factories.AccessControlRoleFactory(
          name="role_4", object_type="Control")
      role_5 = factories.AccessControlRoleFactory(
          name="role_5", object_type="Control")
      person_1 = factories.PersonFactory()
      person_2 = factories.PersonFactory()
      person_3 = factories.PersonFactory()
      factories.AccessControlListFactory(
          person=person_1,
          ac_role=role_1,
          object=control,
      )
      factories.AccessControlListFactory(
          person=person_2,
          ac_role=role_2,
          object=control,
      )
      factories.AccessControlListFactory(
          person=person_3,
          ac_role=role_3,
          object=control,
      )
      for person in [person_1, person_2, person_3]:
        factories.AccessControlListFactory(
            person=person,
            ac_role=role_4,
            object=control,
        )

    with factories.single_commit():
      proposal = factories.ProposalFactory(
          instance=control,
          content={
              "access_control_list": {
                  role_1.id: {
                      "added": [person_2.id],
                      "deleted": []
                  },
                  role_2.id: {
                      "added": [person_1.id],
                      "deleted": [person_2.id]
                  },
                  role_3.id: {
                      "added": [person_3.id],
                      "deleted": [person_2.id]
                  },
                  role_4.id: {
                      "added": [],
                      "deleted": [person_1.id, person_2.id, person_3.id]
                  },
                  role_5.id: {
                      "added": [person_1.id, person_2.id, person_3.id],
                      "deleted": [],
                  },

              }
          },
          agenda="agenda content")
    control_id = control.id
    person_1_id = person_1.id
    person_2_id = person_2.id
    person_3_id = person_3.id
    role_1_id = role_1.id
    role_2_id = role_2.id
    role_3_id = role_3.id
    role_4_id = role_4.id
    role_5_id = role_5.id
    self.assertEqual(proposal.STATES.PROPOSED, proposal.status)
    revisions = all_models.Revision.query.filter(
        all_models.Revision.resource_type == control.type,
        all_models.Revision.resource_id == control.id
    ).all()
    self.assertEqual(1, len(revisions))
    resp = self.api.put(
        proposal, {"proposal": {"status": proposal.STATES.APPLIED}})
    self.assert200(resp)
    control = all_models.Control.query.get(control_id)
    result_dict = collections.defaultdict(set)
    for acl in control.access_control_list:
      result_dict[acl.ac_role_id].add(acl.person_id)
    self.assertEqual({person_1_id, person_2_id}, result_dict[role_1_id])
    self.assertEqual({person_1_id}, result_dict[role_2_id])
    self.assertEqual({person_3_id}, result_dict[role_3_id])
    self.assertEqual(set([]), result_dict[role_4_id])
    self.assertEqual({person_1_id, person_2_id, person_3_id},
                     result_dict[role_5_id])

  def test_change_cad(self):
    with factories.single_commit():
      control = factories.ControlFactory(title="1")
      cad = factories.CustomAttributeDefinitionFactory(
          definition_type="control")
      factories.CustomAttributeValueFactory(
          custom_attribute=cad,
          attributable=control,
          attribute_value="123")
    control_id = control.id
    cad_id = cad.id
    data = control.log_json()
    data["custom_attribute_values"][0]["attribute_value"] = "321"
    resp = self.api.post(
        all_models.Proposal,
        {"proposal": {
            "instance": {
                "id": control.id,
                "type": control.type,
            },
            # "content": {"123": 123},
            "full_instance_content": data,
            "agenda": "update cav",
            "context": None,
        }})
    self.assertEqual(201, resp.status_code)
    control = all_models.Control.query.get(control_id)
    self.assertEqual(1, len(control.proposals))
    self.assertIn("custom_attribute_values", control.proposals[0].content)
    self.assertEqual({unicode(cad_id): u"321"},
                     control.proposals[0].content["custom_attribute_values"])
    self.assertEqual(1, len(control.comments))
    self.assertEqual("update cav", control.comments[0].description)

  def test_apply_cad(self):
    with factories.single_commit():
      control = factories.ControlFactory(title="1")
      cad = factories.CustomAttributeDefinitionFactory(
          definition_type="control")
    control_id = control.id
    proposal = factories.ProposalFactory(
        instance=control,
        content={"custom_attribute_values": {cad.id: "321"}},
        agenda="agenda content")
    revisions = all_models.Revision.query.filter(
        all_models.Revision.resource_type == control.type,
        all_models.Revision.resource_id == control.id
    ).all()
    self.assertEqual(1, len(revisions))
    resp = self.api.put(
        proposal, {"proposal": {"status": proposal.STATES.APPLIED}})
    self.assert200(resp)
    control = all_models.Control.query.get(control_id)
    revisions = all_models.Revision.query.filter(
        all_models.Revision.resource_type == control.type,
        all_models.Revision.resource_id == control.id
    ).all()
    self.assertEqual(2, len(revisions))
    self.assertEqual(
        "321",
        control.custom_attribute_values[0].attribute_value)
