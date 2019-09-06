/*
 Copyright (C) 2019 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canComponent from 'can-component';
import template from './reusable-objects-item.stache';
import canDefineMap from 'can-define/map/map';
import canDefineList from 'can-define/list/list';

export default canComponent.extend({
  tag: 'reusable-objects-item',
  view: canStache(template),
  leakScope: true,
  ViewModel: canDefineMap.extend({
    disabled: {
      value: false,
    },
    reuseAllowed: {
      value: true,
    },
    instance: {
      value: {},
    },
    selectedList: {
      value: canDefineList,
    },
    isChecked: {
      value: false,
    },
    setIsChecked() {
      let instance = this.instance;
      let list = this.selectedList;
      let index = $.makeArray(list).indexOf(instance);

      this.isChecked = index >= 0;
    },
  }),
  events: {
    init() {
      this.viewModel.setIsChecked();
    },
    '{viewModel} isChecked'([viewModel], ev, isChecked) {
      let list = viewModel.selectedList;
      let instance = viewModel.instance;
      let index = list.indexOf(instance);

      if (isChecked && index < 0) {
        list.push(instance);
      } else if (!isChecked) {
        if (index >= 0) {
          list.splice(index, 1);
        }
      }
    },
    '{viewModel.selectedList} length'() {
      this.viewModel.setIsChecked();
    },
  },
});
