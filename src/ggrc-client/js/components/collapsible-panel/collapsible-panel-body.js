/*
 Copyright (C) 2019 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import CanStache from 'can-stache';
import CanMap from 'can-map';
import CanComponent from 'can-component';
import template from './collapsible-panel-body.stache';

/**
 * Collapsible Panel component to add collapsing behavior
 */
export default CanComponent.extend({
  tag: 'collapsible-panel-body',
  view: CanStache(template),
  leakScope: true,
  viewModel: CanMap.extend({
    renderContent: function () {
      return this.attr('softMode') || this.attr('expanded');
    },
    softMode: false,
    expanded: null,
  }),
});
