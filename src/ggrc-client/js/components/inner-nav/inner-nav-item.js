/*
 Copyright (C) 2019 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import CanStache from 'can-stache';
import CanMap from 'can-map';
import CanComponent from 'can-component';
import template from './inner-nav-item.stache';

export default CanComponent.extend({
  tag: 'inner-nav-item',
  leakScope: false,
  view: CanStache(template),
  viewModel: CanMap.extend({
    define: {
      displayTab: {
        get() {
          let widget = this.attr('widget');

          return widget.attr('count') ||
              widget.attr('uncountable') ||
              widget.attr('forceShow') ||
              this.attr('showAllTabs') ||
              widget.attr('inForceShowList');
        },
      },
      showCloseButton: {
        get() {
          return !this.attr('widget.count')
            && !this.attr('widget.uncountable')
            && !this.attr('showAllTabs')
            && !this.attr('widget.inForceShowList');
        },
      },
      isActive: {
        get() {
          return this.attr('widget') === this.attr('activeWidget');
        },
      },
    },
    widget: null,
    showTitle: true,
    activeWidget: null,
    showAllTabs: false,
    closeTab() {
      this.dispatch({
        type: 'close',
        widget: this.attr('widget'),
      });

      // prevent click propagation
      return false;
    },
  }),
});
