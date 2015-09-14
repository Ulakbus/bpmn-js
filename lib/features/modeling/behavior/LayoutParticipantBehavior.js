'use strict';

var inherits = require('inherits');

var assign = require('lodash/object/assign'),
    omit = require('lodash/object/omit'),
    pick = require('lodash/object/pick');

var first = require('lodash/array/first'),
    last = require('lodash/array/last');

var CommandInterceptor = require('diagram-js/lib/command/CommandInterceptor');

var is = require('../../../util/ModelUtil').is;

var getParent = require('../ModelingUtil').getParent;

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

      // do not recurse into participant / lane layouting
      if (hints.recurse === false) {
        return;
      }

      self.layoutElement(shape, getResizeTRBL(oldBounds, shape));

      // ensure we save the layouted/resized participant
      // so we can later update the lane refs
      context.laneRefsChanged = shape;
    }
  });


  /**
   * Update lane refs after participant layout / flow node move.
   */
  this.postExecuted('shape.resize', function(event) {

    var context = event.context,
        laneRefsChanged = context.laneRefsChanged,
        particiantShape;

    if (laneRefsChanged) {

      if (is(laneRefsChanged, 'bpmn:Participant')) {
        particiantShape = laneRefsChanged;
      } else {
        particiantShape = getParent(laneRefsChanged, [ 'bpmn:Participant' ]);
      }

      modeling.updateLaneRefs(particiantShape);
    }
  });

  this.postExecuted('elements.move', function(event) {


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
 */
LayoutParticipantBehavior.prototype.layoutElement = function(shape, trblResize) {

  // recurse into children
  this.layoutChildren(shape, trblResize);

  // spread out to layout sibling lanes
  if (is(shape, 'bpmn:Lane')) {
    trblResize = this.layoutSiblings(shape, trblResize);
  }

  // bubble up to parents
  this.layoutParent(shape, trblResize);

};

LayoutParticipantBehavior.prototype.layoutChildren = function(shape, trblResize) {

  var childLanes = getChildLanes(shape);
  var childLane;

  var resizeLanes;


  if (trblResize.top) {
    childLane = first(childLanes);
  }

  if (trblResize.bottom) {
    childLane = last(childLanes);
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
    this.resizeSiblings(resizeLanes, omit(trblResize, [ 'top', 'bottom' ]));
  }
};

LayoutParticipantBehavior.prototype.layoutParent = function(shape, trblResize) {

  var parentShape = shape.parent;

  if (is(parentShape, 'bpmn:Lane') || is(parentShape, 'bpmn:Participant')) {
    this._modeling.resizeShape(parentShape, resizeTRBL(parentShape, trblResize), { recurse: false });

    trblResize = this.layoutSiblings(parentShape, trblResize);

    // recurse into parents
    this.layoutParent(parentShape, trblResize);
  }
};

LayoutParticipantBehavior.prototype.layoutSiblings = function(shape, trblResize) {

  var allSiblingLanes = getLaneSiblings(shape),
      previousLanes = getPreviousLanes(shape, allSiblingLanes),
      nextLanes = getNextLanes(shape, allSiblingLanes);

  // TODO(nre): layout in vertical modeling
  if (trblResize.left || trblResize.right) {
    this.resizeSiblings(allSiblingLanes, assign({}, trblResize, { top: 0, bottom: 0 }));
  }

  if (trblResize.top && previousLanes.length) {
    this.resizeElement(last(previousLanes), { bottom: trblResize.top });

    // no need to compensate for top resize anymore
    trblResize = omit(trblResize, 'top');
  }

  if (trblResize.bottom && nextLanes.length) {
    this.resizeElement(first(nextLanes), { top: trblResize.bottom });

    // no need to compensate for bottom resize anymore
    trblResize = omit(trblResize, 'bottom');
  }

  return trblResize;
};


LayoutParticipantBehavior.prototype.resizeSiblings = function(siblingShapes, trblResize) {

  siblingShapes.forEach(function(siblingShape) {
    this.resizeElement(siblingShape, trblResize);
  }, this);
};


LayoutParticipantBehavior.prototype.resizeElement = function(shape, trblResize) {

  var modeling = this._modeling;

  modeling.resizeShape(shape, resizeTRBL(shape, trblResize), { recurse: false });

  var childLanes = getChildLanes(shape);

  if (childLanes.length) {
    if (trblResize.top) {
      this.resizeElement(first(childLanes), pick(trblResize, 'top'));
    }

    if (trblResize.bottom) {
      this.resizeElement(last(childLanes), pick(trblResize, 'bottom'));
    }
  }

  var horizontalTrblResize = pick(trblResize, [ 'left', 'right' ]);

  // recurse into children
  childLanes.forEach(function(childLane) {
    this.resizeElement(childLane, horizontalTrblResize);
  }, this);
};