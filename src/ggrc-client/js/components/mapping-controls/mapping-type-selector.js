/*
    Copyright (C) 2019 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import CanComponent from 'can-component';
import template from './mapping-type-selector.stache';

export default CanComponent.extend({
  tag: 'mapping-type-selector',
  view: can.stache(template),
  leakScope: true,
  viewModel: can.Map.extend({
    disabled: false,
    readonly: false,
    types: [],
    selectedType: '',
  }),
  init: function () {
    let selectedType = this.viewModel.selectedType;
    let types = this.viewModel.types;
    let groups = ['scope', 'entities', 'governance'];
    let values = [];

    groups.forEach(function (name) {
      let groupItems = types.attr(name + '.items');
      values = values.concat(_.map(groupItems, 'value'));
    });
    if (values.indexOf(selectedType) < 0) {
      this.viewModel.attr('selectedType', values[0]);
    }
  },
});
