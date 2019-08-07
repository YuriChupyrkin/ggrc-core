/*
 Copyright (C) 2019 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import '../../collapsible-panel/collapsible-panel';
import '../../object-list-item/business-object-list-item';
import '../../object-list-item/detailed-business-object-list-item';
import '../mapped-control-related-objects/mapped-control-related-objects';
import {
  prepareCustomAttributes,
  convertToFormViewField,
} from '../../../plugins/utils/ca-utils';
import {
  buildParam,
  batchRequests,
} from '../../../plugins/utils/query-api-utils';
import {
  toObject,
  transformQueryToSnapshot,
} from '../../../plugins/utils/snapshot-utils';
import template from './assessment-mapped-controls.stache';
import {notifier} from '../../../plugins/utils/notifiers-utils';

/**
 * ViewModel for Assessment Mapped Controls Popover.
 * @type {canMap}
 */
const viewModel = canMap.extend({
  define: {
    /**
     * Private Attribute defining array of requested Objects, Types and Fields of Objects
     * @type {Array}
     * @private
     */
    queries: {
      type: '*',
      value: [
        {
          type: 'requirements',
          objName: 'Requirement',
          fields: ['child_id', 'child_type', 'revision', 'parent'],
        },
        {
          type: 'regulations',
          objName: 'Regulation',
          fields: ['child_id', 'child_type', 'revision', 'parent'],
        },
      ],
    },
    /**
     * Attribute to indicate loading state
     * @private
     */
    mappedItems: {
      set(newArr) {
        return newArr.map((item) => {
          return {
            isSelected: false,
            instance: item,
          };
        });
      },
    },
  },
  isLoading: false,
  objectives: [],
  regulations: [],
  customAttributes: [],
  state: {},
  titleText: '',
  mapping: '',
  mappingType: '',
  selectedItem: {},
  snapshot: {},
  assessmentType: '',
  withoutDetails: false,
  loadItems(id) {
    let params = getParams(this, id);

    this.attr('isLoading', true);
    return $.when(...params.map((param) => {
      return batchRequests(param.request).then((response) => {
        let objects = response.Snapshot.values.map((item) => toObject(item));
        this.attr(param.type, objects);
      });
    })).then(null, () => {
      notifier('error', 'Failed to fetch related objects.');
    }).always(() => this.attr('isLoading', false));
  },
});
/**
 * Assessment specific mapped controls view component
 */
export default canComponent.extend({
  tag: 'assessment-mapped-controls',
  view: canStache(template),
  leakScope: true,
  viewModel: viewModel,
  events: {
    '{viewModel} selectedItem.data'() {
      const item = this.viewModel.attr('selectedItem.data');
      let attributes;
      if (item) {
        if (!this.viewModel.attr('withoutDetails')) {
          let id = item.attr('id');
          this.viewModel.loadItems(id);
        }
        attributes = attributesToFormFields(
          item.attr('revision.content'));
        this.viewModel.attr('customAttributes', attributes);
        this.viewModel.attr('snapshot',
          toObject(item));
        this.viewModel.attr('state.open', true);
      }
    },
  },
});

/**
 * Generate params required for Query API
 * @param {CanMap} vm - component's viewModel
 * @param {Number} id - Id of Control's Snapshot
 * @return {Object} request query object
 */
function getParams(vm, id) {
  // Right now we load only Snapshots of related Objectives and Regulations
  const relevant = {
    type: 'Snapshot',
    id: id,
    operation: 'relevant',
  };
  let params = vm.attr('queries')
    .map((query) => {
      const resultingQuery =
        buildParam(query.objName, {}, relevant, query.fields);
      return {
        type: query.type,
        request: transformQueryToSnapshot(resultingQuery),
      };
    });
  return params;
}

function attributesToFormFields(snapshot) {
  const attributes = prepareCustomAttributes(
    snapshot.custom_attribute_definitions,
    snapshot.custom_attribute_values)
    .map(convertToFormViewField);
  return attributes;
}
