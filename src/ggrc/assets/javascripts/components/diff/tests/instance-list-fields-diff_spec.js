/*
 Copyright (C) 2017 Google Inc., authors, and contributors
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import Component from '../instance-list-fields-diff';

describe('instance-list-fields-diff component', () => {
  let viewModel;

  beforeAll(()=> {
    viewModel = new Component.prototype.viewModel;
  });

  describe('"buildDiffData" method', () => {
    let buildDiffData;

    beforeAll(() => {
      viewModel.loadFieldList = loadFieldListStub;
      buildDiffData = viewModel.buildDiffData.bind(viewModel);
    });

    function loadFieldListStub(values) {
      return values;
    }

    it('should return empty currentVal', () => {
      const key = 'categories';
      const instance = {
        categories: [],
      };
      const modifiedFields = {
        categories: {
          added: [
            {id: 1, name: 'Category #1'},
            {id: 2, name: 'Category #2'},
          ],
          deleted: [],
        },
      };
      let result;
      viewModel.attr('currentInstance', instance);
      viewModel.attr('modifiedFields', modifiedFields);

      result = buildDiffData(key);
      expect(result.attrName).toEqual(key);
      expect(result.currentVal.length).toBe(0);
      expect(result.modifiedVal.length).toBe(2);
    });

    it('should return empty modifiedVal', () => {
      const key = 'categories';
      const instance = {
        categories: [
          {id: 1, name: 'Category #1'},
          {id: 2, name: 'Category #2'},
        ],
      };
      const modifiedFields = {
        categories: {
          deleted: [
            {id: 1, name: 'Category #1'},
            {id: 2, name: 'Category #2'},
          ],
          added: [],
        },
      };
      let result;
      viewModel.attr('currentInstance', instance);
      viewModel.attr('modifiedFields', modifiedFields);

      result = buildDiffData(key);
      expect(result.attrName).toEqual(key);
      expect(result.modifiedVal.length).toBe(0);
      expect(result.currentVal.length).toBe(2);
    });

    it('should remove only 1 item from modifiedVal', () => {
      const key = 'categories';
      const instance = {
        categories: [
          {id: 1, name: 'Category #1'},
          {id: 2, name: 'Category #2'},
        ],
      };
      const modifiedFields = {
        categories: {
          deleted: [
            {id: 1, name: 'Category #1'},
            {id: 3, name: 'Category #3'},
          ],
          added: [],
        },
      };
      let result;
      viewModel.attr('currentInstance', instance);
      viewModel.attr('modifiedFields', modifiedFields);

      result = buildDiffData(key);
      expect(result.attrName).toEqual(key);
      expect(result.currentVal.length).toBe(2);
      expect(result.modifiedVal.length).toBe(1);
      expect(result.modifiedVal[0].id).toBe(2);
      expect(result.modifiedVal[0].name).toEqual('Category #2');
    });

    it('should add only 1 item to currentVal', () => {
      const key = 'categories';
      const instance = {
        categories: [
          {id: 1, name: 'Category #1'},
          {id: 2, name: 'Category #2'},
        ],
      };
      const modifiedFields = {
        categories: {
          added: [
            {id: 1, name: 'Category #1'},
            {id: 3, name: 'Category #3'},
          ],
          deleted: [],
        },
      };
      let result;
      viewModel.attr('currentInstance', instance);
      viewModel.attr('modifiedFields', modifiedFields);

      result = buildDiffData(key);
      expect(result.attrName).toEqual(key);
      expect(result.currentVal.length).toBe(2);
      expect(result.modifiedVal.length).toBe(3);
    });
  });
});
