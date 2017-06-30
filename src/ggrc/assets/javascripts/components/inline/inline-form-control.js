/*!
    Copyright (C) 2017 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

(function (can) {
  'use strict';

  GGRC.Components('inlineFormControl', {
    tag: 'inline-form-control',
    viewModel: {
      instance: {},
      isLoading: false,
      value: '',
      save: function (args) {
        var self = this;
        var value = args.value;
        var instance = this.attr('instance');
        this.attr('isLoading', true);
        this.attr('value', value);
        instance.save().then(function () {
          instance.dispatch('refreshInstance');
          self.attr('isLoading', false);
          console.log('inline Form control SAVED!!!');
        });
      },
      cancel: function () {
        console.log('inline Form control cancel');
      }
    }
  });
})(window.can);
