/*
 Copyright (C) 2019 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import Person from '../../models/business-models/person';
import CycleTaskGroupObjectTask from '../../models/business-models/cycle-task-group-object-task';

/**
 *  Component to show number of Tasks Owned by Person
 *
 */
export default canComponent.extend({
  tag: 'tasks-counter',
  view: canStache(
    '<div class="tasks-counter {{stateCss}}">{{tasksAmount}}</div>'
  ),
  leakScope: true,
  viewModel: canMap.extend({
    CycleTaskGroupObjectTask,
    define: {
      tasksAmount: {
        type: 'number',
        value: 0,
        set: function (newValue) {
          return newValue < 0 ? 0 : newValue;
        },
      },
      hasOverdue: {
        type: 'boolean',
        value: false,
      },
      person: {
        set(value, setValue) {
          if (!value) {
            return;
          }
          setValue(value);
          loadTasks(this);
        },
      },
      stateCss: {
        get: function () {
          let baseCmpName = 'tasks-counter';
          if (this.attr('tasksAmount') === 0) {
            return baseCmpName + '__empty-state';
          }
          return this.attr('hasOverdue') ? baseCmpName + '__overdue-state' : '';
        },
      },
    },
  }),
  events: {
    onModelChange: function ([model], event, instance) {
      if (instance instanceof CycleTaskGroupObjectTask) {
        loadTasks(this.viewModel);
      }
    },
    '{CycleTaskGroupObjectTask} updated': 'onModelChange',
    '{CycleTaskGroupObjectTask} destroyed': 'onModelChange',
    '{CycleTaskGroupObjectTask} created': 'onModelChange',
  },
});

function loadTasks(vm) {
  let id = vm.attr('person.id');
  let user = Person.findInCacheById(id);

  if (!user) {
    user = new Person(vm.attr('person'));
  }
  return user.getTasksCount()
    .then(function (results) {
      vm.attr('tasksAmount', results.open_task_count);
      vm.attr('hasOverdue', results.has_overdue);
    });
}
