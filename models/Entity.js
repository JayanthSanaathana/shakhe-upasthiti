const mongoose = require('mongoose');

const entitySchema = new mongoose.Schema(
  {
    name: String,
    sthara: { type: mongoose.Schema.Types.ObjectId, ref: 'Sthara' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Entity', entitySchema, 'entities');
