/*
 Copyright (C) 2017 Google Inc., authors, and contributors
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import Proposal from '../../models/proposal';
import template from './templates/apply-decline-proposal-buttons.mustache';
const tag = 'apply-decline-proposal-buttons';

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
    },
    proposal: {},
    instance: {},
    isLoading: false,
    title: '',
    description: '',
    actionComment: '',
    isApplyAction: false,
    modalState: {
      open: false,
    },
    getModalDescriptionText(isDecline) {
      const date = GGRC.Utils.formatDate(this.attr('proposal.created_at'));
      const email = this.attr('proposal.created_by.email');
      const action = isDecline ? 'declining' : 'applying';

      return `You're ${action} the version - ${email}, ${date}`;
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
      const comment = this.attr('actionComment');
      const proposal = this.attr('proposal');
      const proposalModel = {
        id: proposal.id,
      };
      this.attr('isLoading', true);

      setTimeout(() => {
        this.attr('isLoading', false);
        this.attr('modalState.open', false);
        this.attr('actionComment', '');
      }, 2000);
      return;

      if (isApply) {
        proposalModel.apply_reason = comment;
        proposalModel.status = 'applied';
      } else {
        proposalModel.decline_reason = comment;
        proposalModel.status = 'declined';
      }

      new Proposal(proposalModel).save().then(
        () => {
          this.attr('isLoading', false);
          this.attr('modalState.open', false);
          this.attr('actionComment', '');
        },
        (error) => {
          console.log(error);
        }
      );
    },
  },
});

