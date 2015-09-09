'use strict';

var TestHelper = require('../../../../TestHelper');

/* global bootstrapModeler, inject */


var modelingModule = require('../../../../../lib/features/modeling'),
    bpmnSnappingModule = require('../../../../../lib/features/snapping'),
    resizeModule = require('diagram-js/lib/features/resize'),
    coreModule = require('../../../../../lib/core');


var resizeTRBL = require('diagram-js/lib/features/resize/ResizeUtil').resizeTRBL;


describe('features/modeling - layout participant', function() {


  describe('should layout after resizing lanes', function() {

    var diagramXML = require('./lanes.bpmn');

    var testModules = [ coreModule, resizeModule, bpmnSnappingModule, modelingModule ];

    beforeEach(bootstrapModeler(diagramXML, { modules: testModules }));


    it.only('execute', inject(function(elementRegistry, modeling) {

      // given
      var laneShape = elementRegistry.get('Lane_A'),
          participantShape = elementRegistry.get('Participant_Lane');

      var newLaneBounds = resizeTRBL(laneShape, { bottom: 50 });

      var expectedParticipantBounds = resizeTRBL(participantShape, { bottom: 50 });


      // when
      modeling.resizeShape(laneShape, newLaneBounds);

      // then
      expect(participantShape).to.have.bounds(expectedParticipantBounds);
    }));

  });

});
