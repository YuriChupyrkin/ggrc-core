/*
 Copyright (C) 2019 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import * as SnapshotUtils from '../../../plugins/utils/snapshot-utils';
import * as Permission from '../../../permission';
import {getComponentVM} from '../../../../js_specs/spec-helpers';
import Component from '../related-people-access-control-group';

describe('related-people-access-control-group component', () => {
  let viewModel;

  beforeEach(() => {
    viewModel = getComponentVM(Component);
    viewModel.instance = {};
  });

  describe('canEdit prop', () => {
    it('returns "false" when instance is snapshot', () => {
      spyOn(Permission, 'isAllowedFor').and.returnValue(true);
      viewModel.instance.archived = false;
      viewModel.updatableGroupId = null;
      viewModel.isNewInstance = false;

      spyOn(SnapshotUtils, 'isSnapshot').and.returnValue(true);

      expect(viewModel.canEdit).toEqual(false);
    });

    it('returns "false" when instance is archived', () => {
      spyOn(SnapshotUtils, 'isSnapshot').and.returnValue(false);
      spyOn(Permission, 'isAllowedFor').and.returnValue(true);
      viewModel.updatableGroupId = null;
      viewModel.isNewInstance = false;

      viewModel.instance.archived = true;

      expect(viewModel.canEdit).toEqual(false);
    });

    it('returns "false" when there is updatableGroupId', () => {
      spyOn(SnapshotUtils, 'isSnapshot').and.returnValue(false);
      viewModel.instance.archived = false;
      viewModel.isNewInstance = false;
      spyOn(Permission, 'isAllowedFor').and.returnValue(true);

      viewModel.updatableGroupId = 'groupId';

      expect(viewModel.canEdit).toEqual(false);
    });

    it('returns "false" when user has no update permissions', () => {
      spyOn(SnapshotUtils, 'isSnapshot').and.returnValue(false);
      viewModel.instance.archived = false;
      viewModel.updatableGroupId = null;
      viewModel.isNewInstance = false;

      spyOn(Permission, 'isAllowedFor').and.returnValue(false);

      expect(viewModel.canEdit).toEqual(false);
    });

    it('returns "false" when is readonly', () => {
      spyOn(SnapshotUtils, 'isSnapshot').and.returnValue(false);
      spyOn(Permission, 'isAllowedFor').and.returnValue(false);
      viewModel.instance.archived = false;
      viewModel.updatableGroupId = null;
      viewModel.isNewInstance = true;
      viewModel.isReadonly = true;

      expect(viewModel.canEdit).toEqual(false);
    });

    it('returns "true" when new instance', () => {
      spyOn(SnapshotUtils, 'isSnapshot').and.returnValue(false);
      spyOn(Permission, 'isAllowedFor').and.returnValue(false);
      viewModel.instance.archived = false;
      viewModel.updatableGroupId = null;

      viewModel.isNewInstance = true;

      expect(viewModel.canEdit).toEqual(true);
    });

    it('returns "true" when user has update permissions', () => {
      spyOn(SnapshotUtils, 'isSnapshot').and.returnValue(false);
      viewModel.instance.archived = false;
      viewModel.updatableGroupId = null;
      viewModel.isNewInstance = false;

      spyOn(Permission, 'isAllowedFor').and.returnValue(true);

      expect(viewModel.canEdit).toEqual(true);
    });
  });

  describe('check methods for updating "people" property', () => {
    let peopleList = [
      {id: 1, desc: 'Existent Person'},
      {id: 2, desc: 'Non-Existent Person'},
    ];

    beforeEach(() => {
      viewModel.people = [peopleList[0]];
      viewModel.groupId = 1;
      viewModel.title = peopleList[0].desc;
    });

    describe('"addPerson" method', () => {
      it('should add person to "people" list if not present', () => {
        viewModel.addPerson(peopleList[1], viewModel.groupId);
        expect(viewModel.people.length).toBe(2);
      });

      it('should not add person to "people" list if present', () => {
        viewModel.addPerson(peopleList[0], viewModel.groupId);
        expect(viewModel.people.length).toBe(1);
      });

      it('should replace person if singleUserRole attr is truthy',
        () => {
          viewModel.singleUserRole = true;

          viewModel.addPerson(peopleList[1], viewModel.groupId);

          let people = viewModel.people;
          expect(people.length).toBe(1);
          expect(people[0]).toEqual(jasmine.objectContaining(peopleList[1]));
        });
    });

    describe('"removePerson" method', () => {
      it('should remove person from "people" list if present', () => {
        viewModel.removePerson({person: peopleList[0]});
        expect(viewModel.people.length).toBe(0);
      });

      it('should not remove person from "people" list if not present', () => {
        let count = viewModel.people.length;
        viewModel.removePerson({person: peopleList[1]});
        expect(viewModel.people.length).toBe(count);
      });
    });
  });
});
