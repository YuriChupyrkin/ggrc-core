/*!
  Copyright (C) 2017 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

(function (can, _, GGRC, Permission, Mustache) {
  'use strict';

  GGRC.Components('relatedPeopleAccessControl', {
    tag: 'related-people-access-control',
    viewModel: {
      instance: {},
      define: {
        accessControlGroups: {
          get: function () {
            return this._rebuildRolesInfo();
          }
        }
      },
      _rebuildRolesInfo: function () {
        var roleAssignments;
        var roles;
        var rolesInfo;
        var instance = this.instance;

        if (!instance) {
          this.attr('rolesInfo', []);
          return;
        }

        roleAssignments = _.groupBy(instance.access_control_list, 'ac_role_id');

        roles = _.filter(GGRC.access_control_roles, {
          object_type: instance.class.model_singular
        });

        var groups = _.map(roles, function (role) {
          var groupId = role.id;
          var title = role.name;
          var group = roleAssignments[groupId];
          var people = group.map(function (groupItem) {
            return groupItem.person;
          });

          return {
            title: title,
            groupId: groupId,
            people: people
          }
        });

        return groups;
      }
    }
  });
})(window.can, window._, window.GGRC, window.Permission, can.Mustache);
