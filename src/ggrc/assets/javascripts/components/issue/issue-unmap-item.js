/*!
    Copyright (C) 2017 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

(function (can, GGRC) {
  'use strict';


  GGRC.Components('issueUnmapItem', {
    tag: 'issue-unmap-item',
    template: '{{#if canUnmap}}<content></content>{{/if}}',
    viewModel: {
      issueInstance: {},
      target: {},
      canUnmap: function () {
        return GGRC.Utils.allowed_to_map(this.attr('issueInstance'),
          this.attr('target'), {}, true);
      },
      unmap: function () {
        if (this.attr('target.type') === 'Audit' &&
          !this.attr('issueInstance.allow_unmap_from_audit')) {
            console.error('allow_unmap_from_audit!!!!');
            // todo: show banner with list of snapshots and assessments
            return;
        }

        this.dispatch('unmapIssue');
      }
    },
    events: {
      click: function (el, ev) {
        this.viewModel.unmap();
        ev.preventDefault();
      }
    }
  });
})(window.can, window.GGRC);
