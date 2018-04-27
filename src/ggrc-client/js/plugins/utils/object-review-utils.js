/*
  Copyright (C) 2018 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

const createNewInstance = (instance) => {
  if (!instance) {
    return new CMS.Models.Review();
  }

  return new CMS.Models.Review({
    access_control_list: [],
    notification_type: 'email',
    context: null,
    instance: {
      id: instance.id,
      type: instance.type,
    },
  });
};

export {
  createNewInstance,
};
