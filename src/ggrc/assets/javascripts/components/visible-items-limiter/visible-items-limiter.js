/*!
    Copyright (C) 2017 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

(function (can, GGRC) {
  'use strict';

  GGRC.Components('visibleItemsLimiter', {
    tag: 'visible-items-limiter',
    template: can.view(
      GGRC.mustache_path +
      '/components/visible-items-limiter/' +
      'visible-items-limiter.mustache'
    ),
    viewModel: {
      define: {
        visibleItems: {
          get: function (value) {
            var startLimit = this.attr('startLimit');

            return this.isAboveLimit() ?
              this.attr('items').slice(0, startLimit) :
              this.attr('items');
          }
        }
      },
      isAboveLimit: function () {
        return this.attr('applyLimit') &&
          this.attr('startLimit') < this.attr('items.length');
      },
      items: [],
      startLimit: 3,
      applyLimit: true,
      showAll: function () {
        this.attr('applyLimit', false);
      }
    }
  });
})(window.can, window.GGRC);
