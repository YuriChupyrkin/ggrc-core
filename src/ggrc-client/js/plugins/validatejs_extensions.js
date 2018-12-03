/*
    Copyright (C) 2018 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import validate from 'validate.js/validate';

validate.validators.custom = function(value, options, key, attributes) {
  console.log('custom validator arguments: ', arguments);
  return "is totally wrong";
};

validate.validators.issue_tracker_title = function(issue_tracker, options, key, attributes) {
  console.log('issue_tracker_title');
  if (attributes.can_use_issue_tracker) {
    if (!issue_tracker || (issue_tracker.enabled && !issue_tracker.title)) {
      return 'title cannot be blank';
    }
  }
};

validate.validators.issue_tracker_component_id = function(value, options, key, attributes) {
  console.log('issue_tracker_component_id');
  if (!value || (value.enabled && !value.component_id)) {
    return 'component_id cannot be blank';
  }
};

validate.validators.truly = function(value, options, key, attributes) {
  if (!value) {
    return 'is falsy';
  }
};
