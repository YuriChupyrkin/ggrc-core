/*
 Copyright (C) 2018 Google Inc., authors, and contributors
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import {getComponentVM} from '../../../../js_specs/spec_helpers';

import Component from '../reviewers-modal';

describe('reviewers-modalcomponent', () => {
  let viewModel;

  beforeAll(() => {
    viewModel = getComponentVM(Component);
  });

  describe('"validateForm" method', () => {
    beforeEach(() => {
      viewModel.attr('emptyAcl', false);
      viewModel.attr('emptyComponentId', false);
      viewModel.attr('accessControlList', [{person_id: 1}]);
      viewModel.attr('issueTracker', {});
      viewModel.attr('notificationType', 'email');
    });

    it('should check only ACL. Empty ACL', () => {
      viewModel.attr('accessControlList', []);

      const validationResult = viewModel.validateForm();
      expect(validationResult).toBeFalsy();
      expect(viewModel.attr('emptyAcl')).toBeTruthy();
      expect(viewModel.attr('emptyComponentId')).toBeFalsy();
    });

    it('should return "FALSE". Empty ACL and empty component_id', () => {
      viewModel.attr('accessControlList', []);
      viewModel.attr('notificationType', 'issue_tracker');

      const validationResult = viewModel.validateForm();
      expect(validationResult).toBeFalsy();
      expect(viewModel.attr('emptyAcl')).toBeTruthy();
      expect(viewModel.attr('emptyComponentId')).toBeTruthy();
    });

    it('should return "FALSE". empty component_id', () => {
      viewModel.attr('notificationType', 'issue_tracker');

      const validationResult = viewModel.validateForm();
      expect(validationResult).toBeFalsy();
      expect(viewModel.attr('emptyAcl')).toBeFalsy();
      expect(viewModel.attr('emptyComponentId')).toBeTruthy();
    });

    it('should return "TRUE"', () => {
      viewModel.attr('notificationType', 'issue_tracker');
      viewModel.attr('issueTracker.component_id', 5);

      const validationResult = viewModel.validateForm();
      expect(validationResult).toBeTruthy();
      expect(viewModel.attr('emptyAcl')).toBeFalsy();
      expect(viewModel.attr('emptyComponentId')).toBeFalsy();
    });
  });
});
