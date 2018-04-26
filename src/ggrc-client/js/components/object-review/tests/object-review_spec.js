/*
 Copyright (C) 2018 Google Inc., authors, and contributors
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import {getComponentVM} from '../../../../js_specs/spec_helpers';

import Component from '../object-review';

describe('object-review component', () => {
  let viewModel;

  beforeAll(() => {
    viewModel = getComponentVM(Component);
  });

  describe('"reviewStatus" getter', () => {
    let instance;
    let review;

    beforeEach(() => {
      review = {
        status: 'status_from_review_object',
      },
      instance = {
        review_status: 'status_from_instance',
      };
    });

    it('should return status from review object', () => {
      viewModel.attr('instance', instance);
      viewModel.attr('review', review);
      const status = viewModel.attr('reviewStatus');

      expect(status).toBe(review.status);
    });

    it('should return status from instance', () => {
      viewModel.attr('instance', instance);
      viewModel.attr('review', null);
      const status = viewModel.attr('reviewStatus');

      expect(status).toBe(instance.review_status);
    });

    it('should return status in lower case', () => {
      instance.review_status = 'Reviewed';

      viewModel.attr('instance', instance);
      viewModel.attr('review', null);
      const status = viewModel.attr('reviewStatus');

      expect(status).toBe(instance.review_status.toLowerCase());
    });
  });

  describe('"isReviewed" getter', () => {
    it('should return true if status equal "reviewed"', () => {
      const statusMap = new Map();
      statusMap.set('Reviewed', true);
      statusMap.set('Unreviewed', false);
      statusMap.set('REVIEWED', true);
      statusMap.set('reviewed', true);
      statusMap.set('UNREVIEWED', false);
      statusMap.set('REVIEWE D', false);

      for (const mapItem of statusMap) {
        const instance = {
          review_status: mapItem[0],
        };

        viewModel.attr('instance', instance);
        const isReviewed = viewModel.attr('isReviewed');

        expect(isReviewed).toBe(mapItem[1]);
      }
    });
  });

  describe('"changeReviewState" method', () => {
    let review;
    let updateReviewDfd;

    beforeEach(() => {
      review = new CMS.Models.Review(),
      viewModel.attr('review', review);

      updateReviewDfd = can.Deferred();
      viewModel.updateReview = () => updateReviewDfd;
    });

    it('should set "Reviewed" status', (done) => {
      review.attr('status', 'Unreviewed');
      spyOn(viewModel, 'getReviewOrDefault').and.returnValue(review);

      viewModel.changeReviewState(true);

      expect(viewModel.attr('loading')).toBeTruthy();
      expect(viewModel.getReviewOrDefault).toHaveBeenCalled();

      updateReviewDfd.resolve(review);
      updateReviewDfd.then(() => {
        expect(review.attr('status')).toEqual('Reviewed');
        expect(viewModel.attr('loading')).toBeFalsy();
        expect(viewModel.attr('canUndo')).toBe(true);
        done();
      });
    });

    it('should set "Unreviewed" status', (done) => {
      review.attr('status', 'Reviewed');
      spyOn(viewModel, 'getReviewOrDefault').and.returnValue(review);

      viewModel.changeReviewState(false);

      expect(viewModel.attr('loading')).toBeTruthy();
      expect(viewModel.getReviewOrDefault).toHaveBeenCalled();

      updateReviewDfd.resolve(review);
      updateReviewDfd.then(() => {
        expect(review.attr('status')).toEqual('Unreviewed');
        expect(viewModel.attr('loading')).toBeFalsy();
        expect(viewModel.attr('canUndo')).toBe(false);
        done();
      });
    });

    it('should NOT change status, because current status is Reviewed',
      () => {
        review.attr('status', 'Reviewed');
        spyOn(viewModel, 'getReviewOrDefault');

        viewModel.changeReviewState(true);

        expect(review.attr('status')).toEqual('Reviewed');
        expect(viewModel.getReviewOrDefault).not.toHaveBeenCalled();
      }
    );

    it('should NOT change status, because current status is Unreviewed',
      () => {
        review.attr('status', 'Unreviewed');
        spyOn(viewModel, 'getReviewOrDefault');

        viewModel.changeReviewState(false);

        expect(review.attr('status')).toEqual('Unreviewed');
        expect(viewModel.getReviewOrDefault).not.toHaveBeenCalled();
      }
    );
  });

  describe('"saveChangedReviewers" method', () => {
    let review;
    let updateReviewDfd;

    beforeEach(() => {
      review = new CMS.Models.Review({
        notification_type: 'issue_tracker',
        email_message: 'original email message',
        issuetracker_issue: {hotlist_id: 5},
        access_control_list: [{person_id: 1}, {person_id: 2}],
      });
      viewModel.attr('review', review);

      let reviewersModalState = {
        open: true,
      };

      viewModel.attr('reviewersModalState', reviewersModalState);
      viewModel.attr('loading', false);

      updateReviewDfd = can.Deferred();
      viewModel.updateReview = () => updateReviewDfd;
    });

    it('should update properties for "Email" notification', () => {
      const updatedReview = {
        notification_type: 'email',
        email_message: 'new email message',
        issuetracker_issue: {hotlist_id: 10},
        access_control_list: [{person_id: 3}, {person_id: 2}],
      };

      viewModel.saveChangedReviewers(updatedReview);
      updateReviewDfd.resolve(review);

      expect(review.attr('notification_type'))
        .toEqual(updatedReview.notification_type);
      expect(review.attr('email_message'))
        .toEqual(updatedReview.email_message);
      expect(review.attr('access_control_list').attr())
        .toEqual(updatedReview.access_control_list);
      expect(review.attr('issuetracker_issue'))
        .toEqual(review.issuetracker_issue);
    });

    it('should update properties for "issue_tacker" notification', () => {
      const updatedReview = {
        notification_type: 'issue_tracker',
        email_message: 'new email message',
        issuetracker_issue: {hotlist_id: 10},
        access_control_list: [{person_id: 3}, {person_id: 2}],
      };

      viewModel.saveChangedReviewers(updatedReview);
      updateReviewDfd.resolve(review);

      expect(review.attr('notification_type'))
        .toEqual(updatedReview.notification_type);
      expect(review.attr('email_message'))
        .toEqual(review.email_message);
      expect(review.attr('access_control_list').attr())
        .toEqual(updatedReview.access_control_list);
      expect(review.attr('issuetracker_issue').attr())
        .toEqual(updatedReview.issuetracker_issue);
    });

    it('should close modal', (done) => {
      expect(viewModel.attr('reviewersModalState.open')).toBeTruthy();

      viewModel.saveChangedReviewers({});

      expect(viewModel.attr('loading')).toBeTruthy();
      updateReviewDfd.resolve(review);

      updateReviewDfd.then(() => {
        expect(viewModel.attr('reviewersModalState.open')).toBeFalsy();
        expect(viewModel.attr('loading')).toBeFalsy();
        done();
      });
    });
  });
});
