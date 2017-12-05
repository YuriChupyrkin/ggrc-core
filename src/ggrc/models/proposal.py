# Copyright (C) 2017 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Defines a Revision model for storing snapshots."""

import sqlalchemy as sa
import deepdiff

from ggrc import db
from ggrc.models import mixins
from ggrc.models import reflection
from ggrc.models import types
from ggrc.models import utils
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
    current_data = {
        k: v for k, v in instance.log_json().iteritems()
        if k in updateable_fields
    }
    proposed_data = {
        k: v for k, v in src["full_instance_content"].iteritems()
        if k in updateable_fields
    }
    diff = deepdiff.DeepDiff(current_data, proposed_data)["values_changed"]
    fields = {}
    for field, diff in diff.iteritems():
      if field.startswith("root['"):
        field = field[6:-2]
      fields[field] = diff["new_value"]
    return {"fields": fields}


class Proposal(mixins.Stateful, mixins.Base, db.Model):
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
