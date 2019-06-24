/*
    Copyright (C) 2019 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import CanComponent from 'can-component';
import '../redirects/proposable-control/proposable-control';
import '../redirects/role-attr-names-provider/role-attr-names-provider';
import template from './editable-people-group-header.stache';

export default CanComponent.extend({
  tag: 'editable-people-group-header',
  view: can.stache(template),
  leakScope: true,
  viewModel: can.Map.extend({
    define: {
      peopleCount: {
        get: function () {
          return this.attr('people.length');
        },
      },
      showEditToolbar: {
        get() {
          return (
            this.attr('canEdit') &&
            !this.attr('editableMode')
          );
        },
      },
    },
    singleUserRole: false,
    editableMode: false,
    isLoading: false,
    canEdit: true,
    required: false,
    redirectionEnabled: false,
    people: [],
    title: '',
    openEditMode: function () {
      this.dispatch('editPeopleGroup');
    },
  }),
});
