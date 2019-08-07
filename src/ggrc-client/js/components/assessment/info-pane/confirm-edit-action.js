/*
    Copyright (C) 2019 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canMap from 'can-map';
import canComponent from 'can-component';
import '../../inline/base-inline-control-title';
import {confirm} from '../../../plugins/utils/modals';

const EDITABLE_STATES = [
  'In Progress', 'Not Started', 'Rework Needed', 'Deprecated'];

export default canComponent.extend({
  tag: 'confirm-edit-action',
  leakScope: true,
  viewModel: canMap.extend({
    instance: {},
    setInProgress: null,
    editMode: false,
    isEditIconDenied: false,
    isConfirmationNeeded: true,
    onStateChangeDfd: $.Deferred().resolve(),
    confirmEdit: function () {
      if (this.attr('isConfirmationNeeded') && !isInEditableState(this)) {
        return showConfirm(this);
      }

      // send 'isLastOpenInline' when inline is opening without confirm
      this.dispatch({
        type: 'setEditMode',
        isLastOpenInline: true,
      });
    },
  }),
});

function openEditMode(vm, el) {
  return vm.attr('onStateChangeDfd').then(function () {
    if (isInEditableState(vm)) {
      vm.dispatch('setEditMode');
    }
  });
}

function isInEditableState(vm) {
  return EDITABLE_STATES.includes(vm.attr('instance.status'));
}

function showConfirm(vm) {
  let self = vm;
  let confirmation = $.Deferred();
  confirm({
    modal_title: 'Confirm moving Assessment to "In Progress"',
    modal_description: 'You are about to move Assessment from "' +
    vm.instance.status +
      '" to "In Progress" - are you sure about that?',
    button_view: GGRC.templates_path + '/modals/prompt_buttons.stache',
  }, confirmation.resolve, confirmation.reject);

  return confirmation.then(function (data) {
    self.dispatch('setInProgress');
    openEditMode(self);
  });
}
