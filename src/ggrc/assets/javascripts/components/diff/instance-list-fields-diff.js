/*
 Copyright (C) 2017 Google Inc., authors, and contributors
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import {REFRESH_PROPOSAL_DIFF} from '../../events/eventTypes';
import DiffBaseVM from './diff-base-vm';
const tag = 'instance-list-fields-diff';

const viewModel = DiffBaseVM.extend({
  modifiedFields: {},
  buildDiffObject() {
    const modifiedKeys = can.Map.keys(this.attr('modifiedFields'));
    const data = modifiedKeys.map((key) => this.buildDiffData(key));
    const diff = data.map((item) => this.buildDisplayNames(item));
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
    return displayNames.length ? displayNames : [this.attr('emptyValue')];
  },
  buildDiffData(key) {
    const instance = this.attr('currentInstance');
    const modifiedField = this.attr('modifiedFields').attr(key);
    let currentField;
    let modifiedItems;
    let shouldBeAdded;

    if (!currentField) {
      currentField = new can.List([]);
    }

    currentField = this.loadFieldList(instance.attr(key));
    modifiedItems = currentField.attr().slice();

    shouldBeAdded = modifiedField.added.filter((item) =>
      _.findIndex(currentField, {id: item.id}) === -1);

    // push added items
    modifiedItems.push(...shouldBeAdded);

    // remove deleted items
    _.remove(modifiedItems, (item) =>
      _.findIndex(modifiedField.deleted, {id: item.id}) > -1);

    return {
      attrName: key,
      currentVal: currentField.attr(),
      modifiedVal: modifiedItems,
    };
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
