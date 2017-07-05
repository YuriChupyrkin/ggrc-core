/*!
  Copyright (C) 2017 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

(function (can, _, GGRC) {
  'use strict';

  GGRC.Components('relatedPeopleAccessControl', {
    tag: 'related-people-access-control',
    viewModel: {
      instance: {},
      includeRoles: [],
      define: {
        accessControlGroups: {
          get: function () {
            return this.getRoleList();
          }
        }
      },
      buildGroups: function (role, roleAssignments) {
        var includeRoles = this.attr('includeRoles');
        var groupId = role.id;
        var title = role.name;
        var group;
        var people;

        if (includeRoles.length && includeRoles.indexOf(title) === -1) {
          return;
        }

        group = roleAssignments[groupId];
        people = group ?
          group.map(function (groupItem) {
            if (groupItem.person) {
              return groupItem.person;
            }
            return new CMS.Models.Person({id: groupItem.person_id});
          }) :
          [];

        return {
          title: title,
          groupId: groupId,
          people: people
        };
      },
      getRoleList: function () {
        var roleAssignments;
        var roles;
        var groups;
        var instance = this.attr('instance');

        if (!instance) {
          this.attr('rolesInfo', []);
          return;
        }

        roleAssignments = _.groupBy(instance
          .attr('access_control_list'), 'ac_role_id');

        roles = _.filter(GGRC.access_control_roles, {
          object_type: instance.class.model_singular
        });

        groups = _.map(roles, function (role) {
          return this.buildGroups(role, roleAssignments);
        }.bind(this))
        .filter(function (group) {
          return typeof group !== 'undefined';
        });

        return groups;
      }
    }
  });
})(window.can, window._, window.GGRC);
