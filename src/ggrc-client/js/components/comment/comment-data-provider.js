/*
 Copyright (C) 2019 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canMap from 'can-map';
import canComponent from 'can-component';
import {loadComments} from '../../plugins/utils/comments-utils';
import {
  REFRESH_COMMENTS,
  REFRESH_MAPPED_COUNTER,
} from '../../events/eventTypes';
import Relationship from '../../models/service-models/relationship';
import Context from '../../models/service-models/context';

export default canComponent.extend({
  tag: 'comment-data-provider',
  leakScope: true,
  viewModel: canMap.extend({
    define: {
      commentObjectName: {
        get() {
          return this.attr('instance').constructor.isChangeableExternally
            ? 'ExternalComment'
            : 'Comment';
        },
      },
    },
    instance: null,
    comments: [],
    pageSize: 10,
    totalCount: 0,
    newCommentsCount: 0,
    isLoading: false,
    hideComments() {
      // remain only first comments
      this.attr('comments').splice(this.attr('pageSize'));
    },
    async loadMoreComments(startIndex) {
      this.attr('isLoading', true);

      let instance = this.attr('instance');
      let modelName = this.attr('commentObjectName');
      let index = startIndex || this.attr('comments').length;
      let pageSize = this.attr('pageSize');

      try {
        let response = await loadComments(instance, modelName, index, pageSize);
        let {values: comments, total} = response[modelName];

        let totalCount = this.attr('totalCount');
        if (totalCount !== total) {
          // new comments were added by other users
          let newCommentsCount = total - totalCount;
          await Promise.all([
            loadFirstComments(this, newCommentsCount),
            this.loadMoreComments(index + newCommentsCount)]);
        } else {
          this.attr('comments').push(...comments);
        }
      } finally {
        this.attr('isLoading', false);
      }
    },
    addComment(event) {
      let newComment = event.items[0];
      return this.attr('comments').unshift(newComment);
    },
    processComment(event) {
      if (event.success) {
        this.attr('totalCount', this.attr('totalCount') + 1);
        this.attr('newCommentsCount', this.attr('newCommentsCount') + 1);

        mapToInstance(this, event.item).then(() => {
          const instance = this.attr('instance');
          instance.dispatch({
            ...REFRESH_MAPPED_COUNTER,
            modelType: 'Comment',
          });
          instance.refresh();
        });
      } else {
        removeComment(this, event.item);
      }
    },
  }),
  async init() {
    this.viewModel.attr('isLoading', true);
    try {
      await loadFirstComments(this.viewModel);
    } finally {
      this.viewModel.attr('isLoading', false);
    }
  },
  events: {
    [`{viewModel.instance} ${REFRESH_COMMENTS.type}`]() {
      this.viewModel.attr('comments').replace([]);
      loadFirstComments(this.viewModel);
    },
  },
});

async function loadFirstComments(vm, count) {
  let instance = vm.attr('instance');
  let modelName = vm.attr('commentObjectName');
  let newCommentsCount = vm.attr('newCommentsCount');

  // load more comments as they can be added by other users before or after current user's new comments
  let pageSize = (count || vm.attr('pageSize')) + newCommentsCount;

  let response = await loadComments(instance, modelName, 0, pageSize);
  let {values: comments, total} = response[modelName];

  vm.attr('comments').splice(0, newCommentsCount);
  vm.attr('comments').unshift(...comments);

  vm.attr('totalCount', total);
  vm.attr('newCommentsCount', 0);
}

function removeComment(vm, commentToRemove) {
  let comments = vm.attr('comments');
  comments.replace(comments.filter((comment) => {
    return comment !== commentToRemove;
  }));
}

function mapToInstance(vm, comment) {
  return (new Relationship({
    context: vm.attr('instance.context') || new Context({id: null}),
    source: vm.attr('instance'),
    destination: comment,
  }))
    .save()
    .fail(() => {
      removeComment(vm, comment);
    });
}
