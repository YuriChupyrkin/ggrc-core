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
    viewModel: {
      _previousDisplayValue: '',
      selected: [],
      plural: '@',
      placeholder: '@',
      element: '',
      define: {
        _displayValue: {
          get: function () {
            return this.getDisplayValue();
          }
        },
        isOpen: {
          type: 'boolean',
          value: false
        },
        openCloseState: {
          type: 'string',
          get: function () {
            return this.attr('isOpen') ? 'display: block;' : 'display: none;';
          }
        },
        options: {
          type: '*',
          value: function () {
            return [];
          },
          set: function (value) {
            var selectAll = {
              value: 'Select All',
              selectAll: true
            };

            value.unshift(selectAll);
            return value;
          }
        }
      },
      updateSelected: function (item) {
        var selected = this.attr('selected');
        var index = -1;

        this.checkSelectAll();

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
      selectAll: function (selectAll) {
        var options = this.attr('options');
        var index = 1;

        for (index; index < options.length; index++) {
          options[index].attr('checked', selectAll);
        }
      },
      checkSelectAll: function () {
        var options = this.attr('options');
        var checkedItems = options.filter(function (item) {
          return item.attr('checked') && !item.attr('selectAll');
        });

        if (checkedItems.length === options.length - 1) {
          options[0].attr('canUncheck', true);
          options[0].attr('checked', true);
        } else {
          options[0].attr('canUncheck', false);
          options[0].attr('checked', false);
        }
      },
      getDisplayValue: function () {
        var self = this;
        var displayValue = '';
        var selected = self.attr('selected');
        var options = self.attr('options');

        if (selected.length > 3) {
          return selected.length + ' of ' + options.length +
            ' ' + this.plural + ' selected';
        }

        selected.forEach(function (item) {
          if (item.value) {
            displayValue += item.value + ', ';
          }
        });

        // remove last space and comma
        return displayValue.substr(0, displayValue.length - 2);
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
        // we should save element of component.
        // it necessary for 'can.trigger'
        if (el && !this.element) {
          this.element = el;
        }

        this.attr('isOpen', !this.attr('isOpen'));

        if (!this.attr('isOpen')) {
          this.dropdownClosed(this.element);
        }

        ev.stopPropagation();
      },
      dropdownBodyClick: function (ev) {
        ev.stopPropagation();
      }
    },
    events:
    {
      '{options} change': function (scope, ev, propertyName) {
        var target = ev.target;

        if (propertyName.indexOf('checked') === -1) {
          return;
        }

        console.log('CHANGE');

        if (target.selectAll) {
          if (target.checked) {
            this.viewModel.selectAll(true);
          } else if (target.canUncheck) {
            this.viewModel.selectAll(false);
          }

          return;
        }

        this.viewModel.updateSelected(target);
      },
      '{window} click': function (el, ev) {
        if (this.viewModel.attr('isOpen')) {
          this.viewModel.changeOpenCloseState('', ev);
        }
      }
    }
  });
})(window.can, window.can.$);
