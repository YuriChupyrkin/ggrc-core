/*!
 Copyright (C) 2017 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

(function (can, GGRC, Mustache) {
  'use strict';

  GGRC.Components('deletablePeopleGroup', {
    tag: 'deletable-people-group',
    template: can.view(
      GGRC.mustache_path +
      '/components/people/deletable-people-group.mustache'
    ),
    viewModel: {
      required: '@',
      people: [],
      groupId: '@',
      canUnmap: true,
      instance: {},
      isLoading: false,
      withDetails: true,
      unmap: function (person) {
         this.dispatch({
          type: 'unmap',
          person: person,
          groupId: this.attr('groupId')
        });
      }
    },
    events: {
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
