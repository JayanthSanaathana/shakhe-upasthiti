const crypto = require('crypto');
const { clientIp } = require('./audit');
const externalAuth = require('./externalAuth');
const { scopesForUser } = require('./varadiScope');
const { isObjectId } = require('./safe');
const VaradiSession = require('../models/VaradiSession');

const COOKIE = 'varadi_session';
const LEVELS = new Set(['prant', 'vibhag', 'bhag', 'nagara']);

/** Old cookie names cleared on logout; password-hash logins removed. */
const LEGACY_COOKIES = ['vibhag_session', 'bhag_session', 'nagara_session'];

const MAX_PASSWORD = 30;
const MAX_EMAIL = 100;
const SESSION_MS = 60 * 60 * 1000;
const LOGIN_WINDOW_MS = 10 * 60 * 1000;
const LOGIN_MAX = 5;
/** Max concurrent Varadi device/browser sessions per account. */
const MAX_SESSIONS_PER_USER = 5;

const loginAttempts = new Map();

function sessionSecret() {
  return process.env.VARADI_SESSION_SECRET || process.env.NAGARA_SESSION_SECRET || '';
}

function configured() {
  return Boolean(sessionSecret());
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

function makeSession({ level, entityId, userId, sessionId }) {
  const exp = String(Date.now() + SESSION_MS);
  const payload = `${exp}.${level}.${entityId}.${userId}.${sessionId}`;
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

/** HMAC-only parse (does not check single-session store). */
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
  if (parts.length !== 5) return null;
  const [expRaw, level, entityId, userId, sessionId] = parts;
  const exp = Number(expRaw);
  if (!Number.isFinite(exp) || Date.now() >= exp) return null;
  if (!LEVELS.has(level) || !isObjectId(entityId) || !userId || !sessionId) return null;
  return {
    level,
    entityId,
    userId,
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
  for (const name of [COOKIE, ...LEGACY_COOKIES]) {
    appendSetCookie(res, `${name}=${suffix}`);
  }
}

/**
 * Create a new Varadi session for this user (up to MAX_SESSIONS_PER_USER concurrent).
 * If already at the cap, the oldest session is removed (that device gets superseded).
 */
async function issueSession({ userId, level, entityId }) {
  if (!configured()) throw new Error('Varadi session secret not configured');
  if (!LEVELS.has(level) || !isObjectId(entityId) || !userId) {
    throw new Error('Invalid session scope');
  }
  const uid = String(userId);
  const sessionId = crypto.randomBytes(18).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_MS);
  await VaradiSession.create({
    userId: uid,
    sessionId,
    level,
    entityId,
    expiresAt,
  });

  const existing = await VaradiSession.find({ userId: uid }).sort({ createdAt: 1 }).select('_id').lean();
  if (existing.length > MAX_SESSIONS_PER_USER) {
    const dropIds = existing.slice(0, existing.length - MAX_SESSIONS_PER_USER).map((r) => r._id);
    if (dropIds.length) await VaradiSession.deleteMany({ _id: { $in: dropIds } });
  }

  const token = makeSession({
    level,
    entityId,
    userId: uid,
    sessionId,
  });
  return { token, sessionId, expiresIn: SESSION_MS, level, entityId, userId: uid };
}

async function destroySessionForUser(userId) {
  if (!userId) return;
  await VaradiSession.deleteMany({ userId: String(userId) });
}

async function destroySessionFromRequest(req) {
  // Remove only this cookie's session row (other devices stay signed in).
  const parsed = parseSessionToken(readCookie(req, COOKIE));
  if (!parsed) return;
  await VaradiSession.deleteOne({ userId: parsed.userId, sessionId: parsed.sessionId });
}

/**
 * Inspect cookie + multi-session store (max 5 per user).
 * reason: missing | invalid | superseded | expired
 */
async function inspectSession(req) {
  const raw = readCookie(req, COOKIE);
  const parsed = parseSessionToken(raw);
  if (!parsed) {
    return { ok: false, reason: raw ? 'invalid' : 'missing' };
  }
  const row = await VaradiSession.findOne({
    userId: parsed.userId,
    sessionId: parsed.sessionId,
  }).lean();
  if (!row) {
    return { ok: false, reason: 'superseded', parsed };
  }
  if (row.entityId !== parsed.entityId || row.level !== parsed.level) {
    return { ok: false, reason: 'superseded', parsed };
  }
  if (!row.expiresAt || new Date(row.expiresAt).getTime() <= Date.now()) {
    return { ok: false, reason: 'expired', parsed };
  }
  return {
    ok: true,
    session: {
      level: row.level,
      entityId: row.entityId,
      userId: row.userId,
      sessionId: row.sessionId,
      expiresIn: Math.max(0, new Date(row.expiresAt).getTime() - Date.now()),
    },
  };
}

/** Live session: signed cookie + matching row in Mongo. */
async function loadSession(req) {
  const result = await inspectSession(req);
  return result.ok ? result.session : null;
}

function unauthorizedBody(reason) {
  if (reason === 'superseded') {
    return {
      error: 'Session ended (too many devices or signed in again)',
      reason: 'superseded',
    };
  }
  if (reason === 'expired') {
    return {
      error: 'Session expired',
      reason: 'expired',
    };
  }
  return { error: 'Login required', reason: reason || 'missing' };
}

function getSession(req) {
  return parseSessionToken(readCookie(req, COOKIE));
}

function isAuthed(req) {
  return Boolean(getSession(req));
}

function sessionRemaining(req) {
  const session = getSession(req);
  return session ? session.expiresIn : 0;
}

async function finalizeScopeLogin(scope) {
  const issued = await issueSession({
    userId: scope.userId,
    level: scope.level,
    entityId: scope.entityId,
  });
  return {
    token: issued.token,
    level: scope.level,
    entityId: scope.entityId,
    entityName: scope.entityName,
    sthara: scope.sthara,
    roleName: scope.roleName,
    userId: scope.userId,
    expiresIn: issued.expiresIn,
  };
}

async function login(req) {
  const limited = rateLimit(req, 'unified');
  if (limited) return limited;
  if (!configured()) {
    console.error('Varadi login is not configured (VARADI_SESSION_SECRET or NAGARA_SESSION_SECRET)');
    return { error: 'Could not sign in', status: 503 };
  }

  const email =
    req.body && typeof req.body.email === 'string'
      ? req.body.email
      : req.body && typeof req.body.username === 'string'
        ? req.body.username
        : '';
  const password = req.body && typeof req.body.password === 'string' ? req.body.password : '';
  if (!String(email).trim() || !password || password.length > MAX_PASSWORD || String(email).length > MAX_EMAIL) {
    return { error: 'Invalid credentials', status: 401 };
  }

  const auth = await externalAuth.signin(email, password);
  if (auth.error) return { error: auth.error, status: auth.status || 401 };

  const scopes = await scopesForUser(auth.userId);
  if (!scopes.length) {
    return { error: 'No Varadi access for this account', status: 403 };
  }

  if (scopes.length > 1) {
    return {
      choices: scopes.map((s) => ({
        level: s.level,
        entityId: s.entityId,
        entityName: s.entityName,
        sthara: s.sthara,
        roleName: s.roleName,
      })),
      userId: auth.userId,
      status: 200,
      needsChoice: true,
    };
  }

  return finalizeScopeLogin(scopes[0]);
}

async function selectScope(req, entityId) {
  const limited = rateLimit(req, 'unified-select');
  if (limited) return limited;
  if (!configured()) return { error: 'Could not sign in', status: 503 };

  const email =
    req.body && typeof req.body.email === 'string'
      ? req.body.email
      : req.body && typeof req.body.username === 'string'
        ? req.body.username
        : '';
  const password = req.body && typeof req.body.password === 'string' ? req.body.password : '';
  const pickId = String(entityId || (req.body && req.body.entityId) || '').trim();
  if (!isObjectId(pickId)) return { error: 'Invalid entity', status: 400 };
  if (
    !String(email).trim() ||
    !password ||
    password.length > MAX_PASSWORD ||
    String(email).length > MAX_EMAIL
  ) {
    return { error: 'Invalid credentials', status: 401 };
  }

  const auth = await externalAuth.signin(email, password);
  if (auth.error) return { error: auth.error, status: auth.status || 401 };

  const scopes = await scopesForUser(auth.userId);
  const scope = scopes.find((s) => s.entityId === pickId);
  if (!scope) return { error: 'No Varadi access for this account', status: 403 };

  return finalizeScopeLogin(scope);
}

async function canAccessEntity(session, targetEntityId) {
  if (!session || !isObjectId(targetEntityId)) return false;
  if (session.entityId === targetEntityId) return true;
  const hierarchy = require('./hierarchy');
  return hierarchy.isDescendantOrSelf(targetEntityId, session.entityId);
}

function requireSession(req, res, next) {
  Promise.resolve(inspectSession(req))
    .then((result) => {
      if (!result.ok) return res.status(401).json(unauthorizedBody(result.reason));
      req.varadiSession = result.session;
      next();
    })
    .catch(next);
}

function requireReportAccess(req, res, next) {
  Promise.resolve(inspectSession(req))
    .then((result) => {
      if (result.ok) {
        req.varadiSession = result.session;
        return next();
      }
      return res.status(401).json(unauthorizedBody(result.reason));
    })
    .catch(next);
}

async function isAuthedRole(req, role) {
  const session = await loadSession(req);
  return Boolean(session && session.level === role);
}

function requireRole(role) {
  return (req, res, next) => {
    Promise.resolve(isAuthedRole(req, role))
      .then((ok) => {
        if (!ok) return res.status(401).json({ error: `${role} login required` });
        next();
      })
      .catch(next);
  };
}

function requireAnyVaradi(req, res, next) {
  Promise.resolve(inspectSession(req))
    .then((result) => {
      if (result.ok) {
        req.varadiSession = result.session;
        return next();
      }
      return res.status(401).json(unauthorizedBody(result.reason));
    })
    .catch(next);
}

module.exports = {
  COOKIE,
  SESSION_MS,
  LEVELS,
  MAX_EMAIL,
  MAX_PASSWORD,
  MAX_SESSIONS_PER_USER,
  LOGIN_MAX,
  LOGIN_WINDOW_MS,
  login,
  selectScope,
  issueSession,
  inspectSession,
  loadSession,
  getSession,
  isAuthed,
  isAuthedRole,
  sessionRemaining,
  canAccessEntity,
  destroySessionFromRequest,
  destroySessionForUser,
  unauthorizedBody,
  requireSession,
  requireReportAccess,
  requireRole,
  requireAnyVaradi,
  setSessionCookie,
  clearSessionCookie,
};
