/*
    Copyright (C) 2019 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import loEvery from 'lodash/every';
import loFilter from 'lodash/filter';
import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import template from './templates/multiselect-dropdown.stache';

export default canComponent.extend({
  tag: 'multiselect-dropdown',
  view: canStache(template),
  leakScope: true,
  viewModel: canMap.extend({
    disabled: false,
    isHighlightable: true,
    isInlineMode: false,
    isOpen: false,
    _stateWasUpdated: false,
    selected: [],
    options: [],
    placeholder: '',
    define: {
      _displayValue: {
        get: function () {
          return this.attr('selected').map(function (item) {
            return item.attr('value');
          }).join(', ');
        },
      },
      _inputSize: {
        type: Number,
        get: function () {
          return this.attr('_displayValue').length;
        },
      },
      _selectedAll: {
        type: 'boolean',
        value: false,
        get: function () {
          let options = this.attr('options');

          return loEvery(options, function (item) {
            return item.attr('checked');
          });
        },
      },
      isOpenOrInline: {
        get() {
          return this.attr('isOpen') || this.attr('isInlineMode');
        },
      },
      isHighlighted: {
        get() {
          return this.attr('isHighlightable') && this.attr('isOpen');
        },
      },
      options: {
        value: [],
        set: function (value, setValue) {
          setValue(value);

          this.attr('selected', loFilter(value,
            (item) => item.checked));
        },
      },
    },
    selectAll: function () {
      let options = this.attr('options');
      let value = !this.attr('_selectedAll');

      options.forEach(function (option) {
        option.attr('checked', value);
      });

      updateSelected(this);
    },
    openDropdown: function () {
      if (this.attr('disabled')) {
        return;
      }

      // this attr needed when page has any components
      this.attr('canBeOpen', true);
    },
    optionChange: function (item) {
      // click event triggered before new value of input is saved
      item.attr('checked', !item.checked);

      updateSelected(this);
    },
    dropdownBodyClick: function (ev) {
      ev.stopPropagation();
    },
  }),
  events: {
    '{window} click': function () {
      if (this.viewModel.attr('disabled')) {
        return;
      }
      changeOpenCloseState(this.viewModel);
    },
  },
});

function updateSelected(vm) {
  vm.attr('_stateWasUpdated', true);

  vm.attr('selected', loFilter(vm.attr('options'),
    (item) => item.checked));

  vm.dispatch({
    type: 'selectedChanged',
    selected: vm.attr('selected'),
  });
}

function dropdownClosed(vm) {
  // don't trigger event if state didn't change
  if (!vm.attr('_stateWasUpdated')) {
    return;
  }

  let selected = vm.attr('selected');

  vm.attr('_stateWasUpdated', false);

  vm.dispatch({
    type: 'dropdownClose',
    selected: selected,
  });
}

function changeOpenCloseState(vm) {
  if (!vm.attr('isOpen')) {
    if (vm.attr('canBeOpen')) {
      vm.attr('canBeOpen', false);
      vm.attr('isOpen', true);
    }
  } else {
    vm.attr('isOpen', false);
    vm.attr('canBeOpen', false);
    dropdownClosed(vm);
  }
}
