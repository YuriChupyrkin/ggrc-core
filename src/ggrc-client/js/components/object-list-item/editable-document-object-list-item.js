/*
 Copyright (C) 2019 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import CanStache from 'can-stache';
import CanMap from 'can-map';
import CanComponent from 'can-component';
import '../object-list-item/document-object-list-item';
import template from './editable-document-object-list-item.stache';

export default CanComponent.extend({
  tag: 'editable-document-object-list-item',
  view: CanStache(template),
  leakScope: true,
  viewModel: CanMap.extend({
    document: {},
  }),
});
