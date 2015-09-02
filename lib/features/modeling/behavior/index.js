module.exports = {
  __init__: [
    'appendBehavior',
    'createBoundaryEventBehavior',
    'createLaneBehavior',
    'createOnFlowBehavior',
    'createParticipantBehavior',
    'layoutParticipantBehavior',
    'modelingFeedback',
    'moveStartEventBehavior',
    'removeParticipantBehavior',
    'replaceConnectionBehavior'
  ],
  appendBehavior: [ 'type', require('./AppendBehavior') ],
  createBoundaryEventBehavior: [ 'type', require('./CreateBoundaryEventBehavior') ],
  createLaneBehavior: [ 'type', require('./CreateLaneBehavior') ],
  createOnFlowBehavior: [ 'type', require('./CreateOnFlowBehavior') ],
  createParticipantBehavior: [ 'type', require('./CreateParticipantBehavior') ],
  layoutParticipantBehavior: [ 'type', require('./LayoutParticipantBehavior') ],
  modelingFeedback: [ 'type', require('./ModelingFeedback') ],
  moveStartEventBehavior: [ 'type', require('./MoveStartEventBehavior') ],
  removeParticipantBehavior: [ 'type', require('./RemoveParticipantBehavior') ],
  replaceConnectionBehavior: [ 'type', require('./ReplaceConnectionBehavior') ]
};
