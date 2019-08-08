/*
 Copyright (C) 2019 Google Inc., authors, and contributors
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import loFind from 'lodash/find';
import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import './request-review-modal';
import template from './templates/object-review.stache';
import notificationTemplate from './templates/complete-review-notification.stache';
import Review from '../../models/service-models/review';
import {isAllowedFor} from '../../permission';
import {isSnapshot} from '../../plugins/utils/snapshot-utils';
import {createReviewInstance, saveReview} from '../../plugins/utils/object-review-utils';
import {
  REFRESH_MAPPING,
  DESTINATION_UNMAPPED,
  NAVIGATE_TO_TAB,
} from '../../events/eventTypes';
import {getRole} from '../../plugins/utils/acl-utils';
import {notifier} from '../../plugins/utils/notifiers-utils';

export default canComponent.extend({
  tag: 'object-review',
  view: canStache(template),
  leakScope: true,
  viewModel: canMap.extend({
    define: {
      reviewStatus: {
        get() {
          let status = this.attr('review.status') ||
            this.attr('instance.review_status');

          if (status) {
            return status.toLowerCase();
          } else {
            return '';
          }
        },
      },
      isReviewed: {
        get() {
          return this.attr('reviewStatus') === 'reviewed';
        },
      },
      showLastReviewInfo: {
        get() {
          return !!this.attr('review.last_reviewed_by');
        },
      },
      isSnapshot: {
        get() {
          return isSnapshot(this.attr('instance'));
        },
      },
      showButtons: {
        get() {
          const instance = this.attr('review') || this.attr('instance');

          return isAllowedFor('update', instance);
        },
      },
      hasReviewers: {
        get() {
          return this.attr('review.access_control_list.length');
        },
      },
    },
    instance: {},
    review: null,
    loading: false,
    reviewersModalState: {
      open: false,
    },
    markReviewed() {
      const review = getReviewInstance(this);

      updateAccessControlList(review);
      changeReviewState(this, review, 'Reviewed')
        .then(() => {
          showNotification(this);
        });
    },
    changeReviewers() {
      this.attr('reviewersModalState.open', true);
    },
    reviewersUpdated(event) {
      this.attr('review', event.review);
    },
    showLastChanges() {
      this.attr('instance').dispatch({
        ...NAVIGATE_TO_TAB,
        tabId: 'change-log',
        options: {
          showLastReviewUpdates: true,
        },
      });
    },
  }),
  events: {
    inserted() {
      loadReview(this.viewModel);
    },
    '{viewModel.instance} modelAfterSave'() {
      loadReview(this.viewModel);
    },
    [`{viewModel.instance} ${REFRESH_MAPPING.type}`]([instance], event) {
      // check destinationType because REFRESH_MAPPING is also dispatched on modal 'hide'
      if (event.destinationType) {
        loadReview(this.viewModel);
      }
    },
    [`{viewModel.instance} ${DESTINATION_UNMAPPED.type}`]() {
      loadReview(this.viewModel);
    },
  },
});

function loadReview(vm) {
  const review = vm.attr('instance.review');

  if (!vm.attr('isSnapshot') && review) {
    vm.attr('loading', true);

    new Review(review)
      .refresh()
      .then((reviewInstance) => {
        vm.attr('review', reviewInstance);
      })
      .always(() => {
        vm.attr('loading', false);
      });
  }
}

function getReviewInstance(vm) {
  const review = vm.attr('review');
  return review || createReviewInstance(vm.attr('instance'));
}

function markUnreviewed() {
  const review = this.attr('review');
  changeReviewState(this, review, 'Unreviewed');
}

function changeReviewState(vm, review, status) {
  review.attr('status', status);
  vm.attr('loading', true);

  return updateReview(vm, review).then(() => {
    vm.attr('loading', false);
  });
}

function showNotification(vm) {
  notifier('info', notificationTemplate, {
    data: {revertState: markUnreviewed.bind(vm)},
  });
}

function updateReview(vm, review) {
  return saveReview(review, vm.attr('instance'))
    .then((reviewInstance) => {
      vm.attr('review', reviewInstance);
    });
}

function updateAccessControlList(review) {
  const acl = review.attr('access_control_list');
  const isCurrentUserReviewer = !!loFind(acl, (item) =>
    item.person.id === GGRC.current_user.id);

  if (!isCurrentUserReviewer) {
    const reviewerRole = getRole('Review', 'Reviewers');

    acl.push({
      ac_role_id: reviewerRole.id,
      person: {type: 'Person', id: GGRC.current_user.id},
    });
  }
}
