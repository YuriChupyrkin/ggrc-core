/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

const DomHelper = require('./dom-helper');

const versionStringToArray = (versionString) => {
  function extractNumbers(versionString) {
    if (versionString.includes('v')) {
      const splittedByV = versionString.split('v');
      if (!splittedByV.length) {
        return '';
      }
      return splittedByV[1];
    }

    if (versionString.includes('-')) {
      const splittedByHyphen = versionString.split('-');
      if (!splittedByHyphen.length) {
        return '';
      }

      return splittedByHyphen[0];
    }

    return '';
  }

  function getVersionArray(versionNumbers) {
    const splittedByDot = versionNumbers.split('.');
    if (!splittedByDot.length || splittedByDot.length !== 3) {
      return [];
    }

    return splittedByDot.map((v) => Number(v));
  }

  const versionNumbers = extractNumbers(versionString);
  const versionArray = getVersionArray(versionNumbers);
  return versionArray;
};

/*
* Returns 1 when a > b;
* Returns 0 when a == b;
* Returns -1 when a < b;
*/
const compareVersions = (a, b) => {
  const aCoef = 1000000;
  const bCoef = 1000;
  const aVersionIndex = a[0] * aCoef
    + a[1] * bCoef
    + a[2];

  const bVersionIndex = b[0] * aCoef
      + b[1] * bCoef
      + b[2];

  return aVersionIndex === bVersionIndex
    ? 0
    : aVersionIndex > bVersionIndex
      ? 1
      : -1;
};

const getVersionByLink = (link) => {
  let versionMatches = link.text.match('v[\\d]+\\.[\\d]+\\.[\\d]+');
  if (!versionMatches || !versionMatches.length) {
    versionMatches = ['v0.0.0'];
  }

  const lastVersionArray = versionStringToArray(versionMatches[0]);
  return lastVersionArray;
};

/*
* remove description connected to title
* (all tags after current <h2>(title) tag except of next <h2> tag)
*/
const removeDescription = (titleElement) => {
  const nextSibling = titleElement.nextSibling;
  if (!nextSibling) {
    return;
  }

  if (nextSibling.tagName === 'H2') {
    return;
  }

  titleElement.parentElement.removeChild(nextSibling);
  return removeDescription(titleElement);
};

const getFirstLinkRootElement = (rootElement) => {
  if (rootElement.parentElement
    && rootElement.parentElement.children
    && rootElement.parentElement.children.length === 1) {
    return getFirstLinkRootElement(rootElement.parentElement);
  } else {
    return rootElement;
  }
};

const removeIrrelevantNotes = (domHelper, currentVersion) => {
  // 1. get first link from document
  const link = domHelper.select('a');
  if (!link) {
    throw new Error('\n !!! Link is NOT found!\n');
  }

  // 2. get version of first link
  const lastVersion = getVersionByLink(link);

  // 3. check versions
  if (currentVersion.length !== lastVersion.length) {
    throw new Error('\n !!! Incorrect format of version!\n');
  }

  // 4. compare last version from document and current versions
  const isVersionIrrelevant =
    compareVersions(lastVersion, currentVersion) > 0;

  // version of first link is equal or less than current version.
  // No need to change HTML.
  if (!isVersionIrrelevant) {
    return;
  }

  // 5. get href of first link
  const href = link.getAttribute('href');
  if (!href) {
    throw new Error('\n !!! Link does NOT contain HREF attribute!\n');
  }

  // 6. get title connected to first link (<h2> tag)
  const titleElement = domHelper.select(href);
  if (!titleElement) {
    throw new Error('\n !!! Title is NOT found!\n');
  }

  // 7. remove description connected to title
  removeDescription(titleElement);

  // 8. remove title (<h2> tag)
  titleElement.parentElement.removeChild(titleElement);

  // 9. remove first link and empty parents of that link
  const rootElement = getFirstLinkRootElement(link);
  rootElement.parentElement.removeChild(rootElement);

  // 10. recursive remove irrelevant notes.
  removeIrrelevantNotes(domHelper, currentVersion);
};


module.exports.processHtmlContent = (htmlContent, currentVersionString) => {
  const currentVersionArray = versionStringToArray(currentVersionString);

  const domHelper = new DomHelper(htmlContent);
  domHelper.cleanUpStylesAndTags();
  domHelper.cleanUpIdLinks();

  removeIrrelevantNotes(domHelper, currentVersionArray);

  const dom = domHelper.getDomDocument();
  return dom.querySelector('body').innerHTML;
};
