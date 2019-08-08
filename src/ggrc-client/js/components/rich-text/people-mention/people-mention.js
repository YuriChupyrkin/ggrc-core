/*
  Copyright (C) 2019 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import '../../people-autocomplete/people-autocomplete-wrapper/people-autocomplete-wrapper';

import template from './people-mention.stache';
import {KEY_MAP} from '../../custom-autocomplete/autocomplete-input';

const MENTION_REGEX = {
  BEFORE_SELECTION: /(^.*[\s]|^)[@+]([\S]*)$/s,
  AFTER_SELECTION: /(^\S*|^)@?\S*\.?\S+\s?/s,
};

/**
 * Supporting component for rich-text to handle mentions of people
 */
export default canComponent.extend({
  tag: 'people-mention',
  view: canStache(template),
  leakScope: false,
  viewModel: canMap.extend({
    define: {
      editor: {
        set(editor) {
          if (editor) {
            editor.on('text-change', this.onChange.bind(this));

            editor.keyboard.addBinding({key: KEY_MAP.ESCAPE},
              onEscapeKey.bind(this));
            editor.keyboard.addBinding({key: KEY_MAP.ARROW_DOWN},
              onActionKey.bind(this, KEY_MAP.ARROW_DOWN));
            editor.keyboard.addBinding({key: KEY_MAP.ARROW_UP},
              onActionKey.bind(this, KEY_MAP.ARROW_UP));

            // This is hacky way to add key binding.
            // We need to do this because there is default handlers
            // which prevents event propagation in new handlers.
            editor.keyboard.bindings[KEY_MAP.ENTER].unshift({
              key: KEY_MAP.ENTER,
              handler: onActionKey.bind(this, KEY_MAP.ENTER),
            });
          }
          return editor;
        },
      },
    },
    // two way bound attribute to child components
    // to define if "results" is shown.
    showResults: false,
    mentionBeforeSelection: null,
    mentionAfterSelection: null,
    mentionIndex: null,
    actionKey: null,
    onChange() {
      const editor = this.attr('editor');
      const selection = editor.getSelection();
      if (!selection) {
        // on mention insert focus is lost
        return;
      }

      const selectionIndex = selection.index;
      const editorText = editor.getText();
      const textBeforeSelection = editorText.substring(0, selectionIndex);
      const textAfterSelection = editorText.substring(selectionIndex);

      const mentionsBeforeSelection =
        MENTION_REGEX.BEFORE_SELECTION.exec(textBeforeSelection);
      const mentionsAfterSelection =
        MENTION_REGEX.AFTER_SELECTION.exec(textAfterSelection);
      if (mentionsBeforeSelection) {
        const textBeforeMention = mentionsBeforeSelection[1];
        const mentionBeforeSelection = mentionsBeforeSelection[2];
        const mentionAfterSelection =
          mentionsAfterSelection && mentionsAfterSelection[0] || '';

        this.attr('mentionBeforeSelection', mentionBeforeSelection);
        this.attr('mentionAfterSelection', mentionAfterSelection);
        this.attr('mentionIndex', textBeforeMention.length);
      } else {
        clearMention(this);
      }
    },
    personSelected({item}) {
      const mentionValueLength =
        this.attr('mentionBeforeSelection').length +
        this.attr('mentionAfterSelection').length + 1;
      const link = `mailto:${item.email}`;
      const retainLength = this.attr('mentionIndex');
      const retain = retainLength ? [{retain: retainLength}] : [];
      const mention = `+${item.email}`;
      const ops = [
        ...retain,
        {'delete': mentionValueLength},
        {insert: mention, attributes: {link}},
        {insert: ' '},
      ];

      const editor = this.attr('editor');
      editor.updateContents({ops});
      editor.setSelection(retainLength + mention.length + 1);
      clearMention(this);
    },
  }),
  events: {
    '{window} click'() {
      clearMention(this.viewModel);
    },
  },
});

function clearMention(vm) {
  vm.attr('mentionBeforeSelection', null);
  vm.attr('mentionAfterSelection', null);
  vm.attr('mentionIndex', null);
}

function onActionKey(keyCode) {
  if (this.attr('showResults')) {
    // trigger setter of 'actionKey'
    this.attr('actionKey', keyCode);
    // reset 'actionKey'
    this.attr('actionKey', null);
    // prevent default behavior
    return false;
  }
  return true;
}

function onEscapeKey() {
  if (this.attr('showResults')) {
    clearMention(this);
    return false;
  }
  return true;
}
