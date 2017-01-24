/*!
  Copyright (C) 2017 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

(function (can) {
  GGRC.Components('unmapAction', {
    tag: 'unmap-action',
    template: can.view(GGRC.mustache_path +
      '/base_templates/unmap_action.mustache'),
    scope: {
      show_spinner: false,
      ez: undefined,
      init: function () {
        console.log('unmap init!');
        window.unmapper = this;
      },
      unmap: function () {
        console.log('unmap!!');

        if (!this.ez) {
          console.log('unmap action is undefined');
          return;
        }

        this.ez.remove_role();
      }
    }
  });
})(window.can);
