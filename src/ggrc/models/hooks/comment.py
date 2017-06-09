# Copyright (C) 2017 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""A module with Comment object creation hooks"""
from sqlalchemy import event

from ggrc.login import get_current_user
from ggrc.models.all_models import Comment, AccessControlList
from ggrc.access_control import role


def init_hook():
  """Initialize all hooks"""
  # pylint: disable=unused-variable
  @event.listens_for(Comment, "after_insert")
  def handle_comment_post(mapper, connection, target):
    """Save information on which user created the Comment object."""
    # pylint: disable=unused-argument
    for role_id, role_name in role.get_custom_roles_for(target.type).items():
      if role_name == "Admin":
        user = get_current_user()
        AccessControlList(
            ac_role_id=role_id,
            person=user if not user.is_anonymous() else None,
            object=target
        )
        return
