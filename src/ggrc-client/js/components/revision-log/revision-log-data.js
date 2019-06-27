/*
 Copyright (C) 2019 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import loIsObject from 'lodash/isObject';
import CanStache from 'can-stache';
import CanMap from 'can-map';
import CanComponent from 'can-component';
import template from './revision-log-data.stache';

let viewModel = CanMap.extend({
  data: null,
  isLoading: false,
  define: {
    isObject: {
      type: 'boolean',
      get: function () {
        return loIsObject(this.attr('data'));
      },
    },
  },
});

export default CanComponent.extend({
  tag: 'revision-log-data',
  view: CanStache(template),
  leakScope: true,
  viewModel: viewModel,
});
