/*
  Copyright (C) 2019 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import template from './sortable-column.stache';

export default canComponent.extend({
  tag: 'sortable-column',
  view: canStache(template),
  leakScope: true,
  viewModel: canMap.extend({
    define: {
      isSorted: {
        type: Boolean,
        get() {
          return this.attr('sort.field') === this.attr('sortField');
        },
      },
      isSortedAsc: {
        type: Boolean,
        get() {
          return this.attr('sort.direction') === 'asc';
        },
      },
    },
    sort: null,
    sortField: '',
    applySort() {
      if (this.attr('isSorted')) {
        toggleSortDirection(this);
      } else {
        this.attr('sort.field', this.attr('sortField'));
        this.attr('sort.direction', 'asc');
      }

      this.attr('sort').dispatch('changed');
    },
  }),
  events: {
    '{$content} click'() {
      this.viewModel.applySort();
    },
  },
});

function toggleSortDirection(vm) {
  if (vm.attr('sort.direction') === 'asc') {
    vm.attr('sort.direction', 'desc');
  } else {
    vm.attr('sort.direction', 'asc');
  }
}
