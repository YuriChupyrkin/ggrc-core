/*
 Copyright (C) 2019 Google Inc., authors, and contributors
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import loLast from 'lodash/last';
import CanMap from 'can-map';
import CanComponent from 'can-component';
export default CanComponent.extend({
  tag: 'snapshot-comparer-config',
  leakScope: true,
  viewModel: CanMap.extend({
    define: {
      rightRevision: {
        get() {
          return loLast(this.attr('rightRevisions'));
        },
      },
    },
    instance: {},
    leftRevisionId: '',
    rightRevisions: [],
    modalTitle: 'Compare with the latest version',
    modalConfirm: 'Update',
    buttonView: `${GGRC.templates_path}/modals/prompt_buttons.stache`,
  }),
});
