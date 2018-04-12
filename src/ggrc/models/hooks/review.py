# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Review object hooks."""

from ggrc import login



from ggrc.models import all_models
from ggrc.models import review
from sqlalchemy import event


def update_reviewable_status_on_review_update(mapper, connection, target):
  if not target.review:
    return
  target.review.status = all_models.Review.STATES.UNREVIEWED
  target.review.agenda = "{user_email} made change in {target_slug}".format(
      user_email=target.modified_by.display_name,
      target_slug=target.slug,
  )


def init_hook():
  """Init proposal signal handlers."""
  for model in all_models.all_models:
    if issubclass(model, review.Reviewable):
      event.listen(model,
                   "before_update",
                   update_reviewable_status_on_review_update)
