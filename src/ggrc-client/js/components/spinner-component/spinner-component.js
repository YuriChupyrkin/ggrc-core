/*
    Copyright (C) 2019 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import CanMap from 'can-map';
import CanComponent from 'can-component';
import template from './spinner-component.stache';

export default CanComponent.extend({
  tag: 'spinner-component',
  view: can.stache(template),
  leakScope: true,
  scope: CanMap.extend({
    extraCssClass: '',
    size: '',
    toggle: null,
  }),
});
