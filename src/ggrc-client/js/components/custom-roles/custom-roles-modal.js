/*
 Copyright (C) 2019 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import CanStache from 'can-stache';
import CanMap from 'can-map';
import CanComponent from 'can-component';
import '../related-objects/related-people-access-control';
import '../related-objects/related-people-access-control-group';
import '../people/deletable-people-group';
import '../autocomplete/autocomplete-component';
import '../external-data-autocomplete/external-data-autocomplete';
import template from './templates/custom-roles-modal.stache';

export default CanComponent.extend({
  tag: 'custom-roles-modal',
  view: CanStache(template),
  leakScope: true,
  viewModel: CanMap.extend({
    instance: {},
    updatableGroupId: null,
    isNewInstance: false,
    conflictRoles: [],
    orderOfRoles: [],
    isProposal: false,
    includeRoles: [],
    excludeRoles: [],
    readOnly: false,
    showGroupTooltip: false,
    groupTooltip: null,
  }),
});
