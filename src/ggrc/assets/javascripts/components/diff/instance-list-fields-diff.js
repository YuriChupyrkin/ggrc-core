/*
 Copyright (C) 2017 Google Inc., authors, and contributors
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import {buildModifiedListField} from '../../plugins/utils/object-history-utils';
import {REFRESH_PROPOSAL_DIFF} from '../../events/eventTypes';
import DiffBaseVM from './diff-base-vm';
const tag = 'instance-list-fields-diff';

const viewModel = DiffBaseVM.extend({
  modifiedFields: {},

  buildDiffObject() {
    const instance = this.attr('currentInstance');
    const modifiedKeys = can.Map.keys(this.attr('modifiedFields'));
    const modifiedFields = modifiedKeys.map((key) => {
      const currentVal = this.loadFieldList(instance.attr(key));
      const modifiedItem = this.attr('modifiedFields')[key];
      const modifiedVal = buildModifiedListField(currentVal, modifiedItem);

      return {
        attrName: key,
        currentVal,
        modifiedVal,
      };
    });

    const diff = modifiedFields.map((item) => this.buildDisplayNames(item));
    this.attr('diff', diff);
  },
  buildDisplayNames(diffData) {
    const currentDisplayNames = this.getDisplayValue(diffData.currentVal);
    const modifiedDiplayNames = this.getDisplayValue(diffData.modifiedVal);
    const attrName = this.getAttrDisplayName(diffData.attrName);
    const diff = {
      attrName,
      currentVal: currentDisplayNames,
      modifiedVal: modifiedDiplayNames,
    };

    return diff;
  },
  getDisplayValue(value) {
    const displayNames = value.map((item) => this.getDisplayName(item));
    return displayNames.length ?
      displayNames.sort() :
      [this.attr('emptyValue')];
  },
  loadFieldList(values) {
    // get from cache
    return values.map((item) => item.reify());
  },
});

export default can.Component.extend({
  tag,
  viewModel: viewModel,
  events: {
    buildDiff() {
      const instance = this.viewModel.attr('currentInstance');
      const modifiedFields = this.viewModel.attr('modifiedFields');
      if (!modifiedFields || !instance) {
        return;
      }
      this.viewModel.buildDiffObject();
    },
    inserted() {
      this.buildDiff();
    },
    [`{viewModel.currentInstance} ${REFRESH_PROPOSAL_DIFF.type}`]() {
      this.buildDiff();
    },
  },
});
