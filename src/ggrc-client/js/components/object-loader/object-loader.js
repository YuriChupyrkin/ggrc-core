/*
  Copyright (C) 2019 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import RefreshQueue from '../../models/refresh_queue';

export default can.Component.extend({
  tag: 'object-loader',
  leakSkope: true,
  viewModel: {
    define: {
      path: {
        set(value) {
          if (value) {
            new RefreshQueue().enqueue(value).trigger().done(
              (response) => {
                this.attr('loadedObject', response[0]);
              });
          }
        },
      },
    },
    loadedObject: null,
  },
});
