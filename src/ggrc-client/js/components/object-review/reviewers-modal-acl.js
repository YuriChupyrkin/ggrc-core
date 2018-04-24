/*
 Copyright (C) 2018 Google Inc., authors, and contributors
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import template from './templates/reviewers-modal-acl.mustache';
const tag = 'reviewers-modal-acl';

export default can.Component.extend({
  tag,
  template,
  viewModel: {
    accessControlList: [],
  },
  events: {
    '{viewModel.accessControlList} length'() {
      this.viewModel.dispatch('validateForm');
    },
  },
});
