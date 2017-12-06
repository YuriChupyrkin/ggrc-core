# Copyright (C) 2017 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Defines a Revision model for storing snapshots."""

import sqlalchemy as sa
import collections

from ggrc import db
from ggrc.models import mixins
from ggrc.models import reflection
from ggrc.models import types
from ggrc.models import utils
from ggrc.models import revision
from ggrc.fulltext import mixin as ft_mixin
from ggrc.fulltext import attributes
from ggrc.utils import referenced_objects


class JsonPolymorphicRelationship(utils.PolymorphicRelationship):

  def __call__(self, obj, json_obj):
    for field_name, prop_instance in obj.__class__.__dict__.iteritems():
      if prop_instance is self:
        instance = referenced_objects.get(json_obj[field_name]["type"],
                                          json_obj[field_name]["id"])
        assert isinstance(instance, Proposalable)
        return instance


class FullInstanceContentFased(utils.FasadeProperty):

  FIELD_NAME = "content"

  @staticmethod
  def generate_acl_diff(proposed, revisioned):
    proposed_acl = collections.defaultdict(set)
    revision_acl = collections.defaultdict(set)
    acl_ids = set()
    for acl in proposed:
      proposed_acl[acl["ac_role_id"]].add(acl["person"]["id"])
      acl_ids.add(acl["ac_role_id"])
    for acl in revisioned:
      revision_acl[acl["ac_role_id"]].add(acl["person"]["id"])
      acl_ids.add(acl["ac_role_id"])
    acl_dict = {}
    for role_id in acl_ids:
      deleted_person_ids = revision_acl[role_id] - proposed_acl[role_id]
      added_person_ids = proposed_acl[role_id] - revision_acl[role_id]
      if added_person_ids or deleted_person_ids:
        acl_dict[role_id] = {
            u"added": sorted(list(added_person_ids)),
            u"deleted": sorted(list(deleted_person_ids)),
        }
    return acl_dict

  @staticmethod
  def generate_cav_diff(instance, proposed, revisioned):
    proposed_cavs = {int(i["custom_attribute_id"]): i["attribute_value"]
                     for i in proposed}
    revisioned_cavs = {int(i["custom_attribute_id"]): i["attribute_value"]
                       for i in revisioned}
    diff = {}
    for cad in instance.custom_attribute_definitions:
      if cad.id not in proposed_cavs:
        continue
      proposed_val = proposed_cavs[cad.id]
      cad_not_setuped = cad.id not in revisioned_cavs
      if cad_not_setuped or proposed_val != revisioned_cavs[cad.id]:
        diff[cad.id] = proposed_val
    return diff

  def prepare(self, src):
    src = super(FullInstanceContentFased, self).prepare(src)
    instance = referenced_objects.get(src["instance"]["type"],
                                      src["instance"]["id"])
    updateable_fields = {
        k for k, v in
        reflection.AttributeInfo.gather_attr_dicts(
            instance.__class__,
            "_api_attrs").iteritems()
        if v.update
    }
    current_data = revision.Revision.query.filter(
        revision.Revision.resource_id == instance.id,
        revision.Revision.resource_type == instance.type
    ).order_by(
        revision.Revision.created_at.desc()
    ).first().content
    full_instance_content = src["full_instance_content"]
    diff_data = {
        f: full_instance_content[f]
        for f in updateable_fields
        if (f in full_instance_content and
            f in current_data and
            current_data[f] != full_instance_content[f])
    }
    return {
        "fields": diff_data,
        "access_control_list": self.generate_acl_diff(
            diff_data.pop("access_control_list", []),
            current_data.get("access_control_list", []),
        ),
        "custom_attribute_values": self.generate_cav_diff(
            instance,
            diff_data.pop("custom_attribute_values", []),
            current_data.get("custom_attribute_values", []),
        )
    }


class Proposal(mixins.Stateful, mixins.Base, ft_mixin.Indexed, db.Model):
  """Revision object holds a JSON snapshot of the object at a time."""

  __tablename__ = 'proposals'

  class STATES(object):
    PROPOSED = "proposed"
    APPLIED = "applied"
    DECLINED = "declined"

  VALID_STATES = [STATES.PROPOSED, STATES.APPLIED, STATES.DECLINED]

  instance_id = db.Column(db.Integer, nullable=False)
  instance_type = db.Column(db.String, nullable=False)
  content = db.Column('content', types.LongJsonType, nullable=False)
  agenda = db.Column(db.Text, nullable=False, default=u"")
  decline_reason = db.Column(db.Text, nullable=False, default=u"")
  decline_datetime = db.Column(db.DateTime, nullable=True)
  declined_by = db.Column(db.Integer,
                          db.ForeignKey('people.id'),
                          nullable=True)
  apply_reason = db.Column(db.Text, nullable=False, default=u"")
  apply_datetime = db.Column(db.DateTime, nullable=True)
  applied_by = db.Column(db.Integer,
                         db.ForeignKey('people.id'),
                         nullable=True)

  INSTANCE_TMPL = "{}_proposalable"

  instance = JsonPolymorphicRelationship("instance_id",
                                         "instance_type",
                                         INSTANCE_TMPL)

  _fulltext_attrs = [
      "instance_id",
      "instance_type",
      "agenda",
      "decline_reason",
      "decline_datetime",
      "apply_reason",
      "apply_datetime",
      attributes.FullTextAttr(
          "declined_by",
          "declined_by",
          ["email", "name"]
      ),
      attributes.FullTextAttr(
          "applied_by",
          "applied_by",
          ["email", "name"]
      ),
  ]

  _api_attrs = reflection.ApiAttributes(
      reflection.Attribute("instance", update=False),
      reflection.Attribute("content", create=False, update=False),
      reflection.Attribute("agenda", update=False),
      # ignore create proposal in specific state to be shure
      # new proposal will be only in proposed state
      reflection.Attribute('status', create=False),
      reflection.Attribute('decline_reason', create=False),
      reflection.Attribute('decline_datetime', create=False, update=False),
      reflection.Attribute('declined_by', create=False, update=False),
      reflection.Attribute('apply_reason', create=False),
      reflection.Attribute('apply_datetime', create=False, update=False),
      reflection.Attribute('applied_by', create=False, update=False),
      reflection.Attribute('full_instance_content',
                           create=True,
                           update=False,
                           read=False),
  )

  full_instance_content = FullInstanceContentFased()

  @staticmethod
  def _extra_table_args(_):
    return (db.Index("fk_instance", "instance_id", "instance_type"), )

  @property
  def link(self):
    return "generated link"


class Proposalable(object):

  @sa.ext.declarative.declared_attr
  def proposals(cls):  # pylint: disable=no-self-argument

    def join_function():
      return sa.and_(
          sa.orm.foreign(Proposal.instance_type) == cls.__name__,
          sa.orm.foreign(Proposal.instance_id) == cls.id,
      )

    return sa.orm.relationship(
        Proposal,
        primaryjoin=join_function,
        backref=Proposal.INSTANCE_TMPL.format(cls.__name__),
    )
