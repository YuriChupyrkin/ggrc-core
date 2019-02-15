/*
 Copyright (C) 2019 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import template from './reusable-objects.stache';

export default can.Component.extend({
  tag: 'reusable-objects',
  template: can.stache(template),
  leakScope: true,
  viewModel: {
    define: {
      reuseAllowed: {
        type: Boolean,
        get() {
          let evidence = this.attr('instance');
          return this.checkReuseability(evidence);
        },
      },
    },
    disabled: false,
    instance: null,
    selectedList: [],
    isChecked: false,
    checkReuseability(evidence) {
      let isFile = evidence.attr('kind') === 'FILE';
      let isGdriveIdProvided = !!evidence.attr('gdrive_id');

      return !isFile || isGdriveIdProvided;
    },
  },
  events: {
    '{viewModel} isChecked'(viewModel, ev, isChecked) {
      let list = viewModel.attr('selectedList');
      let instance = viewModel.attr('instance');
      let index = list.indexOf(instance);

      if (isChecked && index < 0) {
        list.push(instance);
      } else if (!isChecked) {
        if (index >= 0) {
          list.splice(index, 1);
        }
      }
    },
    '{viewModel.selectedList} change'(list) {
      let instance = this.viewModel.attr('instance');
      let index = list.indexOf(instance);

      this.viewModel.attr('isChecked', index >= 0);
    },
  },
});
