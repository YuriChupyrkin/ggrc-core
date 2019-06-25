/*
 Copyright (C) 2019 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import CanStache from 'can-stache';
import CanMap from 'can-map';
import CanComponent from 'can-component';
import template from './templates/three-dots-menu.stache';

const viewModel = CanMap.extend({
  disabled: true,
  observer: null,
  manageEmptyList(menuNode) {
    const isEmpty = menuNode.children.length === 0;
    this.attr('disabled', isEmpty);
  },
  mutationCallback(mutationsList) {
    mutationsList.forEach((mutation) => {
      const menuNode = mutation.target;
      this.manageEmptyList(menuNode);
    });
  },
  initObserver(menuNode) {
    const config = {childList: true};
    const observer = new MutationObserver(this.mutationCallback.bind(this));
    observer.observe(menuNode, config);
    this.attr('observer', observer);
  },
});

const events = {
  inserted(element) {
    const [menuNode] = element.find('[role=menu]');
    this.viewModel.initObserver(menuNode);
    this.viewModel.manageEmptyList(menuNode);
  },
  removed() {
    this.viewModel.attr('observer').disconnect();
  },
};

export default CanComponent.extend({
  tag: 'three-dots-menu',
  view: CanStache(template),
  leakScope: true,
  viewModel,
  events,
});
