/*!
 Copyright (C) 2017 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

(function (can, _, GGRC, Permission, Mustache) {
  'use strict';

  GGRC.Components('editablePeopleListMapping', {
    tag: 'editable-people-list-mapping',
    template: can.view(
      GGRC.mustache_path +
      '/components/people/editable-people-list-mapping.mustache'
    ),
    viewModel: {
      instance: {}
    }
  });
})(window.can, window._, window.GGRC, window.Permission, can.Mustache);
