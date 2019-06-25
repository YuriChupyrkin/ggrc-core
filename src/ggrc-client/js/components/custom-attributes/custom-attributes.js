/*
 Copyright (C) 2019 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import CanStache from 'can-stache';
import CanMap from 'can-map';
import CanComponent from 'can-component';
import '../form/form-validation-icon';
import '../form/form-validation-text';
import '../custom-attributes/custom-attributes-field-view';
import template from './custom-attributes.stache';

export default CanComponent.extend({
  tag: 'custom-attributes',
  view: CanStache(template),
  leakScope: true,
  viewModel: CanMap.extend({
    isLocalCa: false,
    fields: [],
    editMode: false,
    fieldValueChanged: function (e, field) {
      this.dispatch({
        type: 'valueChanged',
        fieldId: e.fieldId,
        value: e.value,
        field: field,
      });
    },
  }),
});
