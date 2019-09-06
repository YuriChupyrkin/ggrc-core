/*
 Copyright (C) 2019 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
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
import canDefineMap from 'can-define/map/map';
import canDefineList from 'can-define/list/list';

const defaultOrderBy = [
  {field: 'finished_date', direction: 'desc'},
  {field: 'created_at', direction: 'desc'},
];

const ViewModel = canDefineMap.extend({
  unableToReuse: {
    get: function () {
      let hasItems = this.selectedEvidences && this.selectedEvidences.length;
      let isSaving = this.isSaving;

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
      return this.instance.assessment_type || this.instance.type;
    },
  },
  relatedObjectsTitle: {
    get: function () {
      const relObjType = this.relatedObjectType;

      const objectName = businessModels[relObjType].model_plural;
      return `Related ${objectName}`;
    },
  },
  paging: {
    value: function () {
      return new Pagination({pageSizeSelect: [5, 10, 15]});
    },
  },
  instance: {
    value: {},
  },
  selectedEvidences: {
    value: canDefineList,
  },
  orderBy: {
    value: {},
  },
  isSaving: {
    value: false,
  },
  loading: {
    value: false,
  },
  needReuse: {
    value: false,
  },
  relatedAssessments: {
    value: canDefineList,
  },
  selectedItem: {
    value: [],
  },
  buildEvidenceModel: function (evidence) {
    const baseData = {
      context: new Context({id: this.instance.context.id || null}),
      parent_obj: {
        id: this.instance.id,
        type: this.instance.type,
      },
      kind: evidence.kind,
      title: evidence.title,
    };
    const specificData = evidence.kind === 'FILE' ?
      {source_gdrive_id: evidence.gdrive_id} :
      {link: evidence.link};

    let data = Object.assign({}, baseData, specificData);

    return new Evidence(data);
  },
  reuseSelected: function () {
    this.isSaving = true;

    let reusedObjectList = this.selectedEvidences.map((evidence) => {
      let model = this.buildEvidenceModel(evidence);

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
        this.selectedEvidences.replace([]);
        this.isSaving = false;
      });
  },
  loadRelatedAssessments() {
    const limits = this.paging.attr('limits');
    const orderBy = this.orderBy;
    let currentOrder = [];
    const stopFn = tracker.start(
      this.instance.type,
      tracker.USER_JOURNEY_KEYS.API,
      tracker.USER_ACTIONS.ASSESSMENT.RELATED_ASSESSMENTS);

    if (!orderBy.field) {
      currentOrder = defaultOrderBy;
    } else {
      currentOrder = [orderBy];
    }

    this.loading = true;

    return this.instance.getRelatedAssessments(limits, currentOrder)
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

        this.paging.attr('total', response.total);
        this.relatedAssessments.replace(assessments);

        stopFn();
        this.loading = false;
      }, () => {
        stopFn(true);
        this.loading = false;
      });
  },
  checkReuseAbility(evidence) {
    let isFile = evidence.kind === 'FILE';
    let isGdriveIdProvided = !!evidence.gdrive_id;

    let isAble = !isFile || isGdriveIdProvided;

    return isAble;
  },
  isFunction(evidence) {
    return isFunction(evidence) ? evidence() : evidence;
  },
});

export default canComponent.extend({
  tag: 'related-assessments',
  view: canStache(template),
  leakScope: true,
  ViewModel,
  init() {
    this.viewModel.loadRelatedAssessments();
  },
  events: {
    '{viewModel.paging} current'() {
      this.viewModel.loadRelatedAssessments();
    },
    '{viewModel.paging} pageSize'() {
      this.viewModel.loadRelatedAssessments();
    },
    '{viewModel.orderBy} changed'() {
      this.viewModel.loadRelatedAssessments();
    },
    [`{viewModel.instance} ${REFRESH_RELATED.type}`]([scope], event) {
      if (event.model === 'Related Assessments') {
        this.viewModel.loadRelatedAssessments();
      }
    },
  },
  helpers: {
    isAllowedToReuse(evidence) {
      evidence = this.isFunction(evidence);

      let isAllowed = this.checkReuseAbility(evidence);

      return isAllowed;
    },
    ifAllowedToReuse(evidence, options) {
      evidence = this.isFunction(evidence);

      let isAllowed = this.checkReuseAbility(evidence);

      return isAllowed ? options.fn(this) : options.inverse(this);
    },
  },
});
