/*
    Copyright (C) 2019 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import loIncludes from 'lodash/includes';
import CanStache from 'can-stache';
import CanMap from 'can-map';
import CanComponent from 'can-component';
import '../form/fields/dropdown-form-field';
import '../person/person-data';
import template from './readonly-inline-content.stache';

export default CanComponent.extend({
  tag: 'readonly-inline-content',
  view: CanStache(template),
  leakScope: true,
  viewModel: CanMap.extend({
    withReadMore: false,
    options: [],
    value: '',
    define: {
      items: {
        get() {
          const options = this.attr('options');
          const value = this.attr('value');

          if (options.length && value && typeof(value) === 'string') {
            return value.split(',')
              .filter((item) => loIncludes(options, item))
              .map((item) => `<p><i class="fa fa-circle"></i>${item}</p>`)
              .join('');
          }
          return '';
        },
      },
    },
  }),
});
