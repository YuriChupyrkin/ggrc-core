/*
    Copyright (C) 2019 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import loMap from 'lodash/map';
import CanStache from 'can-stache';
import CanMap from 'can-map';
import CanComponent from 'can-component';
import template from './recently-viewed.stache';
import {getRecentlyViewedObjects} from '../../plugins/utils/recently-viewed-utils';
import * as businessModels from '../../models/business-models';

export default CanComponent.extend({
  tag: 'recently-viewed',
  view: CanStache(template),
  leakScope: true,
  viewModel: CanMap.extend({
    items: [],
  }),
  init() {
    let objects = getRecentlyViewedObjects();
    let items = loMap(objects, (obj) => {
      return {
        viewLink: obj.viewLink,
        title: obj.title,
        icon: businessModels[obj.type].table_singular,
      };
    });
    this.viewModel.attr('items', items);
  },
});
