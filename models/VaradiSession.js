const mongoose = require('mongoose');

/**
 * One document per live Varadi browser/device session.
 * Up to MAX concurrent sessions per userId (enforced in varadiAuth.issueSession).
 */
const varadiSessionSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    sessionId: { type: String, required: true },
    level: { type: String, required: true },
    entityId: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

varadiSessionSchema.index({ userId: 1, sessionId: 1 }, { unique: true });
// Mongo TTL cleanup shortly after expiry.
varadiSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('VaradiSession', varadiSessionSchema, 'varadisessions');
