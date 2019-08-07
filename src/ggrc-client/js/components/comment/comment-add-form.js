/*
 Copyright (C) 2019 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import './comment-input';
import './comment-add-button';
import template from './comment-add-form.stache';
import {COMMENT_CREATED} from '../../events/eventTypes';
import tracker from '../../tracker';
import {getAssigneeType} from '../../plugins/utils/comments-utils';
import {notifier} from '../../plugins/utils/notifiers-utils';

/**
 * A component that takes care of adding comments
 *
 */
export default canComponent.extend({
  tag: 'comment-add-form',
  view: canStache(template),
  leakScope: true,
  viewModel: canMap.extend({
    define: {
      notificationsInfo: {
        set(newValue) {
          return this.attr('instance').constructor.category === 'scope' ?
            'Notify Contacts' :
            newValue;
        },
      },
      tooltipTitle: {
        get() {
          const title = 'Comments will be sent as part of daily digest email ' +
          'notification';
          const category = this.attr('instance').constructor.category;
          const recipients = this.attr('instance').recipients;

          if (['scope', 'programs'].includes(category)) {
            return `${title} to ${recipients.replace(/,/g, ', ')}.`;
          }
          return `${title}.`;
        },
      },
    },
    instance: {},
    sendNotifications: true,
    isSaving: false,
    isLoading: false,
    onCommentCreated: function (e) {
      let comment = e.comment;
      let self = this;

      tracker.start(self.attr('instance.type'),
        tracker.USER_JOURNEY_KEYS.INFO_PANE,
        tracker.USER_ACTIONS.INFO_PANE.ADD_COMMENT);

      self.attr('isSaving', true);
      comment = updateComment(self, comment);
      self.dispatch({type: 'beforeCreate', items: [comment]});

      comment.save()
        .done(function () {
          return afterCreation(self, comment, true);
        })
        .fail(function () {
          notifier('error', 'Saving has failed');
          afterCreation(self, comment, false);
        });
    },
  }),
});

function getCommentData(vm) {
  let source = vm.attr('instance');

  return {
    send_notification: vm.attr('sendNotifications'),
    context: source.context,
    assignee_type: getAssigneeType(source),
  };
}

function updateComment(vm, comment) {
  comment.attr(getCommentData(vm));
  return comment;
}

function afterCreation(vm, comment, wasSuccessful) {
  vm.attr('isSaving', false);
  vm.dispatch({
    type: 'afterCreate',
    item: comment,
    success: wasSuccessful,
  });
  if (wasSuccessful) {
    vm.attr('instance').dispatch({
      ...COMMENT_CREATED,
      comment: comment,
    });
  }
}
