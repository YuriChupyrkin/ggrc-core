/*
 Copyright (C) 2018 Google Inc., authors, and contributors
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import {createNewInstance} from '../../plugins/utils/object-review-utils';
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
    parentInstance: null,
    notificationTypes,
    title: 'Assign Reviewer(s)',
    disabled: false,
    review: null,
    emptyComponentId: false,
    emptyAcl: false,
    define: {
      isEmailNotification: {
        get() {
          return this.attr('review.notification_type') === emailNotification;
        },
      },
    },
    modalState: {
      open: false,
    },
    prepareModalContent() {
      let review = this.attr('review');
      const parentInstance = this.attr('parentInstance');
      const defaultIssueTracker = {
        issue_type: 'Process',
        issue_severity: 'S2',
        issue_priority: 'P2',
      };

      if (!review) {
        review = createNewInstance(parentInstance);
        this.attr('review', review);
      } else {
        this.attr('review').backup();
      }

      if (!review.attr('issuetracker_issue')) {
        this.attr('originalIssueTracker', null);
        // set default issue tracker
        review.attr('issuetracker_issue', defaultIssueTracker);
      } else {
        this.attr(
          'originalIssueTracker',
          review.attr('issuetracker_issue').attr()
        );
      }

      this.attr('originalEmailComment', review.attr('email_message'));
    },
    cancel() {
      this.attr('modalState.open', false);
      this.attr('emptyComponentId', false);
      this.attr('emptyAcl', false);
      this.attr('disabled', false);
      this.attr('loading', false);
      this.attr('review').restore(true);
    },
    save() {
      if (!this.validateForm()) {
        return;
      }

      const review = this.attr('review');

      if (this.attr('isEmailNotification')) {
        review.attr('issuetracker_issue', this.attr('originalIssueTracker'));
      } else {
        review.attr('email_message', this.attr('originalEmailComment'));
      }

      console.log('SAVE');
      console.log(review);
    },
    validateForm() {
      const review = this.attr('review');
      let isFormInvalid;
      let emptyComponentId = false;
      let isEmptyAcl = !review.attr('access_control_list.length');
      this.attr('emptyAcl', isEmptyAcl);

      if (!this.attr('isEmailNotification')) {
        const componentId = review.attr('issuetracker_issue.component_id');
        emptyComponentId = Boolean(!componentId);
        this.attr('emptyComponentId', emptyComponentId);
      }

      isFormInvalid = isEmptyAcl || emptyComponentId;
      this.attr('disabled', isFormInvalid);

      return !isFormInvalid;
    },
  },
  events: {
    '{viewModel.modalState} open'() {
      if (this.viewModel.attr('modalState.open')) {
        this.viewModel.prepareModalContent();
      }
    },
    '{viewModel.review.access_control_list} length'() {
      this.viewModel.validateForm();
    },
  },
});
