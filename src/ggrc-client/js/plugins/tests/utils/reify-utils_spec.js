/*
 Copyright (C) 2019 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import CanModel from 'can-model';
import CanList from 'can-list';
import CanMap from 'can-map';
import * as ReifyUtils from '../../utils/reify-utils';
import Audit from '../../../models/business-models/audit';
import {makeFakeInstance} from '../../../../js_specs/spec_helpers';

describe('reify-utils', () => {
  describe('reify() method', () => {
    it('should return passed obj when it is CanModel', () => {
      const obj = new CanModel({});
      const model = ReifyUtils.reify(obj);

      expect(model).toBe(obj);
    });

    it(`should return CanList with instances of required model
      when passed object is CanList`, () => {
      const objs = new CanList([]);
      const audits = new CanList([]);

      for (let i = 0; i < 3; i++) {
        objs.push(new CanMap({type: 'Audit', id: i}));
        audits.push(makeFakeInstance({model: Audit})(
          {id: i, data: `Test data ${i}`})
        );
      }

      spyOn(Audit, 'model').and.returnValues(...audits);

      const result = ReifyUtils.reify(objs);

      expect(result.serialize()).toEqual(audits.serialize());
    });

    it(`should return CanModel's instance
      when passed object is CanMap`, () => {
      const obj = new CanMap({type: 'Audit', id: 1});
      const audit = makeFakeInstance({model: Audit})(
        {id: 1, data: 'Test data'}
      );

      spyOn(Audit, 'model').and.returnValue(audit);

      const result = ReifyUtils.reify(obj);

      expect(result.serialize()).toEqual(audit.serialize());
    });
  });

  describe('isReifiable() method', () => {
    it('should return true when obj is the instance of CanMap', () => {
      const obj = new CanModel({});
      const result = ReifyUtils.isReifiable(obj);

      expect(result).toBe(true);
    });
  });

  describe('reifyMap() method', () => {
    it('should call console.warn when model is unrecognized type', () => {
      const obj = new CanMap({type: 'Object'});
      spyOn(console, 'warn');

      ReifyUtils.reifyMap(obj);

      expect(console.warn).toHaveBeenCalled();
    });

    it('should return instance CanModel when model is recognized type', () => {
      const obj = new CanMap({type: 'Audit', id: 1});
      const audit = makeFakeInstance({model: Audit})(
        {id: 1, data: 'Test data'}
      );

      spyOn(Audit, 'model').and.returnValue(audit);

      const result = ReifyUtils.reifyMap(obj);

      expect(result.serialize()).toEqual((audit.serialize()));
    });
  });

  describe('reifyList() method', () => {
    it('should return instance CanList with models', () => {
      const objs = new CanList([]);
      const audits = new CanList([]);

      for (let i = 0; i < 3; i++) {
        objs.push(new CanMap({type: 'Audit', id: i}));
        audits.push(makeFakeInstance({model: Audit})(
          {id: i, data: `Test data ${i}`}
        ));
      }

      spyOn(Audit, 'model').and.returnValues(...audits);

      const result = ReifyUtils.reifyList(objs);

      expect(result.serialize()).toEqual(audits.serialize());
    });
  });
});
