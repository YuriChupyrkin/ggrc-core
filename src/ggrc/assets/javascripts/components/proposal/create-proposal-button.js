/*
 Copyright (C) 2017 Google Inc., authors, and contributors
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import template from './templates/create-proposal-button.mustache';
const tag = 'create-proposal-button';

export default can.Component.extend({
  tag,
  template,
  viewModel: {
    define: {
      showProposalButton: {
        get() {
          const instanceType = this.attr('instance.type');
          const models = this.attr('_allowProposeModels');

          if (!instanceType) {
            return false;
          }

          return _.indexOf(models, instanceType) > -1;
        },
      },
    },
    _allowProposeModels: [
      'Control',
      'Risk',
    ],
    instance: {},
  },
});
