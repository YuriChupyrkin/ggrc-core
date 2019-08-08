/*
    Copyright (C) 2019 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canMap from 'can-map';
import canComponent from 'can-component';
import {
  buildParam,
  batchRequests,
} from '../../plugins/utils/query-api-utils';
import {
  getPageInstance,
} from '../../plugins/utils/current-page-utils';
import {initCounts} from '../../plugins/utils/widgets-utils';
import {
  REFRESH_MAPPING,
  DESTINATION_UNMAPPED,
} from '../../events/eventTypes';
import pubSub from '../../pub-sub';
import Relationship from '../../models/service-models/relationship';
import Context from '../../models/service-models/context';
import Evidence from '../../models/business-models/evidence';
import Document from '../../models/business-models/document';
import * as businessModels from '../../models/business-models';

let DOCUMENT_KIND_MAP = {
  FILE: 'documents_file',
  REFERENCE_URL: 'documents_reference_url',
};

export default canComponent.extend({
  tag: 'related-documents',
  leakScope: true,
  viewModel: canMap.extend({
    instance: {},
    modelType: 'Document',
    kind: '',
    documents: [],
    isLoading: false,
    pubSub,
    define: {

      // automatically refresh instance on related document create/remove
      autorefresh: {
        type: 'boolean',
        value: true,
      },
    },
    createRelatedDocument: function (data) {
      let self = this;
      let document = createDocument(this, data);

      this.attr('documents').unshift(document);
      this.attr('isLoading', true);

      return saveDocument(document)
        .then(createRelationship.bind(this))
        .then(function () {
          refreshRelatedDocuments(self);
        })
        .fail(function (err) {
          console.error(`Unable to create related document: ${err}`);
        })
        .done(function () {
          self.attr('isLoading', false);
        });
    },
    removeRelatedDocument: async function (document) {
      let self = this;
      let documents;
      let relationship = await Relationship.findRelationship(
        document, this.instance);
      if (!relationship.id) {
        console.warn('Unable to find relationship');
        return $.Deferred().reject({
          error: 'Unable to find relationship',
        });
      }

      documents = this.attr('documents').filter(function (item) {
        return item.id !== document.id;
      });

      this.attr('isLoading', true);
      this.attr('documents', documents);

      return relationship.destroy()
        .then(function () {
          refreshRelatedDocuments(self);
        })
        .fail(function (err) {
          console.error(`Unable to remove related document: ${err}`);
        })
        .done(function () {
          self.attr('isLoading', false);
        });
    },
    markDocumentForDeletion: function (document) {
      let documents = this.attr('documents').filter(function (item) {
        return item !== document;
      });

      this.attr('documents', documents);
      this.dispatch({
        type: 'removeMappings',
        object: document,
      });
    },
    markDocumentForAddition: function (data) {
      let document = createDocument(this, data);

      this.attr('documents').unshift(document);
      this.attr('isLoading', true);

      return saveDocument(document)
        .then(() => {
          this.dispatch({
            type: 'addMappings',
            objects: [document],
          });
        })
        .always(() => this.attr('isLoading', false));
    },
  }),
  init: function () {
    let instance = this.viewModel.attr('instance');
    let isNew = instance.isNew();
    let isSnapshot = !!(instance.snapshot || instance.isRevision);

    // don't need to load documents for unsaved instance
    if (!isNew) {
      this.viewModel.attr('isSnapshot', isSnapshot);
      setDocuments(this.viewModel);
    }
  },
  events: {
    [`{viewModel.instance} ${REFRESH_MAPPING.type}`]([instance], event) {
      if (this.viewModel.attr('modelType') === event.destinationType) {
        refreshRelatedDocuments(this.viewModel);
      }
    },
    [`{viewModel.instance} ${DESTINATION_UNMAPPED.type}`]([instance], event) {
      let item = event.item;
      let viewModel = this.viewModel;

      if (item.attr('type') === viewModel.attr('modelType')
        && item.attr('kind') === viewModel.attr('kind')) {
        loadDocuments(viewModel);
      }
    },
    '{pubSub} objectDeleted'(pubSub, event) {
      let instance = event.instance;
      if (instance instanceof Evidence ||
        instance instanceof Document) {
        refreshRelatedDocuments(this.viewModel);
      }
    },
  },
});

function getDocumentsQuery(vm) {
  let relevantFilters = [{
    type: vm.attr('instance.type'),
    id: vm.attr('instance.id'),
    operation: 'relevant',
  }];
  let additionalFilter = vm.attr('kind') ?
    {
      expression: {
        left: 'kind',
        op: {name: '='},
        right: vm.attr('kind'),
      },
    } :
    [];

  let modelType = vm.attr('modelType');
  let query =
    buildParam(modelType, {}, relevantFilters, [], additionalFilter);
  query.order_by = [{name: 'created_at', desc: true}];

  return query;
}

function loadDocuments(vm) {
  const query = getDocumentsQuery(vm);

  vm.attr('isLoading', true);
  refreshTabCounts(vm);

  let modelType = vm.attr('modelType');
  return batchRequests(query).then((response) => {
    const documents = response[modelType].values;
    vm.attr('documents').replace(documents);
    vm.attr('isLoading', false);
  });
}

function setDocuments(vm) {
  let instance;
  let kind;
  let documentPath;
  let documents;

  // load documents for non-snapshots objects
  if (!vm.attr('isSnapshot')) {
    loadDocuments(vm);
    return;
  }

  instance = vm.attr('instance');
  kind = vm.attr('kind');

  if (kind) {
    documentPath = DOCUMENT_KIND_MAP[kind];
    documents = instance[documentPath];
  } else {
    // We need to display URL and Evidences together ("Related
    // Assessments pane")
    documents = instance.document_url.concat(instance.document_evidence);
  }

  vm.attr('documents').replace(documents);
}

function createDocument(vm, data) {
  let modelType = vm.attr('modelType');
  let context = modelType === 'Evidence'
    ? vm.instance.context
    : new Context({id: null});

  let document = new businessModels[modelType]({
    link: data,
    title: data,
    context,
    kind: vm.kind,
  });
  return document;
}

function saveDocument(document) {
  return document.save();
}

function createRelationship(document) {
  let relationship = new Relationship({
    source: this.instance,
    destination: document,
    context: this.instance.context ||
      new Context({id: null}),
  });
  return relationship.save();
}

function refreshRelatedDocuments(vm) {
  if (vm.autorefresh) {
    loadDocuments(vm);
  }
}

function refreshTabCounts(vm) {
  let pageInstance = getPageInstance();
  let modelType = vm.attr('modelType');
  initCounts(
    [modelType],
    pageInstance.type,
    pageInstance.id
  );
}
