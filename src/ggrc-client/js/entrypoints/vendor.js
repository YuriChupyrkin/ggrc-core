/*
   Copyright (C) 2019 Google Inc.
   Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import 'jquery';
import 'lodash';
import 'components-jqueryui/ui/widgets/autocomplete';
import 'components-jqueryui/ui/widgets/datepicker';
import 'components-jqueryui/ui/widgets/draggable';
import 'components-jqueryui/ui/widgets/droppable';
import 'components-jqueryui/ui/widgets/resizable';
import 'components-jqueryui/ui/widgets/sortable';
import 'components-jqueryui/ui/widgets/tooltip';
import 'bootstrap/js/bootstrap-alert.js';
import 'bootstrap/js/bootstrap-collapse.js';
import 'bootstrap/js/bootstrap-dropdown.js';
import 'bootstrap/js/bootstrap-modal.js';
import 'bootstrap/js/bootstrap-tab.js';
import 'bootstrap/js/bootstrap-tooltip.js';
import 'bootstrap/js/bootstrap-popover.js';
import 'clipboard';
import 'canjs/amd/can';
import 'can/construct/super';
import 'can/construct/proxy';
import 'can/control/plugin';
import 'can/list/sort';
import 'can/map/attributes';
import 'can/map/backup';
import 'can/map/validations';
import 'can/view/stache';
import 'moment';
import 'moment-timezone/builds/moment-timezone-with-data.min';
import 'spin.js';
import 'jquery/jquery-ui.css';
import 'quill/dist/quill.core.css';
import 'quill/dist/quill.snow.css';

/* canjs v3 */
import canControl3 from 'can-control';
//can.Control = canControl3;

// import 'can-validate-legacy/map/validate/validate';
// import 'can-validate-legacy/shims/validatejs';
// import 'can-map-define';
import 'can-construct-super';

function addControlPlugin () {
  let makeArray = can.makeArray;

  canControl3.prototype._ifNotRemoved = function (fn) {
    let isPresent = this.element;
    return function () {
      return isPresent ? fn.apply(this, arguments) : null;
    };
  },

  canControl3.initElement = function (ctrlInstance) {
    const $el = $(ctrlInstance.element);
    ctrlInstance.$element = $el;
    if (!$el.data('controls') || !$el.data('controls').length) {
      $el.data('controls', [ctrlInstance]);
    } else {
      $el.data('controls').push(ctrlInstance);
    }
  };

  $.fn.extend({

    /*
    * @function jQuery.fn.controls jQuery.fn.controls
    * @parent can.Control.plugin
    * @description Get the Controls associated with elements.
    * @signature `jQuery.fn.controls([type])`
    * @param {String|can.Control} [control] The type of Controls to find.
    * @return {can.Control} The controls associated with the given elements.
    *
    * @body
    * When the widget is initialized, the plugin control creates an array
    * of control instance(s) with the DOM element it was initialized on using
    * [can.data] method.
    *
    * The `controls` method allows you to get the control instance(s) for any element
    * either by their type or pluginName.
    *
    *      var MyBox = can.Control({
    *          pluginName : 'myBox'
    *      }, {});
    *
    *      var MyClock = can.Control({
    *          pluginName : 'myClock'
    *      }, {});
    *
    *
    * //- Inits the widgets
        * $('.widgets:eq(0)').myBox();
        * $('.widgets:eq(1)').myClock();
        *
        * $('.widgets').controls() //-> [ MyBox, MyClock ]
        *     $('.widgets').controls('myBox') // -> [MyBox]
        *     $('.widgets').controls(MyClock) // -> MyClock
        *
        */
    controls: function () {
      let controllerNames = makeArray(arguments);
      let instances = [];
      let controls;
      // check if arguments
      this.each(function () {
        controls = $(this).data('controls');
        if (!controls) {
          return;
        }
        for (let i = 0; i < controls.length; i++) {
          let c = controls[i];
          if (!controllerNames.length || isAControllerOf(c, controllerNames)) {
            instances.push(c);
          }
        }
      });
      return instances;
    },

    /*
     * @function jQuery.fn.control jQuery.fn.control
     * @parent can.Control.plugin
     * @description Get the Control associated with elements.
     * @signature `jQuery.fn.control([type])`
     * @param {String|can.Control} [control] The type of Control to find.
     * @return {can.Control} The first control found.
     *
     * @body
     * This is the same as [jQuery.fn.controls $().controls] except that
     * it only returns the first Control found.
     *
     * //- Init MyBox widget
        * $('.widgets').my_box();
        *
        * <div class="widgets my_box" />
        *
        * $('.widgets').controls() //-> MyBox
        */
    control: function (control) {
      return this.controls.apply(this, arguments)[0];
    },
  });

  return can;
}

addControlPlugin();
