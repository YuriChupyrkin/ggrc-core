/*
 Copyright (C) 2018 Google Inc., authors, and contributors
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import {NAVIGATE_TO_TAB} from '../../events/eventTypes';
import template from './templates/object-review-history.mustache';
const tag = 'object-review-history';

export default can.Component.extend({
  tag,
  template,
  viewModel: {
    define: {
      canDisplayLink: {
        get() {
          return !!this.attr('review.id');
        },
      },
    },
    baseInstance: {},
    isReviewed: false,
    review: null,
    loading: false,
    title: 'Review History',
    historyContent: [],
    modalState: {
      open: false,
    },
    showHistory() {
      if (!this.attr('canDisplayLink')) {
        return;
      }

      this.attr('modalState.open', true);

      if (!this.attr('historyContent').length) {
        this.loadHistory();
      }
    },
    cancel() {
      this.attr('modalState.open', false);
    },
    loadHistory() {
      this.attr('loading', true);
      this.attr('historyContent', []);

      this.buildRevisionRequest('resource').then((data) => {
        this.attr('loading', false);

        if (!data || !data.length) {
          return;
        }

        let historyContent = data.map((revision) => revision.content);
        this.attr('historyContent', historyContent);
      });
    },
    buildRevisionRequest(attr) {
      const query = {__sort: '-updated_at'};
      query[attr + '_type'] = this.attr('review.type');
      query[attr + '_id'] = this.attr('review.id');
      return CMS.Models.Revision.findAll(query);
    },
    resetCachedHistory() {
      this.attr('historyContent', []);
    },
    showLastChanges() {
      this.cancel();
      this.attr('baseInstance').dispatch({
        ...NAVIGATE_TO_TAB,
        tabId: 'change-log',
      });
    },
  },
  events: {
    '{viewModel.review} change'() {
      // reset cached history after change of review instance
      this.viewModel.resetCachedHistory();
    },
  },
});
