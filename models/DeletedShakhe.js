const mongoose = require('mongoose');

/**
 * Recoverable archive of a deleted Shakhe. The snapshots deliberately retain
 * their original ObjectIds so a future restore can recreate the records and
 * their relationships without translating IDs.
 */
const deletedShakheSchema = new mongoose.Schema(
  {
    originalShakheId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      unique: true,
      index: true,
    },
    shakhe: { type: mongoose.Schema.Types.Mixed, required: true },
    upasthitis: { type: [mongoose.Schema.Types.Mixed], default: [] },
    upasthitiCount: { type: Number, required: true, default: 0, min: 0 },
    deletedAt: { type: Date, required: true, default: Date.now, index: true },
    deletedIp: { type: String, default: null, maxlength: 64 },
    deletedByLevel: { type: String, required: true, default: 'nagara', maxlength: 20 },
    deletedByEntity: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    archiveVersion: { type: Number, required: true, default: 1 },
  },
  { minimize: false }
);

module.exports = mongoose.model('DeletedShakhe', deletedShakheSchema, 'deletedshakhes');
