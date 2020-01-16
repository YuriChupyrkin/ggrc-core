/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

const {JSDOM} = require('jsdom');
const fs = require('fs');

function getReleaseNotesDate(path) {
  const html = fs.readFileSync(path, 'utf-8');
  const defaultDate = new Date('01/01/1001');

  const document = new JSDOM(html).window.document;
  const link = document.querySelector('a');
  if (!link) {
    return defaultDate;
  }

  const linkText = link.text;
  const date = linkText.match(/[\d]{2}\/[\d]{2}\/[\d]{4}/);
  if (!date) {
    return defaultDate;
  }

  return new Date(date[0]);
}

module.exports = getReleaseNotesDate;
