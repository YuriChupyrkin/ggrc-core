/*!
    Copyright (C) 2017 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

(function (can, $) {
  'use strict';

  var innerTplFolder = GGRC.mustache_path + '/components/inline';

  function getInnerInlineTemplat(type) {
    type = can.Mustache.resolve(type);
    return innerTplFolder + '/' + type + '.mustache';
  }

  GGRC.Components('inlineEditNew', {
    tag: 'inline-edit-new',
    template: can.view(
      GGRC.mustache_path + '/components/inline/inline.mustache'
    ),
    viewModel: {
      editMode: false,
      withReadMore: false,
      isLoading: false,
      type: '@',
      value: '@',
      dropdownOptions: [],
      dropdownClass: '@',
      dropdownNoValue: false,

      // before entering the edit mode
      _EV_BEFORE_EDIT: 'before-edit',

      context: {
        value: null
      },
      changeEditMode: function (editMode) {
        var confirmation;
        var onBeforeEdit;

        if (!editMode) {
          this.attr('editMode', false);
        }
        
       // onBeforeEdit = this.$rootEl.attr('can-' + scope._EV_BEFORE_EDIT);

        if (!onBeforeEdit) {
          this.attr('editMode', true);
          return;
        }

        confirmation = this.$rootEl.triggerHandler({
          type: this._EV_BEFORE_EDIT
        });

        // and do nothing if no confirmation by the user
        confirmation.done(function () {
          this.attr('editMode', true);
        }.bind(this));
      },
      setPerson: function (scope, el, ev) {
        this.attr('context.value', ev.selectedItem.serialize());
      },
      unsetPerson: function (scope, el, ev) {
        ev.preventDefault();
        this.attr('context.value', undefined);
      },
      save: function () {
        var oldValue = this.attr('value');
        var value = this.attr('context.value');

        this.attr('editMode', false);
        // In case value is String and consists only of spaces - do nothing
        if (typeof value === 'string' && !value.trim()) {
          this.attr('context.value', '');
          value = null;
        }

        if (oldValue === value) {
          return;
        }

        this.attr('value', value);

        this.dispatch({
          type: 'inlineSave',
          value: value
        });
      },
      cancel: function () {
        var value = this.attr('value');
        this.attr('editMode', false);
        this.attr('context.value', value);

        this.dispatch({
          type: 'inlineCancel',
          value: value
        });
      },
      updateContext: function () {
        var value = this.attr('value');
        this.attr('context.value', value);
      }
    },
    events: {
      init: function () {
        this.viewModel.updateContext();
      },
      '{window} mousedown': function (el, ev) {
        var viewModel = this.viewModel;
        var editIcon = $(ev.target).hasClass('inline-edit-icon');
        var isInside = GGRC.Utils.events.isInnerClick(this.element, ev.target);
        var editMode = viewModel.attr('editMode');

        if (!isInside && editMode) {
          viewModel.cancel();
        }

        if (isInside && !editMode && editIcon) {
          viewModel.changeEditMode(true);
        }
      },
      '{viewModel} value': function () {
        this.viewModel.updateContext();
      }
    },
    helpers: {
      renderInnerInlineTemplate: function (type, options) {
        return can.view
          .render(getInnerInlineTemplat(type), options.context);
      }
    }
  });
})(window.can, window.can.$);
