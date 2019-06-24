/*
 Copyright (C) 2019 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import CanStache from 'can-stache';
import CanMap from 'can-map';
import CanComponent from 'can-component';
import '../object-list-item/comment-list-item';
import '../object-list/object-list';
import template from './mapped-comments.stache';

/**
 * Assessment specific mapped controls view component
 */
export default CanComponent.extend({
  tag: 'mapped-comments',
  view: CanStache(template),
  leakScope: false,
  viewModel: CanMap.extend({
    define: {
      noItemsText: {
        type: 'string',
        get() {
          if (this.attr('showNoItemsText') && !this.attr('isLoading')) {
            return 'No comments';
          }
          return '';
        },
      },
    },
    isLoading: false,
    mappedItems: [],
    baseInstance: {},
    showNoItemsText: false,
  }),
});
