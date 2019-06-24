/*
 Copyright (C) 2019 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import CanStache from 'can-stache';
import CanMap from 'can-map';
import CanComponent from 'can-component';
import template from './templates/repeat-on-summary.stache';
import {unitOptions as workflowUnitOptions} from '../../apps/workflow-config';

export default CanComponent.extend({
  tag: 'repeat-on-summary',
  view: CanStache(template),
  leakScope: true,
  viewModel: CanMap.extend({
    define: {
      unitText: {
        get: function () {
          let result = '';
          let repeatEvery = this.attr('repeatEvery');
          let unit = _.find(workflowUnitOptions, (option) => {
            return option.value === this.attr('unit');
          });

          if (unit) {
            if (repeatEvery > 1) {
              result += repeatEvery + ' ' + unit.plural;
            } else {
              result += unit.singular;
            }
          }
          return result;
        },
      },
      hideRepeatOff: {
        type: 'boolean',
        value: true,
      },
    },
    unit: null,
    repeatEvery: null,
  }),
});
