/*
 Copyright (C) 2019 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import CanList from 'can-list';
import CanMap from 'can-map';
/**
 * Advanced Search Container view model.
 * Contains logic used in container components.
 * @constructor
 */
export default CanMap.extend({
  /**
   * Contains Advanced Search Items.
   * @type {CanList}
   */
  items: CanList(),
  /**
   * Removes Filter Operator and Advanced Search mapping item from the collection.
   * @param {CanMap} item - Advanced Search mapping item.
   * @param {boolean} isGroup - Flag indicates that current component is group.
   */
  removeItem: function (item, isGroup) {
    let items = this.attr('items');
    let index = items.indexOf(item);
    // we have to remove operator in front of each item except the first
    if (index > 0) {
      index--;
    }

    // if there is only 1 item in group we have to remove the whole group
    if (isGroup && items.length === 1) {
      this.remove();
      return;
    }

    items.splice(index, 2);
  },
  /**
   * Dispatches event meaning that the component should be removed from parent container.
   */
  remove: function () {
    this.dispatch('remove');
  },
});
