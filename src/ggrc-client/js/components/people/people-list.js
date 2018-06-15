/*
 Copyright (C) 2018 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import '../person/person-data';
import template from './templates/people-list.mustache';

const tag = 'people-list';
const DEFAULT_PERSON_TAG = 'person-data';

export default can.Component.extend({
  template,
  tag,
  viewModel: {
    define: {
      isEmptyList: {
        get() {
          return !this.attr('people.length');
        },
      },
    },
    personTag: '',
    people: [],
    emptyMessage: '',
    isDisabled: false,
  },
  events: {
    '.people-list__item click'(el, ev) {
      const tag = this.viewModel.attr('personTag') || DEFAULT_PERSON_TAG;
      const person = el.viewModel && el.find(tag).viewModel().attr('person');
      const target = $(ev.target);

      this.viewModel.dispatch({
        type: 'personDataClick',
        person,
        target,
      });
    },
  },
});
