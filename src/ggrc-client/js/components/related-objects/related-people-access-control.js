/*
  Copyright (C) 2019 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import loIntersection from 'lodash/intersection';
import loGroupBy from 'lodash/groupBy';
import loIndexOf from 'lodash/indexOf';
import loFindIndex from 'lodash/findIndex';
import loMap from 'lodash/map';
import canMap from 'can-map';
import canComponent from 'can-component';
import {ROLES_CONFLICT} from '../../events/eventTypes';
import {getRolesForType} from '../../plugins/utils/acl-utils';

export default canComponent.extend({
  tag: 'related-people-access-control',
  leakScope: true,
  viewModel: canMap.extend({
    instance: {},
    deferredSave: null,
    includeRoles: [],
    groups: [],
    updatableGroupId: null,
    isNewInstance: false,
    excludeRoles: [],
    conflictRoles: [],
    orderOfRoles: [],
    hasConflicts: false,
    readOnly: false,
    singleUserRoles: Object.freeze({
      Assignee: true,
      Verifier: true,
    }),

    updateRoles(args) {
      if (this.attr('deferredSave')) {
        this.attr('deferredSave').push(performUpdate.bind(this, this, args));
      }
      performUpdate(this, args);

      this.dispatch({
        type: 'saveCustomRole',
        groupId: args.roleId,
      });
    },
  }),
  events: {
    init() {
      setupGroups(this.viewModel);
    },
    '{viewModel.instance} updated'() {
      refreshPeopleInGroups(this.viewModel);
      checkConflicts(this.viewModel);
    },
    '{viewModel} instance'() {
      setupGroups(this.viewModel);
    },
  },
});

function performUpdate(vm, args) {
  updateAccessControlList(vm, args.people, args.roleId);

  if (vm.attr('conflictRoles').length) {
    checkConflicts(vm, args.roleTitle);
  }
}

function updateAccessControlList(vm, people, roleId) {
  let instance = vm.attr('instance');

  // get people without current role
  let listWithoutRole = instance
    .attr('access_control_list').filter((item) => {
      return item.ac_role_id !== roleId;
    });

  // push update people with current role
  people.forEach((person) => {
    listWithoutRole.push({
      ac_role_id: roleId,
      person: {id: person.id, type: 'Person'},
    });
  });

  instance.attr('access_control_list')
    .replace(listWithoutRole);
}

function checkConflicts(vm, groupTitle) {
  let groups = vm.attr('groups');
  let conflictRoles = vm.attr('conflictRoles');
  let hasConflict = false;

  if (groupTitle && conflictRoles.indexOf(groupTitle) === -1) {
    return;
  }

  hasConflict = groupTitle ?
    isCurrentGroupHasConflict(groupTitle, groups, conflictRoles) :
    isGroupsHasConflict(groups, conflictRoles);

  vm.attr('hasConflicts', hasConflict);
  vm.attr('instance').dispatch({
    ...ROLES_CONFLICT,
    rolesConflict: hasConflict,
  });
}

function isGroupsHasConflict(groups, conflictRoles) {
  let hasConflict = false;

  let conflictGroups = groups
    .filter((group) => loIndexOf(conflictRoles, group.title) > -1);

  conflictGroups.forEach((conflictGroup) => {
    let otherConflictGroups = conflictGroups
      .filter((group) => group.groupId !== conflictGroup.groupId);

    // compare people from current group (conflictGroup)
    // with each other group (otherConflictGroups)
    otherConflictGroups.forEach((group) => {
      // get 2 people ids arrays
      let peopleIds = [conflictGroup, group]
        .map((group) => group.people)
        .map((people) => people.map((person) => person.id));

      hasConflict = !!loIntersection(...peopleIds).length;
    });
  });

  return hasConflict;
}

function isCurrentGroupHasConflict(groupTitle, groups, conflictRoles) {
  let hasConflict = false;

  // get people IDs from conflict groups except current group
  let peopleIds = groups
    .filter((group) => groupTitle !== group.title &&
      loIndexOf(conflictRoles, group.title) > -1)
    .map((group) => group.people)
    .map((people) => people.map((person) => person.id));

  // get people IDs from current conflict group
  let currentGroupPeopleIds = groups
    .filter((group) => groupTitle === group.title)
    .map((group) => group.people)
    .map((people) => people.map((person) => person.id))[0];

  peopleIds.forEach((peopleGroupIds) => {
    if (loIntersection(peopleGroupIds, currentGroupPeopleIds).length) {
      hasConflict = true;
    }
  });

  return hasConflict;
}

function buildGroups(vm, role, roleAssignments) {
  let includeRoles = vm.attr('includeRoles');
  let groupId = role.id;
  let title = role.name;
  let singleUserRole = vm.singleUserRoles[title] ? true : false;

  if (includeRoles.length && includeRoles.indexOf(title) === -1) {
    return;
  }

  return {
    title: title,
    groupId: groupId,
    people: getPeople(roleAssignments, groupId),
    required: role.mandatory,
    singleUserRole: singleUserRole,
  };
}

function getPeople(roleAssignments, groupId) {
  let people = roleAssignments[groupId];
  return people ?
    people.map((person) => {
      return {
        id: person.person.id,
        email: person.person_email,
        name: person.person_name,
        type: 'Person',
      };
    }) :
    [];
}

function filterByIncludeExclude(vm, includeRoles, excludeRoles) {
  const instance = vm.attr('instance');
  const objectRoles = getRolesForType(instance.constructor.model_singular);

  return objectRoles.filter((item) => {
    return loIndexOf(includeRoles, item.name) > -1 &&
      loIndexOf(excludeRoles, item.name) === -1;
  });
}

function filterByInclude(vm, includeRoles) {
  const instance = vm.attr('instance');
  const objectRoles = getRolesForType(instance.constructor.model_singular);

  return objectRoles.filter((item) =>
    loIndexOf(includeRoles, item.name) > -1);
}

function filterByExclude(vm, excludeRoles) {
  const instance = vm.attr('instance');
  const objectRoles = getRolesForType(instance.constructor.model_singular);

  return objectRoles.filter((item) =>
    loIndexOf(excludeRoles, item.name) === -1);
}

function getFilteredRoles(vm) {
  const instance = vm.attr('instance');
  const includeRoles = vm.attr('includeRoles');
  const excludeRoles = vm.attr('excludeRoles');
  let roles;

  if (includeRoles.length && excludeRoles.length) {
    roles = filterByIncludeExclude(vm, includeRoles, excludeRoles);
  } else if (includeRoles.length) {
    roles = filterByInclude(vm, includeRoles);
  } else if (excludeRoles.length) {
    roles = filterByExclude(vm, excludeRoles);
  } else {
    roles = getRolesForType(instance.constructor.model_singular);
  }

  return roles;
}

function setGroupOrder(groups, orderOfRoles) {
  if (!Array.isArray(orderOfRoles)) {
    return groups;
  }

  orderOfRoles.forEach((roleName, index) => {
    let roleIndex = loFindIndex(groups, {title: roleName});
    let group;
    let firstGroup;

    if (roleIndex === -1 || roleIndex === index) {
      return;
    }

    group = groups[roleIndex];
    firstGroup = groups[index];

    groups[index] = group;
    groups[roleIndex] = firstGroup;
  });

  return groups;
}

function getRoleList(vm) {
  let roleAssignments;
  let roles;
  let groups;
  let instance = vm.attr('instance');

  if (!instance) {
    vm.attr('rolesInfo', []);
    return;
  }

  roleAssignments = loGroupBy(instance
    .attr('access_control_list'), 'ac_role_id');

  roles = getFilteredRoles(vm);

  groups = loMap(roles, (role) => {
    return buildGroups(vm, role, roleAssignments);
  })
    .filter((group) => {
      return typeof group !== 'undefined';
    })
    // sort by required
    .sort((a, b) => {
      if (a.required === b.required) {
        return 0;
      }

      return a.required ? -1 : 1;
    });

  if (vm.attr('orderOfRoles.length')) {
    groups = setGroupOrder(groups, vm.attr('orderOfRoles').attr());
  }

  return groups;
}

function refreshPeopleInGroups(vm) {
  let instance = vm.attr('instance');
  let groups = vm.attr('groups');
  let roleAssignments = loGroupBy(instance
    .attr('access_control_list'), 'ac_role_id');

  groups.forEach((group) =>
    group.attr('people', getPeople(roleAssignments, group.groupId)));
}

function setupGroups(vm) {
  vm.attr('groups', getRoleList(vm));
  checkConflicts(vm);
}
