const mongoose = require('mongoose');

const phoneSessionSchema = new mongoose.Schema(
  {
    phone: { type: String, required: true, unique: true, index: true },
    sessionId: { type: String, required: true },
    purpose: { type: String, default: null, maxlength: 32 },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

phoneSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('PhoneSession', phoneSessionSchema, 'phonesessions');
