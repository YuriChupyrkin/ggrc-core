/*
 Copyright (C) 2019 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canMap from 'can-map';
import canComponent from 'can-component';
const viewModel = canMap.extend({
  tabType: 'link',
  instance: null,
  titleText: '',
  linkType: '',
  panels: [],
});

export default canComponent.extend({
  tag: 'tab-link',
  leakScope: true,
  viewModel,
  events: {
    inserted() {
      setupPanels(this.viewModel);
    },
  },
});

function setupPanels(vm) {
  vm.attr('panels').push(vm);
  vm.attr('panels').dispatch('panelAdded');
}
