/*
    Copyright (C) 2019 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import Mixin from './mixin';

export default Mixin({
  'after:init': function () {
    // TODO: use "validateUniqueTitle" validation extension
    // TODO: use "_transient_title" property instead of "_transient.title"
    this.validate(['title', '_transient.title'], function (newVal, prop) {
      if (prop === 'title') {
        return this.attr('_transient.title');
      } else if (prop === '_transient.title') {
        return newVal; // the title error is the error
      }
    });
  },
}, {
  save_error: function (val) {
    if (/title values must be unique\.$/.test(val)) {
      this.attr('_transient.title', val);
    }
  },
  after_save: function () {
    this.removeAttr('_transient.title');
  },
  'before:attr': function (key, val) {
    if (key === 'title' &&
      arguments.length > 1 &&
      this._transient) {
      this.attr('_transient.title', null);
    }
  },
});
