/*
 Copyright (C) 2017 Google Inc., authors, and contributors
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import template from './templates/related-proposals.mustache';
const tag = 'related-proposals';

export default can.Component.extend({
  tag,
  template,
  viewModel: {
    baseInstance: {},
    totalProposals: '',
    totalProposalsChanged(event) {
      const count = event.count;
      this.attr('totalProposals', count);
      this.dispatch({
        type: 'proposalsCountRefresh',
        count: count,
      });
    },
  },
});
