/*
 Copyright (C) 2019 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import loFindIndex from 'lodash/findIndex';
import canMap from 'can-map';
import canComponent from 'can-component';
import {
  applyChangesToCAValue,
  isEvidenceRequired,
  isCommentRequired,
  isUrlRequired,
} from '../../plugins/utils/ca-utils';
import {VALIDATION_ERROR, RELATED_ITEMS_LOADED} from '../../events/eventTypes';
import tracker from '../../tracker';
import {isAllowedFor} from '../../permission';
import isFunction from 'can-util/js/is-function/is-function';
import {getPageInstance} from '../../plugins/utils/current-page-utils';
import {getPlainText} from '../../plugins/ggrc_utils';

export default canComponent.extend({
  tag: 'assessment-local-ca',
  leakScope: true,
  viewModel: canMap.extend({
    instance: null,
    fields: [],
    isDirty: false,
    saving: false,
    highlightInvalidFields: false,

    define: {
      editMode: {
        type: 'boolean',
        value: false,
        set: function (newValue) {
          if (newValue === true) {
            this.attr('highlightInvalidFields', false);
          }
          return newValue;
        },
      },
      canEdit: {
        type: 'boolean',
        value: false,
        get: function () {
          return this.attr('editMode') &&
            isAllowedFor('update', this.attr('instance'));
        },
      },
      evidenceAmount: {
        type: 'number',
      },
      urlsAmount: {
        type: 'number',
      },
      isEvidenceRequired: {
        get: function () {
          let optionsWithEvidence =
            getDropdownOptions(this, isEvidenceRequired);

          return optionsWithEvidence.length > this.attr('evidenceAmount');
        },
      },
      isUrlRequired: {
        get: function () {
          let optionsWithURLs =
            getDropdownOptions(this, isUrlRequired);

          return optionsWithURLs.length > this.attr('urlsAmount');
        },
      },
    },
    attributeChanged: function (e) {
      e.field.attr('value', e.value);

      // Removes "link" with the comment for DD field and
      // makes it require a new one
      if ( e.field.attr('type') === 'dropdown' &&
        isCommentRequired(e.field) ) {
        e.field.attr('errorsMap.comment', true);
      }

      let saveDfd = save(this, e.fieldId, e.value);

      validateForm(this, {
        triggerAttachmentModals: true,
        triggerField: e.field,
        saveDfd: saveDfd,
      });
    },
  }),
  events: {
    '{viewModel} evidenceAmount': function () {
      validateForm(this.viewModel);
    },
    '{viewModel} urlsAmount': function () {
      validateForm(this.viewModel);
    },
    [`{viewModel.instance} ${RELATED_ITEMS_LOADED.type}`]: function () {
      validateForm(this.viewModel);
    },
    '{viewModel} fields'() {
      validateForm(this.viewModel);
    },
    '{viewModel.instance} showInvalidField': function (ev) {
      let pageType = getPageInstance().type;
      let $container = (pageType === 'Assessment') ?
        $('.object-area') : $('.pin-content');
      let $body = (pageType === 'Assessment') ?
        $('.inner-content.widget-area') : $('.info-pane__body');
      let field;
      let index;

      index = loFindIndex(this.viewModel.attr('fields'), function (field) {
        let validation = field.attr('validation');
        return validation.show && !validation.valid;
      });

      field = $('.field-wrapper')[index];

      if (!field) {
        return;
      }

      this.viewModel.attr('highlightInvalidFields', true);
      $container.animate({
        scrollTop: $(field).offset().top - $body.offset().top,
      }, 500);
    },
  },
  helpers: {
    isInvalidField: function (show, valid, highlightInvalidFields, options) {
      show = isFunction(show) ? show() : show;
      valid = isFunction(valid) ? valid() : valid;
      highlightInvalidFields = isFunction(highlightInvalidFields) ?
        highlightInvalidFields() : highlightInvalidFields;

      if (highlightInvalidFields && show && !valid) {
        return options.fn(options.context);
      }
      return options.inverse(options.context);
    },
  },
});

function getDropdownOptions(vm, predicate = () => true) {
  return vm.attr('fields')
    .filter((item) => item.attr('type') === 'dropdown')
    .filter(predicate);
}

function validateForm(
  vm,
  {
    triggerField = null,
    triggerAttachmentModals = false,
    saveDfd = null,
  } = {}) {
  let hasValidationErrors = false;
  vm.attr('fields')
    .each((field) => {
      performValidation(vm, field);
      if ( !field.validation.valid ) {
        hasValidationErrors = true;
      }
      if ( triggerField === field &&
            triggerAttachmentModals &&
            field.validation.hasMissingInfo ) {
        vm.dispatch({
          type: 'validationChanged',
          field,
          saveDfd,
        });
      }
    });

  if ( vm.attr('instance') ) {
    vm.attr('instance._hasValidationErrors', hasValidationErrors);
  }

  if ( hasValidationErrors ) {
    vm.dispatch(VALIDATION_ERROR);
  }
}

function performDropdownValidation(vm, field) {
  let value = field.value;
  let isMandatory = field.validation.mandatory;
  let errorsMap = field.errorsMap || {
    evidence: false,
    comment: false,
    url: false,
  };

  let requiresEvidence = isEvidenceRequired(field);
  let requiresComment = isCommentRequired(field);
  let requiresUrl = isUrlRequired(field);

  let hasMissingEvidence = requiresEvidence &&
    vm.attr('isEvidenceRequired');

  let hasMissingUrl = requiresUrl &&
    vm.attr('isUrlRequired');

  let hasMissingComment = requiresComment && !!errorsMap.comment;

  let fieldValid = (value) ?
    !(hasMissingEvidence || hasMissingComment || hasMissingUrl) :
    !isMandatory;

  field.attr({
    validation: {
      show: isMandatory || !!value,
      valid: fieldValid,
      hasMissingInfo: (hasMissingEvidence || hasMissingComment ||
        hasMissingUrl),
      requiresAttachment: (requiresEvidence || requiresComment ||
        requiresUrl),
    },
    errorsMap: {
      evidence: hasMissingEvidence,
      comment: hasMissingComment,
      url: hasMissingUrl,
    },
  });
}

function performValidation(vm, field) {
  if (field.type === 'dropdown') {
    performDropdownValidation(vm, field);
  } else {
    let value = field.value;
    let isMandatory = field.validation.mandatory;

    if (field.type === 'text') {
      value = getPlainText(value).trim();
    }

    field.attr({
      validation: {
        show: isMandatory,
        valid: isMandatory ? !!(value) : true,
        hasMissingInfo: false,
      },
    });
  }
}

function save(vm, fieldId, fieldValue) {
  const self = vm;
  const changes = {
    [fieldId]: fieldValue,
  };
  const stopFn = tracker.start(vm.attr('instance.type'),
    tracker.USER_JOURNEY_KEYS.INFO_PANE,
    tracker.USER_ACTIONS.ASSESSMENT.EDIT_LCA);

  vm.attr('isDirty', true);

  return vm.attr('deferredSave').push(function () {
    let caValues = self.attr('instance.custom_attribute_values');
    applyChangesToCAValue(
      caValues,
      new canMap(changes));

    self.attr('saving', true);
  })
  // todo: error handling
    .always(() => {
      vm.attr('saving', false);
      vm.attr('isDirty', false);
      stopFn();
    });
}
