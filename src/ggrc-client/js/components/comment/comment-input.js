/*
 Copyright (C) 2019 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import CanStache from 'can-stache';
import CanMap from 'can-map';
import CanComponent from 'can-component';
import template from './comment-input.stache';

export default CanComponent.extend({
  tag: 'comment-input',
  view: CanStache(template),
  leakScope: true,
  viewModel: CanMap.extend({
    define: {
      disabled: {
        type: 'boolean',
        value: false,
      },
      placeholder: {
        type: 'string',
        value: '',
      },
      isEmpty: {
        type: 'boolean',
        value: true,
        get: function () {
          let value = this.attr('value') || '';
          return !value.length;
        },
      },
      clean: {
        type: 'boolean',
        value: true,
        set: function (newValue) {
          if (newValue) {
            this.attr('value', '');
          }
          return newValue;
        },
      },
      value: {
        type: 'string',
        value: '',
        set: function (newValue) {
          return newValue || '';
        },
      },
    },
  }),
});
