'use strict';

var getParent = require('./ModelingUtil').getParent;


function getContainments(laneShape) {

  var lane = laneShape.businessObject;

  var flowNodeRefs = lane.get('flowNodeRef');

  var laneParent = getParent(laneShape, [ 'bpmn:Process', 'bpmn:Participant' ]);

  var parentChildren = laneParent.children;

  var laneRefs = parentChildren.filter(function(c) {
    var bo = c.businessObject;

    return flowNodeRefs.indexOf(bo) !== -1;
  });

  return {
    parentChildren: parentChildren,
    laneRefs: laneRefs
  };
}

module.exports.getContainments = getContainments;