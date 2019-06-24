/*
 Copyright (C) 2019 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import CanList from 'can-list';
import CanMap from 'can-map';
import allModels from '../../models/all-models';

function reify(obj) {
  if (obj instanceof CanList) {
    return reifyList(obj);
  }

  if (obj instanceof CanMap) {
    return reifyMap(obj);
  }
}

function isReifiable(obj) {
  return obj instanceof CanMap;
}

function reifyMap(obj) {
  const type = obj.type;
  const model = allModels[type];

  if (obj instanceof can.Model) {
    return obj;
  }

  if (!model) {
    console.warn('`reifyMap()` called with unrecognized type', obj);
  } else {
    return model.model(obj);
  }
}

function reifyList(obj) {
  return new CanList(_.map(obj, function (item) {
    return reifyMap(item);
  }));
}

export {
  reify,
  reifyMap,
  reifyList,
  isReifiable,
};
