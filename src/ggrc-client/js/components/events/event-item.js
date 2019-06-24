/*
    Copyright (C) 2019 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import CanStache from 'can-stache';
import CanMap from 'can-map';
import CanComponent from 'can-component';
import template from './event-item.stache';

export default CanComponent.extend({
  tag: 'event-item',
  view: CanStache(template),
  viewModel: CanMap.extend({
    define: {
      hasHiddenRevisions: {
        get() {
          return this.attr('event.revisions_count') > 100;
        },
      },
      hiddenRevisionsCount: {
        get() {
          return this.attr('event.revisions_count') - 100;
        },
      },
    },
    event: null,
  }),
});
