'use strict';

var inherits = require('inherits');

var assign = require('lodash/object/assign');

var CommandInterceptor = require('diagram-js/lib/command/CommandInterceptor');

var is = require('../../../util/ModelUtil').is;

var asTRBL = require('diagram-js/lib/layout/LayoutUtil').asTRBL;


function getPosition(lane) {
  return (lane.y + lane.height) / 2;
}

function getLaneSiblings(laneShape) {
  return laneShape.parent.children.filter(function(e) {
    return e !== laneShape && is(e, 'bpmn:Lane');
  });
}

function positionAsc(a, b) {
  return getPosition(a) > getPosition(b);
}

function getPreviousLanes(laneShape, siblingLanes) {
  var lanePosition = getPosition(laneShape);

  var siblings = siblingLanes.filter(function(e) {
    return getPosition(e) < lanePosition;
  });

  siblings.sort(positionAsc);

  return siblings;
}


function getNextLanes(laneShape, siblingLanes) {
  var lanePosition = getPosition(laneShape);

  var siblings = siblingLanes.filter(function(e) {
    return getPosition(e) > lanePosition;
  });

  siblings.sort(positionAsc);

  return siblings;
}


function getChildLanes(laneShape) {

  var siblings = laneShape.children.filter(function(e) {
    return is(e, 'bpmn:Lane');
  });

  siblings.sort(positionAsc);

  return siblings;
}

function getResizeTRBL(oldBounds, newBounds) {

  var oldTRBL = asTRBL(oldBounds),
      newTRBL = asTRBL(newBounds);

  return {
    top: newTRBL.top - oldTRBL.top,
    right: newTRBL.right - oldTRBL.right,
    bottom: newTRBL.bottom - oldTRBL.bottom,
    left: newTRBL.left - oldTRBL.left,
  };

}

function LayoutParticipantBehavior(eventBus, modeling) {

  CommandInterceptor.call(this, eventBus);

  this._modeling = modeling;

  var self = this;

  /**
   * Hook into shape resize and layout a participant if
   * a lane or the participant got resized.
   */
  this.postExecute('shape.resize', function(event) {

    var context = event.context,
        shape = context.shape,
        oldBounds = context.oldBounds,
        hints = context.hints;

    if (is(shape, 'bpmn:Lane') || is(shape, 'bpmn:Participant')) {
      self.layoutElement(shape, getResizeTRBL(oldBounds, shape), hints);
    }
  });

}

inherits(LayoutParticipantBehavior, CommandInterceptor);

LayoutParticipantBehavior.$inject = [ 'eventBus', 'modeling' ];

module.exports = LayoutParticipantBehavior;

var resizeTRBL = require('diagram-js/lib/features/resize/ResizeUtil').resizeTRBL;

/**
 * Layout the participant a given element belongs to.
 *
 * @param {djs.model.Shape} element
 * @param {TRBL} trblResize
 * @param {Object} hints
 */
LayoutParticipantBehavior.prototype.layoutElement = function(shape, trblResize, hints) {

  if (hints.recurse !== false)  {

    // spread out to layout sibling lanes
    if (is(shape, 'bpmn:Lane')) {
      this.layoutSiblings(shape, trblResize);
    }

    // bubble up to parents
    this.layoutParent(shape, trblResize);

    // recurse into children
    this.layoutChildren(shape, trblResize);
  }

};

LayoutParticipantBehavior.prototype.moveSiblings = function(siblings, delta) {
  this._modeling.moveElements(siblings, delta);
};

LayoutParticipantBehavior.prototype.layoutChildren = function(shape, trblResize) {

  var childLanes = getChildLanes(shape);
  var childLane;

  var resizeLanes;


  if (trblResize.top) {
    childLane = childLanes[0];
  }

  if (trblResize.bottom) {
    childLane = childLanes[childLanes.length - 1];
  }

  if (childLane) {
    this._modeling.resizeShape(childLane, resizeTRBL(childLane, trblResize), { recurse: false });

    // recurse into children
    this.layoutChildren(childLane, trblResize);

    resizeLanes = getLaneSiblings(childLane);
  } else {
    resizeLanes = childLanes;
  }

  // resize siblings
  if (trblResize.left || trblResize.right) {
    this.resizeSiblings(resizeLanes, assign({}, trblResize, { top: 0, bottom: 0 }));
  }
};

LayoutParticipantBehavior.prototype.layoutParent = function(shape, trblResize) {

  var parentShape = shape.parent;

  if (is(parentShape, 'bpmn:Lane') || is(parentShape, 'bpmn:Participant')) {
    this._modeling.resizeShape(parentShape, resizeTRBL(parentShape, trblResize), { recurse: false });

    this.layoutSiblings(parentShape, trblResize);

    // recurse into parents
    this.layoutParent(parentShape, trblResize);
  }
};

LayoutParticipantBehavior.prototype.layoutSiblings = function(shape, trblResize) {

  var allSiblingLanes = getLaneSiblings(shape),
      previousLanes = getPreviousLanes(shape, allSiblingLanes),
      nextLanes = getNextLanes(shape, allSiblingLanes);

  if (trblResize.left || trblResize.right) {
    this.resizeSiblings(allSiblingLanes, assign({}, trblResize, { top: 0, bottom: 0 }));
  }

  if (trblResize.top && previousLanes.length) {
    this.moveSiblings(previousLanes, { x: 0, y: trblResize.top });
  }

  if (trblResize.bottom && nextLanes.length) {
    this.moveSiblings(nextLanes, { x: 0, y: trblResize.bottom });
  }
};


LayoutParticipantBehavior.prototype.resizeSiblings = function(siblingShapes, trblResize) {

  siblingShapes.forEach(function(siblingShape) {
    this.horizontalResizeElement(siblingShape, trblResize);
  }, this);
};


LayoutParticipantBehavior.prototype.horizontalResizeElement = function(shape, trblResize) {

  var modeling = this._modeling;

  modeling.resizeShape(shape, resizeTRBL(shape, trblResize), { recurse: false });

  // recurse into children
  getChildLanes(shape).forEach(function(childLane) {
    this.horizontalResizeElement(childLane, trblResize);
  }, this);
};