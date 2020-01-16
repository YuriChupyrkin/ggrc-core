/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

const {JSDOM} = require('jsdom');

module.exports = class DomHelper {
  constructor(htmlContent) {
    this._domDocument = new JSDOM(htmlContent).window.document;
  }

  getDomDocument() {
    return this._domDocument;
  }

  select(selector) {
    return this._domDocument.querySelector(selector);
  }

  selectAll(selector) {
    return this._domDocument.querySelectorAll(selector);
  }

  // remove dots from "href" and "id" attributes
  cleanUpIdLinks() {
    const dot = /\./g;

    const links = this._domDocument.querySelectorAll('a');
    const hrefAttr = 'href';
    for (let i = 0; i < links.length; i++ ) {
      const href = links[i].getAttribute(hrefAttr);
      links[i].setAttribute(hrefAttr, href.replace(dot, ''));
    }

    const h2Elements = this._domDocument.querySelectorAll('h2');
    const idAttr = 'id';
    for (let i = 0; i < h2Elements.length; i++ ) {
      const id = h2Elements[i].getAttribute(idAttr);
      h2Elements[i].setAttribute(idAttr, id.replace(dot, ''));
    }
  }

  cleanUpStylesAndTags() {
    const body = this._domDocument.querySelector('body');
    body.querySelectorAll('[style]').forEach((element) => {
      element.removeAttribute('style');
    });

    const bodyHtml = body.innerHTML;
    // set only 'body' content to "_domDocument" field
    this._domDocument = new JSDOM(bodyHtml).window.document;
  }
};
