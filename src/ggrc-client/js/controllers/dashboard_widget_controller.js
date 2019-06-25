/*
    Copyright (C) 2019 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import {ggrcAjax} from '../plugins/ajax_extensions';
import CanStache from 'can-stache';
import CanMap from 'can-map';
import CanControl from 'can-control';
import {getDashboards} from '../plugins/utils/dashboards-utils';
import {
  getPageModel,
  getPageInstance,
} from '../plugins/utils/current-page-utils';

export default CanControl.extend({
  defaults: {
    model: getPageModel(),
    instance: getPageInstance(),
    isLoading: true,
  },
}, {
  init: function () {
    let options = this.options;
    let dashboards = getDashboards(options.instance);
    let $element = $(this.element);

    options.context = new CanMap({
      model: options.model,
      instance: options.instance,
      dashboards: dashboards,
      activeDashboard: dashboards[0],
      showDashboardList: dashboards.length > 1,
      selectDashboard: function (dashboard) {
        this.attr('activeDashboard', dashboard);
      },
    });
    ggrcAjax({
      url: options.widget_view,
      dataType: 'text',
    }).then((view) => {
      let frag = CanStache(view)(options.context);
      $element.html(frag);
    });
    return 0;
  },
});
