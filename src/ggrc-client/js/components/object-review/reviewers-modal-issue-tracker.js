/*
 Copyright (C) 2018 Google Inc., authors, and contributors
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import template from './templates/reviewers-modal-issue-tracker.mustache';
const tag = 'reviewers-modal-issue-tracker';

const severities = ['S0', 'S1', 'S2', 'S3', 'S4'];
const priorities = ['P0', 'P1', 'P2', 'P3', 'P4'];

export default can.Component.extend({
  tag,
  template,
  viewModel: {
    priorities,
    severities,
    issueTracker: {},
    emptyComponentId: false,
  },
  events: {
    '{viewModel.issueTracker} component_id'() {
      this.viewModel.dispatch('validateForm');
    },
  },
});
