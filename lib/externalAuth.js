const AUTH_URL =
  String(process.env.AUTH_SERVICE_URL || 'https://auth-server-odsk.onrender.com').replace(/\/$/, '');
const MAX_EMAIL = 120;
const MAX_PASSWORD = 200;

function decodeJwtPayload(token) {
  const raw = String(token || '').trim();
  const parts = raw.split('.');
  if (parts.length < 2) return null;
  try {
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const pad = payload.length % 4 === 0 ? '' : '='.repeat(4 - (payload.length % 4));
    const json = Buffer.from(payload + pad, 'base64').toString('utf8');
    return JSON.parse(json);
  } catch (_) {
    return null;
  }
}

function looksLikeJwt(value) {
  const raw = String(value || '').trim();
  if (!raw || raw.length < 20) return false;
  const parts = raw.split('.');
  return parts.length === 3 && parts.every((p) => p.length > 0);
}

function extractToken(body) {
  if (!body) return '';
  if (typeof body === 'string') return looksLikeJwt(body) ? body.trim() : '';
  if (typeof body !== 'object') return '';
  for (const key of ['token', 'accessToken', 'access_token', 'idToken', 'id_token', 'jwt']) {
    if (typeof body[key] === 'string' && looksLikeJwt(body[key])) return body[key].trim();
  }
  if (body.data) {
    const nested = extractToken(body.data);
    if (nested) return nested;
  }
  // Fallback: first JWT-shaped string value in the payload.
  for (const value of Object.values(body)) {
    if (typeof value === 'string' && looksLikeJwt(value)) return value.trim();
  }
  return '';
}

/**
 * Sign in against the shared auth service.
 * Request body shape (probed): { email, password }
 * Returns { userId } from JWT.sub, or { error, status }.
 */
async function signin(email, password) {
  const mail = String(email || '').trim().slice(0, MAX_EMAIL);
  const pass = String(password || '');
  if (!mail || !pass || pass.length > MAX_PASSWORD) {
    return { error: 'Invalid credentials', status: 401 };
  }

  let res;
  try {
    res = await fetch(`${AUTH_URL}/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ email: mail, password: pass }),
    });
  } catch (err) {
    console.error('Auth service unreachable', err && err.message);
    return { error: 'Could not sign in', status: 503 };
  }

  const text = await res.text();
  let body = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch (_) {
      body = text;
    }
  }

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      return { error: 'Invalid credentials', status: 401 };
    }
    if (res.status === 400) {
      return { error: 'Invalid credentials', status: 401 };
    }
    console.error('Auth service signin failed', res.status, typeof body === 'string' ? body.slice(0, 200) : body);
    return { error: 'Could not sign in', status: 503 };
  }

  const token = extractToken(body);
  if (!token) {
    console.error('Auth service signin returned no token field');
    return { error: 'Could not sign in', status: 503 };
  }

  const payload = decodeJwtPayload(token);
  const userId = payload && payload.sub != null ? String(payload.sub).trim() : '';
  if (!userId) {
    console.error('Auth service token missing sub');
    return { error: 'Could not sign in', status: 503 };
  }

  return { userId, token, claims: payload };
}

module.exports = {
  AUTH_URL,
  signin,
  decodeJwtPayload,
  extractToken,
};
