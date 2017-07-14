/*!
    Copyright (C) 2017 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

(function (can) {
  'use strict';

  GGRC.Components('assessmentInlineConfirmAction', {
    tag: 'assessment-inline-confirm-action',
    viewModel: {
      define: {
        isAllowEdit: {
          get: function () {
            return this.isInProgress();
          }
        }
      },
      instance: {},
      setInProgress: null,
      editMode: false,
      type: '@',
      hideEdit: false,
      onStateChangeDfd: can.Deferred().resolve(),
      openInlineEdit: function (el) {
        this.attr('onStateChangeDfd').then(function () {
          if (this.isInProgress()) {
            this.attr('editMode', true);
          }
        }.bind(this));
      },
      isInProgress: function () {
        return this.attr('instance.status') === 'In Progress';
      },
      showConfirm: function () {
        var self = this;
        var confirmation = can.Deferred();
        GGRC.Controllers.Modals.confirm({
          modal_title: 'Confirm moving Assessment to "In Progress"',
          modal_description: 'You are about to move Assesment from "' +
            this.instance.status +
            '" to "In Progress" - are you sure about that?',
          button_view: GGRC.mustache_path + '/modals/prompt_buttons.mustache'
        }, confirmation.resolve, confirmation.reject);

        confirmation.then(function (data) {
          self.dispatch('setInProgress');
          self.openInlineEdit();
        });
      }
    },
    events: {
      inserted: function () {
        var archived = this.viewModel.attr('instance.archived');
        this.viewModel.attr('hideEdit', archived);
      },
      '{.inline-edit-icon} mousedown': function (el, ev) {
        var viewModel = this.viewModel;
        var editIcon = $(ev.target).hasClass('inline-edit-icon');

        if (editIcon && !viewModel.isInProgress()) {
          viewModel.showConfirm();
          ev.preventDefault();
          return false;
        }
      }
    }
  });
})(window.can);
