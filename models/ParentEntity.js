const mongoose = require('mongoose');
const { getLiveModel } = require('../lib/mongo');

const parentEntitySchema = new mongoose.Schema(
  {
    currentEntity: { type: mongoose.Schema.Types.ObjectId, ref: 'Entity' },
    parentEntity: { type: mongoose.Schema.Types.ObjectId, ref: 'Entity' },
  },
  { timestamps: true }
);

module.exports = getLiveModel('ParentEntity', parentEntitySchema, 'parententities');
