/*
    Copyright (C) 2019 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import Assessment from '../../../models/business-models/assessment';
import {
  getComponentVM,
  makeFakeInstance,
} from '../../../../js_specs/spec_helpers';
import Component from '../issue-tracker-switcher';

describe('issue-tracker-switcher component', () => {
  let viewModel;

  beforeAll(() => {
    viewModel = getComponentVM(Component);
  });

  describe('"convertToBool" method', () => {
    let convertToBoolMethod;

    beforeAll(() => {
      convertToBoolMethod = viewModel.convertToBool;
    });

    it('should convert empty string to FALSE', () => {
      let result = convertToBoolMethod('');
      expect(result).toBeFalsy();
    });

    it('should convert "false" string to FALSE', () => {
      let result = convertToBoolMethod('false');
      expect(result).toBeFalsy();
    });

    it('should not convert boolean. FALSE', () => {
      let result = convertToBoolMethod(false);
      expect(result).toBeFalsy();
    });

    it('should not convert boolean. TRUE', () => {
      let result = convertToBoolMethod(true);
      expect(result).toBeTruthy();
    });

    it('should convert "true" string to TRUE', () => {
      let result = convertToBoolMethod('true');
      expect(result).toBeTruthy();
    });

    it('should convert non empty string to TRUE', () => {
      let result = convertToBoolMethod('hello world');
      expect(result).toBeTruthy();
    });
  });

  describe('"inlineDropdownValueChange" method', () => {
    let method;
    let instance;

    beforeAll(() => {
      instance = makeFakeInstance({model: Assessment})({});
      viewModel.attr('instance', instance);
      method = viewModel.inlineDropdownValueChange.bind(viewModel);
    });

    beforeEach(() => {
      spyOn(viewModel.attr('instance'), 'initIssueTracker');
      spyOn(viewModel, 'dispatch');
    });

    it('should call "initIssueTracker"', () => {
      method({value: true}, true);
      expect(viewModel.dispatch).toHaveBeenCalled();
      expect(viewModel.attr('instance').initIssueTracker).toHaveBeenCalled();
    });

    it('should NOT call "initIssueTracker". Value is false', () => {
      method({value: false}, true);
      expect(viewModel.dispatch).toHaveBeenCalled();
      expect(viewModel.attr('instance').initIssueTracker)
        .not.toHaveBeenCalled();
    });

    it('should NOT call "initIssueTracker". "reinitIssueTracker" arg is false',
      () => {
        method({value: true}, false);
        expect(viewModel.dispatch).toHaveBeenCalled();
        expect(viewModel.attr('instance').initIssueTracker)
          .not.toHaveBeenCalled();
      }
    );
  });
});
