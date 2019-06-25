/*
 Copyright (C) 2019 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import CanStache from 'can-stache';
import CanMap from 'can-map';
import CanComponent from 'can-component';
import template from './prev-next-buttons.stache';

export default CanComponent.extend({
  tag: 'prev-next-buttons',
  view: CanStache(template),
  leakScope: true,
  viewModel: CanMap.extend({
    define: {
      currentIndex: {
        type: 'number',
      },
      totalCount: {
        type: 'number',
      },
      hasNext: {
        get: function () {
          let current = this.attr('currentIndex');
          let total = this.attr('totalCount');
          return !this.attr('disabled') && (current < total - 1);
        },
      },
      hasPrev: {
        get: function () {
          let current = this.attr('currentIndex');
          return !this.attr('disabled') && current > 0;
        },
      },
    },
    disabled: false,
    setNext: function () {
      let current = this.attr('currentIndex');
      let hasNext = this.attr('hasNext');

      if (hasNext) {
        this.attr('currentIndex', current + 1);
      }
    },
    setPrev: function () {
      let current = this.attr('currentIndex');
      let hasPrev = this.attr('hasPrev');

      if (hasPrev) {
        this.attr('currentIndex', current - 1);
      }
    },
  }),
});
