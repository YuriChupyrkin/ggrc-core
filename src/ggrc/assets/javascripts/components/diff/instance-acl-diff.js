/*
 Copyright (C) 2017 Google Inc., authors, and contributors
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import {REFRESH_PROPOSAL_DIFF} from '../../events/eventTypes';
import DiffBaseVM from './diff-base-vm';
const tag = 'instance-acl-diff';

const viewModel = DiffBaseVM.extend({
  modifiedAcl: {},

  buildDiffObject() {
    const currentAcl = this.attr('currentInstance.access_control_list');
    const modifiedAclKeys = can.Map.keys(this.attr('modifiedAcl'));
    const rolesDiff = modifiedAclKeys.map((modifiedRoleId) =>
      this.buildRoleDiff(modifiedRoleId, currentAcl));

    const diff = this.prepareDiff(rolesDiff);
    this.attr('diff', diff);
  },
  prepareDiff(rolesDiff) {
    const instanceType = this.attr('currentInstance.type');
    const roles = GGRC.access_control_roles.filter(
      (role) => role.object_type === instanceType
    );

    const diff = rolesDiff.map((diffItem) => {
      const role = _.first(
        roles.filter((item) => item.id == diffItem.roleId)
      );
      const roleDiff = {};

      if (!role) {
        return;
      }

      roleDiff.attrName = role.name;
      roleDiff.currentVal = this.getEmailsOrEmpty(diffItem.currentVal);
      roleDiff.modifiedVal = this.getEmailsOrEmpty(diffItem.modifiedVal);

      return roleDiff;
    })
    // remove empty items
    .filter((item) => !!item);

    return diff;
  },
  getEmailsOrEmpty(value) {
    if (!value || !value.length) {
      return [this.attr('emptyValue')];
    }

    return value.map((item) => item.email).sort();
  },
  buildRoleDiff(modifiedRoleId, currentAcl) {
    const modifiedRole = this.attr('modifiedAcl')[modifiedRoleId];
    const roleDiff = {
      roleId: modifiedRoleId,
      currentVal: [],
      modifiedVal: [],
    };
    let shouldBeAdded;
    let modifiedRoleACL;

    // == because modifiedRoleId - string but ac_role_id - number
    const currentRoleACL = currentAcl
      .filter((aclItem) => aclItem.ac_role_id == modifiedRoleId)
      .map((aclItem) => {
        return {
          id: aclItem.person_id,
          email: aclItem.person_email,
        };
      });

    // people list for current role is empty. return only added
    if (!currentRoleACL.length) {
      roleDiff.modifiedVal = modifiedRole.added;
      return roleDiff;
    }

    // copy 'currentRolePeopleIds' array
    modifiedRoleACL = currentRoleACL.slice();

    shouldBeAdded = modifiedRole.added.filter((person) =>
      _.findIndex(currentRoleACL, {id: person.id}) === -1
    );

    // add new people
    modifiedRoleACL.push(...shouldBeAdded);

    // remove existed people
    _.remove(modifiedRoleACL, (person) =>
      _.findIndex(modifiedRole.deleted, {id: person.id}) > -1
    );

    roleDiff.currentVal = currentRoleACL;
    roleDiff.modifiedVal = modifiedRoleACL;

    return roleDiff;
  },
});

export default can.Component.extend({
  tag,
  viewModel: viewModel,
  events: {
    buildDiff() {
      const instance = this.viewModel.attr('currentInstance');
      const modifiedACL = this.viewModel.attr('modifiedAcl');

      if (!instance || !modifiedACL) {
        return;
      }
      this.viewModel.buildDiffObject();
    },
    inserted() {
      this.buildDiff();
    },
    [`{viewModel.currentInstance} ${REFRESH_PROPOSAL_DIFF.type}`]() {
      this.buildDiff();
    },
  },
});
