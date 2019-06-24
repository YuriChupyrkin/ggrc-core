/*
    Copyright (C) 2019 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import CanStache from 'can-stache';
import CanMap from 'can-map';
import CanComponent from 'can-component';
import template from './templates/proposable-control.stache';
import {getProposalAttrUrl} from '../../../plugins/utils/ggrcq-utils';

const viewModel = CanMap.extend({
  define: {
    link: {
      get() {
        return getProposalAttrUrl(this.attr('instance'), this.attr('attrName'));
      },
    },
  },
  instance: null,
  attrName: '',
});

export default CanComponent.extend({
  tag: 'proposable-control',
  leakScope: false,
  view: CanStache(template),
  viewModel,
});
