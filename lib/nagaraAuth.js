const crypto = require('crypto');

const COOKIE = 'nagara_session';
const SESSION_MS = 45 * 60 * 1000;

function sessionSecret() {
  return process.env.NAGARA_SESSION_SECRET || '';
}

function sign(payload) {
  return crypto.createHmac('sha256', sessionSecret()).update(payload).digest('base64url');
}

function readCookie(req, name) {
  const header = String(req.headers.cookie || '');
  const parts = header.split(';');
  for (const part of parts) {
    const idx = part.indexOf('=');
    if (idx < 0) continue;
    const key = part.slice(0, idx).trim();
    if (key !== name) continue;
    return decodeURIComponent(part.slice(idx + 1).trim());
  }
  return '';
}

function validSession(token) {
  if (!token || !sessionSecret()) return false;
  const last = token.lastIndexOf('.');
  if (last <= 0) return false;
  const payload = token.slice(0, last);
  const sig = token.slice(last + 1);
  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  const exp = Number(payload.split('.')[0]);
  return Number.isFinite(exp) && Date.now() < exp;
}

function appendSetCookie(res, value) {
  if (typeof res.append === 'function') {
    res.append('Set-Cookie', value);
    return;
  }
  const prev = res.getHeader('Set-Cookie');
  if (!prev) res.setHeader('Set-Cookie', value);
  else if (Array.isArray(prev)) res.setHeader('Set-Cookie', prev.concat(value));
  else res.setHeader('Set-Cookie', [String(prev), value]);
}

function clearSessionCookie(req, res) {
  const proto = String(req.headers['x-forwarded-proto'] || '');
  const secure = req.secure || proto.split(',')[0].trim() === 'https';
  appendSetCookie(
    res,
    `${COOKIE}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0${secure ? '; Secure' : ''}`
  );
}

function sessionRemaining(req) {
  const token = readCookie(req, COOKIE);
  if (!validSession(token)) return 0;
  const last = token.lastIndexOf('.');
  const payload = token.slice(0, last);
  const exp = Number(payload.split('.')[0]);
  return Math.max(0, exp - Date.now());
}

function isAuthed(req) {
  return validSession(readCookie(req, COOKIE));
}

function requireNagara(req, res, next) {
  if (!isAuthed(req)) return res.status(401).json({ error: 'Nagara login required' });
  next();
}

module.exports = {
  COOKIE,
  SESSION_MS,
  isAuthed,
  sessionRemaining,
  requireNagara,
  clearSessionCookie,
};
