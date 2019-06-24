/*
 Copyright (C) 2019 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import CanStache from 'can-stache';
import CanComponent from 'can-component';
import '../related-objects/related-people-access-control';
import '../related-objects/related-people-access-control-group';
import '../people/editable-people-group';
import template from './templates/custom-roles.stache';
import viewModel from './custom-roles-vm';

export default CanComponent.extend({
  tag: 'custom-roles',
  view: CanStache(template),
  leakScope: true,
  viewModel,
});
