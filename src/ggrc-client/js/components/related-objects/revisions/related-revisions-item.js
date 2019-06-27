/*
 Copyright (C) 2019 Google Inc., authors, and contributors
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import CanStache from 'can-stache';
import CanMap from 'can-map';
import CanComponent from 'can-component';
import '../../diff/instance-fields-diff';
import '../../diff/instance-acl-diff';
import '../../diff/instance-gca-diff';
import '../../diff/instance-mapping-fields-diff';
import '../../diff/instance-list-fields-diff';
import '../../revision-history/restored-revision-comparer-config';
import {getPersonInfo} from '../../../plugins/utils/user-utils';
import template from './templates/related-revisions-item.stache';

export default CanComponent.extend({
  tag: 'related-revisions-item',
  view: CanStache(template),
  leakScope: true,
  viewModel: CanMap.extend({
    define: {
      revision: {
        set(newValue) {
          if (!newValue) {
            return this.attr('revision');
          }

          getPersonInfo(newValue.modified_by).then((person) => {
            this.attr('modifiedBy', person);
          });

          return newValue;
        },
      },
      isCreated: {
        get() {
          return this.attr('revision.action') === 'created';
        },
      },
    },
    instance: {},
    modifiedBy: {},
    lastRevision: {},
  }),
});
