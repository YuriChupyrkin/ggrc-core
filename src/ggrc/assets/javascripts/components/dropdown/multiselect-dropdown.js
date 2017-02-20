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
      displayValue: '',
      selected: [],
      options: [],
      updateSelected: function (item) {
        var selected = this.attr('selected');
        var index = -1;

        if (item.checked) {
          selected.push(item);
          this.setDisplayValue();
          return;
        }

        // TODO! FIX THIS!
        for (var i = 0; i < selected.length; i++) {
          if (selected[i].value === item.value.trim()) {
            index = i;
            break;
          }
        }

        if (index > -1) {
          selected.splice(index, 1);
          this.setDisplayValue();
        }
      },
      setDisplayValue: function () {
        var self = this;
        var displayValue = '';
        var selected = self.attr('selected');
        var options = self.attr('options');

        self.attr('displayValue', '');

        selected.forEach(function (item) {
          if (item.value) {
            displayValue += item.value.trim() + ', ';
          }
        });

        // remove last space and comma
        displayValue = displayValue.substr(0, displayValue.length - 2);

        if (selected.length > 3) {
          displayValue = 'selected ' + selected.length +
            ' from ' + options.length;
        }

        this.attr('displayValue', displayValue);
      },
      dropdownClosed: function (el, ev, scope) {
        can.trigger(el, 'multiselect:closed', [this.attr('selected')]);
      }
    },
    events:
    {
      '{options} change': function () {
        var target = arguments[1].target;
        this.viewModel.updateSelected(target);
      },
      // Do not close after click on body
      '.multiselect-dropdown-body click': function (el, ev) {
        ev.stopPropagation();
      },
      '.multiselect-dropdown-input click': function (el, ev) {
        this.openCloseDropdown(el, ev);
      },
      '{window} click': function (el, ev) {
        this.openCloseDropdown(el, ev, true);
      },
      openCloseDropdown: function (el, ev, isWindowClick) {
        var dropdownBody = this.element.find('.multiselect-dropdown-body');

        // dropdown is displayed
        if (dropdownBody.css('display') === 'block') {
          dropdownBody.toggle('dropdown');
          ev.stopPropagation();

          this.viewModel.dropdownClosed(this.element);
        } else if (!isWindowClick) {
          dropdownBody.toggle('dropdown');
          ev.stopPropagation();
        }
      }
    }
  });
})(window.can, window.can.$);
