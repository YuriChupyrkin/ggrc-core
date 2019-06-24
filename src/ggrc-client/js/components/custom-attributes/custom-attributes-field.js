/*
 Copyright (C) 2019 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import CanStache from 'can-stache';
import CanMap from 'can-map';
import CanComponent from 'can-component';
import '../form/fields/checkbox-form-field';
import '../form/fields/multiselect-form-field';
import '../form/fields/date-form-field';
import '../form/fields/dropdown-form-field';
import '../form/fields/person-form-field';
import '../form/fields/rich-text-form-field';
import '../form/fields/text-form-field';
import template from './custom-attributes-field.stache';

export default CanComponent.extend({
  tag: 'custom-attributes-field',
  view: CanStache(template),
  leakScope: true,
  viewModel: CanMap.extend({
    define: {
      disabled: {
        type: 'htmlbool',
      },
    },
    type: null,
    value: null,
    fieldId: null,
    placeholder: '',
    options: [],
    isLocalCa: false,
    fieldValueChanged: function (e, scope) {
      this.dispatch({
        type: 'valueChanged',
        fieldId: e.fieldId,
        value: e.value,
        field: scope,
      });
    },
  }),
});
