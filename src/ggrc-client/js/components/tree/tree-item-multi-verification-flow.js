/*
 Copyright (C) 2019 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import template from './templates/tree-item-multi-verification-flow.stache';
import Person from '../../models/business-models/person';
import {
  isMultiLevelFlow,
} from '../../plugins/utils/verification-flow-utils';

export default canComponent.extend({
  tag: 'tree-item-multi-verification-flow',
  view: canStache(template),
  leakScope: true,
  viewModel: canMap.extend({
    instance: null,
    attrName: '',
    attrLevel: null,
    verifiers: [],
    verifierType: Person,
    renderAttr() {
      const instance = this.attr('instance');
      if (!isMultiLevelFlow(instance)) {
        return;
      }

      const attrName = this.attr('attrName');
      const attrLevel = this.attr('attrLevel');

      if (attrName.includes('verifiers_level')) {
        const verifiers = instance.getVerifiersByLevel(attrLevel);
        this.attr('verifiers', verifiers);
        return;
      }

      if (attrName.includes('review_level')) {
        console.log('REVIEW_LEVEL');
      }
    },
  }),
  events: {
    inserted() {
      this.viewModel.renderAttr();
    },
    '{viewModel.instance.review_levels} change'() {
      console.log('{viewModel.instance} review_levels CHANGED!!');
      console.log(this.viewModel.attr('instance')._cid);
      this.viewModel.renderAttr();
    },
  },
});
