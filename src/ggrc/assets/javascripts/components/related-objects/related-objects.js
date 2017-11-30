/*
 Copyright (C) 2017 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import '../sortable-column/sortable-column';
import {REFRESH_RELATED} from '../../events/eventTypes';
import {
  makeRequest,
} from '../../plugins/utils/query-api-utils';
import Pagination from '../base-objects/pagination';

(function (can, GGRC, CMS) {
  'use strict';

  var defaultOrderBy = 'created_at';

  GGRC.Components('relatedObjects', {
    tag: 'related-objects',
    viewModel: {
      define: {
        noRelatedObjectsMessage: {
          type: 'string',
          get: function () {
            return 'No Related ' + this.attr('relatedItemsType') + 's ' +
              'were found';
          },
        },
        isLoading: {
          type: 'boolean',
          value: false,
        },
        paging: {
          value: function () {
            return new Pagination({pageSizeSelect: [5, 10, 15]});
          },
        },
        relatedObjects: {
          Value: can.List,
        },
        predefinedFilter: {
          type: '*',
        },
      },
      baseInstance: null,
      relatedItemsType: '@',
      orderBy: {},
      initialOrderBy: '@',
      selectedItem: {},
      totalItems: '',
      objectSelectorEl: '.grid-data__action-column button',
      getFilters: function (id, type, isAssessment) {
        var predefinedFilter = this.attr('predefinedFilter');
        var filters;

        if (predefinedFilter) {
          filters = predefinedFilter;
        } else {
          filters = {
            expression: {
              object_name: type,
              op: isAssessment ? {name: 'similar'} : {name: 'relevant'},
              ids: [id],
            },
          };
        }
        return filters;
      },
      updateTotalItems(totalItems) {
        this.attr('totalItems', totalItems);
        this.dispatch({
          type: 'totalItemsChanged',
          count: totalItems,
        });
      },
      getParams: function () {
        var id;
        var type;
        var relatedType = this.attr('relatedItemsType');
        var isAssessment = this.attr('baseInstance.type') === 'Assessment';
        var isSnapshot = !!this.attr('baseInstance.snapshot');
        var filters;
        var params = {};

        if (isSnapshot) {
          id = this.attr('baseInstance.snapshot.child_id');
          type = this.attr('baseInstance.snapshot.child_type');
        } else {
          id = this.attr('baseInstance.id');
          type = this.attr('baseInstance.type');
        }
        filters = this.getFilters(id, type, isAssessment);
        params.data = [{
          limit: this.attr('paging.limits'),
          object_name: relatedType,
          order_by: this.getSortingInfo(),
          filters: filters,
        }];
        return params;
      },
      loadRelatedItems: function () {
        var dfd = can.Deferred();
        var params = this.getParams();
        this.attr('isLoading', true);

        // if (this.attr('relatedItemsType') === 'Proposal') {
        //   dfd = this.fakeLoadProposals(params);
        //   return dfd;
        // }

        makeRequest(params)
          .done(function (responseArr) {
            var relatedType = this.attr('relatedItemsType');
            var data = responseArr[0];
            var values = data[relatedType].values;
            var result = values.map(function (item) {
              return {
                instance: CMS.Models[relatedType].model(item),
              };
            });
            // Update paging object
            this.attr('paging.total', data[relatedType].total);
            this.updateTotalItems(data[relatedType].total);
            dfd.resolve(result);
          }.bind(this))
          .fail(function () {
            dfd.resolve([]);
          })
          .always(function () {
            this.attr('isLoading', false);
          }.bind(this));
        return dfd;
      },
      fakeLoadProposals: function (params) {
        console.log('fake proposals load');
        console.log(params);

        let proposals = [
          {
            id: 1,
            status: 'proposed',
            agenda: 'Commnet for first revision Commnet for first revision Commnet for first revision Commnet for first revision Commnet for first revision Commnet for first revision Commnet for first revision Commnet for first revision ',
            content: {
              fields: [
                {
                  attr: 'title',
                  currentValue: 'title A',
                  revisedValue: 'title B',
                },
                {
                  attr: 'description',
                  currentValue: 'Description ADescription ADescription ADescription ADescription ADescription ADescription ADescription ADescription ADescription ADescription ADescription ADescription ADescription ADescription A',
                  revisedValue: 'Description_B_Description_B_Description_B_Description_B_Description_B_Description_B_Description_B_Description_B_Description_B_Description_B_Description_B_Description_B_',
                },
              ],
            },
            decline_reason: '',
            decline_datetime: '',
            declined_by: null,
            apply_reason: '',
            apply_datetime: '',
            applied_by: null,
            created_by: {id: 2, href: '/api/people/2', type: 'Person'},
            created_at: '2017-05-30T22:05:19',
          },
          {
            id: 2,
            status: 'declined',
            agenda: 'My comment',
            content: {
              fields: [
                {
                  attr: 'title',
                  currentValue: 'title A',
                  revisedValue: 'title B',
                },
                {
                  attr: 'effective_date',
                  currentValue: '5/5/1990',
                  revisedValue: '6/5/1990',
                },
              ],
            },
            decline_reason: 'bad proposal... very bad proposal',
            decline_datetime: '2017-11-28T12:01:09',
            declined_by: {id: 3, href: '/api/people/3', type: 'Person'},
            apply_reason: '',
            apply_datetime: '',
            applied_by: null,
            created_by: {id: 1, href: '/api/people/1', type: 'Person'},
            created_at: '2017-05-30T22:05:19',
          },
          {
            id: 3,
            status: 'applied',
            agenda: 'Comment of approved proposal',
            content: {
              fields: [
                {
                  attr: 'title',
                  currentValue: 'title A',
                  revisedValue: 'title B',
                },
                {
                  attr: 'note',
                  currentValue: 'note note...',
                  revisedValue: 'this note',
                },
              ],
            },
            decline_reason: '',
            decline_datetime: '',
            declined_by: null,
            apply_reason: 'looks nice...',
            apply_datetime: '2017-08-05T12:11:19',
            applied_by: {id: 4, href: '/api/people/4', type: 'Person'},
            created_by: {id: 3, href: '/api/people/3', type: 'Person'},
            created_at: '2017-05-30T22:05:19',
          },
        ];

        let dfd = can.Deferred();

        setTimeout(() => {
          dfd.resolve(proposals);
          this.attr('isLoading', false);
          this.attr('paging.total', 30);
          this.updateTotalItems(36);
        }, 500);

        return dfd;
      },
      getSortingInfo: function () {
        var orderBy = this.attr('orderBy');
        var defaultOrder;

        if (!orderBy.attr('field')) {
          defaultOrder = this.attr('initialOrderBy') || defaultOrderBy;
          return defaultOrder.split(',').map(function (field) {
            return {name: field, desc: true};
          });
        }

        return [{
          name: orderBy.attr('field'),
          desc: orderBy.attr('direction') === 'desc'}];
      },
      setRelatedItems: function () {
        this.attr('relatedObjects').replace(this.loadRelatedItems());
      },
    },
    init: function () {
      this.viewModel.setRelatedItems();
    },
    events: {
      '{viewModel.paging} current': function () {
        this.viewModel.setRelatedItems();
      },
      '{viewModel.paging} pageSize': function () {
        this.viewModel.setRelatedItems();
      },
      '{viewModel.baseInstance} refreshInstance': function () {
        this.viewModel.setRelatedItems();
      },
      [`{viewModel.baseInstance} ${REFRESH_RELATED.type}`]:
        function (scope, event) {
        let vm = this.viewModel;

        if (vm.attr('relatedItemsType') === event.model) {
          vm.setRelatedItems();
        }
      },
      '{viewModel.orderBy} changed': function () {
        this.viewModel.setRelatedItems();
      },
    },
  });
})(window.can, window.GGRC, window.CMS);
