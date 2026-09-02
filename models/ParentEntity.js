const mongoose = require('mongoose');

const parentEntitySchema = new mongoose.Schema(
  {
    currentEntity: { type: mongoose.Schema.Types.ObjectId, ref: 'Entity' },
    parentEntity: { type: mongoose.Schema.Types.ObjectId, ref: 'Entity' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ParentEntity', parentEntitySchema, 'parententities');
