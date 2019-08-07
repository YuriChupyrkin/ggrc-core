/*
 Copyright (C) 2019 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import loForEach from 'lodash/forEach';
import loMap from 'lodash/map';
import moment from 'moment';
import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import '../tree-pagination/tree-pagination';
import './revision-page';

import RefreshQueue from '../../models/refresh_queue';
import template from './revision-log.stache';
import tracker from '../../tracker';
import Revision from '../../models/service-models/revision';
import Stub from '../../models/stub';
import {reify as reifyUtil, isReifiable} from '../../plugins/utils/reify-utils';

import {
  buildParam,
  batchRequests,
} from '../../plugins/utils/query-api-utils';
import QueryParser from '../../generated/ggrc_filter_query_parser';
import Pagination from '../base-objects/pagination';
import {notifier} from '../../plugins/utils/notifiers-utils';

export default canComponent.extend({
  tag: 'revision-log',
  view: canStache(template),
  leakScope: true,
  /**
   * The component's entry point. Invoked when a new component instance has
   * been created.
   */
  init: function () {
    const viewModel = this.viewModel;

    initObjectReview(viewModel);

    fetchItems(viewModel);
  },
  viewModel: canMap.extend({
    define: {
      showFilter: {
        get() {
          return (this.attr('review.status') === 'Unreviewed') &&
            !!this.attr('review.last_reviewed_by');
        },
      },
      pageInfo: {
        value: function () {
          return new Pagination({
            pageSizeSelect: [10, 25, 50],
            pageSize: 10,
          });
        },
      },
    },
    options: {},
    instance: null,
    review: null,
    isLoading: false,
    revisions: null,
    changeLastUpdatesFilter(element) {
      const isChecked = element.checked;
      this.attr('options.showLastReviewUpdates', isChecked);

      this.attr('pageInfo.current', 1);
      fetchItems(this);
    },
  }),
  events: {
    '{viewModel.instance} refreshInstance': function () {
      fetchItems(this.viewModel);
    },
    '{viewModel.pageInfo} current'() {
      fetchItems(this.viewModel);
    },
    '{viewModel.pageInfo} pageSize'() {
      fetchItems(this.viewModel);
    },
    removed() {
      this.viewModel.attr('options.showLastReviewUpdates', false);
    },
  },
});

function fetchItems(vm) {
  vm.attr('isLoading', true);
  vm.attr('revisions', null);

  const stopFn = tracker.start(
    vm.attr('instance.type'),
    tracker.USER_JOURNEY_KEYS.LOADING,
    tracker.USER_ACTIONS.CHANGE_LOG);

  return fetchRevisions(vm)
    .then(fetchAdditionalInfoForRevisions.bind(vm))
    .then(composeRevisionsData.bind(vm))
    .done((revisionsData) => {
      vm.attr('revisions', revisionsData);
      stopFn();
    })
    .fail(function () {
      stopFn(true);
      notifier('error', 'Failed to fetch revision history data.');
    })
    .always(function () {
      vm.attr('isLoading', false);
    });
}

function fetchRevisions(vm) {
  const filter = getQueryFilter(vm);
  const pageInfo = vm.attr('pageInfo');
  const page = {
    current: pageInfo.current,
    pageSize: pageInfo.pageSize,
    buffer: 1, // we need additional item to calculate diff for last item on page
    sort: [{
      direction: 'desc',
      key: 'created_at',
    }],
  };
  let params = buildParam(
    'Revision',
    page,
    null,
    null,
    filter
  );

  return batchRequests(params).then((data) => {
    data = data.Revision;
    const total = data.total;
    vm.attr('pageInfo.total', total);

    return makeRevisionModels(data);
  });
}

function getQueryFilter(vm) {
  const instance = vm.attr('instance');

  if (!vm.attr('options.showLastReviewUpdates')) {
    return QueryParser.parse(
      `${instance.type} not_empty_revisions_for ${instance.id} OR
      source_type = ${instance.type} AND
      source_id = ${instance.id} OR
      destination_type = ${instance.type} AND
      destination_id = ${instance.id}`);
  } else {
    const reviewDate = moment(vm.attr('review.last_reviewed_at'))
      .format('YYYY-MM-DD HH:mm:ss');

    return QueryParser.parse(
      `${instance.type} not_empty_revisions_for ${instance.id} AND
      created_at >= "${reviewDate}" OR
      source_type = ${instance.type} AND
      source_id = ${instance.id} AND
      created_at >= "${reviewDate}" OR
      destination_type = ${instance.type} AND
      destination_id = ${instance.id} AND
      created_at >= "${reviewDate}"`);
  }
}

function makeRevisionModels(data) {
  let revisions = data.values;
  revisions = revisions.map(function (source) {
    return Revision.model(source, 'Revision');
  });

  return revisions;
}

function fetchAdditionalInfoForRevisions(revisions) {
  const refreshQueue = new RefreshQueue();

  loForEach(revisions, (revision) => {
    enqueueRelated(revision, refreshQueue);
    if (revision.content && revision.content.automapping) {
      enqueueRelated(revision.content.automapping, refreshQueue);
    }
  });

  return refreshQueue.trigger().then(() => revisions);
}

function enqueueRelated(object, refreshQueue) {
  if (object.modified_by) {
    refreshQueue.enqueue(object.modified_by);
  }
  if (object.destination_type && object.destination_id) {
    object.destination = new Stub({
      id: object.destination_id,
      type: object.destination_type,
    });
    refreshQueue.enqueue(object.destination);
  }
  if (object.source_type && object.source_id) {
    object.source = new Stub({
      id: object.source_id,
      type: object.source_type,
    });
    refreshQueue.enqueue(object.source);
  }
}

function composeRevisionsData(revisions) {
  let objRevisions = [];
  let mappings = [];
  let revisionsForCompare = [];

  if (this.attr('pageInfo.pageSize') < revisions.length) {
    revisionsForCompare = revisions.splice(-1);
  }
  loForEach(revisions, (revision) => {
    if (revision.destination || revision.source) {
      mappings.push(revision);
    } else {
      objRevisions.push(revision);
    }

    if (revision.content && revision.content.automapping) {
      reifyObject(revision.content.automapping);
    }
  });

  return {
    object: loMap(objRevisions, reifyObject),
    mappings: loMap(mappings, reifyObject),
    revisionsForCompare: loMap(revisionsForCompare, reifyObject),
  };
}

function reifyObject(object) {
  ['modified_by', 'source', 'destination'].forEach(
    (field) => {
      if (object[field] && isReifiable(object[field])) {
        object.attr(field, reifyUtil(object[field]));
      }
    });
  return object;
}

function initObjectReview(vm) {
  const review = vm.attr('instance.review');

  if (review) {
    vm.attr('review', reifyUtil(review));
  }
}
