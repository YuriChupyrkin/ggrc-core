/*
    Copyright (C) 2019 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import CanStache from 'can-stache';
import CanComponent from 'can-component';
import baseAutocompleteWrapper from './../custom-autocomplete/autocomplete-wrapper';
import Label from '../../models/service-models/label';

let viewModel = baseAutocompleteWrapper.extend({
  currentValue: '',
  modelName: 'Label',
  modelConstructor: Label,
  queryField: 'name',
  result: [],
  objectsToExclude: [],
  showResults: false,
  showNewValue: false,
});

export default CanComponent.extend({
  tag: 'label-autocomplete-wrapper',
  view: CanStache('<content/>'),
  leakScope: true,
  viewModel: viewModel,
});
