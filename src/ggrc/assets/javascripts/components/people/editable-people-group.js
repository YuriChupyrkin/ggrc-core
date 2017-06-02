/*!
 Copyright (C) 2017 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

(function (can, GGRC, Mustache) {
  'use strict';

  GGRC.Components('editablePeopleGroup', {
    tag: 'editable-people-group',
    template: can.view(
      GGRC.mustache_path +
      '/components/people/editable-people-group.mustache'
    ),
    viewModel: {
      title: '@',
      required: '@',
      people: [],
      groupId: '@',
      instance: {},
      isLoading: false,
      canUnmap: true,
      withDetails: true,
      editableMode: false,
      personSelected: function (person) {
        this.dispatch({
          type: 'personSelected',
          person: person,
          groupId: this.attr('groupId')
        });
      },
      unmap: function (person) {
         this.dispatch({
          type: 'unmap',
          person: person,
          groupId: this.attr('groupId')
        });
      },
      save: function () {
        this.dispatch('saveChanges');
      },
      cancel: function () {
        this.changeEditableMode(false);
      },
      changeEditableMode: function (editableMode) {
        this.attr('editableMode', editableMode);
        this.dispatch({
          type: 'changeEditableMode',
          isAddEditableGroup: editableMode,
          groupId: this.attr('groupId')
        });
      }
    },
    events: {
      '{window} mousedown': function (el, ev) {
        var viewModel = this.viewModel;
        var editableIcon = $(ev.target).hasClass('set-editable-group');
        var isInside = GGRC.Utils.events.isInnerClick(this.element, ev.target);
        var editableMode = viewModel.attr('editableMode');
        console.log(isInside);

        if (!isInside && editableMode) {
          viewModel.cancel();
        }

        if (isInside && !editableMode && editableIcon) {
          viewModel.changeEditableMode(true);
        }
      }
    },
    helpers: {
      can_unmap: function (options) {
        var people = this.attr('people');
        var required = this.attr('required');
        if (required) {
          if (people.length > 1) {
            return options.fn(options.context);
          }
          return options.inverse(options.context);
        }
        return options.fn(options.context);
      }
    }
  });
})(window.can, window.GGRC, can.Mustache);
