/*
 Copyright (C) 2019 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import '../sortable-column/sortable-column';
import '../object-list/object-list';
import '../object-list-item/business-object-list-item';
import '../object-list-item/document-object-list-item';
import '../object-popover/related-assessment-popover';
import '../reusable-objects/reusable-objects-item';
import '../state-colors-map/state-colors-map';
import '../spinner-component/spinner-component';
import '../tree-pagination/tree-pagination';
import Pagination from '../base-objects/pagination';
import template from './templates/related-assessments.stache';
import {prepareCustomAttributes} from '../../plugins/utils/ca-utils';
import isFunction from 'can-util/js/is-function/is-function';
import {backendGdriveClient} from '../../plugins/ggrc-gapi-client';
import tracker from '../../tracker';
import Evidence from '../../models/business-models/evidence';
import Context from '../../models/service-models/context';
import * as businessModels from '../../models/business-models';
import {REFRESH_RELATED} from '../../events/eventTypes';

const defaultOrderBy = [
  {field: 'finished_date', direction: 'desc'},
  {field: 'created_at', direction: 'desc'},
];

export default canComponent.extend({
  tag: 'related-assessments',
  view: canStache(template),
  leakScope: true,
  viewModel: canMap.extend({
    define: {
      unableToReuse: {
        get: function () {
          let hasItems = this.attr('selectedEvidences.length');
          let isSaving = this.attr('isSaving');

          return !hasItems || isSaving;
        },
      },
      relatedObjectType: {
        get: function () {
          // Get related object type based on assessment or the instance itself
          // 'instance.assessment_type' is used for object in "Related assessments" in
          // assessments info pane.
          // 'instance.type' is used when we are getting related assessment for
          // a snapshot.
          return this.attr('instance.assessment_type') ||
                 this.attr('instance.type');
        },
      },
      relatedObjectsTitle: {
        get: function () {
          const relObjType = this.attr('relatedObjectType');

          const objectName = businessModels[relObjType].model_plural;
          return `Related ${objectName}`;
        },
      },
      paging: {
        value: function () {
          return new Pagination({pageSizeSelect: [5, 10, 15]});
        },
      },
    },
    instance: {},
    selectedEvidences: [],
    orderBy: {},
    isSaving: false,
    loading: false,
    needReuse: false,
    relatedAssessments: [],
    reuseSelected: function () {
      this.attr('isSaving', true);

      let reusedObjectList = this.attr('selectedEvidences').map((evidence) => {
        let model = buildEvidenceModel(this, evidence);

        return backendGdriveClient.withAuth(() => {
          return model.save();
        });
      });

      return $.when(...reusedObjectList)
        .done((...evidence) => {
          this.dispatch({
            type: 'reusableObjectsCreated',
            items: evidence,
          });
        })
        .always(() => {
          this.attr('selectedEvidences').replace([]);
          this.attr('isSaving', false);
        });
    },
  }),
  init() {
    loadRelatedAssessments(this.viewModel);
  },
  events: {
    '{viewModel.paging} current'() {
      loadRelatedAssessments(this.viewModel);
    },
    '{viewModel.paging} pageSize'() {
      loadRelatedAssessments(this.viewModel);
    },
    '{viewModel.orderBy} changed'() {
      loadRelatedAssessments(this.viewModel);
    },
    [`{viewModel.instance} ${REFRESH_RELATED.type}`]([scope], event) {
      if (event.model === 'Related Assessments') {
        loadRelatedAssessments(this.viewModel);
      }
    },
  },
  helpers: {
    isAllowedToReuse(evidence) {
      evidence = unwrapEvidence(evidence);

      let isAllowed = checkReuseAbility(evidence);

      return isAllowed;
    },
    ifAllowedToReuse(evidence, options) {
      evidence = unwrapEvidence(evidence);

      let isAllowed = checkReuseAbility(evidence);

      return isAllowed ? options.fn(this) : options.inverse(this);
    },
  },
});

function buildEvidenceModel(vm, evidence) {
  const baseData = {
    context: new Context({id: vm.attr('instance.context.id') || null}),
    parent_obj: {
      id: vm.attr('instance.id'),
      type: vm.attr('instance.type'),
    },
    kind: evidence.attr('kind'),
    title: evidence.attr('title'),
  };
  const specificData = evidence.attr('kind') === 'FILE' ?
    {source_gdrive_id: evidence.attr('gdrive_id')} :
    {link: evidence.attr('link')};

  let data = Object.assign({}, baseData, specificData);

  return new Evidence(data);
}

function loadRelatedAssessments(vm) {
  const limits = vm.attr('paging.limits');
  const orderBy = vm.attr('orderBy');
  let currentOrder = [];
  const stopFn = tracker.start(
    vm.attr('instance.type'),
    tracker.USER_JOURNEY_KEYS.API,
    tracker.USER_ACTIONS.ASSESSMENT.RELATED_ASSESSMENTS);

  if (!orderBy.attr('field')) {
    currentOrder = defaultOrderBy;
  } else {
    currentOrder = [orderBy];
  }

  vm.attr('loading', true);

  return vm.attr('instance').getRelatedAssessments(limits, currentOrder)
    .then((response) => {
      const assessments = response.data.map((assessment) => {
        let values = assessment.custom_attribute_values || [];
        let definitions = assessment.custom_attribute_definitions || [];

        if (definitions.length) {
          assessment.custom_attribute_values =
            prepareCustomAttributes(definitions, values);
        }

        return {
          instance: assessment,
        };
      });

      vm.attr('paging.total', response.total);
      vm.attr('relatedAssessments').replace(assessments);

      stopFn();
      vm.attr('loading', false);
    }, () => {
      stopFn(true);
      vm.attr('loading', false);
    });
}

function checkReuseAbility(evidence) {
  let isFile = evidence.attr('kind') === 'FILE';
  let isGdriveIdProvided = !!evidence.attr('gdrive_id');

  let isAble = !isFile || isGdriveIdProvided;

  return isAble;
}

function unwrapEvidence(evidence) {
  return isFunction(evidence) ? evidence() : evidence;
}
