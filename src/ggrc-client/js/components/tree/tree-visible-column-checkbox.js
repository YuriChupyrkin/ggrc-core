/*
 Copyright (C) 2019 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import loIsFunction from 'lodash/isFunction';
import CanStache from 'can-stache';
import CanMap from 'can-map';
import CanComponent from 'can-component';
import template from './templates/tree-visible-column-checkbox.stache';

export default CanComponent.extend({
  tag: 'tree-visible-column-checkbox',
  view: CanStache(template),
  leakScope: true,
  viewModel: CanMap.extend({
    column: {},
    viewType: null,
    getTitle(item) {
      if (loIsFunction(item.title)) {
        // case for person name item
        return item.title(this.viewType);
      } else {
        return item.title;
      }
    },
  }),
});
