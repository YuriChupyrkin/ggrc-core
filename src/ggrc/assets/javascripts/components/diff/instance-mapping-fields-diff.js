/*
 Copyright (C) 2017 Google Inc., authors, and contributors
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import {REFRESH_PROPOSAL_DIFF} from '../../events/eventTypes';
import RefreshQueue from '../../models/refresh_queue';
import DiffBaseVM from './diff-base-vm';
const tag = 'instance-mapping-fields-diff';

const viewModel = DiffBaseVM.extend({
  modifiedFields: {},

  buildDiffObject() {
    const fieldsKeys = can.Map.keys(this.attr('modifiedFields'));
    const diffPromises = fieldsKeys.map(async (key) => {
      return await this.buildFieldDiff(key);
    });

    Promise.all(diffPromises).then((data) => {
      const notEmptyDiffs = data.filter((item) => !!item);
      this.attr('diff', notEmptyDiffs);
    });
  },
  async buildFieldDiff(key) {
    const modifiedValueStub = this.attr('modifiedFields').attr(key);
    const currentValueStub = this.attr('currentInstance').attr(key);
    let modifiedField;
    let currentValue;
    let modifiedDisplayName;
    let currentDisplayName;

    if (!currentValueStub && !modifiedValueStub) {
      return;
    }

    modifiedField = await this.getModifiedValue(modifiedValueStub);

    currentValue = this.getCurrentValue(currentValueStub);

    modifiedDisplayName = this.getDisplayName(modifiedField);
    currentDisplayName = this.getDisplayName(currentValue);

    return {
      attrName: this.getAttrDisplayName(key),
      currentVal: currentDisplayName,
      modifiedVal: modifiedDisplayName,
    };
  },
  getCurrentValue(currentValueStub) {
    // current value should be in cache
    return currentValueStub ? currentValueStub.reify() : null;
  },
  async getModifiedValue(modifiedValueStub) {
    let id;
    let type;
    if (!modifiedValueStub) {
      return;
    }

    id = modifiedValueStub.id;
    type = modifiedValueStub.type;
    return await this.getObjectData(id, type, 'title');
  },
  getObjectData(id, type, requiredAttr) {
    const promise = new Promise((resolve, reject) => {
      let modelInstance;

      if (!id || !type || !requiredAttr) {
        reject();
      }

      modelInstance = CMS.Models[type].store[id] || {};

      if (modelInstance && modelInstance.hasOwnProperty(requiredAttr)) {
        resolve(modelInstance);
      } else {
        modelInstance = new CMS.Models[type]({id: id});
        new RefreshQueue()
          .enqueue(modelInstance)
          .trigger()
          .done((data) => {
            data = Array.isArray(data) ? data[0] : data;
            resolve(data);
          })
          .fail(function () {
            GGRC.Errors
              .notifier('error', `Failed to fetch data for ${type}: ${id}.`);
            reject();
          });
      }
    });

    return promise;
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
