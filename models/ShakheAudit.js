const mongoose = require('mongoose');

const shakheAuditSchema = new mongoose.Schema({
  at: { type: Date, required: true, default: Date.now, index: true },
  ip: { type: String, required: true, maxlength: 64 },
  action: { type: String, required: true, maxlength: 40 },
  recordKind: { type: String, default: null, maxlength: 40 },
  recordId: { type: mongoose.Schema.Types.ObjectId, default: null },
  nagara: { type: Boolean, default: false },
  detail: { type: String, default: null, maxlength: 40 },
});

shakheAuditSchema.index({ action: 1, at: -1 });

module.exports = mongoose.model('ShakheAudit', shakheAuditSchema, 'shakheaudits');
