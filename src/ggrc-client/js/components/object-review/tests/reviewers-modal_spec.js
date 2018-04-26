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
      const review = {
        access_control_list: [{person_id: 1}],
        issuetracker_issue: {},
        notification_type: 'email',
      };

      viewModel.attr('review', review);

      viewModel.attr('emptyAcl', false);
      viewModel.attr('emptyComponentId', false);
    });

    it('should check only ACL. Empty ACL', () => {
      viewModel.attr('review.access_control_list', []);

      const validationResult = viewModel.validateForm();
      expect(validationResult).toBeFalsy();
      expect(viewModel.attr('emptyAcl')).toBeTruthy();
      expect(viewModel.attr('emptyComponentId')).toBeFalsy();
    });

    it('should return "FALSE". Empty ACL and empty component_id', () => {
      viewModel.attr('review.access_control_list', []);
      viewModel.attr('review.notification_type', 'issue_tracker');

      const validationResult = viewModel.validateForm();
      expect(validationResult).toBeFalsy();
      expect(viewModel.attr('emptyAcl')).toBeTruthy();
      expect(viewModel.attr('emptyComponentId')).toBeTruthy();
    });

    it('should return "FALSE". empty component_id', () => {
      viewModel.attr('review.notification_type', 'issue_tracker');

      const validationResult = viewModel.validateForm();
      expect(validationResult).toBeFalsy();
      expect(viewModel.attr('emptyAcl')).toBeFalsy();
      expect(viewModel.attr('emptyComponentId')).toBeTruthy();
    });

    it('should return "TRUE"', () => {
      viewModel.attr('review.notification_type', 'issue_tracker');
      viewModel.attr('review.issuetracker_issue.component_id', '5');

      const validationResult = viewModel.validateForm();
      expect(validationResult).toBeTruthy();
      expect(viewModel.attr('emptyAcl')).toBeFalsy();
      expect(viewModel.attr('emptyComponentId')).toBeFalsy();
    });
  });

  describe('"save" method', () => {
    let originalEmailComment;
    let originalIssueTracker;
    let saveDfd;
    let review;

    beforeEach(() => {
      originalIssueTracker = {
        component_id: 123456789,
      };
      originalEmailComment = 'email comment...';
      saveDfd = can.Deferred();

      viewModel.attr('originalIssueTracker', originalIssueTracker);
      viewModel.attr('originalEmailComment', originalEmailComment);

      review = {
        access_control_list: [{person_id: 1}],
        issuetracker_issue: originalIssueTracker,
        notification_type: 'email',
        email_message: originalEmailComment,
        isNew: () => false,
        save: () => saveDfd,
      };

      viewModel.attr('review', review);
      viewModel.attr('modalState.open', true);
    });

    it('should update properties for "Email" notification', (done) => {
      const newEmailMessage = 'NEW EMAIL MESSAGE!!!';
      const newIssueTracker = {
        component_id: 10,
      };

      viewModel.attr('review.email_message', newEmailMessage);
      viewModel.attr('review.issuetracker_issue', newIssueTracker);

      viewModel.save();

      saveDfd.then((updatedReview) => {
        expect(viewModel.attr('review.email_message')).toEqual(newEmailMessage);
        expect(viewModel.attr('review.issuetracker_issue.component_id'))
          .toEqual(originalIssueTracker.component_id);
        done();
      });

      saveDfd.resolve(review);
    });

    it('should update properties for "issue_tacker" notification', (done) => {
      const newEmailMessage = 'NEW EMAIL MESSAGE!!!';
      const newIssueTracker = {
        component_id: 10,
      };

      viewModel.attr('review.notification_type', 'issue_tracker');
      viewModel.attr('review.email_message', newEmailMessage);
      viewModel.attr('review.issuetracker_issue', newIssueTracker);

      viewModel.save();

      saveDfd.then((updatedReview) => {
        expect(viewModel.attr('review.email_message')).
          toEqual(originalEmailComment);
        expect(viewModel.attr('review.issuetracker_issue.component_id'))
          .toEqual(newIssueTracker.component_id);
        done();
      });

      saveDfd.resolve(review);
    });

    it('should update properties for "issue_tacker" notification', (done) => {
      const newIssueTracker = {
        component_id: 10,
      };

      viewModel.attr('review.issuetracker_issue', newIssueTracker);
      expect(viewModel.attr('modalState.open')).toBeTruthy();
      viewModel.save();

      saveDfd.then((updatedReview) => {
        expect(viewModel.attr('modalState.open')).toBeFalsy();
        done();
      });

      saveDfd.resolve(review);
    });
  });
});
