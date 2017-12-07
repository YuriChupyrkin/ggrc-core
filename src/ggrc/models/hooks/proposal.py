# Copyright (C) 2017 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""AccessControlList creation hooks."""

from sqlalchemy import inspect

from ggrc.services import signals
from ggrc.models import all_models
from ggrc.models import mixins
from ggrc.models import comment
from ggrc import login
from ggrc import db


def is_status_changed_to(required_status, obj):
  return (inspect(obj).attrs.status.history.has_changes() and
          obj.status == required_status)


def add_comment_to(obj, txt):
  if not isinstance(obj, comment.Commentable):
    return
  created_comment = all_models.Comment(
      description=txt,
      modified_by_id=login.get_current_user_id())
  all_models.Relationship(
      source=obj,
      destination=created_comment)


def build_text_comment(txt, proposal_link):
  return "{} \n\n link:{}".format(txt or "", proposal_link)


def apply_acl_proposal(obj):
  instance_acl_dict = {(l.ac_role_id, l.person_id): l
                       for l in obj.instance.access_control_list}
  person_ids = set()
  for role_id, data in obj.content.get("access_control_list", {}).iteritems():
    person_ids |= set(data["added"] + data["deleted"])
  person_dict = {p.id: p for p in all_models.Person.query.filter(
      all_models.Person.id.in_(person_ids))
  }
  acr_dict = {
      i.id: i for i in all_models.AccessControlRole.query.filter(
          all_models.AccessControlRole.object_type == obj.instance_type)
  }
  for role_id, data in obj.content.get("access_control_list", {}).iteritems():
    role_id = int(role_id)
    for add in data["added"]:
      if (role_id, add) not in instance_acl_dict:
        # add ACL if it hasn't added yet
        acl = all_models.AccessControlList(
            person=person_dict[add],
            ac_role=acr_dict[int(role_id)],
            object=obj.instance,
        )
        instance_acl_dict[(role_id, add)] = acl
    for delete in data["deleted"]:
      if (role_id, delete) in instance_acl_dict:
        db.session.delete(instance_acl_dict[(role_id, delete)])


def apply_cav_proposal(obj):
  if not isinstance(obj.instance,
                    mixins.customattributable.CustomAttributable):
    return
  cad_dict = {d.id: d for d in obj.instance.custom_attribute_definitions}
  cav_dict = {i.custom_attribute_id: i
              for i in obj.instance.custom_attribute_values}
  proposals = obj.content.get("custom_attribute_values", {})
  for cad_id, value in proposals.iteritems():
    cad_id = int(cad_id)
    if cad_id in cav_dict:
      cav_dict[cad_id].attribute_value = value["attribute_value"]
      cav_dict[cad_id].attribute_object_id = value["attribute_object_id"]
    else:
      all_models.CustomAttributeValue(
          custom_attribute=cad_dict[cad_id],
          attributable=obj.instance,
          attribute_value=value["attribute_value"],
          attribute_object_id=value["attribute_object_id"],
      )


def apply_proposal(
    sender, obj=None, src=None, service=None,
    event=None, initial_state=None):  # noqa
  if not is_status_changed_to(obj.STATES.APPLIED, obj):
    return
  for field, value in obj.content.get("fields", {}).iteritems():
    if hasattr(obj.instance, field):
      setattr(obj.instance, field, value)
  apply_acl_proposal(obj)
  apply_cav_proposal(obj)
  add_comment_to(obj.instance, obj.apply_reason or "")


def decline_proposal(
    sender, obj=None, src=None, service=None,
    event=None, initial_state=None):  # noqa
  if not is_status_changed_to(obj.STATES.DECLINED, obj):
    return
  add_comment_to(obj.instance, obj.decline_reason or "")


def make_proposal(
    sender, obj=None, src=None, service=None,
    event=None, initial_state=None):  # noqa
  add_comment_to(obj.instance, obj.agenda or "")


def init_hook():
  signals.Restful.model_posted.connect(make_proposal,
                                       all_models.Proposal,
                                       weak=False)
  signals.Restful.model_put.connect(apply_proposal,
                                    all_models.Proposal,
                                    weak=False)
  signals.Restful.model_put.connect(decline_proposal,
                                    all_models.Proposal,
                                    weak=False)
