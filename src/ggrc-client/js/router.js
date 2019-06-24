/*
  Copyright (C) 2019 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import CanRoute from 'can-route';
import CanMap from 'can-map';
const router = new CanMap();

class RouterConfig {
  static setupRoutes(routes) {
    routes.forEach((route) => {
      CanRoute(route.template, route.defaults);
    });
    CanRoute.data = router;
    CanRoute.start();
  }
}

const buildUrl = (data) => {
  let url = CanRoute.url(data);
  return url;
};

const getUrlParams = (data) => {
  if (typeof data === 'string') {
    let widget;

    // trim first and last slashes if so
    // so CanRoute.deparam can parse it
    let params = _.compact(data.split('/'));

    // if params missing 'widget' part
    if (params.length === 2) {
      widget = CanRoute.attr('widget');

      if (widget) {
        params.unshift(widget);
      }
    }

    data = params.join('/');

    return CanRoute.deparam(data);
  }
};

const changeHash = (data) => {
  CanRoute.attr(data);
};

const changeUrl = (url) => {
  if (typeof url === 'string') {
    window.location.href = url;
  }
};

const reloadPage = () => {
  window.location.reload();
};

export default router;
export {
  RouterConfig,
  buildUrl,
  getUrlParams,
  changeHash,
  changeUrl,
  reloadPage,
};
