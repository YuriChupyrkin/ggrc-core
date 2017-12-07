/*
 Copyright (C) 2017 Google Inc., authors, and contributors
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import Component from '../instance-acl-diff';

describe('instance-acl-diff component', () => {
  let viewModel;

  beforeAll(()=> {
    viewModel = new Component.prototype.viewModel;
  });

  describe('"buildRoleDiff" method', () => {
    let buildRoleDiff;

    beforeAll(() => {
      buildRoleDiff = viewModel.buildRoleDiff.bind(viewModel);
    });

    function getTestAclData() {
      return [
        {ac_role_id: 1, person_id: 1, person_email: 'user1@gg.com'},
        {ac_role_id: 1, person_id: 2, person_email: 'user2@gg.com'},
        {ac_role_id: 1, person_id: 3, person_email: 'user3@gg.com'},
      ];
    }

    it('should add only 1 person to modifiedVal', () => {
      let diff;
      const acl = getTestAclData();
      const modifiedAcl = {
        '1': {
          added: [
            {id: 1, email: 'user1@gg.com'},
            {id: 5, email: 'user5@gg.com'},
          ],
          deleted: [],
        },
      };

      const modifiedAclId = 1;
      viewModel.attr('modifiedAcl', modifiedAcl);
      diff = buildRoleDiff(modifiedAclId, acl);

      expect(diff.currentVal.length).toBe(3);
      expect(diff.modifiedVal.length).toBe(4);
    });

    it('should remove only 1 person from modifiedVal', () => {
      let diff;
      const acl = getTestAclData();
      const modifiedAcl = {
        '1': {
          deleted: [
            {id: 1, email: 'user1@gg.com'},
            {id: 5, email: 'user5@gg.com'},
          ],
          added: [],
        },
      };

      const modifiedAclId = 1;
      viewModel.attr('modifiedAcl', modifiedAcl);
      diff = buildRoleDiff(modifiedAclId, acl);

      expect(diff.currentVal.length).toBe(3);
      expect(diff.modifiedVal.length).toBe(2);
    });

    it('should return empty currentValue', () => {
      let diff;
      const acl = [];
      const modifiedAcl = {
        '1': {
          added: [
            {id: 1, email: 'user1@gg.com'},
            {id: 5, email: 'user5@gg.com'},
          ],
          deleted: [],
        },
      };

      const modifiedAclId = 1;
      viewModel.attr('modifiedAcl', modifiedAcl);
      diff = buildRoleDiff(modifiedAclId, acl);

      expect(diff.currentVal.length).toBe(0);
      expect(diff.modifiedVal.length).toBe(2);
    });

    it('should return empty modifiedVal', () => {
      let diff;
      const acl = getTestAclData();
      const modifiedAcl = {
        '1': {
          deleted: [
            {id: 1, email: 'user1@gg.com'},
            {id: 2, email: 'user2@gg.com'},
            {id: 3, email: 'user3@gg.com'},
          ],
          added: [],
        },
      };

      const modifiedAclId = 1;
      viewModel.attr('modifiedAcl', modifiedAcl);
      diff = buildRoleDiff(modifiedAclId, acl);

      expect(diff.currentVal.length).toBe(3);
      expect(diff.modifiedVal.length).toBe(0);
    });
  });

  describe('"getEmailsOrEmpty" method', () => {
    let getEmailsOrEmpty;
    let emptyValue;

    beforeAll(() => {
      emptyValue = viewModel.attr('emptyValue');
      getEmailsOrEmpty = viewModel.getEmailsOrEmpty.bind(viewModel);
    });

    it('shoud return emptyValue. argument is undefined', () => {
      const result = getEmailsOrEmpty();
      expect(result.length).toBe(1);
      expect(result[0]).toEqual(emptyValue);
    });

    it('shoud return emptyValue. argument is empry array', () => {
      const result = getEmailsOrEmpty([]);
      expect(result.length).toBe(1);
      expect(result[0]).toEqual(emptyValue);
    });

    it('shoud return sorted emails', () => {
      const values = [
        {id: 5, email: 'sona@gg.com'},
        {id: 3, email: 'zed@gg.com'},
        {id: 15, email: 'leona@gg.com'},
      ];
      const result = getEmailsOrEmpty(values);
      expect(result.length).toBe(3);
      expect(result[0]).toEqual(values[2].email);
      expect(result[1]).toEqual(values[0].email);
      expect(result[2]).toEqual(values[1].email);
    });
  });
});
