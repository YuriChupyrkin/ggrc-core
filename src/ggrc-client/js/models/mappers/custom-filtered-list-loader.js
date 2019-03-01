/*
 Copyright (C) 2019 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import RefreshQueue from '../refresh_queue';
import Mappings from './mappings';
import {filtredMap} from '../../plugins/ggrc_utils';

(function (GGRC, can) {
  /*
   CustomFilteredListLoader allows any sort of filter to be applied on instances
   to create a new set of filtered items.  This depends on refresh_instances from
   the source list loader and a filter function applied to each MappingResult.

   The signature of the filter function is (MappingResult) -> truthy | falsy | Deferred

   if the filter function returns a Deferred, inclusion of the instance in the new
   ListBinding will be contingent on the Deferred resolving to a truthy value.

   Rejected Deferreds are treated as false.
   */
  GGRC.ListLoaders.CustomFilteredListLoader =
    GGRC.ListLoaders.StubFilteredListLoader.extend({}, {
      process_result: function (binding, result, newResult, include) {
        let self = this;
        if (include) {
          if (typeof include.then === 'function') {
            // return nothing yet. push in later if it is needed.
            include.then(function (realInclude) {
              if (realInclude) {
                self.insert_results(binding, [newResult]);
              } else {
                self.remove_instance(binding, result.instance, result);
              }
            }, function () {
              // remove instance (if it exists) if the deferred rejects
              self.remove_instance(binding, result.instance, result);
            });
          } else {
            self.insert_results(binding, [newResult]);
          }
        } else {
          self.remove_instance(binding, result.instance, result);
        }
      },

      init_listeners: function (binding) {
        let self = this;
        function resultCompute(result) {
          return can.compute(function () {
            return self.filter_fn(result);
          });
        }

        if (typeof this.source === 'string') {
          binding.source_binding = Mappings.getBinding(
            this.source,
            binding.instance);
        } else {
          binding.source_binding = this.source;
        }

        binding.source_binding.list.bind('add', function (ev, results) {
          binding.refresh_instances().done(function () {
            new RefreshQueue().enqueue(
              filtredMap(results, function (res) {
                return res.instance;
              })
            ).trigger().done(function () {
              filtredMap(can.makeArray(results), function (result) {
                let newResult =
                  self.make_result(result.instance, [result], binding);
                newResult.compute = resultCompute(result);
                newResult.compute.bind('change',
                  $.proxy(self, 'process_result', binding, result, newResult));
                self.process_result(binding, result, newResult,
                  newResult.compute());
              });
            });
          });
        });

        binding.source_binding.list.bind('remove', function (ev, results) {
          _.forEach(results, function (result) {
            self.remove_instance(binding, result.instance, result);
          });
        });
      },

      _refresh_stubs: function (binding) {
        let self = this;

        return binding.source_binding.refresh_instances()
          .then(function (results) {
            new RefreshQueue().enqueue(
              filtredMap(results, function (res) {
                return res.instance;
              })
            ).trigger().done(function () {
              filtredMap(can.makeArray(results), function (result) {
                let newResult =
                  self.make_result(result.instance, [result], binding);
                newResult.compute = can.compute(function () {
                  return self.filter_fn(result);
                });
                newResult.compute.bind('change',
                  $.proxy(self, 'process_result', binding, result, newResult));
                self.process_result(binding, result, newResult,
                  newResult.compute());
              });
            });
          });
      },
    });
})(window.GGRC, window.can);
