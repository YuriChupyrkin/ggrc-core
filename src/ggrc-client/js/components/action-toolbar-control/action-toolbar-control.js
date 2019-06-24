/*
  Copyright (C) 2019 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import CanStache from 'can-stache';
import CanMap from 'can-map';
import CanComponent from 'can-component';
export default CanComponent.extend({
  tag: 'action-toolbar-control',
  view: CanStache(
    '<div class="action-toolbar__controls-item"><content/></div>'
  ),
  leakScope: true,
  viewModel: CanMap.extend({}),
});

