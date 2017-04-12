/*!
 Copyright (C) 2017 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

(function (can, $, GGRC) {
  'use strict';

  /**
   * Util methods for work with QueryAPI.
   */
  GGRC.Utils.QueryAPI = (function () {
    /**
     * @typedef LimitArray
     * @type {array}
     * @property {number} 0  - Lower bound is inclusive.
     * @property {number} 1  - Upper bound is exclusive.
     */

    /**
     * @typedef QueryAPIRequest
     * @type {Object}
     * @property {string} object_name - The name of object
     * @property {LimitArray} limit - The boundaries of the requested values.
     * @property {object} filters - Filter properties
     */

    var widgetsCounts = new can.Map({});
    var BATCH_TIMEOUT = 100;
    var batchQueue = [];
    var batchTimeout = null;

    /**
     * Collect requests to Query API.
     *
     * @param {Object} params - Params for request
     * @param {Object} params.headers - Custom headers for request.
     * @param {Object} params.data - Object with parameters on Query API needed.
     * @return {Promise} Promise on Query API request.
     */
    function batchRequests(params) {
      var dfd = can.Deferred();
      batchQueue.push({dfd: dfd, params: params});

      if (_.isNumber(batchTimeout)) {
        clearTimeout(batchTimeout);
      }

      batchTimeout = setTimeout(function () {
        _resolveBatch(batchQueue.splice(0, batchQueue.length));
      }, BATCH_TIMEOUT);
      return dfd;
    }

    /**
     * Build params for request on Query API.
     *
     * @param {String} objName - Name of requested object
     * @param {Object} page - Information about page state.
     * @param {Number} page.current - Current page
     * @param {Number} page.pageSize - Page size
     * @param {String} page.sortBy - sortBy
     * @param {String} page.sortDirection - sortDirection
     * @param {String} page.filter - Filter string
     * @param {Object} relevant - Information about relevant object
     * @param {Object} relevant.type - Type of relevant object
     * @param {Object} relevant.id - Id of relevant object
     * @param {Object} relevant.operation - Type of operation.
     * @param {Object} additionalFilter - An additional filter to be applied
     * @return {Array} Array of QueryAPIRequest
     */
    function buildParams(objName, page, relevant, additionalFilter) {
      return [buildParam(objName, page, relevant, undefined, additionalFilter)];
    }

    /**
     * Build params for ids type request on Query API.
     *
     * @param {String} objName - Name of requested object
     * @param {Object} page - Information about page state.
     * @param {Number} page.current - Current page
     * @param {Number} page.pageSize - Page size
     * @param {String} page.sortBy - sortBy
     * @param {String} page.sortDirection - sortDirection
     * @param {String} page.filter - Filter string
     * @param {Object} relevant - Information about relevant object
     * @param {Object} relevant.type - Type of relevant object
     * @param {Object} relevant.id - Id of relevant object
     * @param {Object} relevant.operation - Type of operation.
     * @param {Object|Array} additionalFilter - Additional filters to be applied
     * @return {Object} Object of QueryAPIRequest
     */
    function buildRelevantIdsQuery(objName, page, relevant, additionalFilter) {
      var param = buildParam(objName, page, relevant, null, additionalFilter);
      param.type = 'ids';
      return param;
    }

    /**
     * Build params for request on Query API.
     *
     * @param {String} objName - Name of requested object
     * @param {Object} page - Information about page state.
     * @param {Number} page.current - Current page
     * @param {Number} page.pageSize - Page size
     * @param {String} page.sortBy - sortBy
     * @param {String} page.sortDirection - sortDirection
     * @param {String} page.filter - Filter string
     * @param {Object|Object[]} relevant - Information about relevant object
     * @param {Object} relevant.type - Type of relevant object
     * @param {Object} relevant.id - Id of relevant object
     * @param {Object} relevant.operation - Type of operation.
     * @param {Array} fields - Array of requested fields.
     * @param {Object|Array} additionalFilter - Additional filters to be applied
     * @return {Object} Object of QueryAPIRequest
     */
    function buildParam(objName, page, relevant, fields, additionalFilter) {
      var first;
      var last;
      var params = {};

      if (!objName) {
        return {};
      }

      params.object_name = objName;
      params.filters =
        _makeFilter(objName, page.filter, relevant, additionalFilter);

      if (page.current && page.pageSize) {
        first = (page.current - 1) * page.pageSize;
        last = page.current * page.pageSize;
        params.limit = [first, last];
      }
      if (page.sortBy) {
        params.order_by = [{
          name: page.sortBy,
          desc: page.sortDirection === 'desc'
        }];
      }
      if (fields) {
        params.fields = fields;
      }
      return params;
    }

    /**
     * Build Count Params.
     *
     * @param {Array} types - Names of requested object
     * @param {Object} relevant - Information about relevant object
     * @return {Array} Array of QueryAPIRequests
     */
    function buildCountParams(types, relevant) {
      var params;

      if (!types || !Array.isArray(types)) {
        return [];
      }

      params = types.map(function (objName) {
        var param = {};

        if (!objName) {
          return {};
        }

        param.object_name = objName;
        param.type = 'count';

        if (relevant) {
          param.filters = _makeRelevantFilter(relevant, objName);
        }
        return param;
      });

      return params;
    }

    /**
     * Counts for related objects.
     *
     * @return {can.Map} Promise which return total count of objects.
     */
    function getCounts() {
      return widgetsCounts;
    }

    /**
     * Update Page Counts
     * @param {Array|Object} widgets - list of widgets
     * @param {Object} relevant - relevant filter
     * @return {can.Deferred} - resolved deferred object
     */
    function initCounts(widgets, relevant) {
      var params = can.makeArray(widgets)
        .map(function (widget) {
          var param = {};
          if (GGRC.Utils.Snapshots.isSnapshotRelated(relevant.type, widget)) {
            param = buildParam('Snapshot', {},
              makeExpression(widget, relevant.type, relevant.id), null,
              GGRC.query_parser.parse('child_type = ' + widget));
          } else if (typeof widget === 'string') {
            param = buildParam(widget, {},
              makeExpression(widget, relevant.type, relevant.id));
          } else {
            param = buildParam(widget.name, {},
              makeExpression(widget.name, relevant.type, relevant.id),
              null, widget.additionalFilter);
          }
          param.type = 'count';
          return param;
        });
      // Perform requests only if params are defined
      if (!params.length) {
        return can.Deferred().resolve();
      }

      return makeRequest({
        data: params
      }).then(function (data) {
        data.forEach(function (info, i) {
          var widget = widgets[i];
          var name = typeof widget === 'string' ? widget : widget.name;
          var countsName = typeof widget === 'string' ?
            widget : (widget.countsName || widget.name);
          if (GGRC.Utils.Snapshots.isSnapshotRelated(relevant.type, name)) {
            name = 'Snapshot';
          }
          getCounts().attr(countsName, info[name].total);
        });
      });
    }

    function refreshCounts() {
      var pageInstance = GGRC.page_instance();
      var widgets;
      var location = window.location.pathname;

      if (!pageInstance) {
        return can.Deferred().resolve();
      }

      widgets = GGRC.Utils.CurrentPage
        .getWidgetModels(pageInstance.constructor.shortName, location);

      return initCounts(widgets,
        {id: pageInstance.id, type: pageInstance.type});
    }

    /**
     * Params for request on Query API
     * @param {Object} params - Params for request
     * @param {Object} params.headers - Custom headers for request.
     * @param {Object} params.data - Object with parameters on Query API needed.
     * @return {Promise} Promise on Query API request.
     */
    function makeRequest(params) {
      var reqParams = params.data || [];
      return can.ajax({
        type: 'POST',
        headers: $.extend({
          'Content-Type': 'application/json'
        }, params.headers || {}),
        url: '/query',
        data: JSON.stringify(reqParams)
      });
    }

    function makeExpression(parent, type, id, operation) {
      var isObjectBrowser = /^\/objectBrowser\/?$/
        .test(window.location.pathname);
      var expression;

      if (!isObjectBrowser) {
        expression = {
          type: type,
          id: id
        };

        expression.operation = operation ? operation :
          _getTreeViewOperation(parent);
      }
      return expression;
    }

    function _makeRelevantFilter(filter, objName) {
      var relevantFilter = GGRC.query_parser.parse('#' + filter.type + ',' +
        filter.id + '#');

      if (filter && !filter.operation) {
        filter.operation = _getTreeViewOperation(objName);
      }

      if (filter.operation &&
        filter.operation !== relevantFilter.expression.op.name) {
        relevantFilter.expression.op.name = filter.operation;
      }

      return relevantFilter;
    }

    function _makeFilter(objName, filter, relevant, additionalFilter) {
      var relevantFilters;
      var filterList = [];

      if (relevant) {
        relevant = Array.isArray(relevant) ?
          relevant :
          can.makeArray(relevant);
        relevantFilters = relevant.map(function (filter) {
          return _makeRelevantFilter(filter, objName);
        });
        filterList = filterList.concat(relevantFilters);
      }

      if (filter) {
        filterList.push(GGRC.query_parser.parse(filter));
      }

      if (additionalFilter) {
        additionalFilter = Array.isArray(additionalFilter) ?
          additionalFilter :
          can.makeArray(additionalFilter);
        filterList = filterList.concat(additionalFilter);
      }
      if (filterList.length) {
        return filterList.reduce(function (left, right) {
          return GGRC.query_parser.join_queries(left, right);
        });
      }
      return {expression: {}};
    }

    function _getTreeViewOperation(objectName) {
      var isDashboard = /dashboard/.test(window.location);
      var operation;
      if (isDashboard) {
        operation = 'owned';
      } else if (objectName === 'Person') {
        operation = 'related_people';
      }
      return operation;
    }

    function _resolveBatch(queue) {
      makeRequest({
        data: queue.map(function (el) {
          return el.params;
        })
      }).then(function (result) {
        result.forEach(function (info, i) {
          var req = queue[i];

          req.dfd.resolve(info);
        });
      });
    }

    return {
      buildParam: buildParam,
      buildParams: buildParams,
      buildRelevantIdsQuery: buildRelevantIdsQuery,
      makeRequest: makeRequest,
      getCounts: getCounts,
      makeExpression: makeExpression,
      initCounts: initCounts,
      refreshCounts: refreshCounts,
      batchRequests: batchRequests,
      buildCountParams: buildCountParams
    };
  })();
})(window.can, window.can.$, window.GGRC);
