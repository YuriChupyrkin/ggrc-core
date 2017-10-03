/*
    Copyright (C) 2017 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

export default GGRC.Components('booleanDropdownHelper', {
  tag: 'boolean-dropdown-helper',
  viewModel: {
    dropdownValue: '',
    convertToBool: function (value) {
      if (typeof value === 'boolean') {
        return value;
      }

      return !(!value || value === 'false');
    },
    dropdownValueChange: function () {
      var boolValue = this.convertToBool(this.attr('dropdownValue'));
      this.attr('dropdownValue', boolValue);
    },
    inlineDropdownValueChange: function (args) {
      var dropdownValue = this.convertToBool(args.value);
      args.value = dropdownValue;
      args.type = 'booleanDropdownChanged';

      this.dispatch(args);
    }
  },
});
