/*!
 Copyright (C) 2017 Google Inc., authors, and contributors
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

var tag = 'buganizer-fields-pre-population';

export default GGRC.Components('buganizerFieldsPrePopulation', {
  tag: tag,
  template: '<content/>',
  viewModel: {
    define: {
      fromValue: {
        set:function (newValue) {
          var instance = this.attr('instance');
          if (newValue && instance && instance.isNew()) {
            this.attr('toValue', newValue);
          }
        }
      }
    },
    toValue: '',
    instance: {},
  }
});
