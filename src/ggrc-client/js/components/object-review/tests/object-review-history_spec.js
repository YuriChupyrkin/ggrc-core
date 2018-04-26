/*
 Copyright (C) 2018 Google Inc., authors, and contributors
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import {getComponentVM} from '../../../../js_specs/spec_helpers';

import Component from '../object-review-history';

describe('object-review-history component', () => {
  let viewModel;

  beforeAll(() => {
    viewModel = getComponentVM(Component);
  });

  describe('"showHistory" method', () => {
    beforeEach(() => {
      viewModel.attr('review', {id: 5});
      viewModel.attr('historyContent', [{agend: '....'}]);
    });

    it('should NOT call "loadHistory". review.id is empty', () => {
      viewModel.attr('review', null);
      spyOn(viewModel, 'loadHistory');

      viewModel.showHistory();
      expect(viewModel.loadHistory).not.toHaveBeenCalled();
    });

    it('should NOT call "loadHistory". history is not empty', () => {
      spyOn(viewModel, 'loadHistory');

      viewModel.showHistory();
      expect(viewModel.loadHistory).not.toHaveBeenCalled();
    });

    it('should call "loadHistory". history is empty', () => {
      viewModel.attr('historyContent', []);
      spyOn(viewModel, 'loadHistory');

      viewModel.showHistory();
      expect(viewModel.loadHistory).toHaveBeenCalled();
    });
  });

  describe('"loadHistory" method', () => {
    let buildRevisionRequestDfd;
    let revisions;

    beforeAll(() => {
      revisions = [
        {
          id: 1,
          content: {
            someProp: 'someVal',
            agenda: 'agenda #1',
          },
        },
        {
          id: 2,
          content: {
            someProp: 'someVal',
            agenda: 'agenda #2',
          },
        },
      ];
    });

    beforeEach(() => {
      viewModel.attr('loading', false);
      viewModel.attr('historyContent', [{agend: '....'}]);

      buildRevisionRequestDfd = can.Deferred();
      viewModel.buildRevisionRequest = () => buildRevisionRequestDfd;
    });

    it('should set "content" of revisions to "historyContent"', (done) => {
      viewModel.loadHistory();

      buildRevisionRequestDfd.resolve(revisions);
      buildRevisionRequestDfd.then(() => {
        const historyContent = viewModel.attr('historyContent').attr();
        expect(historyContent.length).toBe(2);
        expect(historyContent[0]).toEqual(revisions[0].content);
        expect(historyContent[1]).toEqual(revisions[1].content);
        done();
      });
    });

    it('should clear "historyContent" before load new', (done) => {
      expect(viewModel.attr('historyContent').length).toBe(1);
      viewModel.loadHistory();

      expect(viewModel.attr('historyContent').length).toBe(0);

      buildRevisionRequestDfd.resolve(revisions);
      buildRevisionRequestDfd.then(() => {
        expect(viewModel.attr('historyContent').length).toBe(2);
        done();
      });
    });

    it('should toggle "loading" flag', (done) => {
      expect(viewModel.attr('historyContent').length).toBe(1);
      viewModel.loadHistory();

      expect(viewModel.attr('loading')).toBeTruthy();

      buildRevisionRequestDfd.resolve(revisions);
      buildRevisionRequestDfd.then(() => {
        expect(viewModel.attr('loading')).toBeFalsy();
        done();
      });
    });
  });
});
