/*
 Copyright (C) 2018 Google Inc., authors, and contributors
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import {createNewInstance} from '../../plugins/utils/object-review-utils';
import Permission from '../../permission';
import './reviewers-modal';
import './object-review-history';

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
          return !this.attr('isReviewed') &&
            this.hasUpdatePermission() &&
            !this.isSnapshot();
        },
      },
      wasReviewed: {
        get() {
          // Check last reviewer. Reviewed review has to contain "reviewer"
          return !!this.attr('review.last_set_reviewed_by');
        },
      },
      isEmptySection: {
        get() {
          // Empty description area and user without permissions to see buttons
          return !this.attr('wasReviewed') &&
            !this.attr('isDisplayReviewerButtons');
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
      return Permission.is_allowed_for('update', this.attr('instance'));
    },
    isSnapshot() {
      const isSnapshot = this.attr('instance.snapshot');
      const isRevision = this.attr('instance.isRevision');

      return isSnapshot || isRevision;
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

      return createNewInstance(instance);
    },
    changeReviewers() {
      this.attr('reviewersModalState.open', true);
    },
    reviewersUpdated(event) {
      this.attr('review', event.review);
    },
  },
  events: {
    inserted() {
      this.viewModel.refreshReview();
    },
    '{viewModel.instance} modelAfterSave'() {
      this.viewModel.refreshReview();
    },
    // TODO: general solution
    // '{viewModel.instance} review_status'() {
    //   console.log('UPDATE!');
    //   this.viewModel.refreshReview();
    // },
  },
});
