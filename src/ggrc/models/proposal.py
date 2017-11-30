# Copyright (C) 2017 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Defines a Revision model for storing snapshots."""

from ggrc import db
from ggrc import models


class Proposal(models.mixins.Stateful,
               models.mixins.Base,
               db.Model):
  """Revision object holds a JSON snapshot of the object at a time."""

  __tablename__ = 'proposal'

  class STATES(object):
    PROPOSED = "proposed"
    APPLIED = "applied"
    DECLINED = "declined"

  VALID_STATES = [STATES.PROPOSED, STATES.APPLIED, STATES.DECLINED]

  instance_id = db.Column(db.Integer, nullable=False)
  instance_type = db.Column(db.String, nullable=False)
  content = db.Column('content', models.types.LongJsonType, nullable=False)
  agenda = db.Column(db.Text, nullable=False, default=u"")
  decline_reason = db.Column(db.Text, nullable=False, default=u"")
  decline_datetime = db.Column(db.DateTime, nullable=True)
  apply_reason = db.Column(db.Text, nullable=False, default=u"")
  apply_datetime = db.Column(db.DateTime, nullable=True)

  INSTANCE_TMPL = "{}_proposalable"

  instance = models.utils.PolymorphicRelationship("instance_id",
                                                  "instance_type",
                                                  INSTANCE_TMPL)

  _api_attrs = models.reflection.ApiAttributes(
      models.reflection.Attribute("instance", update=False),
      models.reflection.Attribute("content", update=False),
      models.reflection.Attribute("agenda", update=False),
      # ignore create proposal in specific state to be shure
      # new proposal will be only in proposed state
      models.reflection.Attribute('status', create=False),
      models.reflection.Attribute('decline_reason', create=False),
      models.reflection.Attribute('decline_datetime',
                                  create=False,
                                  update=False),
      models.reflection.Attribute('apply_reason', create=False),
      models.reflection.Attribute('apply_datetime',
                                  create=False,
                                  update=False),
  )

  @staticmethod
  def _extra_table_args(_):
    return (
        db.Index("fk_instance", "instance_id", "instance_type"),
    )
