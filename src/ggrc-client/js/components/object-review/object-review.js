/*
 Copyright (C) 2018 Google Inc., authors, and contributors
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import Permission from '../../permission';
import './reviewers-modal';

import template from './templates/object-review.mustache';
const tag = 'object-review';

export default can.Component.extend({
  tag,
  template,
  viewModel: {
    define: {
      reviewStatus: {
        get() {
          let status = this.attr('review.status');

          // get 'review status' from instance if 'review' isn't inited
          if (!status) {
            status = this.attr('instance.review_status');
          }

          return status.toLowerCase();
        },
      },
      reviewIssueLink: {
        get() {
          return this.attr('review.issuetracker_issue.issue_url');
        },
      },
      isReviewed: {
        get() {
          return this.attr('reviewStatus') === 'reviewed';
        },
      },
      isDisplayUndo: {
        get() {
          return this.attr('isReviewed') &&
            this.attr('canUndo') &&
            this.hasUpdatePermission();
        },
      },
      isDisplayReviewerButtons: {
        get() {
          return !this.attr('isReviewed') && this.hasUpdatePermission();
        },
      },
      wasReviewed: {
        get() {
          return true;

          // Check last reviewer. Reviewed review has to contain "reviewer"
          return !!this.attr('review.last_set_reviewed_by');
        },
      },
      isEmptySection: {
        get() {
          // Empty description area and user without permissions to see buttons
          return !this.attr('wasReviewed') && !this.hasUpdatePermission();
        },
      },
    },
    instance: {},
    review: null,
    canUndo: false,
    loading: false,
    reviewersModalState: {
      open: false,
    },
    hasUpdatePermission() {
      const instance = this.attr('instance');
      return Permission.is_allowed_for('update', instance);
    },
    changeReviewState(markReviewed) {
      if (this.attr('isReviewed') === markReviewed) {
        return;
      }

      const status = markReviewed ? 'Reviewed' : 'Unreviewed';
      const review = this.getReviewOrDefault();
      review.attr('status', status);

      this.attr('loading', true);
      this.updateReview(review).then((reviewInstance) => {
        this.attr('review', reviewInstance);
        this.attr('canUndo', markReviewed);
        this.attr('loading', false);
      });
    },
    updateReview(review) {
      if (!review.isNew()) {
        return review.save();
      }

      return review.save().then((reviewInstance) => {
        /*
          Workaround.
          Create backup because 'POST' request doesn't return 'e-tag'.
          Created backup helps to resolve conflicts in 'cacheable_conflict_resolution.js'
        */
        reviewInstance.backup();
        return reviewInstance;
      });
    },
    refreshReview() {
      let review = this.attr('instance.review');

      if (!review) {
        return;
      }

      // Get e-tag
      new CMS.Models.Review(review).refresh().then((reviewInstance) => {
        this.attr('review', reviewInstance);
      });
    },
    getReviewOrDefault() {
      const instance = this.attr('instance');
      let review = this.attr('review');

      // New instance doesn't have "review" object. Check it.
      if (review) {
        return review;
      }

      review = new CMS.Models.Review({
        notification_type: 'email',
        context: null,
        instance: {
          id: instance.attr('id'),
          type: instance.attr('type'),
        },
      });

      return review;
    },
    changeReviewers() {
      this.attr('reviewersModalState.open', true);
    },
  },
  events: {
    inserted() {
      this.viewModel.refreshReview();
    },
    // TODO: is need?
    '{viewModel.instance} modelAfterSave'() {
      /* solution #1: */
      // this.viewModel.getReview();

      /* solution #2: */
      // const vm = this.viewModel;
      // const review = new CMS.Models.Review(vm.attr('instance.review'));
      // this.viewModel.attr('review', review);
    },
  },
});
