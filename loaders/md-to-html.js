/*
    Copyright (C) 2019 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

const md = require('markdown-it')();

module.exports = function(content) {
  console.log(' >>> mo-to-html MODULE. html length: ' + content.length);
  return md.render(content);
}
