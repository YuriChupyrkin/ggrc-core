# Copyright (C) 2017 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Defines a Revision model for storing snapshots."""

import sqlalchemy as sa

from ggrc import db
from ggrc import models
from ggrc import login


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
  declined_by= db.Column(db.Integer, db.ForeignKey('people.id'), nullable=False)
  apply_reason = db.Column(db.Text, nullable=False, default=u"")
  apply_datetime = db.Column(db.DateTime, nullable=True)
  applied_by= db.Column(db.Integer, db.ForeignKey('people.id'), nullable=False)

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
      models.reflection.Attribute('declined_by',
                                  create=False,
                                  update=False),
      models.reflection.Attribute('apply_reason', create=False),
      models.reflection.Attribute('apply_datetime',
                                  create=False,
                                  update=False),
      models.reflection.Attribute('applied_by',
                                  create=False,
                                  update=False),
  )

  @staticmethod
  def _extra_table_args(_):
    return (
        db.Index("fk_instance", "instance_id", "instance_type"),
    )

  @property
  def link(self):
    return "generated link"

  def add_comment(self, text):
    if not isinstance(self.instance, models.comment.Commentable):
      return
    comment = models.Comment(
        description=u"{} \n link:{}".format(text, self.link),
        modified_by_id=login.get_current_user_id())
    models.Relationship(source=self.instance, destination=comment)

  def send_notification(self, text):
    if not isinstance(self.instance, models.mixins.Notifiable):
      return
    # get notification type
    # create notification

  def propose_action(self):
    assert self.status == self.STATES.PROPOSED
    self.send_notification(self.agenda)
    self.add_comment(self.agenda)

  def decline_action(self):
    assert self.status == self.STATES.DECLINED
    self.send_notification(self.decline_reason)
    self.add_comment(self.decline_reason)

  def apply_action(self):
    assert self.status == self.STATES.APPLIED
    self.send_notification(self.apply_reason)
    self.add_comment(self.apply_reason)
    for field, value in self.content.iteritems():
      if hasattr(self.instance, field):
        setattr(self.instance, field, value)
    # create revision

    # send


class Proposalable(object):

  @sa.ext.declarative.declared_attr
  def _proposals(cls):  # pylint: disable=no-self-argument

    def join_function():
      return sa.and_(
          sa.orm.foreign(Proposal.object_type) == cls.__name__,
          sa.orm.foreign(Proposal.object_id) == cls.id,
      )

    return sa.orm.relationship(
        Proposal,
        primaryjoin=join_function,
        backref=Proposal.INSTANCE_TMPL.format(cls.__name__),
    )
