/*
 Copyright (C) 2019 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import CanStache from 'can-stache';
import CanMap from 'can-map';
import CanComponent from 'can-component';
import template from './templates/tree-item-status-for-workflow.stache';

const viewModel = CanMap.extend({
  define: {
    statusCSSClass: {
      type: 'string',
      get() {
        const status = this.attr('instance.status');
        let result = '';

        if (status) {
          const postfix = status
            .replace(/[\s\t]+/g, '')
            .toLowerCase();
          result = `state-${postfix}`;
        }

        return result;
      },
    },
  },
  instance: {},
});

export default CanComponent.extend({
  tag: 'tree-item-status-for-workflow',
  view: CanStache(template),
  leakScope: true,
  viewModel,
});
