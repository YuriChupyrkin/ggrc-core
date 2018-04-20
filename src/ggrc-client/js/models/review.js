/*
    Copyright (C) 2018 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

export default can.Model.Cacheable('CMS.Models.Review', {
  root_object: 'review',
  root_collection: 'reviews',
  table_singular: 'review',
  table_plural: 'reviews',

  category: 'governance',
  findOne: 'GET /api/reviews/{id}',
  findAll: 'GET /api/reviews',
  update: 'PUT /api/reviews/{id}',
  destroy: 'DELETE /api/reviews/{id}',
  create: 'POST /api/reviews',
  attributes: {
    last_set_unreviewed_at: 'datetime',
    last_set_reviewed_at: 'datetime',
  },
}, {
  save_error(error) {
    GGRC.Errors.notifier('error', error);
  },
});
