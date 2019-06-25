/*
    Copyright (C) 2019 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import loMap from 'lodash/map';
import CanStache from 'can-stache';
import CanMap from 'can-map';
import CanComponent from 'can-component';
import template from './mapping-type-selector.stache';

export default CanComponent.extend({
  tag: 'mapping-type-selector',
  view: CanStache(template),
  leakScope: true,
  viewModel: CanMap.extend({
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
      values = values.concat(loMap(groupItems, 'value'));
    });
    if (values.indexOf(selectedType) < 0) {
      this.viewModel.attr('selectedType', values[0]);
    }
  },
});
