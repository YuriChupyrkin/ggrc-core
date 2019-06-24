/*
    Copyright (C) 2019 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import CanMap from 'can-map';
import CanComponent from 'can-component';
import {reify} from '../../plugins/utils/reify-utils';

export default CanComponent.extend({
  tag: 'review-state',
  leakScope: true,
  viewModel: CanMap.extend({
    define: {
      reviewState: {
        get: function () {
          const instance = this.attr('instance');
          const review = instance.attr('review');
          let state;

          /**
           * Review status is placed in instance as review_status and in review as status property.
           * When we mark instance as reviewed/unreviewed only status in review object is changed.
           * To avoid redundant GET instance request we leave review_status as it is,
           * so these two values can be inconsistent.
           * To get correct review state value we should take it from review object if it is presented
           * (was previously received from the server), in other case - from instance.
           * */
          if (review) {
            state = reify(review).attr('status');
          }

          return state || instance.attr('review_status');
        },
      },
    },
    instance: null,
  }),
});

