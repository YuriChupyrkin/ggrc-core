/*
 Copyright (C) 2017 Google Inc., authors, and contributors
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import DiffBaseVM from './diff-base-vm';
const tag = 'instance-gca-diff';

const viewModel = DiffBaseVM.extend({
  modifiedAttributes: {},
  _customAttributesValues: [],

  prepareAttributes() {
    const values = this.attr('currentInstance.custom_attribute_values')
      .map((value) => value.reify());

    this.attr('_customAttributesValues', values);
  },
  buildDiffObject() {
    const modifiedAttributes = this.attr('modifiedAttributes');
    const caKeys = can.Map.keys(modifiedAttributes);
    let diff = [];
    this.prepareAttributes();


    diff = caKeys.map((attrId) => {
      const attr = this.getValueAndDefinition(attrId);
      const modifiedAttr = modifiedAttributes[attrId];

      // attr was deleted
      if (!attr.def) {
        return;
      }

      if (attr.def.attribute_type === 'Map:Person') {
        return this.buildPersonDiff(modifiedAttr, attr);
      }

      return this.buildAttributeDiff(modifiedAttr, attr);
    })
    .filter((diffItem) => !!diffItem);

    this.attr('diff', diff);
  },
  buildAttributeDiff(modifiedAttr, currentAttr) {
    const value = currentAttr.value;
    const def = currentAttr.def;
    let modifiedVal = this.attr('emptyValue');
    let currentVal = this.attr('emptyValue');

    if (value) {
      currentVal = this
        .convertValue(value.attribute_value, def.attribute_type);
    }

    if (modifiedAttr && modifiedAttr.attribute_value) {
      modifiedVal = this
        .convertValue(modifiedAttr.attribute_value, def.attribute_type);
    }

    return {
      attrName: def.title,
      currentVal: currentVal,
      modifiedVal: modifiedVal,
    };
  },
  buildPersonDiff(modifiedAttr, currentAttr) {
    const val = currentAttr.value;
    const def = currentAttr.def;
    let modifiedPersonEmail = this.attr('emptyValue');
    let currentPersonEmail = this.attr('emptyValue');

    // value is empty. Attr filled first time
    if (val && val.attribute_object) {
      currentPersonEmail = this.loadPerson(val.attribute_object.id).email;
    }

    if (modifiedAttr.attribute_object) {
      modifiedPersonEmail = modifiedAttr.attribute_object.email;
    }

    return {
      attrName: def.title,
      currentVal: currentPersonEmail,
      modifiedVal: modifiedPersonEmail,
    };
  },
  loadPerson(personId) {
    return CMS.Models.Person.store[personId];
  },
  convertValue(value, type) {
    if (!value) {
      return this.attr('emptyValue');
    }

    switch (type) {
      case 'Date':
        return GGRC.Utils.formatDate(value, true);
      case 'Checkbox':
        return value === true || value === '1' ?
          '✓' :
          this.attr('emptyValue');
      default:
        return value;
    }
  },
  getValueAndDefinition(attrId) {
    const instance = this.attr('currentInstance');
    const value = this.attr('_customAttributesValues').attr()
      .find((val) => val.custom_attribute_id == attrId);
    const definition = instance.attr('custom_attribute_definitions').attr()
      .find((def) => def.id == attrId);

    return {
      value: value,
      def: definition,
    };
  },
});

export default can.Component.extend({
  tag,
  viewModel: viewModel,
  events: {
    inserted() {
      const instance = this.viewModel.attr('currentInstance');
      const modifiedCA = this.viewModel.attr('modifiedAttributes');
      if (!modifiedCA || !instance) {
        return;
      }
      this.viewModel.buildDiffObject();
    },
  },
});
