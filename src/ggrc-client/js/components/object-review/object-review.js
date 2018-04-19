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
          return (this.attr('instance.review_status') || '').toLowerCase();
        },
      },
      reviewIssueLink: {
        get() {
          return this.attr('instance.review_issue_link');
        },
      },
      isReviewed: {
        get() {
          return !this.attr('needInitReview') &&
            this.attr('reviewStatus') === 'Reviewed';
          //return this.attr('review.status') === 'Reviewed';
        },
      },
      review: {
        get() {
          return this.attr('instance.review');
        },
      },
      needInitReview: {
        get() {
          return !this.attr('review');
        },
      },
    },
    instance: {},
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
      review.attr('status', 'status');
      new CMS.Models.Review(review).save().then((data) => {
        console.log('update Review');
        console.log(data);
      });
    },
    initReview() {
      console.log('INIT REVIEW!!!');
      const instance = this.attr('instance');
      // const review = this.attr('review') ||
      //   {
      //     instance_id: instance.attr('id'),
      //     instance_type: instance.attr('type'),
      //   };

      const review = {
        instance_id: instance.attr('id'),
        instance_type: instance.attr('type'),
        notification_type: 'email',
        email_message: '___',
        // instance: {
        //   id: instance.attr('id'),
        //   type: instance.attr('type'),
        // },
      };

      const reviewModel = new CMS.Models.Review(review);
      reviewModel.save().then((data) => {
        console.log('inited');
        console.log(data);
      });
    },
  },
  events: {
  },
});
