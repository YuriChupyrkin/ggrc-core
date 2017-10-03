/*
    Copyright (C) 2017 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import component from '../boolean-dropdown-helper';

describe('GGRC.Components.booleanDropdownHelper', function () {
  var viewModel;

  beforeAll(function () {
    viewModel = new (can.Map.extend(component.prototype.viewModel));
  });

  describe('convertToBool function', function () {
    var convertToBoolMethod;

    beforeAll(function () {
      convertToBoolMethod = viewModel.convertToBool;
    });

    it('should convert empty string to FALSE', function () {
      var result = convertToBoolMethod('');
      expect(result).toBe(false);
    });

    it('should convert "false" string to FALSE', function () {
      var result = convertToBoolMethod('false');
      expect(result).toBe(false);
    });

    it('should not convert boolean. FALSE', function () {
      var result = convertToBoolMethod(false);
      expect(result).toBe(false);
    });

    it('should not convert boolean. TRUE', function () {
      var result = convertToBoolMethod(true);
      expect(result).toBe(true);
    });

    it('should convert "true" string to TRUE', function () {
      var result = convertToBoolMethod('true');
      expect(result).toBe(true);
    });

    it('should convert non empty string to TRUE', function () {
      var result = convertToBoolMethod('hello world');
      expect(result).toBe(true);
    });
  });

  describe('dropdownValueChange function', function () {
    var dropdownValueChangeMethod;

    beforeAll(function () {
      dropdownValueChangeMethod = viewModel
        .dropdownValueChange.bind(viewModel);
    });

    it('should set dropdownValue to FALSE. dropdownValue is string',
      function () {
        viewModel.attr('dropdownValue', 'false');
        dropdownValueChangeMethod();
        expect(viewModel.attr('dropdownValue')).toBe(false);
      }
    );

    it('should set dropdownValue to FALSE. dropdownValue is bool',
      function () {
        viewModel.attr('dropdownValue', false);
        dropdownValueChangeMethod();
        expect(viewModel.attr('dropdownValue')).toBe(false);
      }
    );

    it('should set dropdownValue to TRUE. dropdownValue is string',
      function () {
        viewModel.attr('dropdownValue', 'true');
        dropdownValueChangeMethod();
        expect(viewModel.attr('dropdownValue')).toBe(true);
      }
    );

    it('should set dropdownValue to TRUE. dropdownValue is bool',
      function () {
        viewModel.attr('dropdownValue', true);
        dropdownValueChangeMethod();
        expect(viewModel.attr('dropdownValue')).toBe(true);
      }
    );
  });
});
