/*
 Copyright (C) 2019 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import template from './templates/three-dots-menu.stache';

const viewModel = canMap.extend({
  disabled: true,
  observer: null,
});

const events = {
  inserted(element) {
    const [menuNode] = element.find('[role=menu]');
    initObserver(this.viewModel, menuNode);
    manageEmptyList(this.viewModel, menuNode);
  },
  removed() {
    this.viewModel.attr('observer').disconnect();
  },
};

export default canComponent.extend({
  tag: 'three-dots-menu',
  view: canStache(template),
  leakScope: true,
  viewModel,
  events,
});

function manageEmptyList(vm, menuNode) {
  const isEmpty = menuNode.children.length === 0;
  vm.attr('disabled', isEmpty);
}

function mutationCallback(mutationsList) {
  mutationsList.forEach((mutation) => {
    const menuNode = mutation.target;
    manageEmptyList(this, menuNode);
  });
}

function initObserver(vm, menuNode) {
  const config = {childList: true};
  const observer = new MutationObserver(mutationCallback.bind(vm));
  observer.observe(menuNode, config);
  vm.attr('observer', observer);
}
