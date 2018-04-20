/*
 Copyright (C) 2018 Google Inc., authors, and contributors
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

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
          return this.attr('instance.review_issue_link');
        },
      },
      isReviewed: {
        get() {
          return this.attr('reviewStatus') === 'reviewed';
        },
      },
    },
    instance: {},
    review: null,
    undo() {
      if (!this.attr('isReviewed')) {
        return;
      }

      this.updateReview('Unreviewed');
    },
    markReviewed() {
      if (this.attr('isReviewed')) {
        return;
      }

      this.updateReview('Reviewed');
    },
    updateReview(status) {
      let review = this.attr('review');

      // New instance doesn't have "review" object. Check it.
      if (!review) {
        this.createReview(status);
        return;
      }

      review.attr('status', status);
      review.save().then((data) => {
        this.attr('review', data);
      });
    },
    createReview(status) {
      const instance = this.attr('instance');
      const review = new CMS.Models.Review({
        notification_type: 'email',
        context: null,
        instance: {
          id: instance.attr('id'),
          type: instance.attr('type'),
        },
        status,
      });

      review.save().then((reviewInstance) => {
        this.attr('review', reviewInstance);
      });
    },
    getReview() {
      let review = this.attr('instance.review');

      if (!review) {
        return;
      }

      // Get e-tag
      new CMS.Models.Review(review).refresh().then((reviewInstance) => {
        this.attr('review', reviewInstance);
      });
    },
  },
  events: {
    inserted() {
      this.viewModel.getReview();
    },
    '{viewModel.instance} modelAfterSave'() {
      this.viewModel.getReview();
    },
  },
});
