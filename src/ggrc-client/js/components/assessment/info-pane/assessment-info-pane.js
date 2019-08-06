/*
 Copyright (C) 2019 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import loKeyBy from 'lodash/keyBy';
import loCapitalize from 'lodash/capitalize';
import loFindIndex from 'lodash/findIndex';
import makeArray from 'can-util/js/make-array/make-array';
import canBatch from 'can-event/batch/batch';
import canStache from 'can-stache';
import canList from 'can-list';
import canMap from 'can-map';
import canComponent from 'can-component';
import '../controls-toolbar/assessment-controls-toolbar';
import '../assessment-local-ca';
import '../assessment-custom-attributes';
import '../assessment-people';
import '../assessment-object-type-dropdown';
import '../attach-button';
import '../info-pane-save-status';
import '../../comment/comment-add-form';
import '../../comment/mapped-comments';
import '../../comment/comments-paging';
import '../mapped-controls/assessment-mapped-controls';
import '../../assessment/map-button-using-assessment-type';
import '../../ca-object/ca-object-modal-content';
import '../../comment/comment-add-form';
import '../../custom-attributes/custom-attributes';
import '../../custom-attributes/custom-attributes-field';
import '../../custom-attributes/custom-attributes-status';
import '../../prev-next-buttons/prev-next-buttons';
import '../../inline/inline-form-control';
import '../../object-change-state/object-change-state';
import '../../related-objects/related-assessments';
import '../../related-objects/related-issues';
import '../../issue-tracker/issue-tracker-switcher';
import './ticket-id-checker';
import '../../object-list-item/editable-document-object-list-item';
import '../../object-state-toolbar/object-state-toolbar';
import '../../loading/loading-status';
import './info-pane-issue-tracker-fields';
import '../../tabs/tab-container';
import './assessment-inline-item';
import './create-url';
import './confirm-edit-action';
import '../../multi-select-label/multi-select-label';
import {
  buildParam,
  batchRequests,
} from '../../../plugins/utils/query-api-utils';
import {loadComments} from '../../../plugins/utils/comments-utils';
import {
  getCustomAttributes,
  getLCAPopupTitle,
  CUSTOM_ATTRIBUTE_TYPE as CA_UTILS_CA_TYPE,
  convertValuesToFormFields,
} from '../../../plugins/utils/ca-utils';
import {getRole} from '../../../plugins/utils/acl-utils';
import DeferredTransaction from '../../../plugins/utils/deferred-transaction-utils';
import tracker from '../../../tracker';
import {
  RELATED_ITEMS_LOADED,
  REFRESH_MAPPING,
  REFRESH_RELATED,
  REFRESHED,
} from '../../../events/eventTypes';
import {isAllowedFor} from '../../../permission';
import {
  getPageInstance,
} from '../../../plugins/utils/current-page-utils';
import {initCounts} from '../../../plugins/utils/widgets-utils';
import template from './assessment-info-pane.stache';
import {CUSTOM_ATTRIBUTE_TYPE} from '../../../plugins/utils/custom-attribute/custom-attribute-config';
import pubSub from '../../../pub-sub';
import {relatedAssessmentsTypes} from '../../../plugins/utils/models-utils';
import {notifier, notifierXHR} from '../../../plugins/utils/notifiers-utils';
import Evidence from '../../../models/business-models/evidence';
import * as businessModels from '../../../models/business-models';
import {getAjaxErrorInfo} from '../../../plugins/utils/errors-utils';

/**
 * Assessment Specific Info Pane View Component
 */
export default canComponent.extend({
  tag: 'assessment-info-pane',
  view: canStache(template),
  leakScope: true,
  viewModel: canMap.extend({
    define: {
      verifiers: {
        get: function () {
          let acl = this.attr('instance.access_control_list');
          let verifierRoleId = this.attr('_verifierRoleId');
          let verifiers;

          if (!verifierRoleId) {
            return [];
          }

          verifiers = acl
            .filter((item) =>
              String(item.ac_role_id) === String(verifierRoleId)
            ).map(
              // Getter of 'verifiers' is called when access_control_list(ACL) length
              // is changed or object itself is changed.
              // When we save new ACL, after getting response from BE,
              // order of items in ACL can differ from original. In this case
              // verifiers won't be recalculated and we can get invalid list
              // after merging ACL data which we get from BE.
              // To prevent this we returns copies of persons which won't be modified
              // in scenario described above.
              ({person}) => ({
                id: person.id,
                type: person.type,
              }));

          return verifiers;
        },
      },
      showProcedureSection: {
        get: function () {
          return this.instance.attr('test_plan') ||
            this.instance.attr('issue_tracker.issue_url');
        },
      },
      isLoading: {
        type: 'boolean',
        value: false,
      },
      mappedSnapshots: {
        Value: canList,
      },
      assessmentTypeNameSingular: {
        get: function () {
          let type = this.attr('instance.assessment_type');
          return businessModels[type].title_singular;
        },
      },
      assessmentTypeNamePlural: {
        get: function () {
          let type = this.attr('instance.assessment_type');
          return businessModels[type].title_plural;
        },
      },
      assessmentTypeObjects: {
        get: function () {
          let self = this;
          return this.attr('mappedSnapshots')
            .filter(function (item) {
              return item.child_type === self
                .attr('instance.assessment_type');
            });
        },
      },
      relatedInformation: {
        get: function () {
          let self = this;
          return this.attr('mappedSnapshots')
            .filter(function (item) {
              return item.child_type !== self
                .attr('instance.assessment_type');
            });
        },
      },
      comments: {
        Value: canList,
      },
      urls: {
        Value: canList,
      },
      files: {
        Value: canList,
      },
      editMode: {
        type: 'boolean',
        get: function () {
          if (this.attr('instance.archived')) {
            return false;
          }

          // instance's state is changed before sending a request to server
          const instanceStatus = this.attr('instance.status');

          // current state is changed after receiving a server's response
          const currentState = this.attr('currentState');

          // the state when a request was sent, but a response wasn't received
          if (currentState !== instanceStatus) {
            return false;
          }
          const editModeStatuses = this.attr('instance')
            .constructor.editModeStatuses;
          return editModeStatuses.includes(instanceStatus);
        },
        set: function () {
          this.onStateChange({state: 'In Progress', undo: false});
        },
      },
      isEditDenied: {
        get: function () {
          return !isAllowedFor('update', this.attr('instance')) ||
            this.attr('instance.archived');
        },
      },
      isAllowedToMap: {
        get: function () {
          let audit = this.attr('instance.audit');
          return !!audit && isAllowedFor('read', audit);
        },
      },
      instance: {},
      isInfoPaneSaving: {
        get: function () {
          if (this.attr('isUpdatingRelatedItems') ||
            this.attr('isLoadingComments')) {
            return false;
          }

          return this.attr('isUpdatingFiles') ||
            this.attr('isUpdatingState') ||
            this.attr('isUpdatingEvidences') ||
            this.attr('isUpdatingUrls') ||
            this.attr('isUpdatingComments') ||
            this.attr('isAssessmentSaving');
        },
      },
    },
    modal: {
      state: {
        open: false,
      },
    },
    pubSub,
    _verifierRoleId: undefined,
    isUpdatingRelatedItems: false,
    isUpdatingState: false,
    isAssessmentSaving: false,
    onStateChangeDfd: {},
    formState: {},
    noItemsText: '',
    currentState: '',
    previousStatus: undefined,
    initialState: 'Not Started',
    deprecatedState: 'Deprecated',
    assessmentMainRoles: ['Creators', 'Assignees', 'Verifiers'],
    commentsTotalCount: 0,
    commentsPerPage: 10,
    newCommentsCount: 0,
    setUrlEditMode: function (value) {
      this.attr('urlsEditMode', value);
    },
    setInProgressState: function () {
      this.onStateChange({state: 'In Progress', undo: false});
    },
    addItems: function (event, type) {
      let items = event.items;
      this.attr('isUpdating' + loCapitalize(type), true);
      return this.attr(type).unshift(...makeArray(items));
    },
    addRelatedItem: function (event, type) {
      let self = this;
      let assessment = this.attr('instance');
      let relatedItemType = event.item.attr('type');
      let related = {
        id: event.item.attr('id'),
        type: relatedItemType,
      };

      this.attr('deferredSave').execute(function () {
        addAction(self, 'add_related', related);
      })
        .done(() => {
          if (type === 'comments') {
            tracker.stop(assessment.type,
              tracker.USER_JOURNEY_KEYS.INFO_PANE,
              tracker.USER_ACTIONS.INFO_PANE.ADD_COMMENT_TO_LCA);
            tracker.stop(assessment.type,
              tracker.USER_JOURNEY_KEYS.INFO_PANE,
              tracker.USER_ACTIONS.INFO_PANE.ADD_COMMENT);

            let commentsTotalCount = this.attr('commentsTotalCount');
            this.attr('commentsTotalCount', ++commentsTotalCount);
            let newCommentsCount = this.attr('newCommentsCount');
            this.attr('newCommentsCount', ++newCommentsCount);
          }
        })
        .fail(function (instance, xhr) {
          notifierXHR('error', xhr);

          if (type === 'comments') {
            tracker.stop(assessment.type,
              tracker.USER_JOURNEY_KEYS.INFO_PANE,
              tracker.USER_ACTIONS.INFO_PANE.ADD_COMMENT_TO_LCA,
              false);
            tracker.stop(assessment.type,
              tracker.USER_JOURNEY_KEYS.INFO_PANE,
              tracker.USER_ACTIONS.INFO_PANE.ADD_COMMENT,
              false);
          }

          removeItems(
            self,
            {
              items: [event.item],
            },
            type);
        })
        .always(function (assessment) {
          assessment.removeAttr('actions');
          self.attr('isUpdating' + loCapitalize(type), false);

          // dispatching event on instance to pass to the auto-save-form
          self.attr('instance').dispatch(RELATED_ITEMS_LOADED);

          if (relatedItemType === 'Evidence') {
            refreshCounts(['Evidence']);
          }
        });
    },
    removeRelatedItem: function (item, type) {
      let self = this;
      let related = {
        id: item.attr('id'),
        type: item.attr('type'),
      };
      let items = self.attr(type);
      let index = items.indexOf(item);
      this.attr('isUpdating' + loCapitalize(type), true);
      items.splice(index, 1);

      this.attr('deferredSave').push(function () {
        addAction(self, 'remove_related', related);
      })
        .fail(function () {
          notifier('error', 'Unable to remove URL.');
          items.splice(index, 0, item);
        })
        .always(function (assessment) {
          assessment.removeAttr('actions');
          self.attr('isUpdating' + loCapitalize(type), false);

          refreshCounts(['Evidence']);
        });
    },
    async loadMoreComments(startIndex) {
      this.attr('isLoadingComments', true);

      let instance = this.attr('instance');
      let index = startIndex || this.attr('comments').length;
      let pageSize = this.attr('commentsPerPage');

      try {
        let response = await loadComments(instance, 'Comment', index, pageSize);
        let {values: comments, total} = response.Comment;

        let totalCount = this.attr('commentsTotalCount');
        if (totalCount !== total) {
          // new comments were added by other users
          let newCommentsCount = total - totalCount;
          await Promise.all([
            loadFirstComments(this, newCommentsCount),
            this.loadMoreComments(index + newCommentsCount)]);
        } else {
          this.attr('comments').push(...comments);
        }
      } finally {
        this.attr('isLoadingComments', false);
      }
    },
    hideComments() {
      // remain only first comments
      this.attr('comments').splice(this.attr('commentsPerPage'));
    },
    addReusableEvidence(event) {
      this.attr('deferredSave').push(() => {
        event.items.forEach((item) => {
          let related = {
            id: item.attr('id'),
            type: item.attr('type'),
          };

          addAction(this, 'add_related', related);
        });
      })
        .done(() => {
          updateItems.call(this, 'urls', 'files');
          refreshCounts(['Evidence']);
        })
        .always(() => {
          this.attr('instance').removeAttr('actions');
        });
    },
    initGlobalAttributes: function () {
      const instance = this.attr('instance');
      const caObjects = instance
        .customAttr({type: CUSTOM_ATTRIBUTE_TYPE.GLOBAL});
      this.attr('globalAttributes', caObjects);
    },

    /*
    refreshAssessment() {
      this.attr('instance').refresh().then((response) => {
        this.setCurrentState(response.status);
      });
    },
    */

    onStateChange: function (event) {
      const isUndo = event.undo;
      const newStatus = event.state;
      const instance = this.attr('instance');
      const status = instance.attr('status');
      const initialState = this.attr('initialState');
      const deprecatedState = this.attr('deprecatedState');
      const isArchived = instance.attr('archived');
      const previousStatus = this.attr('previousStatus');
      const doneStatuses = instance.constructor.doneStatuses;
      const stopFn = tracker.start(instance.type,
        tracker.USER_JOURNEY_KEYS.INFO_PANE,
        tracker.USER_ACTIONS.ASSESSMENT.CHANGE_STATUS);

      if (isArchived && [initialState, deprecatedState].includes(newStatus)) {
        return $.Deferred().resolve();
      }

      if (doneStatuses.includes(newStatus) && !instance.validateGCAs()) {
        notifier('error', `Please fill in the required fields at
          'Other Attributes' tab to complete assessment.`);
        return $.Deferred().reject();
      }

      this.attr('onStateChangeDfd', $.Deferred());
      this.attr('isUpdatingState', true);

      return this.attr('deferredSave').execute(
        beforeStatusSave.bind(this, newStatus, isUndo)
      ).then((resp) => {
        const newStatus = resp.status;
        afterStatusSave(this, newStatus);

        this.attr('isUndoButtonVisible', !isUndo);

        if (newStatus === 'In Review' && !isUndo) {
          notifier('info', 'The assessment is complete. ' +
          'The verifier may revert it if further input is needed.');
        }

        this.attr('onStateChangeDfd').resolve();
        pubSub.dispatch({
          type: 'refetchOnce',
          modelNames: relatedAssessmentsTypes,
        });
        stopFn();
      }).fail((object, xhr) => {
        if (xhr && xhr.status === 409 && xhr.remoteObject) {
          instance.attr('status', xhr.remoteObject.status);
        } else {
          afterStatusSave(this, status);
          this.attr('previousStatus', previousStatus);
          notifier('error', getAjaxErrorInfo(xhr).details);
        }
      }).always(() => {
        this.attr('isUpdatingState', false);
      });
    },
    saveGlobalAttributes: function (event) {
      this.attr('deferredSave').push(() => {
        const instance = this.attr('instance');
        const globalAttributes = event.globalAttributes;

        globalAttributes.each((value, caId) => {
          instance.customAttr(caId, value);
        });
      });
    },
    showRequiredInfoModal: function (e, field) {
      let scope = field || e.field;
      let errors = scope.attr('errorsMap');
      let errorsList = canMap.keys(errors)
        .map(function (error) {
          return errors[error] ? error : null;
        })
        .filter(function (errorCode) {
          return !!errorCode;
        });
      let data = {
        options: scope.attr('options'),
        contextScope: scope,
        fields: errorsList,
        value: scope.attr('value'),
        title: scope.attr('title'),
        type: scope.attr('type'),
        saveDfd: e.saveDfd || $.Deferred().resolve(),
      };

      let title = 'Required ' + getLCAPopupTitle(errors);

      canBatch.start();
      this.attr('modal.content', data);
      this.attr('modal.modalTitle', title);
      canBatch.stop();
      this.attr('modal.state.open', true);
    },
  }),
  async init() {
    initializeFormFields(this.viewModel);
    this.viewModel.initGlobalAttributes();
    updateRelatedItems(this.viewModel);
    initializeDeferredSave(this.viewModel);
    setVerifierRoleId(this.viewModel);

    try {
      this.viewModel.attr('isLoadingComments', true);
      await loadFirstComments(this.viewModel);
    } finally {
      this.viewModel.attr('isLoadingComments', false);
    }
  },
  events: {
    inserted() {
      resetCurrentState(this.viewModel);
    },
    [`{viewModel.instance} ${REFRESH_MAPPING.type}`]([scope], event) {
      const viewModel = this.viewModel;
      viewModel.attr('mappedSnapshots')
        .replace(loadFn.loadSnapshots(this.viewModel));
      viewModel.attr('instance').dispatch({
        ...REFRESH_RELATED,
        model: event.destinationType,
      });
    },
    [`{viewModel.instance} ${REFRESHED.type}`]() {
      const status = this.viewModel.attr('instance.status');
      setCurrentState(this.viewModel, status);
    },
    '{viewModel.instance} updated'([instance]) {
      const vm = this.viewModel;
      const isPending = vm.attr('deferredSave').isPending();
      instance.backup();
      if (!isPending) {
        // reinit LCA when queue is empty
        // to avoid rewriting of changed values
        reinitFormFields(vm);
      }
    },
    '{viewModel.instance} modelBeforeSave': function () {
      this.viewModel.attr('isAssessmentSaving', true);
    },
    '{viewModel.instance} modelAfterSave': function () {
      this.viewModel.attr('isAssessmentSaving', false);
      setCurrentState(this.viewModel, this.viewModel.attr('instance.status'));
    },
    '{viewModel.instance} assessment_type'() {
      const onSave = () => {
        this.viewModel.instance.dispatch({
          ...REFRESH_RELATED,
          model: 'Related Assessments',
        });
        this.viewModel.instance.unbind('updated', onSave);
      };
      this.viewModel.instance.bind('updated', onSave);
    },
    async '{viewModel} instance'() {
      initializeFormFields(this.viewModel);
      this.viewModel.initGlobalAttributes();
      updateRelatedItems(this.viewModel);
      resetCurrentState(this.viewModel);

      try {
        this.viewModel.attr('comments', []);
        this.viewModel.attr('commentsTotalCount', 0);
        this.viewModel.attr('isLoadingComments', true);
        await loadFirstComments(this.viewModel);
      } finally {
        this.viewModel.attr('isLoadingComments', false);
      }
    },
    '{pubSub} objectDeleted'(pubSub, event) {
      let instance = event.instance;
      // handle removing evidence on Evidence tab
      // evidence on Assessment tab should be updated
      if (instance instanceof Evidence) {
        updateItems.call(this.viewModel, 'files', 'urls');
      }
    },
    '{pubSub} relatedItemSaved'(pubSub, event) {
      this.viewModel.addRelatedItem(event, event.itemType);
    },
    '{pubSub} relatedItemBeforeSave'(pubSub, event) {
      this.viewModel.addItems(event, event.itemType);
    },
  },
});

const loadFn = {
  loadSnapshots: (vm) => {
    let query = getSnapshotQuery(vm);
    return requestQuery(vm, query);
  },
  loadFiles: (vm) => {
    let query = getEvidenceQuery(vm, 'FILE');
    return requestQuery(vm, query, 'files');
  },
  loadUrls: (vm) => {
    let query = getEvidenceQuery(vm, 'URL');
    return requestQuery(vm, query, 'urls');
  },
};

function refreshCounts(types) {
  let pageInstance = getPageInstance();
  initCounts(
    types,
    pageInstance.attr('type'),
    pageInstance.attr('id')
  );
}

function getQuery(vm, type, sortObj, additionalFilter) {
  let relevantFilters = [{
    type: vm.attr('instance.type'),
    id: vm.attr('instance.id'),
    operation: 'relevant',
  }];
  return buildParam(type,
    sortObj || {},
    relevantFilters,
    [],
    additionalFilter || []);
}

function getSnapshotQuery(vm) {
  return getQuery(vm, 'Snapshot');
}

function getEvidenceQuery(vm, kind) {
  let query = getQuery(
    vm,
    'Evidence',
    {sort: [{key: 'created_at', direction: 'desc'}]},
    getEvidenceAdditionFilter(kind));
  return query;
}

function requestQuery(vm, query, type) {
  let dfd = $.Deferred();
  type = type || '';
  vm.attr('isUpdating' + loCapitalize(type), true);

  batchRequests(query)
    .done(function (response) {
      let type = Object.keys(response)[0];
      let values = response[type].values;
      dfd.resolve(values);
    })
    .fail(function () {
      dfd.resolve([]);
    })
    .always(function () {
      vm.attr('isUpdating' + loCapitalize(type), false);

      tracker.stop(vm.attr('instance.type'),
        tracker.USER_JOURNEY_KEYS.INFO_PANE,
        tracker.USER_ACTIONS.INFO_PANE.OPEN_INFO_PANE);
    });
  return dfd;
}

function updateItems() {
  makeArray(arguments).forEach(function (type) {
    this.attr(type).replace(loadFn['load' + loCapitalize(type)](this));
  }.bind(this));
}

function removeItems(vm, event, type) {
  let items = vm.attr(type);

  canBatch.start();
  let resultItems = items.filter((item) => {
    let newItemIndex = loFindIndex(event.items, (newItem) => {
      return newItem === item;
    });
    return newItemIndex < 0;
  });

  items.replace(resultItems);
  canBatch.stop();
}

function getEvidenceAdditionFilter(kind) {
  return kind ?
    {
      expression: {
        left: 'kind',
        op: {name: '='},
        right: kind,
      },
    } :
    [];
}

function addAction(vm, actionType, related) {
  let assessment = vm.attr('instance');
  let path = 'actions.' + actionType;

  if (!assessment.attr('actions')) {
    assessment.attr('actions', {});
  }
  if (assessment.attr(path)) {
    assessment.attr(path).push(related);
  } else {
    assessment.attr(path, [related]);
  }
}

function updateRelatedItems(vm) {
  vm.attr('isUpdatingRelatedItems', true);

  return vm.attr('instance').getRelatedObjects()
    .then((data) => {
      vm.attr('mappedSnapshots').replace(data.Snapshot);
      vm.attr('files')
        .replace(data['Evidence:FILE'].map((file) => new Evidence(file)));
      vm.attr('urls')
        .replace(data['Evidence:URL'].map((url) => new Evidence(url)));

      vm.attr('isUpdatingRelatedItems', false);
      vm.attr('instance').dispatch(RELATED_ITEMS_LOADED);

      tracker.stop(vm.attr('instance.type'),
        tracker.USER_JOURNEY_KEYS.INFO_PANE,
        tracker.USER_ACTIONS.INFO_PANE.OPEN_INFO_PANE);
    });
}

async function loadFirstComments(vm, count) {
  let instance = vm.attr('instance');
  let newCommentsCount = vm.attr('newCommentsCount');

  // load more comments as they can be added by other users before or after current user's new comments
  let pageSize = (count || vm.attr('commentsPerPage')) + newCommentsCount;

  let response = await loadComments(instance, 'Comment', 0, pageSize);
  let {values: comments, total} = response.Comment;

  vm.attr('comments').splice(0, newCommentsCount);
  vm.attr('comments').unshift(...comments);

  vm.attr('commentsTotalCount', total);
  vm.attr('newCommentsCount', 0);
}

function initializeFormFields(vm) {
  const cavs =
  getCustomAttributes(
    vm.attr('instance'),
    CA_UTILS_CA_TYPE.LOCAL
  );
  vm.attr('formFields',
    convertValuesToFormFields(cavs)
  );
}

function reinitFormFields(vm) {
  const cavs = getCustomAttributes(
    vm.attr('instance'),
    CA_UTILS_CA_TYPE.LOCAL
  );

  let updatedFormFields = convertValuesToFormFields(cavs);
  let updatedFieldsIds = loKeyBy(updatedFormFields, 'id');

  vm.attr('formFields').forEach((field) => {
    let updatedField = updatedFieldsIds[field.attr('id')];

    if (updatedField &&
      field.attr('value') !== updatedField.attr('value')) {
      field.attr('value', updatedField.attr('value'));
    }
  });
}

function initializeDeferredSave(vm) {
  vm.attr('deferredSave', new DeferredTransaction(
    function (resolve, reject) {
      vm.attr('instance').save().done(resolve).fail(reject);
    }, 1000));
}

function beforeStatusSave(newStatus, isUndo) {
  const instance = this.attr('instance');

  if (isUndo) {
    instance.attr('status', this.attr('previousStatus'));
    this.attr('previousStatus', undefined);
  } else {
    this.attr('previousStatus', instance.attr('status'));
    instance.attr('status', newStatus);
  }
}

function afterStatusSave(vm, savedStatus) {
  vm.attr('instance.status', savedStatus);
  setCurrentState(vm, savedStatus);
}

function setCurrentState(vm, state) {
  vm.attr('currentState', state);
}

function setVerifierRoleId(vm) {
  let verifierRole = getRole('Assessment', 'Verifiers');

  let verifierRoleId = verifierRole ? verifierRole.id : null;
  vm.attr('_verifierRoleId', verifierRoleId);
}

function resetCurrentState(vm) {
  setCurrentState(vm, vm.attr('instance.status'));
  vm.attr('previousStatus', undefined);
  vm.attr('isUndoButtonVisible', false);
}
