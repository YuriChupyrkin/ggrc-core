/*
    Copyright (C) 2019 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import {getDashboards} from '../plugins/utils/dashboards-utils';
import {
  getPageModel,
  getPageInstance,
} from '../plugins/utils/current-page-utils';

import canControl3 from 'can-control';

export default canControl3({
  defaults: {
    model: getPageModel(),
    instance: getPageInstance(),
    isLoading: true,
  },
}, {
  init: function () {
    canControl3.initElement(this);
    let options = this.options;
    let dashboards = getDashboards(options.instance);
    let $element = $(this.element);

    this.options.context = new can.Map({
      model: this.options.model,
      instance: this.options.instance,
      dashboards: dashboards,
      activeDashboard: dashboards[0],
      showDashboardList: dashboards.length > 1,
      selectDashboard: function (dashboard) {
        this.attr('activeDashboard', dashboard);
      },
    });

    let frag = can.view(this.options.widget_view,
      this.options.context);
    this.element.html(frag);
    return 0;
  },
});
