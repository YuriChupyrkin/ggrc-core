/*!
    Copyright (C) 2017 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

(function (can, $) {
  'use strict';

  GGRC.Components('multiselectDropdown', {
    tag: 'multiselect-dropdown',
    template: can.view(
      GGRC.mustache_path +
      '/components/dropdown/multiselect_dropdown.mustache'
    ),
    leakScope: false,
    viewModel: {
      _previousDisplayValue: '',
      selected: [],
      plural: '@',
      placeholder: '@',
      element: '',
      define: {
        elementWidth: {
          type: 'number',
          value: 240
        },
        _displayValue: {
          get: function () {
            return this.getDisplayValue();
          }
        },
        _selectedAll: {
          type: 'boolean',
          value: false,
          get: function () {
            var options = this.attr('options') || [];

            return Array.prototype.every.call(options, function (item) {
              return item.attr('checked');
            });
          },
          set: function (value) {
            var options = this.attr('options') || [];

            options.forEach(function (option) {
              option.attr('checked', value);
            });

            return value;
          }
        },
        isOpen: {
          type: 'boolean',
          value: false
        },
        openCloseState: {
          type: 'boolean',
          get: function () {
            return this.attr('isOpen');
          }
        },
        options: {
          type: '*'
        }
      },
      updateSelected: function (item) {
        var selected = this.attr('selected');
        var index = -1;

        if (item.checked) {
          selected.push(item);
          return;
        }

        index = selected.map(function (selectedItem) {
          return selectedItem.value;
        }).indexOf(item.value);

        if (index > -1) {
          selected.splice(index, 1);
        }
      },
      getDisplayValue: function () {
        var selected = this.attr('selected');
        var options = this.attr('options');

        if (selected.attr('length') > 3) {
          return selected.attr('length') + ' of ' + options.length +
            ' ' + this.attr('plural') + ' selected';
        }

        return selected.map(function (item) {
          return item.attr('value');
        }).join(', ');
      },
      dropdownClosed: function (el, ev, scope) {
        var displayValue = this.attr('_displayValue');

        // don't trigger event if state didn't change
        if (displayValue === this.attr('_previousDisplayValue')) {
          return;
        }

        this.attr('_previousDisplayValue', displayValue);
        can.trigger(el, 'multiselect:closed', [this.attr('selected')]);
      },
      changeOpenCloseState: function (el, ev) {
        if (!this.attr('isOpen')) {
          if (this.attr('canBeOpen')) {
            this.attr('canBeOpen', false);
            this.attr('isOpen', true);
          }
        } else {
          this.attr('isOpen', false);
          this.attr('canBeOpen', false);
          this.dropdownClosed(this.element);
        }
      },
      openDropdown: function (el, ev) {
        // we should save element of component.
        // it necessary for 'can.trigger'
        if (el && !this.element) {
          this.element = el;
        }

        // this attr needed when page has any components
        this.attr('canBeOpen', true);
      },
      dropdownBodyClick: function (ev) {
        ev.stopPropagation();
      }
    },
    events:
    {
      '{options} change': function (scope, ev, propertyName) {
        var target = ev.target;

        // igore all propetries except 'checked'
        if (propertyName.indexOf('checked') === -1) {
          return;
        }

        this.viewModel.updateSelected(target);
      },
      '{window} click': function (el, ev) {
        this.viewModel.changeOpenCloseState('', ev);
      }
    }
  });
})(window.can, window.can.$);
