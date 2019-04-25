/*
 Copyright (C) 2019 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import '../../components/advanced-search/advanced-search-filter-container';
import '../../components/advanced-search/advanced-search-filter-state';
import '../../components/advanced-search/advanced-search-mapping-container';
import '../../components/advanced-search/advanced-search-wrapper';
import '../../components/unified-mapper/mapper-results';
import '../../components/mapping-controls/mapping-type-selector';
import '../../components/collapsible-panel/collapsible-panel';
import '../../components/saved-search/create-saved-search/create-saved-search';
import '../../components/saved-search/saved-search-list/saved-search-list';
import '../../components/saved-search/saved-search-wrapper/saved-search-wrapper';

import ObjectOperationsBaseVM from '../view-models/object-operations-base-vm';
import template from './object-search.stache';

export default can.Component.extend({
  tag: 'object-search',
  view: can.stache(template),
  leakScope: true,
  viewModel: function () {
    return ObjectOperationsBaseVM.extend({
      object: 'MultitypeSearch',
      type: 'Control',
      resultsRequested: false,
      onSubmit: function () {
        this.attr('resultsRequested', true);
        this._super();
      },
    });
  },
  helpers: {
    displayCount: function (countObserver) {
      let count = countObserver();
      if (count) {
        return '(' + count + ')';
      }
    },
  },
});
