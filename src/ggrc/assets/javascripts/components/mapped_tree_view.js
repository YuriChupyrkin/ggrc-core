/*!
    Copyright (C) 2016 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

(function (can, $) {
  can.Component.extend({
    tag: 'mapping-tree-view',
    template: can.view(GGRC.mustache_path +
      '/base_templates/mapping_tree_view.mustache'),
    scope: {
      reusable: '@',
      reuseMethod: '@',
      treeViewClass: '@',
      expandable: '@',
      sortField: '@',
      parentInstance: null,
      mappedObjects: [],
      isExpandable: function () {
        var expandable = this.attr('expandable');
        if (expandable === null || expandable === undefined) {
          return true;
        } else if (typeof expandable === 'string') {
          return expandable === 'true';
        }
        return expandable;
      }
    },
    init: function(element){
      var self = this;

      if(!this.scope.mapping) {
        // // for test! TODO: remove
        // self._init_mapping_tree_view(element);
        // return;
        // // for test! TODO: remove

        console.log("WRONG MAPPING");
        var parentInstance = this.scope.parentInstance;
        var promise = parentInstance.deferred_mapped_tree_init
          .bind(parentInstance);

        if (!promise) {
          console.log("promise doesn't exist");
          self._init_mapping_tree_view(element);
        } else {
          // ToDo: check type (should be function)...
          promise().always(function(){
            console.log('promise resolved;');
            console.log(`Mapping: ${self.scope.mapping}`);
            self._init_mapping_tree_view(element);
          });
        }

        return;
      }

      self._init_mapping_tree_view(element);
    },
    _init_mapping_tree_view: function (element) {
      var el = $(element);
      var binding;

      _.each(['mapping', 'itemTemplate'], function (prop) {
        if (!this.scope.attr(prop)) {
          this.scope.attr(prop,
            el.attr(can.camelCaseToDashCase(prop)));
        }
      }, this);

      binding = this.scope.parentInstance.get_binding(this.scope.mapping);

      binding.refresh_instances().then(function (mappedObjects) {
        this.scope.attr('mappedObjects').replace(
          this._sortObjects(mappedObjects)
        );
      }.bind(this));

      // We are tracking binding changes, so mapped items update accordingly
      binding.list.on('change', function () {
        this.scope.attr('mappedObjects').replace(
          this._sortObjects(binding.list)
        );
      }.bind(this));
    },
    /**
      * Sort objects list by this.scope.sortField, if defined
      *
      * @param {Array} mappedObjects - the list of objects to be sorted
      *
      * @return {Array} - if this.scope.sortField is defined, mappedObjects
      *                   sorted by field this field;
      *                   if this.scope.sortField is undefined, unsorted
      *                   mappedObjects.
      */
    _sortObjects: function (mappedObjects) {
      if (this.scope.attr('sortField')) {
        return _.sortBy(mappedObjects, this.scope.attr('sortField'));
      }
      return mappedObjects;
    },
    events: {
      '[data-toggle=unmap] click': function (el, ev) {
        var instance = el.find('.result').data('result');
        var mappings = this.scope.parentInstance.get_mapping(
          this.scope.mapping);
        var binding;

        ev.stopPropagation();

        binding = _.find(mappings, function (mapping) {
          return mapping.instance.id === instance.id &&
            mapping.instance.type === instance.type;
        });
        _.each(binding.get_mappings(), function (mapping) {
          mapping.refresh()
            .then(function () {
              return mapping.destroy();
            })
            .then(function () {
              if (mapping.documentable) {
                return mapping.documentable.reify();
              }
            })
            .fail(GGRC.Errors.notifierXHR('error'));
        });
      }
    }
  });
})(window.can, window.can.$);
