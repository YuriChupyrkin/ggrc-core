/*
    Copyright (C) 2018 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import validate from 'validate.js/validate';

validate.validators.custom = function(value, options, key, attributes) {
  console.log('custom validator arguments: ', arguments);
  return "is totally wrong";
};
