'use strict';

var TestHelper = require('../../../../TestHelper');

/* global bootstrapModeler, inject */


var modelingModule = require('../../../../../lib/features/modeling'),
    coreModule = require('../../../../../lib/core');


var resizeTRBL = require('diagram-js/lib/features/resize/ResizeUtil').resizeTRBL;


describe.only('features/modeling - layout participant', function() {


  describe('should layout after resizing lanes', function() {

    var diagramXML = require('./lanes.bpmn');

    var testModules = [ coreModule, modelingModule ];

    beforeEach(bootstrapModeler(diagramXML, { modules: testModules }));


    it('execute', inject(function(elementRegistry, modeling) {

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
