require('dotenv').config();
const path = require('path');

const express = require('express');
const mongoose = require('mongoose');
const Shakhe = require('./models/Shakhe');
const ShakheAudit = require('./models/ShakheAudit');
const ShakheUpasthiti = require('./models/ShakheUpasthiti');
const hierarchy = require('./lib/hierarchy');
const shakheService = require('./lib/shakheService');
const upasthitiService = require('./lib/upasthitiService');
const { searchPeople } = require('./lib/peopleSearch');
const { isObjectId, scalar, isSthara, clipText, phoneQuery, MAX_GEOCODE } = require('./lib/safe');
const nagaraAuth = require('./lib/nagaraAuth');
const varadiAuth = require('./lib/varadiAuth');
const audit = require('./lib/audit');
const rateLimit = require('./lib/rateLimit');

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(express.json({ limit: '16kb' }));

const limitWrite = rateLimit.middleware('write', { limit: 30, windowMs: 15 * 60 * 1000 });
const limitRead = rateLimit.middleware('read', { limit: 120, windowMs: 60 * 1000 });
const limitSearch = rateLimit.middleware('search', { limit: 60, windowMs: 60 * 1000 });
const limitGeocode = rateLimit.middleware('geocode', { limit: 20, windowMs: 60 * 1000 });

app.use((req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Cache-Control': 'no-store',
    'Content-Security-Policy':
      "default-src 'self'; script-src 'self' https://unpkg.com; style-src 'self' https://unpkg.com https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https://*.tile.openstreetmap.org https://tile.openstreetmap.org https://unpkg.com; connect-src 'self' https://unpkg.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
  });
  next();
});

app.use((req, res, next) => {
  const raw = decodeURIComponent(req.path || '');
  if (raw.includes('..') || raw.includes('\\') || /\/\./.test(raw)) {
    return res.status(404).json({ error: 'Not found' });
  }
  next();
});

app.use((req, res, next) => {
  if (req.query && typeof req.query === 'object') {
    for (const key of Object.keys(req.query)) {
      req.query[key] = scalar(req.query[key]);
    }
  }
  next();
});

function asyncRoute(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

function entityWriteAuthed(req) {
  return varadiAuth.isAuthed(req);
}

function writeAudit(req, action, extra) {
  return audit.write(req, {
    action,
    nagara: entityWriteAuthed(req),
    ...(extra || {}),
  });
}

const publicDir = path.join(__dirname, 'public');
app.get('/favicon.ico', (req, res) => {
  res.redirect(302, '/favicon.svg');
});
app.use(express.static(publicDir, { dotfiles: 'deny', index: 'index.html', fallthrough: true }));

app.get('/api/nagara/session', asyncRoute(async (req, res) => {
  const session = await varadiAuth.loadSession(req);
  if (!session || session.level !== 'nagara') {
    return res.status(401).json({ error: 'Nagara login required' });
  }
  res.json({ ok: true, expiresIn: session.expiresIn, entityId: session.entityId });
}));

app.post('/api/nagara/logout', asyncRoute(async (req, res) => {
  const wasAuthed = Boolean(await varadiAuth.loadSession(req));
  await varadiAuth.destroySessionFromRequest(req);
  varadiAuth.clearSessionCookie(req, res);
  nagaraAuth.clearSessionCookie(req, res);
  await writeAudit(req, 'nagara.logout', { detail: wasAuthed ? 'ok' : null });
  res.json({ ok: true });
}));

async function assertVaradiEntityAccess(req, res, targetEntityId) {
  const session = req.varadiSession || (await varadiAuth.loadSession(req));
  if (session) {
    req.varadiSession = session;
    const ok = await varadiAuth.canAccessEntity(session, targetEntityId);
    if (!ok) {
      res.status(403).json({ error: 'Not allowed for this entity' });
      return false;
    }
    return true;
  }
  res.status(401).json({ error: 'Login required' });
  return false;
}

app.get('/api/varadi/session', asyncRoute(async (req, res) => {
  const inspected = await varadiAuth.inspectSession(req);
  if (!inspected.ok) {
    if (inspected.reason === 'missing') {
      return res.json({ ok: false, reason: 'missing' });
    }
    return res.status(401).json(varadiAuth.unauthorizedBody(inspected.reason));
  }
  const session = inspected.session;
  let entityName = '';
  try {
    const Entity = require('./models/Entity');
    const entity = await Entity.findById(session.entityId).select('name').lean();
    if (entity) entityName = entity.name || '';
  } catch (_) {
    /* name is optional for resume */
  }
  res.json({
    ok: true,
    level: session.level,
    entityId: session.entityId,
    entityName,
    userId: session.userId,
    expiresIn: session.expiresIn,
  });
}));

app.post('/api/varadi/login', asyncRoute(async (req, res) => {
  const result = await varadiAuth.login(req);
  if (result.error) {
    if (result.status !== 429 && result.status !== 403) {
      await writeAudit(req, 'varadi.login_fail', { detail: String(result.status || 401) });
    }
    return res.status(result.status || 401).json({ error: result.error });
  }
  if (result.needsChoice) {
    const nagaraChoices = (result.choices || []).filter((c) => c.level === 'nagara');
    if (!nagaraChoices.length) {
      return res.status(403).json({ error: 'No Nagara access for this account' });
    }
    if (nagaraChoices.length === 1) {
      req.body.entityId = nagaraChoices[0].entityId;
      const picked = await varadiAuth.selectScope(req);
      if (picked.error) {
        return res.status(picked.status || 401).json({ error: picked.error });
      }
      varadiAuth.setSessionCookie(req, res, picked.token);
      await writeAudit(req, 'varadi.login', {
        detail: `${picked.level}:${picked.entityId}`,
      });
      return res.json({
        ok: true,
        level: picked.level,
        entityId: picked.entityId,
        entityName: picked.entityName,
        sthara: picked.sthara,
        roleName: picked.roleName,
        expiresIn: picked.expiresIn,
      });
    }
    await writeAudit(req, 'varadi.login_choice', { detail: result.userId });
    return res.json({
      ok: true,
      needsChoice: true,
      choices: nagaraChoices,
      expiresIn: varadiAuth.SESSION_MS,
    });
  }
  if (result.level !== 'nagara') {
    return res.status(403).json({ error: 'No Nagara access for this account' });
  }
  varadiAuth.setSessionCookie(req, res, result.token);
  await writeAudit(req, 'varadi.login', {
    detail: `${result.level}:${result.entityId}`,
  });
  res.json({
    ok: true,
    level: result.level,
    entityId: result.entityId,
    entityName: result.entityName,
    sthara: result.sthara,
    roleName: result.roleName,
    expiresIn: result.expiresIn,
  });
}));

app.post('/api/varadi/select', asyncRoute(async (req, res) => {
  const result = await varadiAuth.selectScope(req);
  if (result.error) {
    return res.status(result.status || 401).json({ error: result.error });
  }
  if (result.level !== 'nagara') {
    return res.status(403).json({ error: 'No Nagara access for this account' });
  }
  varadiAuth.setSessionCookie(req, res, result.token);
  await writeAudit(req, 'varadi.login', {
    detail: `${result.level}:${result.entityId}`,
  });
  res.json({
    ok: true,
    level: result.level,
    entityId: result.entityId,
    entityName: result.entityName,
    sthara: result.sthara,
    roleName: result.roleName,
    expiresIn: result.expiresIn,
  });
}));

app.post('/api/varadi/logout', asyncRoute(async (req, res) => {
  const wasAuthed = Boolean(await varadiAuth.loadSession(req));
  await varadiAuth.destroySessionFromRequest(req);
  varadiAuth.clearSessionCookie(req, res);
  nagaraAuth.clearSessionCookie(req, res);
  await writeAudit(req, 'varadi.logout', { detail: wasAuthed ? 'ok' : null });
  res.json({ ok: true });
}));

app.get('/api/form', varadiAuth.requireSession, asyncRoute(async (req, res) => {
  const session = req.varadiSession;
  if (!session || session.level !== 'nagara') {
    return res.status(401).json({ error: 'Nagara login required' });
  }
  const result = await hierarchy.formStateForNagara(session.entityId);
  if (result.error) return res.status(400).json({ error: result.error });
  res.json(result);
}));

app.get('/api/options', varadiAuth.requireSession, asyncRoute(async (req, res) => {
  const parentId = scalar(req.query.parentId);
  const sthara = scalar(req.query.sthara);
  if (!isObjectId(parentId) || !isSthara(sthara)) {
    return res.status(400).json({ error: 'Invalid request' });
  }
  if (!(await assertVaradiEntityAccess(req, res, parentId))) return;
  const result = await hierarchy.optionsUnder(parentId, sthara);
  if (result.error) return res.status(404).json({ error: result.error });
  res.json(result.options);
}));

app.get('/api/shakhe', varadiAuth.requireSession, limitRead, asyncRoute(async (req, res) => {
  const session = req.varadiSession;
  if (!session || session.level !== 'nagara') {
    return res.status(401).json({ error: 'Nagara login required' });
  }
  const result = await shakheService.listForNagara(session.entityId);
  if (result.error) return res.status(400).json({ error: result.error });
  res.json(result);
}));

app.get('/api/shakhe/by-upavasati', varadiAuth.requireSession, asyncRoute(async (req, res) => {
  const upavasatiId = scalar(req.query.upavasatiId);
  if (!isObjectId(upavasatiId)) return res.status(400).json({ error: 'Invalid upavasati' });
  if (!(await assertVaradiEntityAccess(req, res, upavasatiId))) return;
  const result = await shakheService.listForUpavasati(upavasatiId);
  if (result.error) return res.status(400).json({ error: result.error });
  res.json(result);
}));

app.get('/api/shakhe/by-mukhashikshak', varadiAuth.requireSession, limitSearch, asyncRoute(async (req, res) => {
  const phone = phoneQuery(req.query.phone);
  if (!phone || phone.length < 6) return res.json({ shakhes: [] });
  const result = await shakheService.listForMukhashikshak(phone);
  res.json(result);
}));

app.post('/api/shakhe', varadiAuth.requireSession, limitWrite, asyncRoute(async (req, res) => {
  const session = req.varadiSession;
  if (!session || session.level !== 'nagara') {
    return res.status(401).json({ error: 'Nagara login required' });
  }
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  if (body.nagarId && body.nagarId !== session.entityId) {
    return res.status(403).json({ error: 'Not allowed for this entity' });
  }
  body.nagarId = session.entityId;
  const form = await hierarchy.formStateForNagara(session.entityId);
  if (form.error) return res.status(400).json({ error: form.error });
  const vibhag = form.levels.find((l) => l.sthara === 'Vibhag');
  const bhag = form.levels.find((l) => l.sthara === 'Bhag');
  if (vibhag && vibhag.value) body.vibhagId = vibhag.value.id;
  if (bhag && bhag.value) body.bhagId = bhag.value.id;

  if (!(await assertVaradiEntityAccess(req, res, body.upavasatiId || body.vasatiId || session.entityId))) {
    return;
  }

  const { shakhe, error, status } = await shakheService.createShakhe(body, {
    ip: audit.clientIp(req),
    nagara: true,
  });
  if (error) return res.status(status || 400).json({ error });
  await writeAudit(req, 'shakhe.create', { recordKind: 'shakhes', recordId: shakhe._id });
  res.status(201).json(shakheService.serialize(shakhe));
}));

app.get('/api/people/search', limitSearch, asyncRoute(async (req, res) => {
  const phone = phoneQuery(req.query.phone);
  if (!phone) return res.json([]);
  res.json(await searchPeople(phone));
}));

app.get('/api/geocode', limitGeocode, asyncRoute(async (req, res) => {
  const q = clipText(req.query.q, MAX_GEOCODE);
  if (q.length < 3) return res.json([]);

  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('format', 'json');
  url.searchParams.set('q', q);
  url.searchParams.set('limit', '6');
  url.searchParams.set('countrycodes', 'in');

  const geo = await fetch(url, {
    headers: { 'User-Agent': 'ShakheUpasthiti/0.1 (shakhe form)' },
  });
  if (!geo.ok) return res.status(502).json({ error: 'Address search failed' });

  const results = await geo.json();
  if (!Array.isArray(results)) return res.json([]);
  res.json(
    results
      .slice(0, 6)
      .map((r) => ({
        label: clipText(r && r.display_name, 200),
        lat: Number(r && r.lat),
        lng: Number(r && r.lon),
      }))
      .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng))
  );
}));

app.get('/api/shakhe/by-phone', limitSearch, asyncRoute(async (req, res) => {
  const phone = phoneQuery(req.query.phone);
  if (!phone || phone.length < 6) return res.json({ shakhes: [] });
  const result = await shakheService.listByPhone(phone);
  res.json(result);
}));

app.get('/api/shakhe/:id', limitRead, asyncRoute(async (req, res) => {
  const session = await varadiAuth.loadSession(req);
  let result;
  if (session && session.level === 'nagara') {
    result = await shakheService.viewForNagara(scalar(req.params.id), session.entityId);
  } else {
    result = await shakheService.viewShakhe(scalar(req.params.id), scalar(req.query.confirmPhone));
  }
  if (result.error) return res.status(result.status || 400).json({ error: result.error });
  res.json(result.shakhe);
}));

app.put('/api/shakhe/:id', varadiAuth.requireSession, limitWrite, asyncRoute(async (req, res) => {
  const session = req.varadiSession;
  if (!session || session.level !== 'nagara') {
    return res.status(401).json({ error: 'Nagara login required' });
  }
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  body.nagarId = session.entityId;
  const form = await hierarchy.formStateForNagara(session.entityId);
  if (form.error) return res.status(400).json({ error: form.error });
  const vibhag = form.levels.find((l) => l.sthara === 'Vibhag');
  const bhag = form.levels.find((l) => l.sthara === 'Bhag');
  if (vibhag && vibhag.value) body.vibhagId = vibhag.value.id;
  if (bhag && bhag.value) body.bhagId = bhag.value.id;
  if (!(await assertVaradiEntityAccess(req, res, body.upavasatiId || body.vasatiId || session.entityId))) {
    return;
  }
  const { shakhe, error, status } = await shakheService.updateShakhe(
    scalar(req.params.id),
    body,
    { ip: audit.clientIp(req), nagara: true },
    session.entityId
  );
  if (error) return res.status(status || 400).json({ error });
  await writeAudit(req, 'shakhe.update', { recordKind: 'shakhes', recordId: shakhe._id });
  res.json(shakheService.serialize(shakhe));
}));

app.put('/api/shakhe/:id/setup', limitWrite, asyncRoute(async (req, res) => {
  const result = await shakheService.completeSetup(
    scalar(req.params.id),
    req.body && typeof req.body === 'object' ? req.body : {},
    { ip: audit.clientIp(req) }
  );
  if (result.error) return res.status(result.status || 400).json({ error: result.error });
  await writeAudit(req, 'shakhe.setup', { recordKind: 'shakhes', recordId: result.shakhe.id });
  res.json(result.shakhe);
}));

app.get('/api/upasthiti', limitRead, asyncRoute(async (req, res) => {
  const result = await upasthitiService.loadForDay(
    scalar(req.query.shakheId),
    scalar(req.query.confirmPhone),
    scalar(req.query.date)
  );
  if (result.error) {
    return res.status(result.status || 400).json({ error: result.error, shakhe: result.shakhe || null });
  }
  res.json(result);
}));

app.post('/api/upasthiti', limitWrite, asyncRoute(async (req, res) => {
  const { entry, shakhe, created, error, status } = await upasthitiService.saveUpasthiti(
    req.body && typeof req.body === 'object' ? req.body : {},
    { ip: audit.clientIp(req) }
  );
  if (error) return res.status(status || 400).json({ error });
  await writeAudit(req, created ? 'upasthiti.create' : 'upasthiti.update', {
    recordKind: 'shakheupasthitis',
    recordId: entry._id,
  });
  res.status(created ? 201 : 200).json(upasthitiService.serialize(entry, shakhe));
}));

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err, req, res, next) => {
  console.error(err && err.stack ? err.stack : err);
  res.status(500).json({ error: 'Request failed' });
});

const PORT = Number(process.env.PORT || process.env.SHAKHE_PORT) || 3002;
if (!process.env.MONGO_URI) {
  console.error('MONGO_URI is not set');
  process.exit(1);
}

mongoose.connect(process.env.MONGO_URI).then(async () => {
  await Shakhe.syncIndexes();
  await ShakheAudit.syncIndexes();
  await ShakheUpasthiti.syncIndexes();
  app.listen(PORT, () => console.log(`Shakhe Upasthiti running on http://localhost:${PORT}`));
});
