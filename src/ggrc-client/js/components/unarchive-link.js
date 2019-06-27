/*
    Copyright (C) 2019 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import CanStache from 'can-stache';
import CanMap from 'can-map';
import CanComponent from 'can-component';
export default CanComponent.extend({
  tag: 'unarchive-link',
  view: CanStache('<a href="javascript:void(0)"><content></content></a>'),
  leakScope: true,
  viewModel: CanMap.extend({
    notify: '',
    instance: null,
    notifyText: 'was unarchived successfully',
  }),
  events: {
    'a click': function (el, event) {
      let instance = this.viewModel.attr('instance');
      let notifyText = instance.display_name() + ' ' +
        this.viewModel.attr('notifyText');

      event.preventDefault();

      if (instance && instance.attr('archived')) {
        instance.attr('archived', false);
        instance.save()
          .then(function () {
            if (this.viewModel.attr('notify')) {
              $('body').trigger('ajax:flash', {success: notifyText});
            }
          }.bind(this));
      }
    },
  },
});
