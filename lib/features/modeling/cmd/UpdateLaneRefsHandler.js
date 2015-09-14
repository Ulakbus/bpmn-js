'use strict';

var Collections = require('diagram-js/lib/util/Collections');


function UpdateLaneRefsHandler(elementRegistry) { }

UpdateLaneRefsHandler.$inject = [ 'canvas', 'modeling' ];

module.exports = UpdateLaneRefsHandler;


UpdateLaneRefsHandler.prototype.execute = function(context) {
  console.log('UPDATE LANE REFS', context);
};

UpdateLaneRefsHandler.prototype.revert = function(context) {
  console.log('REVERT UPDATE LANE REFS', context);
};