/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import '../dropdown/dropdown-component';
import '../dropdown/autocomplete-dropdown';
import '../numberbox/numberbox-component';
import template from './templates/modal-issue-tracker-fields.stache';
import {loadComponentIds} from '../../plugins/utils/issue-tracker-utils';

const state = {
  NOT_SELECTED: 0,
  GENERATE_NEW: 1,
  LINK_TO_EXISTING: 2,
  LINKED: 3,
};

export default canComponent.extend({
  tag: 'modal-issue-tracker-fields',
  view: canStache(template),
  leakScope: true,
  viewModel: canMap.extend({
    define: {
      displayFields: {
        get() {
          return this.attr('instance.issue_tracker.enabled') &&
            this.attr('currentState') !== state.NOT_SELECTED;
        },
      },
    },
    instance: {},
    note: '',
    mandatoryTicketIdNote: '',
    isTicketIdMandatory: false,
    componentIds: [],
    componentIdsLoading: false,
    state,
    currentState: state.NOT_SELECTED,
    generateNewTicket() {
      if (this.attr('currentState') === state.GENERATE_NEW) {
        return;
      }

      this.setComponentIds();

      this.attr('currentState', state.GENERATE_NEW);
      this.setValidationFlags({linking: false, initialized: true});

      this.attr('instance').setDefaultHotlistAndComponent();
      this.attr('instance.issue_tracker.issue_id', null);

      this.dispatch({
        type: 'issueTrackerStateChanged',
        state: 'generateNew',
      });
    },
    linkToExistingTicket() {
      if (this.attr('currentState') === state.LINK_TO_EXISTING) {
        return;
      }

      this.attr('currentState', state.LINK_TO_EXISTING);
      this.setValidationFlags({linking: true, initialized: true});

      this.attr('instance.issue_tracker').attr({
        issue_id: null,
        hotlist_id: null,
        component_id: null,
      });

      this.dispatch({
        type: 'issueTrackerStateChanged',
        state: 'linkToExisting',
      });
    },
    setTicketIdMandatory() {
      let instance = this.attr('instance');

      if (instance.constructor.unchangeableIssueTrackerIdStatuses) {
        this.attr('isTicketIdMandatory',
          instance.constructor.unchangeableIssueTrackerIdStatuses
            .includes(instance.attr('status')));
      }
    },
    setValidationFlags({initialized, linking}) {
      this.attr('instance.issue_tracker').attr({
        is_linking: linking,
        _initialized: initialized,
      });
    },
    setComponentIds() {
      // componentIds attr has already set
      if (this.attr('componentIds').length > 0) {
        return;
      }

      this.attr('componentIdsLoading', true);

      return loadComponentIds().then((ids) => {
        this.attr('componentIds', ids);
      }).finally(() => {
        this.attr('componentIdsLoading', false);
      });
    },
  }),
  events: {
    inserted() {
      let vm = this.viewModel;

      vm.setTicketIdMandatory();
      if (vm.attr('instance').issueCreated()) {
        vm.attr('currentState', state.LINKED);
        vm.setValidationFlags({initialized: true, linking: false});
        return;
      }

      vm.setValidationFlags({initialized: false, linking: false});
    },
    '{viewModel.instance} status'() {
      this.viewModel.setTicketIdMandatory();
    },
    removed() {
      let instance = this.viewModel.attr('instance');
      if (instance) {
        instance.removeAttr('issue_tracker.is_linking');
        instance.removeAttr('issue_tracker._initialized');
      }
    },
  },
});
