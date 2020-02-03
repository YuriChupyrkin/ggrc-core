/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/


import '../../../components/advanced-search/advanced-search-filter-container';
import '../../../components/advanced-search/advanced-search-mapping-container';

import canComponent from 'can-component';
import canStache from 'can-stache';
import canDefineMap from 'can-define/map/map';
import template from './advanced-search-container.stache';

const ViewModel = canDefineMap.extend({
  filterItems: {
    value: () => [],
  },
  defaultFilterItems: {
    value: () => [],
  },
  availableAttributes: {
    value: () => [],
  },
  statesCollectionKey: {
    value: () => [],
  },
  mappingItems: {
    value: () => [],
  },
  modelName: {
    value: null,
  },
  mappedToItems: {
    value: () => [],
  },
  filterOperatorOptions: {
    value: null,
  },
  disabled: {
    value: false,
  },
  resetFilters() {
    this.filterItems = this.attr('defaultFilterItems').serialize();
    this.mappingItems = [];
  },
  onSubmit() {
    this.dispatch('onSubmit');
  },
});

export default canComponent.extend({
  tag: 'advanced-search-container',
  view: canStache(template),
  ViewModel,
});
