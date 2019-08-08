/*
 Copyright (C) 2019 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import loDifference from 'lodash/difference';
import canMap from 'can-map';
import canComponent from 'can-component';
import * as StateUtils from '../../plugins/utils/state-utils';
import router from '../../router';
import {
  getTreeViewStates,
  setTreeViewStates,
} from '../../plugins/utils/display-prefs-utils';

let viewModel = canMap.extend({
  disabled: false,
  options: {
    name: 'status',
    query: null,
  },
  filterStates: [],
  widgetId: null,
  modelName: null,
  define: {
    currentStates: {
      get() {
        let states = this.attr('filterStates')
          .filter((state) => state.checked)
          .map((state) => state.value);
        return states;
      },
    },
    allStates: {
      get() {
        let modelName = this.attr('modelName');
        let states = StateUtils.getStatesForModel(modelName);
        return states;
      },
    },
  },
  selectItems(event) {
    let selectedStates = event.selected.map((state) => state.value);

    buildSearchQuery(this, selectedStates);
    saveTreeStates(this, selectedStates);
    setStatesRoute(this, selectedStates);
    this.dispatch('filter');
  },
});

export default canComponent.extend({
  tag: 'tree-status-filter',
  leakScope: true,
  viewModel: viewModel,
  events: {
    init() {
      let vm = this.viewModel;

      vm.attr('router', router);

      if (vm.registerFilter) {
        let options = vm.attr('options');
        vm.registerFilter(options);
      }

      // Setup key-value pair items for dropdown
      let filterStates = vm.attr('allStates').map((state) => {
        return {
          value: state,
        };
      });
      vm.attr('filterStates', filterStates);

      let defaultStates = getDefaultStates(vm);
      buildSearchQuery(vm, defaultStates);
      setStatesDropdown(vm, defaultStates);
      setStatesRoute(vm, defaultStates);
    },
    '{viewModel} disabled'() {
      if (this.viewModel.attr('disabled')) {
        setStatesDropdown(this.viewModel, []);
        setStatesRoute(this.viewModel, []);
      } else {
        let defaultStates = getDefaultStates(this.viewModel);
        setStatesDropdown(this.viewModel, defaultStates);
        setStatesRoute(this.viewModel, defaultStates);
      }
    },
    '{viewModel.router} state'([router], event, newStatuses) {
      let isCurrent = this.viewModel.attr('widgetId') === router.attr('widget');
      let isEnabled = !this.viewModel.attr('disabled');

      let currentStates = this.viewModel.attr('currentStates');
      newStatuses = newStatuses || this.viewModel.attr('allStates');
      let isChanged =
        loDifference(currentStates, newStatuses).length ||
        loDifference(newStatuses, currentStates).length;

      if (isCurrent && isEnabled && isChanged) {
        buildSearchQuery(this.viewModel, newStatuses);
        setStatesDropdown(this.viewModel, newStatuses);
        this.viewModel.dispatch('filter');
      }
    },
    '{viewModel.router} widget'([router]) {
      let isCurrent = this.viewModel.attr('widgetId') === router.attr('widget');
      let isEnabled = !this.viewModel.attr('disabled');
      let routeStatuses = router.attr('state');

      if (isCurrent && isEnabled && !routeStatuses) {
        let statuses = this.viewModel.attr('currentStates');
        setStatesRoute(this.viewModel, statuses);
      }
    },
  },
});

function getDefaultStates(vm) {
  let widgetId = vm.attr('widgetId');
  // Get the status list from local storage
  let savedStates = getTreeViewStates(widgetId);
  // Get the status list from query string
  let queryStates = router.attr('state');

  let modelName = vm.attr('modelName');
  let allStates = vm.attr('allStates');

  let defaultStates = (queryStates || savedStates).filter((state) => {
    return allStates.includes(state);
  });

  if (defaultStates.length === 0) {
    defaultStates = StateUtils.getDefaultStatesForModel(modelName);
  }

  return defaultStates;
}

function saveTreeStates(vm, selectedStates) {
  let widgetId = vm.attr('widgetId');
  setTreeViewStates(widgetId, selectedStates);
}

function setStatesDropdown(vm, states) {
  let statuses = vm.attr('filterStates').map((item) => {
    item.attr('checked', (states.indexOf(item.value) > -1));

    return item;
  });

  // need to trigger change event for 'filterStates' attr
  vm.attr('filterStates', statuses);
}

function setStatesRoute(vm, states) {
  let allStates = vm.attr('allStates');

  if (states.length && loDifference(allStates, states).length) {
    router.attr('state', states);
  } else {
    router.removeAttr('state');
  }
}

function buildSearchQuery(vm, states) {
  let allStates = vm.attr('allStates');
  let modelName = vm.attr('modelName');
  let query = (states.length && loDifference(allStates, states).length) ?
    StateUtils.buildStatusFilter(states, modelName) :
    null;
  vm.attr('options.query', query);
}
