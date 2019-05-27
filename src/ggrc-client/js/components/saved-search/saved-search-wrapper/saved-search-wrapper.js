/*
  Copyright (C) 2019 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import SavedSearch from '../../../models/service-models/saved-search';
import {notifier} from '../../../plugins/utils/notifiers-utils';
import Pagination from '../../base-objects/pagination';

export default can.Component.extend({
  tag: 'saved-search-wrapper',
  leakScope: true,
  viewModel: can.Map.extend({
    define: {
      objectType: {
        set(newValue, setValue) {
          setValue(newValue);

          this.loadSavedSearches();
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
    filtersToApply: null,
    applySearch({search}) {
      try {
        const {
          filterItems,
          mappingItems,
          statusItem,
        } = JSON.parse(search.filters);

        this.attr('filtersToApply', {
          filterItems,
          mappingItems,
          statusItem,
        });
      } catch (e) {
        notifier('error',
          `"${search.name}" is broken somehow. Sorry for any inconvenience.`);
      }
    },
    init() {
      this.loadSavedSearches();
    },
    loadSavedSearches() {
      const type = this.attr('objectType');
      const paging = this.attr('searchesPaging');

      return SavedSearch.findByType(type, paging)
        .then(({total, values}) => {
          this.attr('searchesPaging.total', total);

          const searches = values.map((value) => new SavedSearch(value));
          this.attr('searches', searches);
        });
    },
  }),
});
