const crypto = require('crypto');
const { clientIp } = require('./audit');
const { phoneDigits } = require('./phoneConfirm');
const PhoneSession = require('../models/PhoneSession');

const COOKIE = 'shakhe_phone_session';
const PURPOSES = new Set(['upasthiti', 'varadi']);
const SESSION_MS = 60 * 60 * 1000;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX = 5;
const MIN_PHONE = 6;
const MAX_PHONE = 15;

const loginAttempts = new Map();

function sessionSecret() {
  return (
    process.env.PHONE_SESSION_SECRET ||
    process.env.VARADI_SESSION_SECRET ||
    process.env.NAGARA_SESSION_SECRET ||
    ''
  );
}

function configured() {
  return Boolean(sessionSecret());
}

function normalizePhone(value) {
  const digits = phoneDigits(value);
  if (digits.length < MIN_PHONE || digits.length > MAX_PHONE) return '';
  return digits.length > 10 ? digits.slice(-10) : digits;
}

function normalizePurpose(value) {
  const purpose = String(value || '').trim();
  return PURPOSES.has(purpose) ? purpose : null;
}

function clientKey(req, bucket) {
  return `${bucket}:${clientIp(req)}`;
}

function rateLimit(req, bucket) {
  const key = clientKey(req, bucket);
  const now = Date.now();
  let row = loginAttempts.get(key);
  if (!row || row.reset <= now) {
    row = { n: 0, reset: now + LOGIN_WINDOW_MS };
    loginAttempts.set(key, row);
  }
  row.n += 1;
  if (row.n > LOGIN_MAX) {
    return { error: 'Try again later', status: 429 };
  }
  return null;
}

function sign(payload) {
  return crypto.createHmac('sha256', sessionSecret()).update(payload).digest('base64url');
}

function makeSession({ phone, sessionId }) {
  const exp = String(Date.now() + SESSION_MS);
  const payload = `${exp}.${phone}.${sessionId}`;
  return `${payload}.${sign(payload)}`;
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

function parseSessionToken(token) {
  if (!token || !sessionSecret()) return null;
  const last = token.lastIndexOf('.');
  if (last <= 0) return null;
  const payload = token.slice(0, last);
  const sig = token.slice(last + 1);
  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  const parts = payload.split('.');
  if (parts.length !== 3) return null;
  const [expRaw, phone, sessionId] = parts;
  const exp = Number(expRaw);
  if (!Number.isFinite(exp) || Date.now() >= exp) return null;
  if (!phone || !sessionId) return null;
  if (!/^\d{6,15}$/.test(phone)) return null;
  return {
    phone,
    sessionId,
    expiresIn: Math.max(0, exp - Date.now()),
  };
}

function cookieFlags(req, cookieName) {
  const proto = String(req.headers['x-forwarded-proto'] || '');
  const secure = req.secure || proto.split(',')[0].trim() === 'https';
  const maxAge = Math.floor(SESSION_MS / 1000);
  return [
    `${cookieName}=`,
    'HttpOnly',
    'Path=/',
    'SameSite=Lax',
    `Max-Age=${maxAge}`,
    secure ? 'Secure' : '',
  ].filter(Boolean);
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

function setSessionCookie(req, res, token) {
  const flags = cookieFlags(req, COOKIE);
  flags[0] = `${COOKIE}=${encodeURIComponent(token)}`;
  appendSetCookie(res, flags.join('; '));
}

function clearSessionCookie(req, res) {
  const proto = String(req.headers['x-forwarded-proto'] || '');
  const secure = req.secure || proto.split(',')[0].trim() === 'https';
  const suffix = `; HttpOnly; Path=/; SameSite=Lax; Max-Age=0${secure ? '; Secure' : ''}`;
  appendSetCookie(res, `${COOKIE}=${suffix}`);
}

async function issueSession({ phone, purpose }) {
  if (!configured()) throw new Error('Phone session secret not configured');
  const normalized = normalizePhone(phone);
  if (!normalized) throw new Error('Invalid phone');
  const sessionId = crypto.randomBytes(18).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_MS);
  const purposeValue = normalizePurpose(purpose);
  await PhoneSession.findOneAndUpdate(
    { phone: normalized },
    {
      phone: normalized,
      sessionId,
      purpose: purposeValue,
      expiresAt,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  const token = makeSession({ phone: normalized, sessionId });
  return {
    token,
    sessionId,
    phone: normalized,
    purpose: purposeValue,
    expiresIn: SESSION_MS,
  };
}

async function destroySessionForPhone(phone) {
  const normalized = normalizePhone(phone);
  if (!normalized) return;
  await PhoneSession.deleteOne({ phone: normalized });
}

async function destroySessionFromRequest(req) {
  const parsed = parseSessionToken(readCookie(req, COOKIE));
  if (!parsed) return;
  const row = await PhoneSession.findOne({ phone: parsed.phone }).lean();
  if (row && row.sessionId === parsed.sessionId) {
    await destroySessionForPhone(parsed.phone);
  }
}

async function inspectSession(req) {
  const raw = readCookie(req, COOKIE);
  const parsed = parseSessionToken(raw);
  if (!parsed) {
    return { ok: false, reason: raw ? 'invalid' : 'missing' };
  }
  const row = await PhoneSession.findOne({ phone: parsed.phone }).lean();
  if (!row) {
    return { ok: false, reason: 'superseded', parsed };
  }
  if (row.sessionId !== parsed.sessionId) {
    return { ok: false, reason: 'superseded', parsed };
  }
  if (!row.expiresAt || new Date(row.expiresAt).getTime() <= Date.now()) {
    return { ok: false, reason: 'expired', parsed };
  }
  return {
    ok: true,
    session: {
      phone: row.phone,
      sessionId: row.sessionId,
      purpose: row.purpose || null,
      expiresIn: Math.max(0, new Date(row.expiresAt).getTime() - Date.now()),
    },
  };
}

async function loadSession(req) {
  const result = await inspectSession(req);
  return result.ok ? result.session : null;
}

function unauthorizedBody(reason) {
  if (reason === 'superseded') {
    return { error: 'Signed in elsewhere', reason: 'superseded' };
  }
  if (reason === 'expired') {
    return { error: 'Session expired', reason: 'expired' };
  }
  return { error: 'Login required', reason: reason || 'missing' };
}

async function login(req) {
  const limited = rateLimit(req, 'phone');
  if (limited) return limited;
  if (!configured()) {
    console.error('Phone login is not configured (PHONE_SESSION_SECRET / NAGARA_SESSION_SECRET)');
    return { error: 'Could not sign in', status: 503 };
  }
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const phone = normalizePhone(body.phone);
  if (!phone) return { error: 'Enter at least 6 digits', status: 400 };
  const issued = await issueSession({ phone, purpose: body.purpose });
  return {
    ok: true,
    phone: issued.phone,
    purpose: issued.purpose,
    expiresIn: issued.expiresIn,
    token: issued.token,
  };
}

module.exports = {
  COOKIE,
  SESSION_MS,
  MIN_PHONE,
  normalizePhone,
  normalizePurpose,
  login,
  issueSession,
  inspectSession,
  loadSession,
  destroySessionFromRequest,
  destroySessionForPhone,
  unauthorizedBody,
  setSessionCookie,
  clearSessionCookie,
  configured,
};
