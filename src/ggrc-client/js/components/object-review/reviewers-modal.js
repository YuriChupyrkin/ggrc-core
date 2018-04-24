/*
 Copyright (C) 2018 Google Inc., authors, and contributors
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import './reviewers-modal-acl';
import './reviewers-modal-issue-tracker';

import template from './templates/reviewers-modal.mustache';
const tag = 'reviewers-modal';

const emailNotification = 'email';
const notificationTypes = [
  {value: emailNotification, title: 'Email Notification'},
  {value: 'issue_tracker', title: 'Issue Link'},
];

export default can.Component.extend({
  tag,
  template,
  viewModel: {
    notificationTypes,
    accessControlList: [],
    issueTracker: {},
    notificationType: '',
    emailComment: '',
    title: 'Assign Reviewer(s)',
    disabled: false,
    review: null,
    emptyComponentId: false,
    define: {
      isEmailNotification: {
        get() {
          return this.attr('notificationType') === emailNotification;
        },
      },
    },
    modalState: {
      open: false,
    },
    prepareModalContent() {
      const review = this.attr('review');
      const defaultIssueTracker = {
        issue_type: 'Process',
        issue_severity: 'S2',
        issue_priority: 'P2',
      };

      this.attr('emailComment', '');

      if (!review) {
        this.attr('accessControlList', []);
        this.attr('notificationType', 'email');
        this.attr('issueTracker', defaultIssueTracker);
        return;
      }

      // copy needed properties from Revie object
      if (review.attr('issuetracker_issue')) {
        this.attr('issueTracker', review.attr('issuetracker_issue').attr());
      } else {
        this.attr('issueTracker', defaultIssueTracker);
      }

      this.attr(
        'accessControlList',
        review.attr('access_control_list').slice()
      );
      this.attr('notificationType', review.attr('notification_type'));
    },
    cancel() {
      this.attr('modalState.open', false);
      this.attr('emptyComponentId', false);
    },
    save() {
      if (!this.validateForm()) {
        return;
      }

      const updateReview = {
        access_control_list: this.attr('accessControlList').attr(),
        notification_type: this.attr('notificationType'),
      };

      if (this.attr('isEmailNotification')) {
        updateReview.email_message = this.attr('emailComment');
      } else {
        updateReview.issuetracker_issue = this.attr('issueTracker');
      }

      // TODO: save logic
      console.log(updateReview);
    },
    validateForm() {
      let isFormInvalid = false;

      if (!this.attr('isEmailNotification')) {
        const componentId = this.attr('issueTracker.component_id');
        const emptyComponentId = Boolean(!componentId);
        this.attr('emptyComponentId', emptyComponentId);

        isFormInvalid = isFormInvalid || emptyComponentId;
      }
      this.attr('disabled', isFormInvalid);

      return isFormInvalid;
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
