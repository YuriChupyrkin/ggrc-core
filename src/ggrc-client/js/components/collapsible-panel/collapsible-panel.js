/*
 Copyright (C) 2019 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import CanStache from 'can-stache';
import CanMap from 'can-map';
import CanComponent from 'can-component';
import './collapsible-panel-header';
import './collapsible-panel-body';
import template from './collapsible-panel.stache';

let viewModel = CanMap.extend({
  titleText: '',
  titleIcon: '',
  extraCssClass: '',
  softMode: false,
  define: {
    /**
     * Public attribute to indicate expanded/collapsed status of the component
     * @type {Boolean}
     * @public
     */
    expanded: {
      type: 'boolean',
      value: false,
    },
  },
});
/**
 * Collapsible Panel component to add expand/collapse behavior
 */
export default CanComponent.extend({
  tag: 'collapsible-panel',
  view: CanStache(template),
  leakScope: false,
  viewModel,
});
