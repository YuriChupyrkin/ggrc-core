/*
 Copyright (C) 2019 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import CanMap from 'can-map';
import CanComponent from 'can-component';
import template from './templates/tree-visible-column-checkbox.stache';

export default CanComponent.extend({
  tag: 'tree-visible-column-checkbox',
  view: can.stache(template),
  leakScope: true,
  viewModel: CanMap.extend({
    column: {},
    viewType: null,
    onChange(attr) {
      attr.attr('selected', !attr.attr('selected'));
    },
  }),
});
