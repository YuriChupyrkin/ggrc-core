/*
  Copyright (C) 2019 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import SavedSearch from '../../../models/service-models/saved-search';
import Pagination from '../../base-objects/pagination';
import {isMyWork} from '../../../plugins/utils/current-page-utils';
import {
  parseFilterJson,
  applySavedSearchFilter,
} from '../../../plugins/utils/advanced-search-utils';

export default can.Component.extend({
  tag: 'saved-search-wrapper',
  leakScope: true,
  viewModel: can.Map.extend({
    define: {
      isGlobalSearch: {
        get() {
          return !this.attr('advancedSearch');
        },
      },
      isShowSavedSearch: {
        get() {
          if (this.attr('isGlobalSearch')) {
            return true;
          }

          // do NOT show Advanced saved seacrhes on Dashboard tab
          if (isMyWork()) {
            return false;
          }

          return true;
        },
      },
      objectType: {
        set(newValue, setValue) {
          setValue(newValue);

          if (this.attr('isShowSavedSearch')) {
            this.loadSavedSearches();
          }
        },
      },
      searchesPaging: {
        value() {
          return new Pagination({
            pageSize: 10, pageSizeSelect: [10],
          });
        },
      },
      isPagingShown: {
        get() {
          const total = this.attr('searchesPaging.total');
          const pageSize = this.attr('searchesPaging.pageSize');

          return total > pageSize;
        },
      },
    },
    searches: [],
    searchType: '',
    filtersToApply: null,
    advancedSearch: null,
    isLoading: false,
    applySearch({search}) {
      const advancedSearch = this.attr('advancedSearch');
      if (advancedSearch) {
        applySavedSearchFilter(advancedSearch, search);
      } else {
        const filter = parseFilterJson(search.filters);
        this.attr('filtersToApply', {
          filterItems: filter.filterItems,
          mappingItems: filter.mappingItems,
          statusItem: filter.statusItem,
        });
      }
    },
    loadSavedSearches() {
      const type = this.attr('objectType');
      const paging = this.attr('searchesPaging');
      const searchType = this.attr('searchType');

      this.attr('isLoading', true);
      return SavedSearch.findBy(type, searchType, paging)
        .then(({total, values}) => {
          this.attr('searchesPaging.total', total);

          const searches = values.map((value) => new SavedSearch(value));
          this.attr('searches', searches);
        }).always(() => {
          this.attr('isLoading', false);
        });
    },
  }),
  events: {
    '{viewModel.searchesPaging} current'() {
      this.viewModel.loadSavedSearches();
    },
  },
});
