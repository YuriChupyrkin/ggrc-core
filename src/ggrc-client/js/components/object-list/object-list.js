/*
 Copyright (C) 2019 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import '../show-more/show-more';
import '../spinner-component/spinner-component';
import template from './object-list.stache';

/**
 * Object List component
 */
export default canComponent.extend({
  tag: 'object-list',
  view: canStache(template),
  leakScope: true,
  viewModel: canMap.extend({
    define: {
      itemSelector: {
        type: 'string',
        value: '',
      },
      isLoading: {
        type: 'boolean',
        value: false,
      },
      showSpinner: {
        get: function () {
          return this.attr('isLoading');
        },
      },
      items: {
        value: function () {
          return [];
        },
      },
      selectedItem: {
        value: function () {
          return {
            el: null,
            data: null,
          };
        },
      },
      isInnerClick: {
        type: 'boolean',
        value: false,
      },
      emptyMessage: {
        type: 'string',
        value: 'None',
      },
      isGrid: {
        get() {
          return this.attr('listType') === 'GRID';
        },
      },
    },
    listType: '',
    isDisabled: false,
    showMore: false,
    /**
     *
     * @param {canMap} ctx - current item context
     * @param {jQuery} el - selected element
     * @param {jQuery.Event} ev - click event
     */
    modifySelection: function (ctx, el, ev) {
      let selectionFilter = this.attr('itemSelector');
      let isSelected = selectionFilter ?
        $(ev.target).closest(selectionFilter, el).length :
        true;
      clearSelection(this);
      // Select Item only in case required HTML item was clicked
      if (isSelected) {
        this.attr('selectedItem.el', el);
        this.attr('selectedItem.data', ctx.instance);
        ctx.attr('isSelected', true);
      }
    },
  }),
  events: {
    '.object-list__item click': function () {
      this.viewModel.attr('isInnerClick', true);
    },
    '{window} click': function () {
      onOuterClick(this.viewModel);
    },
  },
});

/**
 * Deselect all items and clear selected item Object
 */
function clearSelection(vm) {
  vm.attr('items').forEach(function (item) {
    item.removeAttr('isSelected', false);
  });
  vm.attr('selectedItem.el', null);
  vm.attr('selectedItem.data', null);
}

/**
 * Event Handler executed on each viewport click
 */
function onOuterClick(vm) {
  let isInnerClick = vm.attr('isInnerClick');
  if (!isInnerClick) {
    clearSelection(vm);
  }
  vm.attr('isInnerClick', false);
}
