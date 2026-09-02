const mongoose = require('mongoose');

const varadiSessionSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    sessionId: { type: String, required: true },
    level: { type: String, required: true },
    entityId: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

// Mongo TTL cleanup shortly after expiry.
varadiSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('VaradiSession', varadiSessionSchema, 'varadisessions');
