/*
 Copyright (C) 2017 Google Inc., authors, and contributors
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import template from './templates/fileds-diff-items.mustache';
const tag = 'fileds-diff-items';

export default can.Component.extend({
  tag,
  template,
  viewModel: {
    diff: [],
    instance: {},
  },
});
