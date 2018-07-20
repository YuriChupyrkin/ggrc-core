/*
    Copyright (C) 2018 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import * as workflowHelpers from '../../utils/workflow-utils';
import {
  makeFakeInstance,
  makeFakeModel,
} from '../../../../js_specs/spec_helpers';

describe('Workflow helpers', () => {
  describe('createCycle() method', () => {
    describe('returns cycle instance which contains', () => {
      let workflow;
      let originalCycleModel;

      beforeAll(function () {
        originalCycleModel = CMS.Models.Cycle;
      });

      afterAll(function () {
        CMS.Models.Cycle = originalCycleModel;
      });

      beforeEach(function () {
        CMS.Models.Cycle = makeFakeModel({model: CMS.Models.Cycle});
        workflow = makeFakeInstance({model: CMS.Models.Workflow})();
        workflow.context = {
          stub: jasmine.createSpy('stub'),
        };
      });

      it('context equals to workflow context stub object', function () {
        const stubType = 'Context';
        const origContextModel = CMS.Models[stubType];
        CMS.Models[stubType] = makeFakeModel({model: CMS.Models[stubType]});
        const stub = {
          id: 123,
          type: 'Context',
        };
        let context;
        workflow.context.stub.and.returnValue(stub);
        context = workflowHelpers
          .createCycle(workflow)
          .attr('context');
        expect(context.attr()).toEqual(stub);
        CMS.Models[stubType] = origContextModel;
      });

      it('workflow equals to workflow stub object', function () {
        const stubType = 'Workflow';
        const origContextModel = CMS.Models[stubType];
        CMS.Models[stubType] = makeFakeModel({model: CMS.Models[stubType]});
        const stub = {
          id: 123,
          type: stubType,
        };
        let wfStub;
        workflow.attr('id', stub.id);
        wfStub = workflowHelpers
          .createCycle(workflow)
          .attr('workflow');
        expect(wfStub.attr()).toEqual(stub);
        CMS.Models[stubType] = origContextModel;
      });

      it('autogenerate property equals to true', function () {
        const {autogenerate} = workflowHelpers.createCycle(workflow);
        expect(autogenerate).toBe(true);
      });
    });
  });

  describe('updateStatus() method', () => {
    let instance;
    let actualizedInstance;

    beforeEach(function () {
      actualizedInstance = new can.Map({
        save: jasmine.createSpy('save'),
      });
      instance = new can.Map({
        actualize: jasmine.createSpy('actualize')
          .and.returnValue(actualizedInstance),
      });
    });

    it('actualizes passed instance', async function (done) {
      await workflowHelpers.updateStatus(instance);
      expect(instance.actualize).toHaveBeenCalled();
      done();
    });

    it('sets passed status for actualized instance before saving',
      async function (done) {
        const status = 'New Status';
        spyOn(actualizedInstance, 'attr');
        await workflowHelpers.updateStatus(instance, status);
        expect(actualizedInstance.attr).toHaveBeenCalledWith('status', status);
        expect(actualizedInstance.attr).toHaveBeenCalledBefore(
          actualizedInstance.save
        );
        done();
      });

    it('returns saved instance', async function (done) {
      const saved = {};
      actualizedInstance.save.and.returnValue(saved);
      const result = await workflowHelpers.updateStatus(instance);
      expect(result).toBe(saved);
      done();
    });
  });
});
