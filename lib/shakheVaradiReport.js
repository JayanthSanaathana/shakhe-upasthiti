const Entity = require('../models/Entity');
const ParentEntity = require('../models/ParentEntity');
const Sthara = require('../models/Sthara');
const Shakhe = require('../models/Shakhe');
const ShakheUpasthiti = require('../models/ShakheUpasthiti');
const hierarchy = require('./hierarchy');
const { isObjectId } = require('./safe');

function isIsoDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''));
}

function addDaysIso(iso, n) {
  const [y, m, d] = String(iso).split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return dt.toISOString().slice(0, 10);
}

function eachIsoDay(from, to, maxDays) {
  const days = [];
  let cur = from;
  while (cur <= to) {
    days.push(cur);
    if (days.length >= maxDays) break;
    cur = addDaysIso(cur, 1);
  }
  return days;
}

/** Calendar Sunday for an ISO date (UTC noon avoids TZ edge cases). */
function isSundayIso(iso) {
  if (!isIsoDate(iso)) return false;
  const [y, m, d] = String(iso).split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0)).getUTCDay() === 0;
}

function parseDateRange(fromDate, toDate, excludeSunday) {
  let from = String(fromDate || '');
  let to = String(toDate || '');
  if (!isIsoDate(from) || !isIsoDate(to)) return { error: 'Select from and to dates' };
  if (from > to) {
    const swap = from;
    from = to;
    to = swap;
  }
  const rawSpan = eachIsoDay(from, to, 63);
  if (rawSpan.length > 62) return { error: 'Select at most 62 days' };
  const skipSunday = Boolean(excludeSunday);
  const span = skipSunday ? rawSpan.filter((day) => !isSundayIso(day)) : rawSpan;
  return {
    from,
    to,
    dayCount: span.length,
    calendarDayCount: rawSpan.length,
    days: span,
    excludeSunday: skipSunday,
  };
}

function filterEntriesExcludeSunday(entries, excludeSunday) {
  if (!excludeSunday) return entries || [];
  return (entries || []).filter((e) => e && e.date && !isSundayIso(e.date));
}

/** Always round up to the next whole number (2.1 → 3, 2.5 → 3). Exact ints stay. */
function avg(sum, daysRan) {
  if (!daysRan) return null;
  const raw = sum / daysRan;
  if (!Number.isFinite(raw)) return null;
  const nearest = Math.round(raw);
  if (Math.abs(raw - nearest) < 1e-9) return nearest < 0 ? 0 : nearest;
  return Math.ceil(raw);
}

function emptySums() {
  return {
    taruna: 0,
    balaka: 0,
    shishu: 0,
    mataBhagi: 0,
    samparkitaManegalu: 0,
    samparkitaVyaktigalu: 0,
  };
}

function addEntrySums(acc, entry) {
  acc.taruna += entry.taruna || 0;
  acc.balaka += entry.balaka || 0;
  acc.shishu += entry.shishu || 0;
  acc.mataBhagi += entry.mataBhagi || 0;
  acc.samparkitaManegalu += entry.samparkitaManegalu || 0;
  acc.samparkitaVyaktigalu += entry.samparkitaVyaktigalu || 0;
  return acc;
}

function metricsFromEntries(upavasatiIdSet, entries) {
  const upavasatiCount = upavasatiIdSet.size;
  const daysRan = entries.length;
  const sums = entries.reduce((acc, e) => addEntrySums(acc, e), emptySums());
  return {
    upavasatiCount,
    daysRan,
    averages: {
      taruna: avg(sums.taruna, daysRan),
      balaka: avg(sums.balaka, daysRan),
      shishu: avg(sums.shishu, daysRan),
      mataBhagi: avg(sums.mataBhagi, daysRan),
      total: avg(sums.taruna + sums.balaka, daysRan),
    },
    ottuSamparka: {
      manegalu: sums.samparkitaManegalu,
      vyaktigalu: sums.samparkitaVyaktigalu,
    },
    _sums: sums,
  };
}

async function loadGramsByVasati(nagarId) {
  const vasatis = await hierarchy.descendantsOfSthara(nagarId, 'Vasati');
  const vasatiIds = vasatis.map((v) => v.id);
  const upavasatiSthara = await Sthara.findOne({ name: 'Upavasati' }).select('_id').lean();
  if (!upavasatiSthara) throw new Error('Unknown sthara: Upavasati');
  const upavasatiStharaId = upavasatiSthara._id.toString();

  const edges = vasatiIds.length
    ? await ParentEntity.find({ parentEntity: { $in: vasatiIds } }).lean()
    : [];
  const childIds = edges.map((e) => e.currentEntity);
  const children = childIds.length
    ? await Entity.find({ _id: { $in: childIds } }).select('name sthara').lean()
    : [];
  const childById = new Map(children.map((c) => [c._id.toString(), c]));
  const upavasatiIds = new Set(
    children.filter((c) => c.sthara.toString() === upavasatiStharaId).map((c) => c._id.toString())
  );

  const gramsByVasati = new Map(vasatiIds.map((id) => [id, new Map()]));
  for (const edge of edges) {
    const childId = edge.currentEntity.toString();
    if (!upavasatiIds.has(childId)) continue;
    const parent = edge.parentEntity.toString();
    const map = gramsByVasati.get(parent);
    const child = childById.get(childId);
    if (map && child) map.set(childId, { id: childId, name: child.name });
  }

  return { vasatis, gramsByVasati };
}

async function parentEntityRef(entityId) {
  const edge = await ParentEntity.findOne({ currentEntity: entityId }).lean();
  if (!edge) return null;
  const parent = await Entity.findById(edge.parentEntity).select('name').lean();
  return parent ? { id: parent._id.toString(), name: parent.name } : null;
}

async function reportForNagara(nagarId, fromDate, toDate, excludeSunday) {
  if (!isObjectId(nagarId)) return { error: 'Invalid nagara' };
  const nagar = await Entity.findById(nagarId);
  if (!nagar) return { error: 'Nagara not found', status: 404 };
  if ((await hierarchy.stharaName(nagar)) !== 'Nagar') return { error: 'Not a Nagara' };

  const range = parseDateRange(fromDate, toDate, excludeSunday);
  if (range.error) return range;

  const [{ vasatis, gramsByVasati }, shakhes, bhag] = await Promise.all([
    loadGramsByVasati(nagarId),
    Shakhe.find({ 'nagar.entity': nagarId })
      .select('_id vasati upavasati')
      .lean(),
    parentEntityRef(nagar._id),
  ]);

  const shakheIds = shakhes.map((s) => s._id);
  const rawEntries = shakheIds.length
    ? await ShakheUpasthiti.find({
        shakhe: { $in: shakheIds },
        date: { $gte: range.from, $lte: range.to },
      }).lean()
    : [];
  const entries = filterEntriesExcludeSunday(rawEntries, range.excludeSunday);

  const entriesByShakhe = new Map();
  for (const entry of entries) {
    const sid = entry.shakhe.toString();
    if (!entriesByShakhe.has(sid)) entriesByShakhe.set(sid, []);
    entriesByShakhe.get(sid).push(entry);
  }

  const shakhesByVasati = new Map(vasatis.map((v) => [v.id, []]));
  const gramsWithShakheByVasati = new Map(vasatis.map((v) => [v.id, new Set()]));
  for (const shakhe of shakhes) {
    const vasatiId = shakhe.vasati && shakhe.vasati.entity ? shakhe.vasati.entity.toString() : '';
    const upavasatiId =
      shakhe.upavasati && shakhe.upavasati.entity ? shakhe.upavasati.entity.toString() : '';
    if (shakhesByVasati.has(vasatiId)) shakhesByVasati.get(vasatiId).push(shakhe);
    if (gramsWithShakheByVasati.has(vasatiId) && upavasatiId) {
      gramsWithShakheByVasati.get(vasatiId).add(upavasatiId);
    }
  }

  const rows = vasatis.map((vasati) => {
    const grams = gramsByVasati.get(vasati.id) || new Map();
    const gramIds = new Set(grams.keys());
    const withShakhe = gramsWithShakheByVasati.get(vasati.id) || new Set();
    const vasatiShakhes = shakhesByVasati.get(vasati.id) || [];
    const vasatiEntries = [];
    let nadayuthiruva = 0;
    for (const shakhe of vasatiShakhes) {
      const list = entriesByShakhe.get(shakhe._id.toString()) || [];
      if (list.length) nadayuthiruva += 1;
      for (const e of list) vasatiEntries.push(e);
    }
    const yojita = vasatiShakhes.length;
    const metrics = metricsFromEntries(gramIds, vasatiEntries);
    return {
      vasati,
      upavasatiCount: metrics.upavasatiCount,
      upavasatiWithShakheCount: [...withShakhe].filter((id) => gramIds.has(id)).length,
      upavasatiWithoutShakheCount: Math.max(
        0,
        metrics.upavasatiCount - [...withShakhe].filter((id) => gramIds.has(id)).length
      ),
      yojitaShakheCount: yojita,
      nadayuthiruvaShakheCount: nadayuthiruva,
      nadayadaShakheCount: Math.max(0, yojita - nadayuthiruva),
      daysRan: metrics.daysRan,
      averages: metrics.averages,
      ottuSamparka: metrics.ottuSamparka,
      _sums: metrics._sums,
    };
  });

  const allEntries = entries;
  const totalSums = allEntries.reduce((acc, e) => addEntrySums(acc, e), emptySums());
  const totalDays = allEntries.length;
  const totals = {
    upavasatiCount: rows.reduce((n, r) => n + (r.upavasatiCount || 0), 0),
    upavasatiWithShakheCount: rows.reduce((n, r) => n + (r.upavasatiWithShakheCount || 0), 0),
    upavasatiWithoutShakheCount: rows.reduce((n, r) => n + (r.upavasatiWithoutShakheCount || 0), 0),
    yojitaShakheCount: rows.reduce((n, r) => n + (r.yojitaShakheCount || 0), 0),
    nadayuthiruvaShakheCount: rows.reduce((n, r) => n + (r.nadayuthiruvaShakheCount || 0), 0),
    nadayadaShakheCount: rows.reduce((n, r) => n + (r.nadayadaShakheCount || 0), 0),
    daysRan: totalDays,
    averages: {
      taruna: avg(totalSums.taruna, totalDays),
      balaka: avg(totalSums.balaka, totalDays),
      shishu: avg(totalSums.shishu, totalDays),
      mataBhagi: avg(totalSums.mataBhagi, totalDays),
      total: avg(totalSums.taruna + totalSums.balaka, totalDays),
    },
    ottuSamparka: {
      manegalu: totalSums.samparkitaManegalu,
      vyaktigalu: totalSums.samparkitaVyaktigalu,
    },
  };

  // Strip internal sums before response
  const publicRows = rows.map((row) => {
    const { _sums, ...rest } = row;
    return rest;
  });

  return {
    nagar: { id: nagar._id.toString(), name: nagar.name },
    bhag,
    from: range.from,
    to: range.to,
    dayCount: range.dayCount,
    excludeSunday: range.excludeSunday,
    rows: publicRows,
    totals,
  };
}

async function listUpavasatisForNagara({ nagarId, vasatiId, filter }) {
  if (!isObjectId(nagarId)) return { error: 'Invalid nagara' };
  const nagar = await Entity.findById(nagarId);
  if (!nagar) return { error: 'Nagara not found', status: 404 };
  if ((await hierarchy.stharaName(nagar)) !== 'Nagar') return { error: 'Not a Nagara' };

  const kind = filter || 'all';
  if (!['all', 'with-shakhe', 'without-shakhe'].includes(kind)) {
    return { error: 'Invalid filter' };
  }
  if (vasatiId && !isObjectId(vasatiId)) return { error: 'Invalid vasati' };

  const { vasatis, gramsByVasati } = await loadGramsByVasati(nagarId);
  const query = { 'nagar.entity': nagarId };
  if (vasatiId) query['vasati.entity'] = vasatiId;
  const shakhes = await Shakhe.find(query)
    .select(
      '_id name timing time shakheType mukhashikshakPhone mukhashikshakName upavasati vasati'
    )
    .lean();
  const shakheService = require('./shakheService');
  const compactRows = shakhes.map((shakhe) => ({
    id: shakhe._id.toString(),
    name: shakhe.name,
    timing: shakhe.timing,
    time: shakhe.time,
    shakheType: shakhe.shakheType,
    mukhashikshakPhone: shakhe.mukhashikshakPhone,
    mukhashikshakName: shakhe.mukhashikshakName || null,
    upavasatiId:
      shakhe.upavasati && shakhe.upavasati.entity ? shakhe.upavasati.entity.toString() : '',
  }));
  const enriched = await shakheService.withPeopleNames(compactRows);

  const shakhesByGram = new Map();
  for (const shakhe of enriched) {
    const gid = shakhe.upavasatiId || '';
    if (!gid) continue;
    if (!shakhesByGram.has(gid)) shakhesByGram.set(gid, []);
    shakhesByGram.get(gid).push({
      id: shakhe.id,
      name: shakhe.name,
      timing: shakhe.timing,
      time: shakhe.time,
      shakheType: shakhe.shakheType,
      mukhashikshakPhone: shakhe.mukhashikshakPhone,
      mukhashikshakName: shakhe.mukhashikshakName,
    });
  }

  const targetVasatis = vasatiId ? vasatis.filter((v) => v.id === vasatiId) : vasatis;
  if (vasatiId && !targetVasatis.length) return { error: 'Vasati not found', status: 404 };

  const items = [];
  for (const vasati of targetVasatis) {
    const grams = gramsByVasati.get(vasati.id) || new Map();
    for (const gram of grams.values()) {
      const gramShakhes = shakhesByGram.get(gram.id) || [];
      const shakheCount = gramShakhes.length;
      const hasShakhe = shakheCount > 0;
      if (kind === 'with-shakhe' && !hasShakhe) continue;
      if (kind === 'without-shakhe' && hasShakhe) continue;
      items.push({
        id: gram.id,
        name: gram.name,
        vasati: { id: vasati.id, name: vasati.name },
        shakheCount,
        shakheNames: gramShakhes.map((s) => s.name),
        shakhes: gramShakhes,
        hasShakhe,
      });
    }
  }

  items.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));

  return {
    nagar: { id: nagar._id.toString(), name: nagar.name },
    vasati: vasatiId && targetVasatis[0] ? targetVasatis[0] : null,
    filter: kind,
    upavasatis: items,
  };
}

function compactUpasthiti(entry) {
  if (!entry) return null;
  const boudhik = Array.isArray(entry.boudhik) ? entry.boudhik : [];
  const sharirik = Array.isArray(entry.sharirik) ? entry.sharirik : [];
  return {
    taruna: entry.taruna || 0,
    balaka: entry.balaka || 0,
    shishu: entry.shishu || 0,
    mataBhagi: entry.mataBhagi || 0,
    total: (entry.taruna || 0) + (entry.balaka || 0),
    samparkitaManegalu: entry.samparkitaManegalu == null ? null : entry.samparkitaManegalu,
    samparkitaVyaktigalu: entry.samparkitaVyaktigalu == null ? null : entry.samparkitaVyaktigalu,
    boudhik,
    sharirik,
    boudhikCount: boudhik.length,
    sharirikCount: sharirik.length,
    boudhikItara: entry.boudhikItara || null,
    sharirikItara: entry.sharirikItara || null,
    seva: Boolean(entry.seva),
  };
}

function emptyItemCounts(catalog) {
  const out = {};
  for (const item of catalog) out[item.id] = 0;
  return out;
}

function addProgramCounts(counts, entry, field) {
  const list = Array.isArray(entry[field]) ? entry[field] : [];
  for (const id of list) {
    if (Object.prototype.hasOwnProperty.call(counts, id)) counts[id] += 1;
  }
  return counts;
}

async function reportProgramForNagara(nagarId, programKind, fromDate, toDate, excludeSunday) {
  if (!isObjectId(nagarId)) return { error: 'Invalid nagara' };
  if (programKind !== 'boudhik' && programKind !== 'sharirik') {
    return { error: 'Invalid program kind' };
  }
  const { BOUDHIK, SHARIRIK } = require('./ashtabindu');
  const catalog = programKind === 'boudhik' ? BOUDHIK : SHARIRIK;
  const field = programKind;

  const nagar = await Entity.findById(nagarId);
  if (!nagar) return { error: 'Nagara not found', status: 404 };
  if ((await hierarchy.stharaName(nagar)) !== 'Nagar') return { error: 'Not a Nagara' };

  const range = parseDateRange(fromDate, toDate, excludeSunday);
  if (range.error) return range;

  const [{ vasatis, gramsByVasati }, shakhes, bhag] = await Promise.all([
    loadGramsByVasati(nagarId),
    Shakhe.find({ 'nagar.entity': nagarId }).select('_id vasati upavasati').lean(),
    parentEntityRef(nagar._id),
  ]);

  const shakheIds = shakhes.map((s) => s._id);
  const rawEntries = shakheIds.length
    ? await ShakheUpasthiti.find({
        shakhe: { $in: shakheIds },
        date: { $gte: range.from, $lte: range.to },
      }).lean()
    : [];
  const entries = filterEntriesExcludeSunday(rawEntries, range.excludeSunday);

  const entriesByShakhe = new Map();
  for (const entry of entries) {
    const sid = entry.shakhe.toString();
    if (!entriesByShakhe.has(sid)) entriesByShakhe.set(sid, []);
    entriesByShakhe.get(sid).push(entry);
  }

  const shakhesByVasati = new Map(vasatis.map((v) => [v.id, []]));
  for (const shakhe of shakhes) {
    const vasatiId = shakhe.vasati && shakhe.vasati.entity ? shakhe.vasati.entity.toString() : '';
    if (shakhesByVasati.has(vasatiId)) shakhesByVasati.get(vasatiId).push(shakhe);
  }

  const rows = vasatis.map((vasati) => {
    const vasatiShakhes = shakhesByVasati.get(vasati.id) || [];
    const vasatiEntries = [];
    let nadayuthiruva = 0;
    for (const shakhe of vasatiShakhes) {
      const list = entriesByShakhe.get(shakhe._id.toString()) || [];
      if (list.length) nadayuthiruva += 1;
      for (const e of list) vasatiEntries.push(e);
    }
    const itemCounts = emptyItemCounts(catalog);
    for (const e of vasatiEntries) addProgramCounts(itemCounts, e, field);
    const grams = gramsByVasati.get(vasati.id) || new Map();
    return {
      vasati,
      upavasatiCount: grams.size,
      yojitaShakheCount: vasatiShakhes.length,
      nadayuthiruvaShakheCount: nadayuthiruva,
      daysRan: vasatiEntries.length,
      itemCounts,
    };
  });

  const totalCounts = emptyItemCounts(catalog);
  for (const e of entries) addProgramCounts(totalCounts, e, field);
  const totals = {
    upavasatiCount: rows.reduce((n, r) => n + (r.upavasatiCount || 0), 0),
    yojitaShakheCount: rows.reduce((n, r) => n + (r.yojitaShakheCount || 0), 0),
    nadayuthiruvaShakheCount: rows.reduce((n, r) => n + (r.nadayuthiruvaShakheCount || 0), 0),
    daysRan: entries.length,
    itemCounts: totalCounts,
  };

  return {
    kind: programKind,
    catalog: catalog.map((item) => ({ id: item.id, kn: item.kn, en: item.en })),
    nagar: { id: nagar._id.toString(), name: nagar.name },
    bhag,
    from: range.from,
    to: range.to,
    dayCount: range.dayCount,
    excludeSunday: range.excludeSunday,
    rows,
    totals,
  };
}

async function listShakhesForNagara({
  nagarId,
  vasatiId,
  shakheId,
  filter,
  fromDate,
  toDate,
  excludeSunday,
}) {
  if (!isObjectId(nagarId)) return { error: 'Invalid nagara' };
  const nagar = await Entity.findById(nagarId);
  if (!nagar) return { error: 'Nagara not found', status: 404 };
  if ((await hierarchy.stharaName(nagar)) !== 'Nagar') return { error: 'Not a Nagara' };

  const kind = filter || 'all';
  if (!['all', 'running', 'not-running', 'varadi'].includes(kind)) return { error: 'Invalid filter' };
  if (vasatiId && !isObjectId(vasatiId)) return { error: 'Invalid vasati' };
  if (shakheId && !isObjectId(shakheId)) return { error: 'Invalid shakhe' };

  let from = null;
  let to = null;
  let dayCount = 0;
  let rangeDays = null;
  let skipSunday = Boolean(excludeSunday);
  const needsRange = kind === 'running' || kind === 'not-running' || kind === 'varadi' || Boolean(shakheId);
  if (needsRange) {
    const range = parseDateRange(fromDate, toDate, excludeSunday);
    if (range.error) return range;
    from = range.from;
    to = range.to;
    dayCount = range.dayCount;
    rangeDays = range.days;
    skipSunday = range.excludeSunday;
  }

  const query = { 'nagar.entity': nagarId };
  if (vasatiId) query['vasati.entity'] = vasatiId;
  if (shakheId) query._id = shakheId;
  const shakhes = await Shakhe.find(query).sort({ name: 1 }).lean();
  if (shakheId && !shakhes.length) return { error: 'Shakhe not found', status: 404 };
  const shakheService = require('./shakheService');
  const serialized = await shakheService.withPeopleNames(shakhes.map(shakheService.serialize));

  let entriesByShakhe = new Map();
  if (from && to && shakhes.length) {
    const rawEntries = await ShakheUpasthiti.find({
      shakhe: { $in: shakhes.map((s) => s._id) },
      date: { $gte: from, $lte: to },
    })
      .sort({ date: 1 })
      .lean();
    const entries = filterEntriesExcludeSunday(rawEntries, skipSunday);
    for (const entry of entries) {
      const sid = entry.shakhe.toString();
      if (!entriesByShakhe.has(sid)) entriesByShakhe.set(sid, []);
      entriesByShakhe.get(sid).push(entry);
    }
  }

  const includeDays = kind === 'varadi' || Boolean(shakheId);
  const items = [];
  const pooledEntries = [];
  for (const shakhe of serialized) {
    const list = entriesByShakhe.get(shakhe.id) || [];
    const running = list.length > 0;
    if (kind === 'running' && !running) continue;
    if (kind === 'not-running' && running) continue;

    const daysRan = list.length;
    const sums = list.reduce((acc, e) => addEntrySums(acc, e), emptySums());
    const item = {
      ...shakhe,
      daysRan,
      daysSelected: dayCount,
      running,
      averages: {
        taruna: avg(sums.taruna, daysRan),
        balaka: avg(sums.balaka, daysRan),
        shishu: avg(sums.shishu, daysRan),
        mataBhagi: avg(sums.mataBhagi, daysRan),
        total: avg(sums.taruna + sums.balaka, daysRan),
      },
      ottuSamparka: {
        manegalu: sums.samparkitaManegalu,
        vyaktigalu: sums.samparkitaVyaktigalu,
      },
    };
    if (includeDays && rangeDays) {
      const byDate = new Map(list.map((e) => [e.date, e]));
      item.days = rangeDays.map((date) => ({
        date,
        upasthiti: compactUpasthiti(byDate.get(date) || null),
      }));
    }
    for (const e of list) pooledEntries.push(e);
    items.push(item);
  }

  let vasati = null;
  if (vasatiId) {
    const hit = items[0] && items[0].vasati;
    if (hit) vasati = { id: hit.id, name: hit.name };
    else {
      const ent = await Entity.findById(vasatiId).select('name').lean();
      if (ent) vasati = { id: ent._id.toString(), name: ent.name };
    }
  }

  const pooledSums = pooledEntries.reduce((acc, e) => addEntrySums(acc, e), emptySums());
  const pooledDays = pooledEntries.length;
  const totals = {
    shakheCount: items.length,
    daysRan: pooledDays,
    daysSelected: dayCount,
    averages: {
      taruna: avg(pooledSums.taruna, pooledDays),
      balaka: avg(pooledSums.balaka, pooledDays),
      shishu: avg(pooledSums.shishu, pooledDays),
      mataBhagi: avg(pooledSums.mataBhagi, pooledDays),
      total: avg(pooledSums.taruna + pooledSums.balaka, pooledDays),
    },
    ottuSamparka: {
      manegalu: pooledSums.samparkitaManegalu,
      vyaktigalu: pooledSums.samparkitaVyaktigalu,
    },
  };

  return {
    nagar: { id: nagar._id.toString(), name: nagar.name },
    vasati,
    filter: kind,
    from,
    to,
    dayCount,
    excludeSunday: skipSunday,
    shakhes: items,
    totals,
  };
}

module.exports = {
  reportForNagara,
  reportProgramForNagara,
  listUpavasatisForNagara,
  listShakhesForNagara,
  parseDateRange,
};
