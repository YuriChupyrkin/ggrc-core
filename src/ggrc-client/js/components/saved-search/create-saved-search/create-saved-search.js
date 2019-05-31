/*
  Copyright (C) 2019 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import SavedSearch from '../../../models/service-models/saved-search';
import { notifierXHR } from '../../../plugins/utils/notifiers-utils';
import { handleAjaxError } from '../../../plugins/utils/errors-utils';

export default can.Component.extend({
  tag: 'create-saved-search',
  template: can.stache(`
    <input type="text" placeholder="Type to Save Search"
        value:bind="searchName">
    <button type="button" class="btn btn-small btn-green"
        on:el:click="saveSearch()">Save Search</button>
  `),
  leakScope: false,
  viewModel: can.Map.extend({
    filterItems: null,
    mappingItems: null,
    statusItem: null,
    parentItems: null,
    parent: null,
    searchName: '',
    objectType: '',
    saveSearch() {
      const filterItems = this.attr('filterItems') &&
        this.attr('filterItems').serialize();
      const mappingItems = this.attr('mappingItems') &&
        this.attr('mappingItems').serialize();
      const statusItem = this.attr('statusItem') &&
        this.attr('statusItem').serialize();

      let parentItems = this.attr('parentItems') &&
        this.attr('parentItems').serialize();
      let parent = this.attr('parent');
      if (parent) {
        parent = parent.serialize();
        if (parentItems) {
          parentItems.push(parent);
        } else {
          parentItems = [parent];
        }
      }

      const filters = {
        filterItems,
        mappingItems,
        statusItem,
        parentItems,
      };

      const savedSearch = new SavedSearch({
        name: this.attr('searchName'),
        object_type: this.attr('objectType'),
        filters,
      })
      return savedSearch.save().then(() => {
        this.dispatch('created');
        this.attr('searchName', '');
      }, (err) => {
        handleAjaxError(err);
      });
    },
  }),
});
