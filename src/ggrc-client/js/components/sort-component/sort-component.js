/*
    Copyright (C) 2019 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canMap from 'can-map';
import canComponent from 'can-component';
export default canComponent.extend({
  tag: 'sort-component',
  leakScope: true,
  viewModel: canMap.extend({
    sortedItems: [],
    items: [],
  }),
  events: {
    '{viewModel.items} change'() {
      sort(this.viewModel);
    },
    init() {
      sort(this.viewModel);
    },
  },
});

function sort(vm) {
  const items = vm.attr('items');
  const sortedItems = items.sort();
  vm.attr('sortedItems', sortedItems);
}
