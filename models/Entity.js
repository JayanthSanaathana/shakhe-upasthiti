const mongoose = require('mongoose');
const { getLiveModel } = require('../lib/mongo');

const entitySchema = new mongoose.Schema(
  {
    name: String,
    sthara: { type: mongoose.Schema.Types.ObjectId, ref: 'Sthara' },
  },
  { timestamps: true }
);

module.exports = getLiveModel('Entity', entitySchema, 'entities');
