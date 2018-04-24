/*
 Copyright (C) 2018 Google Inc., authors, and contributors
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import template from './templates/reviewers-modal.mustache';
const tag = 'reviewers-modal';

export default can.Component.extend({
  tag,
  template,
  viewModel: {
    accessControlList: [],
    issueTracker: {},
    notificationType: '',
    emailComment: '',
    title: 'Assign Reviewer(s)',
    isLoading: false,
    review: null,
    modalState: {
      open: false,
    },
    prepareModalContent() {
      const review = this.attr('review');

      this.attr('emailComment', '');

      if (!review) {
        this.attr('accessControlList', []);
        this.attr('notificationType', 'email');
        this.attr('issueTracker', {});
        return;
      }

      // copy needed properties from Revie object
      if (review.attr('issuetracker_issue')) {
        this.attr('issueTracker', review.attr('issuetracker_issue').attr());
      } else {
        this.attr('issueTracker', {});
      }

      this.attr(
        'accessControlList',
        review.attr('access_control_list').slice()
      );
      this.attr('notificationType', review.attr('notification_type'));
    },
    cancel() {
      console.log('CANCEL');
      this.attr('modalState.open', false);
    },
    save() {
      console.log('SAVE');
    },
  },
  events: {
    '{viewModel.modalState} open'() {
      if (this.viewModel.attr('modalState.open')) {
        this.viewModel.prepareModalContent();
      }
    },
  },
});
