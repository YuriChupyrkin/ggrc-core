/*!
    Copyright (C) 2017 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

(function (can, GGRC) {
  'use strict';


  GGRC.Components('issueUnmap', {
    tag: 'issue-unmap',
    template: can.view(
      GGRC.mustache_path +
      '/components/issue/issue-unmap.mustache'
    ),
    viewModel: {
      issueInstance: {},
      target: {}
    }
  });
})(window.can, window.GGRC);
