/*
 Copyright (C) 2018 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

class EtagStorage {
  constructor() {
    this.etags = {};
  }

  /**
   * Gets etagData
   * @param {string} url - resource url.
   * @return {object} etagData - etag data.
   */
  get(url) {
    if (!this.etags[url]) {
      return {};
    }

    return this.etags[url].etagData || {};
  }

  /**
   * Gets previous etagData
   * @param {string} url - resource url.
   * @return {object} previousEtagData - previous etag data.
   */
  getPrevious(url) {
    if (!this.etags[url]) {
      return {};
    }

    return this.etags[url].previousEtagData || {};
  }

  /**
   * Sets etagData
   * @param {string} url - resource url.
   * @param {object} etagData - etag data.
   */
  set(url, etagData = {}) {
    let previousEtagData = this.get(url);

    // set current etag data when previous etag data is empty
    if (_.isEmpty(previousEtagData)) {
      previousEtagData = etagData;
    }

    this.etags[url] = {
      etagData,
      previousEtagData,
    };
  }

  /**
   * Deletes etagData and previousEtagData
   * @param {string} url - resource url.
   */
  delete(url) {
    delete this.etags[url];
  }
}

export default new EtagStorage();
