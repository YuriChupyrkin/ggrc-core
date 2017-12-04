# Copyright (C) 2017 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""AccessControlList creation hooks."""

from sqlalchemy import inspect

from ggrc.services import signals
from ggrc.models import all_models


def upsert_all(
    sender, obj=None, src=None, service=None,
    event=None, initial_state=None):  # noqa
  if not inspect(obj).attrs.status.history.has_changes():
    return
  if obj.status != obj.STATES.APPLIED:
    return
  for field, value in obj.content["fields"].iteritems():
    if hasattr(obj.instance, field):
      setattr(obj.instance, field, value)


def init_hook():
  signals.Restful.model_put.connect(upsert_all,
                                    all_models.Proposal,
                                    weak=False)
