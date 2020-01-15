/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

const fs = require('fs');
const loadReleaseNotesContent = require('./release-notes-csv-content-loader');
const htmlBuilder = require('./release-notes-html-builder');

const releaseNotesPath = './release-notes-builder/release-notes.stache';

const saveHtmlToFile = (html) => {
  return new Promise((resolve, reject) => {
    fs.writeFile(releaseNotesPath, html, (err) => {
      if (err) {
        reject(err);
        return;
      }
      console.log('->>>> SAVED');
      resolve();
    });
  });
};

module.exports = async () => {
  console.log(' -----> Build Release Notes');
  const releaseNotesCsvContent = await loadReleaseNotesContent();
  const html = htmlBuilder(releaseNotesCsvContent);

  if (!html) {
    return;
  }

  console.log(html);
  saveHtmlToFile(html);
};
