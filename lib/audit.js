const ShakheAudit = require('../models/ShakheAudit');

function clientIp(req) {
  const forwarded = String((req && req.headers && req.headers['x-forwarded-for']) || '')
    .split(',')[0]
    .trim();
  const raw = forwarded || (req && req.ip) || (req && req.socket && req.socket.remoteAddress) || '';
  return String(raw).replace(/^::ffff:/, '').slice(0, 64) || 'unknown';
}

function stampCreate(ip) {
  const now = new Date();
  const value = ip || null;
  return { createdAt: now, createdIp: value, updatedAt: now, updatedIp: value };
}

function stampUpdate(ip) {
  return { updatedAt: new Date(), updatedIp: ip || null };
}

async function write(req, fields) {
  try {
    await ShakheAudit.create({
      at: new Date(),
      ip: clientIp(req),
      action: String((fields && fields.action) || '').slice(0, 40),
      recordKind: fields && fields.recordKind ? String(fields.recordKind).slice(0, 40) : null,
      recordId: fields && fields.recordId ? fields.recordId : null,
      nagara: Boolean(fields && fields.nagara),
      detail: fields && fields.detail ? String(fields.detail).slice(0, 40) : null,
    });
  } catch (err) {
    console.error('audit write failed:', err && err.message);
  }
}

module.exports = { clientIp, stampCreate, stampUpdate, write };
