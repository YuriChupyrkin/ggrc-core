/*
 Copyright (C) 2019 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import CanStache from 'can-stache';
import CanMap from 'can-map';
import CanComponent from 'can-component';
import template from './advanced-search-filter-operator.stache';

/**
 * Filter Operator view model.
 * Contains logic used in Filter Operator component
 * @constructor
 */
let viewModel = CanMap.extend({
  /**
   * Contains operation name.
   * @type {string}
   * @example
   * AND
   * OR
   */
  operator: '',
});

/**
 * Filter Operator is a component representing operation connecting Advanced Search items.
 */
export default CanComponent.extend({
  tag: 'advanced-search-filter-operator',
  view: CanStache(template),
  leakScope: true,
  viewModel: viewModel,
});
