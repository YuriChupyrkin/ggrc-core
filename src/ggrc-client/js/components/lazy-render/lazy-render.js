/*
 Copyright (C) 2019 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import CanComponent from 'can-component';
let viewModel = can.Map.extend({
  define: {
    trigger: {
      type: 'boolean',
      set: function (value) {
        if (!this.attr('activated') && value) {
          this.attr('activated', true);
        }
      },
    },
  },
  activated: false,
});

/**
 *
 */
export default CanComponent.extend({
  tag: 'lazy-render',
  view: can.stache('{{#if activated}}<content/>{{/if}}'),
  leakScope: true,
  viewModel,
});
