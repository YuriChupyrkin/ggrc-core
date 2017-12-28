/*
 Copyright (C) 2017 Google Inc., authors, and contributors
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import {
  buildModifiedACL,
  buildModifiedListField,
  buildModifiedAttValues,
  getInstanceView,
} from '../../plugins/utils/object-history-utils';

import template from './templates/apply-decline-proposal.mustache';
import {REFRESH_TAB_CONTENT} from '../../events/eventTypes';
const tag = 'apply-decline-proposal';

export default can.Component.extend({
  tag,
  template,
  viewModel: {
    define: {
      canDisplayApplyButton: {
        get() {
          const proposalStatus = this.attr('proposal.status');
          return proposalStatus === 'proposed' ||
            proposalStatus === 'declined';
        },
      },
      canDisplayDeclineButton: {
        get() {
          const proposalStatus = this.attr('proposal.status');
          return proposalStatus === 'proposed';
        },
      },
      buttonView: {
        get() {
          return `${GGRC.mustache_path}/modals/restore_revision.mustache`;
        },
      },
    },
    leftRevisionId: null,
    rightRevision: null,
    proposal: {},
    instance: {},
    isLoading: false,
    title: '',
    description: '',
    actionComment: '',
    isApplyAction: false,
    modalTitle: 'Review: Compare to Current',
    modalState: {
      open: false,
    },
    getModalDescriptionText(isDecline) {
      const date = GGRC.Utils.formatDate(this.attr('proposal.created_at'));
      const email = this.attr('proposal.proposed_by.email');
      const action = isDecline ? 'declining' : 'applying';

      return `You're ${action} the version - ${email}, ${date}`;
    },
    closeModal() {
      this.attr('actionComment', '');
      this.attr('modalState.open', false);
    },
    declineProposal() {
      this.attr('title', 'Decline confirmation');
      this.attr('description', this.getModalDescriptionText(true));
      this.attr('isApplyAction', false);
      this.attr('modalState.open', true);
    },
    applyProposal() {
      this.attr('title', 'Apply confirmation');
      this.attr('description', this.getModalDescriptionText(false));
      this.attr('isApplyAction', true);
      this.attr('modalState.open', true);
    },
    confirm(isApply) {
      this.attr('isLoading', true);

      // refresh for getting E-tag
      this.attr('proposal').refresh().then(() => {
        this.prepareDataAndSave(isApply);
      });
    },
    prepareDataAndSave(isApply) {
      const comment = this.attr('actionComment');
      // create new model. No need to 'PUT' full object data
      const proposalModel = new CMS.Models.Proposal();

      if (isApply) {
        proposalModel.attr('apply_reason', comment);
        proposalModel.attr('status', 'applied');
      } else {
        proposalModel.attr('decline_reason', comment);
        proposalModel.attr('status', 'declined');
      }

      proposalModel.attr('id', this.attr('proposal.id'));

      proposalModel.save().then(
        () => {
          this.attr('isLoading', false);
          this.attr('modalState.open', false);
          this.attr('actionComment', '');

          if (isApply) {
            this.refreshPage();
          }
        },
        (error) => {
          console.log(error);
        }
      );
    },
    refreshPage() {
      const instance = this.attr('instance');
      instance.refresh().then(() => {
        instance.dispatch({
          ...REFRESH_TAB_CONTENT,
          tabId: 'tab-related-proposals',
        });
      });
    },

    // COMPARER WINDOW
    prepareComparerConfig() {
      const instance = this.attr('instance');
      const leftRevisionId = this.attr('leftRevisionId');
      const rightRevision = this.attr('rightRevision');
      let query;

      // build isntance view
      instance.attr('view', getInstanceView(instance));

      if (leftRevisionId && rightRevision) {
        // revisions are already ready
        this.openRevisionComparer();
        return;
      }

      query = {
        __sort: '-updated_at',
        __page: 1,
        __page_size: 1,
        resource_type: instance.attr('type'),
        resource_id: instance.attr('id'),
      };

      // get last revision
      CMS.Models.Revision.findAll(query).then((data) => {
        const originalRevision = data[0];
        this.attr('leftRevisionId', originalRevision.id);
        this.buildModifiedRevision(originalRevision);
      });
    },
    buildModifiedRevision(originalRevision) {
      const diff = this.attr('proposal.content');
      const diffAttributes = diff.custom_attribute_values;
      const rightRevision = new can.Map({
        id: originalRevision.id,
        content: Object.assign({}, originalRevision.content.attr()),
      });

      const modifiedContent = rightRevision.content;

      this.applyFields(modifiedContent, diff.fields);
      this.applyFields(modifiedContent, diff.mapping_fields);
      this.applyAcl(modifiedContent, diff.access_control_list);
      this.applyListFields(modifiedContent, diff.mapping_list_fields);
      this.applyCustomAttributes(modifiedContent, diffAttributes);

      this.attr('rightRevision', rightRevision);
      this.openRevisionComparer();
    },
    applyFields(instance, modifiedFields) {
      const fieldNames = can.Map.keys(modifiedFields);

      fieldNames.forEach((fieldName) => {
        const modifiedField = modifiedFields[fieldName];
        instance[fieldName] = modifiedField;
      });
    },
    applyAcl(instance, modifiedRoles) {
      const modifiedACL = buildModifiedACL(instance, modifiedRoles);
      instance.access_control_list = modifiedACL;
    },
    applyListFields(instance, modifiedFields) {
      const fieldNames = can.Map.keys(modifiedFields);
      fieldNames.forEach((fieldName) => {
        const items = instance[fieldName];
        const modifiedItems = modifiedFields[fieldName];
        const modifiedField = buildModifiedListField(items, modifiedItems);
        instance[fieldName] = modifiedField;
      });
    },
    applyCustomAttributes(instance, modifiedAttributes) {
      const values = instance
        .custom_attribute_values
        .attr()
        .map((val) => {
          // mark as stub
          val.isStub = true;
          return val;
        });

      const definitions = instance
        .custom_attribute_definitions
        .attr();

      const modifiedValues =
        buildModifiedAttValues(values, definitions, modifiedAttributes);

      instance.custom_attribute_values = modifiedValues;
      instance.custom_attributes = modifiedValues;
    },
    openRevisionComparer() {
      const el = this.attr('$el');
      const revisionsComparer = el.find('revisions-comparer');
      if (revisionsComparer && revisionsComparer.viewModel) {
        revisionsComparer.viewModel().compareIt();
      }
    },
  },
  events: {
    inserted() {
      this.viewModel.attr('$el', this.element);
    },
  },
});
