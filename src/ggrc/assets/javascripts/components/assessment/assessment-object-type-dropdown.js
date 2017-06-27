/*!
 Copyright (C) 2017 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

(function (GGRC, can) {
  'use strict';

  var tag = 'assessment-object-type-dropdown';
  var template = can.view(GGRC.mustache_path +
    '/components/assessment/assessment-object-type-dropdown.mustache');

  GGRC.Components('assessmentObjectTypeDropdown', {
    tag: tag,
    template: template,
    viewModel: {
      define: {
        objectTypes: {
          get: function () {
            var mapper;
            var MapperModel = GGRC.Models.MapperModel;
            var objectTypes;
            var self = this;

            mapper = new MapperModel({
              object: 'MultitypeSearch',
              search_only: true
            });
            objectTypes = mapper.initTypes('AssessmentTemplate');
            // remove ignored types and sort the rest
            _.each(objectTypes, function (objGroup) {
              objGroup.items = _.filter(objGroup.items, function (item) {
                return !self.getNonRelevantObjectTypes()[item.value];
              });
              objGroup.items = _.sortBy(objGroup.items, 'name');
            });

            // remove the groups that have ended up being empty
            objectTypes = _.pick(objectTypes, function (objGroup) {
              return objGroup.items && objGroup.items.length > 0;
            });

            return objectTypes;
          }
        }
      },
      assessmentType: '',
      cssClass: '@',
      getNonRelevantObjectTypes: function () {
        return Object.freeze({
          AssessmentTemplate: true,
          Assessment: true,
          Audit: true,
          CycleTaskGroupObjectTask: true,
          TaskGroup: true,
          TaskGroupTask: true,
          Workflow: true
        });
      }
    }
  });
})(window.GGRC, window.can);
