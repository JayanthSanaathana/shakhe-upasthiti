const Entity = require('../models/Entity');
const ParentEntity = require('../models/ParentEntity');
const Sthara = require('../models/Sthara');
const Shakhe = require('../models/Shakhe');
const ShakheUpasthiti = require('../models/ShakheUpasthiti');
const hierarchy = require('./hierarchy');
const { displayEntityName } = hierarchy;
const { isObjectId } = require('./safe');
const {
  shakheVisibleInDays,
  filterEntriesByShakheVisibility,
  intervalsByShakheId,
} = require('./reportVisibility');

/** Drop shakhes fully hidden for the report days; drop entries on hidden days. */
function applyShakheReportVisibility(shakhes, entries, rangeDays) {
  const days = rangeDays || [];
  const visibleShakhes = (shakhes || []).filter((s) =>
    shakheVisibleInDays(s.reportHideIntervals || [], days)
  );
  const visibleIds = new Set(visibleShakhes.map((s) => String(s._id)));
  const intervalsMap = intervalsByShakheId(shakhes);
  const visibleEntries = filterEntriesByShakheVisibility(entries || [], intervalsMap).filter((e) =>
    visibleIds.has(String(e.shakhe))
  );
  return { shakhes: visibleShakhes, entries: visibleEntries };
}

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

const AVG_KEYS = ['taruna', 'balaka', 'shishu', 'mataBhagi', 'total'];

function emptyAverages() {
  return { taruna: null, balaka: null, shishu: null, mataBhagi: null, total: null };
}

/** Sum already-ceiled child Sarisumaru values (null → 0). */
function sumAverages(list) {
  const out = { taruna: 0, balaka: 0, shishu: 0, mataBhagi: 0, total: 0 };
  let any = false;
  for (const a of list || []) {
    if (!a) continue;
    any = true;
    for (const k of AVG_KEYS) out[k] += Number(a[k]) || 0;
  }
  if (!any) return emptyAverages();
  return out;
}

/** Bhag total ÷ days selected (ceil), used for vibhag/prant child rows. */
function averagesDividedByDays(summed, dayCount) {
  if (!summed || !dayCount) return emptyAverages();
  // No nagara data under this child → keep blank (not zeros).
  if (AVG_KEYS.every((k) => summed[k] == null)) return emptyAverages();
  return {
    taruna: avg(Number(summed.taruna) || 0, dayCount),
    balaka: avg(Number(summed.balaka) || 0, dayCount),
    shishu: avg(Number(summed.shishu) || 0, dayCount),
    mataBhagi: avg(Number(summed.mataBhagi) || 0, dayCount),
    total: avg(Number(summed.total) || 0, dayCount),
  };
}

function sumOttu(list) {
  let manegalu = 0;
  let vyaktigalu = 0;
  for (const o of list || []) {
    if (!o) continue;
    manegalu += Number(o.manegalu) || 0;
    vyaktigalu += Number(o.vyaktigalu) || 0;
  }
  return { manegalu, vyaktigalu };
}

/** Nagara Sarisumaru from its shakhe attendance entries (same basis as nagara report totals). */
function averagesFromShakheGroup(shakhes, entriesByShakhe) {
  const groupEntries = [];
  for (const shakhe of shakhes || []) {
    const list = entriesByShakhe.get(shakhe._id.toString()) || [];
    for (const e of list) groupEntries.push(e);
  }
  const metrics = metricsFromEntries(new Set(), groupEntries);
  return {
    averages: metrics.averages,
    ottuSamparka: metrics.ottuSamparka,
    daysRan: metrics.daysRan,
    _sums: metrics._sums,
  };
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
    if (map && child) map.set(childId, { id: childId, name: displayEntityName(child.name) });
  }

  return { vasatis, gramsByVasati };
}

async function parentEntityRef(entityId) {
  const edge = await ParentEntity.findOne({ currentEntity: entityId }).lean();
  if (!edge) return null;
  const parent = await Entity.findById(edge.parentEntity).select('name').lean();
  return parent ? { id: parent._id.toString(), name: displayEntityName(parent.name) } : null;
}

function placedName(ref) {
  if (!ref || !ref.entity) return null;
  return { id: ref.entity.toString(), name: displayEntityName(ref.name) };
}

async function reportForNagara(nagarId, fromDate, toDate, excludeSunday) {
  if (!isObjectId(nagarId)) return { error: 'Invalid nagara' };
  const nagar = await Entity.findById(nagarId);
  if (!nagar) return { error: 'Nagara not found', status: 404 };
  if ((await hierarchy.stharaName(nagar)) !== 'Nagar') return { error: 'Not a Nagara' };

  const range = parseDateRange(fromDate, toDate, excludeSunday);
  if (range.error) return range;

  const [{ vasatis, gramsByVasati }, rawShakhes, bhag] = await Promise.all([
    loadGramsByVasati(nagarId),
    Shakhe.find({ 'nagar.entity': nagarId })
      .select('_id vasati upavasati reportHideIntervals')
      .lean(),
    parentEntityRef(nagar._id),
  ]);

  const shakheIdsAll = rawShakhes.map((s) => s._id);
  const rawEntries = shakheIdsAll.length
    ? await ShakheUpasthiti.find({
        shakhe: { $in: shakheIdsAll },
        date: { $gte: range.from, $lte: range.to },
      }).lean()
    : [];
  const entriesRaw = filterEntriesExcludeSunday(rawEntries, range.excludeSunday);
  const { shakhes, entries } = applyShakheReportVisibility(rawShakhes, entriesRaw, range.days);

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
      daysRanBuckets: daysRanBucketsForShakhes(vasatiShakhes, entriesByShakhe, range.dayCount),
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
    daysRanBuckets: sumDaysRanBuckets(rows, range.dayCount),
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
    level: 'nagara',
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

/** Count running shakhes that selected each program item at least once. */
function itemShakheCountsFromGroup(catalog, shakhes, entriesByShakhe, field) {
  const counts = emptyItemCounts(catalog);
  for (const shakhe of shakhes || []) {
    const list = entriesByShakhe.get(shakhe._id.toString()) || [];
    if (!list.length) continue;
    const seen = new Set();
    for (const entry of list) {
      const items = Array.isArray(entry[field]) ? entry[field] : [];
      for (const id of items) {
        if (Object.prototype.hasOwnProperty.call(counts, id)) seen.add(id);
      }
    }
    for (const id of seen) counts[id] += 1;
  }
  return counts;
}

function sumItemCounts(catalog, rows) {
  const totals = emptyItemCounts(catalog);
  for (const row of rows || []) {
    const counts = row.itemCounts || {};
    for (const item of catalog) {
      totals[item.id] += counts[item.id] || 0;
    }
  }
  return totals;
}

/** Unique calendar days with at least one entry (not sum of shakhe-days). */
function uniqueDaysCount(entries) {
  const days = new Set();
  for (const entry of entries || []) {
    if (entry && entry.date) days.add(String(entry.date));
  }
  return days.size;
}

/** Count shakhes by how many unique days they ran (0..maxDays). */
function daysRanBucketsForShakhes(shakhes, entriesByShakhe, maxDays) {
  const max = Math.max(0, Number(maxDays) || 0);
  const buckets = Array.from({ length: max + 1 }, () => 0);
  for (const shakhe of shakhes || []) {
    const list = entriesByShakhe.get(shakhe._id.toString()) || [];
    const ran = Math.min(uniqueDaysCount(list), max);
    buckets[ran] += 1;
  }
  return buckets;
}

function sumDaysRanBuckets(rows, maxDays) {
  const max = Math.max(0, Number(maxDays) || 0);
  const totals = Array.from({ length: max + 1 }, () => 0);
  for (const row of rows || []) {
    const buckets = row.daysRanBuckets || [];
    for (let i = 0; i <= max; i += 1) totals[i] += buckets[i] || 0;
  }
  return totals;
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

  const [{ vasatis, gramsByVasati }, rawShakhes, bhag] = await Promise.all([
    loadGramsByVasati(nagarId),
    Shakhe.find({ 'nagar.entity': nagarId })
      .select('_id vasati upavasati reportHideIntervals')
      .lean(),
    parentEntityRef(nagar._id),
  ]);

  const shakheIdsAll = rawShakhes.map((s) => s._id);
  const rawEntries = shakheIdsAll.length
    ? await ShakheUpasthiti.find({
        shakhe: { $in: shakheIdsAll },
        date: { $gte: range.from, $lte: range.to },
      }).lean()
    : [];
  const entriesRaw = filterEntriesExcludeSunday(rawEntries, range.excludeSunday);
  const { shakhes, entries } = applyShakheReportVisibility(rawShakhes, entriesRaw, range.days);

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
    const itemCounts = itemShakheCountsFromGroup(catalog, vasatiShakhes, entriesByShakhe, field);
    const grams = gramsByVasati.get(vasati.id) || new Map();
    return {
      vasati,
      upavasatiCount: grams.size,
      yojitaShakheCount: vasatiShakhes.length,
      nadayuthiruvaShakheCount: nadayuthiruva,
      nadayadaShakheCount: Math.max(0, vasatiShakhes.length - nadayuthiruva),
      itemCounts,
    };
  });

  const totals = {
    upavasatiCount: rows.reduce((n, r) => n + (r.upavasatiCount || 0), 0),
    yojitaShakheCount: rows.reduce((n, r) => n + (r.yojitaShakheCount || 0), 0),
    nadayuthiruvaShakheCount: rows.reduce((n, r) => n + (r.nadayuthiruvaShakheCount || 0), 0),
    nadayadaShakheCount: rows.reduce((n, r) => n + (r.nadayadaShakheCount || 0), 0),
    itemCounts: sumItemCounts(catalog, rows),
  };

  return {
    kind: programKind,
    level: 'nagara',
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
  daysRanExact,
}) {
  if (!isObjectId(nagarId)) return { error: 'Invalid nagara' };
  const nagar = await Entity.findById(nagarId);
  if (!nagar) return { error: 'Nagara not found', status: 404 };
  if ((await hierarchy.stharaName(nagar)) !== 'Nagar') return { error: 'Not a Nagara' };

  const kind = filter || 'all';
  if (!['all', 'running', 'not-running', 'varadi', 'days-ran'].includes(kind)) {
    return { error: 'Invalid filter' };
  }
  if (vasatiId && !isObjectId(vasatiId)) return { error: 'Invalid vasati' };
  if (shakheId && !isObjectId(shakheId)) return { error: 'Invalid shakhe' };
  const exactDays =
    daysRanExact == null || daysRanExact === '' ? null : Number(daysRanExact);
  if (kind === 'days-ran' && (!Number.isFinite(exactDays) || exactDays < 0)) {
    return { error: 'Invalid daysRanExact' };
  }

  let from = null;
  let to = null;
  let dayCount = 0;
  let rangeDays = null;
  let skipSunday = Boolean(excludeSunday);
  const needsRange =
    kind === 'running' ||
    kind === 'not-running' ||
    kind === 'varadi' ||
    kind === 'days-ran' ||
    Boolean(shakheId);
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
  let shakhes = await Shakhe.find(query).sort({ name: 1 }).lean();
  if (shakheId && !shakhes.length) return { error: 'Shakhe not found', status: 404 };

  let entriesByShakhe = new Map();
  if (from && to && shakhes.length) {
    const rawEntries = await ShakheUpasthiti.find({
      shakhe: { $in: shakhes.map((s) => s._id) },
      date: { $gte: from, $lte: to },
    })
      .sort({ date: 1 })
      .lean();
    const entriesRaw = filterEntriesExcludeSunday(rawEntries, skipSunday);
    const visible = applyShakheReportVisibility(shakhes, entriesRaw, rangeDays || []);
    shakhes = visible.shakhes;
    if (shakheId && !shakhes.length) {
      // Specific shakhe fully hidden for this range — still return empty days rather than 404.
      shakhes = await Shakhe.find(query).sort({ name: 1 }).lean();
      for (const entry of visible.entries) {
        const sid = entry.shakhe.toString();
        if (!entriesByShakhe.has(sid)) entriesByShakhe.set(sid, []);
        entriesByShakhe.get(sid).push(entry);
      }
    } else {
      for (const entry of visible.entries) {
        const sid = entry.shakhe.toString();
        if (!entriesByShakhe.has(sid)) entriesByShakhe.set(sid, []);
        entriesByShakhe.get(sid).push(entry);
      }
    }
  } else if (!from && !shakheId) {
    // No date range (plain list): hide currently-hidden shakhes.
    shakhes = shakhes.filter((s) => shakheVisibleInDays(s.reportHideIntervals || [], []));
  }

  const shakheService = require('./shakheService');
  const serialized = await shakheService.withPeopleNames(shakhes.map(shakheService.serialize));

  const includeDays = kind === 'varadi' || Boolean(shakheId);
  const items = [];
  const pooledEntries = [];
  for (const shakhe of serialized) {
    const list = entriesByShakhe.get(shakhe.id) || [];
    const daysRan = uniqueDaysCount(list);
    const running = daysRan > 0;
    if (kind === 'running' && !running) continue;
    if (kind === 'not-running' && running) continue;
    if (kind === 'days-ran' && daysRan !== exactDays) continue;

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

function personSnap(raw) {
  if (!raw || (!raw.name && !raw.phone)) return null;
  return {
    name: raw.name || null,
    phone: raw.phone || null,
  };
}

function extrasForProgramHit(entry, programKind, itemId) {
  if (programKind === 'sharirik') {
    return {
      sharirikItara: itemId === 'itara' ? entry.sharirikItara || null : null,
    };
  }
  return {
    sannaKatheText: itemId === 'sannaKathe' ? entry.sannaKatheText || null : null,
    deerghaKatheText: itemId === 'deerghaKathe' ? entry.deerghaKatheText || null : null,
    boudhikPerson: itemId === 'boudhik' ? personSnap(entry.boudhikPerson) : null,
    charchePerson: itemId === 'charche' ? personSnap(entry.charchePerson) : null,
    boudhikItara: itemId === 'itara' ? entry.boudhikItara || null : null,
  };
}

async function listProgramItemHits({
  nagarId,
  vasatiId,
  programKind,
  itemId,
  fromDate,
  toDate,
  excludeSunday,
}) {
  if (!isObjectId(nagarId)) return { error: 'Invalid nagara' };
  if (programKind !== 'boudhik' && programKind !== 'sharirik') {
    return { error: 'Invalid program kind' };
  }
  const { BOUDHIK, SHARIRIK } = require('./ashtabindu');
  const catalog = programKind === 'boudhik' ? BOUDHIK : SHARIRIK;
  const item = catalog.find((c) => c.id === itemId);
  if (!item) return { error: 'Invalid program item' };
  if (vasatiId && !isObjectId(vasatiId)) return { error: 'Invalid vasati' };

  const nagar = await Entity.findById(nagarId);
  if (!nagar) return { error: 'Nagara not found', status: 404 };
  if ((await hierarchy.stharaName(nagar)) !== 'Nagar') return { error: 'Not a Nagara' };

  const range = parseDateRange(fromDate, toDate, excludeSunday);
  if (range.error) return range;

  const query = { 'nagar.entity': nagarId };
  if (vasatiId) query['vasati.entity'] = vasatiId;
  const rawShakhes = await Shakhe.find(query).sort({ name: 1 }).lean();
  const field = programKind;

  const rawEntries = rawShakhes.length
    ? await ShakheUpasthiti.find({
        shakhe: { $in: rawShakhes.map((s) => s._id) },
        date: { $gte: range.from, $lte: range.to },
        [field]: itemId,
      })
        .sort({ date: 1 })
        .lean()
    : [];
  const entriesRaw = filterEntriesExcludeSunday(rawEntries, range.excludeSunday);
  const { shakhes, entries } = applyShakheReportVisibility(rawShakhes, entriesRaw, range.days);

  const shakheById = new Map(shakhes.map((s) => [s._id.toString(), s]));
  const byShakhe = new Map();
  for (const entry of entries) {
    const sid = entry.shakhe.toString();
    const shakhe = shakheById.get(sid);
    if (!shakhe) continue;
    if (!byShakhe.has(sid)) {
      byShakhe.set(sid, {
        id: sid,
        name: shakhe.name,
        timing: shakhe.timing,
        time: shakhe.time,
        shakheType: shakhe.shakheType,
        upavasati: shakhe.upavasati
          ? { id: shakhe.upavasati.entity.toString(), name: shakhe.upavasati.name }
          : null,
        vasati: shakhe.vasati
          ? { id: shakhe.vasati.entity.toString(), name: shakhe.vasati.name }
          : null,
        days: [],
      });
    }
    byShakhe.get(sid).days.push({
      date: entry.date,
      ...extrasForProgramHit(entry, programKind, itemId),
    });
  }

  const shakheGroups = [...byShakhe.values()].sort((a, b) => {
    const ua = (a.upavasati && a.upavasati.name) || '';
    const ub = (b.upavasati && b.upavasati.name) || '';
    if (ua !== ub) return ua.localeCompare(ub);
    return String(a.name || '').localeCompare(String(b.name || ''));
  });

  // Group by upavasati for UI convenience
  const byUpavasati = new Map();
  for (const shakhe of shakheGroups) {
    const key = (shakhe.upavasati && shakhe.upavasati.id) || 'none';
    const name = (shakhe.upavasati && shakhe.upavasati.name) || '—';
    if (!byUpavasati.has(key)) {
      byUpavasati.set(key, { id: key === 'none' ? null : key, name, shakhes: [] });
    }
    byUpavasati.get(key).shakhes.push(shakhe);
  }

  let vasati = null;
  if (vasatiId) {
    const ent = await Entity.findById(vasatiId).select('name').lean();
    if (ent) vasati = { id: ent._id.toString(), name: ent.name };
  }

  return {
    kind: programKind,
    item: { id: item.id, kn: item.kn, en: item.en },
    nagar: { id: nagar._id.toString(), name: nagar.name },
    vasati,
    from: range.from,
    to: range.to,
    dayCount: range.dayCount,
    excludeSunday: range.excludeSunday,
    hitCount: entries.length,
    upavasatis: [...byUpavasati.values()],
    shakhes: shakheGroups,
  };
}

/**
 * Higher-level rollups: prant→vibhag rows, vibhag→bhag rows, bhag→nagar rows.
 * Sarisumaru hierarchy:
 *   - Nagara: computed from attendance (same as nagara report).
 *   - Bhag: each nagara’s Sarisumaru as-is; footer = sum of nagara Sarisumaru.
 *   - Vibhag: each bhag = (sum of its nagara Sarisumaru) ÷ days selected; footer = sum of bhag rows.
 *   - Prant: each vibhag = (sum of its nagara Sarisumaru) ÷ days selected; footer = sum of vibhag rows.
 * Leaf nagara→vasati stays in reportForNagara / reportProgramForNagara.
 */
async function reportForParentLevel(level, entityId, fromDate, toDate, excludeSunday) {
  if (!isObjectId(entityId)) return { error: 'Invalid entity' };
  if (!['prant', 'vibhag', 'bhag'].includes(level)) return { error: 'Invalid level' };

  const Entity = require('../models/Entity');
  const root = await Entity.findById(entityId);
  if (!root) return { error: 'Entity not found', status: 404 };
  const expectedSthara = { prant: 'Prant', vibhag: 'Vibhag', bhag: 'Bhag' }[level];
  if ((await hierarchy.stharaName(root)) !== expectedSthara) {
    return { error: `Not a ${expectedSthara}` };
  }

  const range = parseDateRange(fromDate, toDate, excludeSunday);
  if (range.error) return range;

  const childSthara = { prant: 'Vibhag', vibhag: 'Bhag', bhag: 'Nagar' }[level];
  const childKey = { Vibhag: 'vibhag', Bhag: 'bhag', Nagar: 'nagar' }[childSthara];
  const children = await hierarchy.descendantsOfSthara(entityId, childSthara);
  const childIds = children.map((c) => c.id);

  const shakheQuery =
    level === 'prant'
      ? { 'vibhag.entity': { $in: childIds } }
      : level === 'vibhag'
        ? { 'bhag.entity': { $in: childIds } }
        : { 'nagar.entity': { $in: childIds } };

  const rawShakhes = childIds.length
    ? await Shakhe.find(shakheQuery)
        .select('_id vibhag bhag nagar vasati upavasati reportHideIntervals')
        .lean()
    : [];
  const shakheIdsAll = rawShakhes.map((s) => s._id);
  const rawEntries = shakheIdsAll.length
    ? await ShakheUpasthiti.find({
        shakhe: { $in: shakheIdsAll },
        date: { $gte: range.from, $lte: range.to },
      }).lean()
    : [];
  const entriesRaw = filterEntriesExcludeSunday(rawEntries, range.excludeSunday);
  const { shakhes, entries } = applyShakheReportVisibility(rawShakhes, entriesRaw, range.days);
  const entriesByShakhe = new Map();
  for (const entry of entries) {
    const sid = entry.shakhe.toString();
    if (!entriesByShakhe.has(sid)) entriesByShakhe.set(sid, []);
    entriesByShakhe.get(sid).push(entry);
  }

  // Nagara-level Sarisumaru for every nagara under this scope.
  const shakhesByNagar = new Map();
  for (const shakhe of shakhes) {
    const nid =
      shakhe.nagar && shakhe.nagar.entity ? shakhe.nagar.entity.toString() : '';
    if (!nid) continue;
    if (!shakhesByNagar.has(nid)) shakhesByNagar.set(nid, []);
    shakhesByNagar.get(nid).push(shakhe);
  }
  const nagaraMetrics = new Map();
  for (const [nid, group] of shakhesByNagar) {
    nagaraMetrics.set(nid, averagesFromShakheGroup(group, entriesByShakhe));
  }

  const shakhesByChild = new Map(childIds.map((id) => [id, []]));
  for (const shakhe of shakhes) {
    const placed = shakhe[childKey];
    const cid = placed && placed.entity ? placed.entity.toString() : '';
    if (shakhesByChild.has(cid)) shakhesByChild.get(cid).push(shakhe);
  }

  // For vibhag/prant rows: map child → nagara ids under that child.
  let nagarIdsByChild = null;
  if (level === 'vibhag' || level === 'prant') {
    nagarIdsByChild = new Map(childIds.map((id) => [id, []]));
    await Promise.all(
      children.map(async (child) => {
        const nagars = await hierarchy.descendantsOfSthara(child.id, 'Nagar');
        nagarIdsByChild.set(
          child.id,
          nagars.map((n) => n.id)
        );
      })
    );
  }

  const rows = children.map((child) => {
    const group = shakhesByChild.get(child.id) || [];
    let nadayuthiruva = 0;
    const upavasatiWithShakhe = new Set();
    let daysRan = 0;
    for (const shakhe of group) {
      const list = entriesByShakhe.get(shakhe._id.toString()) || [];
      if (list.length) nadayuthiruva += 1;
      daysRan += list.length;
      if (shakhe.upavasati && shakhe.upavasati.entity) {
        upavasatiWithShakhe.add(shakhe.upavasati.entity.toString());
      }
    }

    let averages;
    let ottuSamparka;
    if (level === 'bhag') {
      // Nagara Sarisumaru taken as-is.
      const m = nagaraMetrics.get(child.id) || averagesFromShakheGroup(group, entriesByShakhe);
      averages = m.averages;
      ottuSamparka = m.ottuSamparka;
      daysRan = m.daysRan;
    } else {
      // Vibhag/prant: sum of nagara Sarisumaru under this child, ÷ days selected.
      const nagarIds = nagarIdsByChild.get(child.id) || [];
      const childNagaraAvgs = nagarIds
        .map((nid) => nagaraMetrics.get(nid))
        .filter(Boolean);
      const summed = sumAverages(childNagaraAvgs.map((m) => m.averages));
      averages = averagesDividedByDays(summed, range.dayCount);
      ottuSamparka = sumOttu(childNagaraAvgs.map((m) => m.ottuSamparka));
    }

    return {
      [childKey]: child,
      upavasatiCount: upavasatiWithShakhe.size,
      yojitaShakheCount: group.length,
      nadayuthiruvaShakheCount: nadayuthiruva,
      nadayadaShakheCount: Math.max(0, group.length - nadayuthiruva),
      daysRan,
      daysRanBuckets: daysRanBucketsForShakhes(group, entriesByShakhe, range.dayCount),
      averages,
      ottuSamparka,
    };
  });

  // Footer: always sum of the displayed child Sarisumaru rows (and Ottu).
  const totals = {
    upavasatiCount: rows.reduce((n, r) => n + (r.upavasatiCount || 0), 0),
    yojitaShakheCount: rows.reduce((n, r) => n + (r.yojitaShakheCount || 0), 0),
    nadayuthiruvaShakheCount: rows.reduce((n, r) => n + (r.nadayuthiruvaShakheCount || 0), 0),
    nadayadaShakheCount: rows.reduce((n, r) => n + (r.nadayadaShakheCount || 0), 0),
    daysRan: rows.reduce((n, r) => n + (r.daysRan || 0), 0),
    daysRanBuckets: sumDaysRanBuckets(rows, range.dayCount),
    averages: sumAverages(rows.map((r) => r.averages)),
    ottuSamparka: sumOttu(rows.map((r) => r.ottuSamparka)),
  };

  const parent = await parentEntityRef(root._id);
  const envelope = {
    level,
    from: range.from,
    to: range.to,
    dayCount: range.dayCount,
    excludeSunday: range.excludeSunday,
    rows,
    totals,
  };
  if (level === 'prant') {
    envelope.prant = { id: root._id.toString(), name: root.name };
  } else if (level === 'vibhag') {
    envelope.vibhag = { id: root._id.toString(), name: root.name };
    envelope.prant = parent;
  } else {
    envelope.bhag = { id: root._id.toString(), name: root.name };
    envelope.vibhag = parent;
  }
  return envelope;
}

async function reportProgramForParentLevel(level, entityId, programKind, fromDate, toDate, excludeSunday) {
  if (!isObjectId(entityId)) return { error: 'Invalid entity' };
  if (!['prant', 'vibhag', 'bhag'].includes(level)) return { error: 'Invalid level' };
  if (programKind !== 'boudhik' && programKind !== 'sharirik') {
    return { error: 'Invalid program kind' };
  }
  const { BOUDHIK, SHARIRIK } = require('./ashtabindu');
  const catalog = programKind === 'boudhik' ? BOUDHIK : SHARIRIK;
  const field = programKind;

  const Entity = require('../models/Entity');
  const root = await Entity.findById(entityId);
  if (!root) return { error: 'Entity not found', status: 404 };
  const expectedSthara = { prant: 'Prant', vibhag: 'Vibhag', bhag: 'Bhag' }[level];
  if ((await hierarchy.stharaName(root)) !== expectedSthara) {
    return { error: `Not a ${expectedSthara}` };
  }

  const range = parseDateRange(fromDate, toDate, excludeSunday);
  if (range.error) return range;

  const childSthara = { prant: 'Vibhag', vibhag: 'Bhag', bhag: 'Nagar' }[level];
  const childKey = { Vibhag: 'vibhag', Bhag: 'bhag', Nagar: 'nagar' }[childSthara];
  const children = await hierarchy.descendantsOfSthara(entityId, childSthara);
  const childIds = children.map((c) => c.id);
  const shakheQuery =
    level === 'prant'
      ? { 'vibhag.entity': { $in: childIds } }
      : level === 'vibhag'
        ? { 'bhag.entity': { $in: childIds } }
        : { 'nagar.entity': { $in: childIds } };

  const rawShakhes = childIds.length
    ? await Shakhe.find(shakheQuery).select('_id vibhag bhag nagar reportHideIntervals').lean()
    : [];
  const shakheIdsAll = rawShakhes.map((s) => s._id);
  const rawEntries = shakheIdsAll.length
    ? await ShakheUpasthiti.find({
        shakhe: { $in: shakheIdsAll },
        date: { $gte: range.from, $lte: range.to },
      }).lean()
    : [];
  const entriesRaw = filterEntriesExcludeSunday(rawEntries, range.excludeSunday);
  const { shakhes, entries } = applyShakheReportVisibility(rawShakhes, entriesRaw, range.days);
  const entriesByShakhe = new Map();
  for (const entry of entries) {
    const sid = entry.shakhe.toString();
    if (!entriesByShakhe.has(sid)) entriesByShakhe.set(sid, []);
    entriesByShakhe.get(sid).push(entry);
  }
  const shakhesByChild = new Map(childIds.map((id) => [id, []]));
  for (const shakhe of shakhes) {
    const placed = shakhe[childKey];
    const cid = placed && placed.entity ? placed.entity.toString() : '';
    if (shakhesByChild.has(cid)) shakhesByChild.get(cid).push(shakhe);
  }

  const rows = children.map((child) => {
    const group = shakhesByChild.get(child.id) || [];
    const groupEntries = [];
    let nadayuthiruva = 0;
    for (const shakhe of group) {
      const list = entriesByShakhe.get(shakhe._id.toString()) || [];
      if (list.length) nadayuthiruva += 1;
      for (const e of list) groupEntries.push(e);
    }
    const itemCounts = itemShakheCountsFromGroup(catalog, group, entriesByShakhe, field);
    return {
      [childKey]: child,
      yojitaShakheCount: group.length,
      nadayuthiruvaShakheCount: nadayuthiruva,
      nadayadaShakheCount: Math.max(0, group.length - nadayuthiruva),
      itemCounts,
    };
  });

  const parent = await parentEntityRef(root._id);
  const envelope = {
    kind: programKind,
    level,
    catalog: catalog.map((item) => ({ id: item.id, kn: item.kn, en: item.en })),
    from: range.from,
    to: range.to,
    dayCount: range.dayCount,
    excludeSunday: range.excludeSunday,
    rows,
    totals: {
      yojitaShakheCount: rows.reduce((n, r) => n + (r.yojitaShakheCount || 0), 0),
      nadayuthiruvaShakheCount: rows.reduce((n, r) => n + (r.nadayuthiruvaShakheCount || 0), 0),
      nadayadaShakheCount: rows.reduce((n, r) => n + (r.nadayadaShakheCount || 0), 0),
      itemCounts: sumItemCounts(catalog, rows),
    },
  };
  if (level === 'prant') envelope.prant = { id: root._id.toString(), name: root.name };
  else if (level === 'vibhag') {
    envelope.vibhag = { id: root._id.toString(), name: root.name };
    envelope.prant = parent;
  } else {
    envelope.bhag = { id: root._id.toString(), name: root.name };
    envelope.vibhag = parent;
  }
  return envelope;
}

/**
 * Running shakhes under an entity, split by whether they did a program item.
 * Nested by lower hierarchy levels down to shakhe rows (name/time/hasItem).
 */
async function listProgramItemShakheSplit({
  level,
  entityId,
  vasatiId,
  programKind,
  itemId,
  fromDate,
  toDate,
  excludeSunday,
}) {
  if (!isObjectId(entityId)) return { error: 'Invalid entity' };
  if (!['prant', 'vibhag', 'bhag', 'nagara'].includes(level)) return { error: 'Invalid level' };
  if (programKind !== 'boudhik' && programKind !== 'sharirik') {
    return { error: 'Invalid program kind' };
  }
  const { BOUDHIK, SHARIRIK } = require('./ashtabindu');
  const catalog = programKind === 'boudhik' ? BOUDHIK : SHARIRIK;
  const item = catalog.find((c) => c.id === itemId);
  if (!item) return { error: 'Invalid program item' };
  if (vasatiId && !isObjectId(vasatiId)) return { error: 'Invalid vasati' };

  const Entity = require('../models/Entity');
  const root = await Entity.findById(entityId);
  if (!root) return { error: 'Entity not found', status: 404 };
  const expectedSthara = {
    prant: 'Prant',
    vibhag: 'Vibhag',
    bhag: 'Bhag',
    nagara: 'Nagar',
  }[level];
  if ((await hierarchy.stharaName(root)) !== expectedSthara) {
    return { error: `Not a ${expectedSthara}` };
  }

  const range = parseDateRange(fromDate, toDate, excludeSunday);
  if (range.error) return range;

  const parentField = { prant: 'vibhag', vibhag: 'vibhag', bhag: 'bhag', nagara: 'nagar' }[level];
  const shakheQuery = { [`${parentField}.entity`]: entityId };
  if (vasatiId) shakheQuery['vasati.entity'] = vasatiId;
  const rawShakhes = await Shakhe.find(shakheQuery)
    .select('_id name timing time shakheType vibhag bhag nagar vasati upavasati reportHideIntervals')
    .sort({ name: 1 })
    .lean();

  const field = programKind;
  const rawEntries = rawShakhes.length
    ? await ShakheUpasthiti.find({
        shakhe: { $in: rawShakhes.map((s) => s._id) },
        date: { $gte: range.from, $lte: range.to },
      })
        .sort({ date: 1 })
        .lean()
    : [];
  const entriesRaw = filterEntriesExcludeSunday(rawEntries, range.excludeSunday);
  const { shakhes, entries } = applyShakheReportVisibility(rawShakhes, entriesRaw, range.days);
  const entriesByShakhe = new Map();
  for (const entry of entries) {
    const sid = entry.shakhe.toString();
    if (!entriesByShakhe.has(sid)) entriesByShakhe.set(sid, []);
    entriesByShakhe.get(sid).push(entry);
  }

  const withItem = [];
  const withoutItem = [];
  for (const shakhe of shakhes) {
    const list = entriesByShakhe.get(shakhe._id.toString()) || [];
    if (!list.length) continue; // only nadayuthiruva
    const days = [];
    for (const entry of list) {
      const items = Array.isArray(entry[field]) ? entry[field] : [];
      if (items.includes(itemId)) {
        days.push({
          date: entry.date,
          ...extrasForProgramHit(entry, programKind, itemId),
        });
      }
    }
    const hasItem = days.length > 0;
    const row = {
      id: shakhe._id.toString(),
      name: shakhe.name,
      timing: shakhe.timing || null,
      time: shakhe.time || null,
      shakheType: shakhe.shakheType || null,
      hasItem,
      days,
      vibhag: placedName(shakhe.vibhag),
      bhag: placedName(shakhe.bhag),
      nagar: placedName(shakhe.nagar),
      vasati: placedName(shakhe.vasati),
      upavasati: placedName(shakhe.upavasati),
    };
    if (hasItem) withItem.push(row);
    else withoutItem.push(row);
  }

  const nestKeysForLevel = () => {
    if (vasatiId || level === 'nagara') return ['upavasati'];
    if (level === 'bhag') return ['nagar', 'vasati', 'upavasati'];
    if (level === 'vibhag') return ['bhag', 'nagar', 'vasati', 'upavasati'];
    return ['vibhag', 'bhag', 'nagar', 'vasati', 'upavasati'];
  };

  function nestShakhes(list, keys) {
    if (!keys.length) {
      return {
        shakhes: list
          .slice()
          .sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''))),
      };
    }
    const [key, ...rest] = keys;
    const buckets = new Map();
    for (const row of list) {
      const ent = row[key];
      const id = (ent && ent.id) || 'none';
      const name = (ent && ent.name) || '—';
      if (!buckets.has(id)) buckets.set(id, { id: id === 'none' ? null : id, name, rows: [] });
      buckets.get(id).rows.push(row);
    }
    const groups = [...buckets.values()]
      .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')))
      .map((g) => {
        const nested = nestShakhes(g.rows, rest);
        return {
          id: g.id,
          name: g.name,
          key,
          count: g.rows.length,
          ...nested,
        };
      });
    return { groups };
  }

  const nestKeys = nestKeysForLevel();
  return {
    kind: programKind,
    level,
    item: { id: item.id, kn: item.kn, en: item.en },
    entity: { id: root._id.toString(), name: root.name },
    vasati: vasatiId
      ? (() => {
          const hit = withItem.concat(withoutItem).find((s) => s.vasati && s.vasati.id === vasatiId);
          return hit && hit.vasati
            ? hit.vasati
            : { id: vasatiId, name: null };
        })()
      : null,
    from: range.from,
    to: range.to,
    dayCount: range.dayCount,
    excludeSunday: range.excludeSunday,
    nestKeys,
    nadayuthiruvaShakheCount: withItem.length + withoutItem.length,
    withItem: {
      count: withItem.length,
      ...nestShakhes(withItem, nestKeys),
    },
    withoutItem: {
      count: withoutItem.length,
      ...nestShakhes(withoutItem, nestKeys),
    },
  };
}

/**
 * All yojita shakhes under an entity, split by running vs not in the date range.
 * Same nested/flat shape as listProgramItemShakheSplit (hasItem === running).
 */
async function listShakheStatusSplit({
  level,
  entityId,
  vasatiId,
  fromDate,
  toDate,
  excludeSunday,
  daysRanExact,
}) {
  if (!isObjectId(entityId)) return { error: 'Invalid entity' };
  if (!['prant', 'vibhag', 'bhag', 'nagara'].includes(level)) return { error: 'Invalid level' };
  if (vasatiId && !isObjectId(vasatiId)) return { error: 'Invalid vasati' };
  const exactDays =
    daysRanExact == null || daysRanExact === '' ? null : Number(daysRanExact);
  if (exactDays != null && (!Number.isFinite(exactDays) || exactDays < 0)) {
    return { error: 'Invalid daysRanExact' };
  }

  const Entity = require('../models/Entity');
  const root = await Entity.findById(entityId);
  if (!root) return { error: 'Entity not found', status: 404 };
  const expectedSthara = {
    prant: 'Prant',
    vibhag: 'Vibhag',
    bhag: 'Bhag',
    nagara: 'Nagar',
  }[level];
  if ((await hierarchy.stharaName(root)) !== expectedSthara) {
    return { error: `Not a ${expectedSthara}` };
  }

  const range = parseDateRange(fromDate, toDate, excludeSunday);
  if (range.error) return range;

  const parentField = { prant: 'vibhag', vibhag: 'vibhag', bhag: 'bhag', nagara: 'nagar' }[level];
  const shakheQuery = { [`${parentField}.entity`]: entityId };
  if (vasatiId) shakheQuery['vasati.entity'] = vasatiId;
  const rawShakhes = await Shakhe.find(shakheQuery)
    .select(
      '_id name timing time shakheType stanaName location setupComplete vibhag bhag nagar vasati upavasati reportHideIntervals'
    )
    .sort({ name: 1 })
    .lean();

  const rawEntries = rawShakhes.length
    ? await ShakheUpasthiti.find({
        shakhe: { $in: rawShakhes.map((s) => s._id) },
        date: { $gte: range.from, $lte: range.to },
      }).lean()
    : [];
  const entriesRaw = filterEntriesExcludeSunday(rawEntries, range.excludeSunday);
  const { shakhes, entries } = applyShakheReportVisibility(rawShakhes, entriesRaw, range.days);
  const entriesByShakhe = new Map();
  for (const entry of entries) {
    const sid = entry.shakhe.toString();
    if (!entriesByShakhe.has(sid)) entriesByShakhe.set(sid, []);
    entriesByShakhe.get(sid).push(entry);
  }

  const withItem = [];
  const withoutItem = [];
  for (const shakhe of shakhes) {
    const list = entriesByShakhe.get(shakhe._id.toString()) || [];
    const daysRan = uniqueDaysCount(list);
    if (exactDays != null && daysRan !== exactDays) continue;
    const running = daysRan > 0;
    const sums = list.reduce((acc, e) => addEntrySums(acc, e), emptySums());
    const row = {
      id: shakhe._id.toString(),
      name: shakhe.name,
      timing: shakhe.timing || null,
      time: shakhe.time || null,
      shakheType: shakhe.shakheType || null,
      stanaName: shakhe.stanaName || null,
      location: shakhe.location || null,
      setupComplete: Boolean(shakhe.setupComplete),
      hasItem: running,
      daysRan,
      daysSelected: range.dayCount,
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
      vibhag: placedName(shakhe.vibhag),
      bhag: placedName(shakhe.bhag),
      nagar: placedName(shakhe.nagar),
      vasati: placedName(shakhe.vasati),
      upavasati: placedName(shakhe.upavasati),
    };
    if (running) withItem.push(row);
    else withoutItem.push(row);
  }

  const nestKeys = vasatiId
    ? ['upavasati']
    : level === 'nagara'
      ? ['vasati', 'upavasati']
      : level === 'bhag'
        ? ['nagar', 'vasati', 'upavasati']
        : level === 'vibhag'
          ? ['bhag', 'nagar', 'vasati', 'upavasati']
          : ['vibhag', 'bhag', 'nagar', 'vasati', 'upavasati'];

  function nestShakhes(list, keys) {
    if (!keys.length) {
      return {
        shakhes: list
          .slice()
          .sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''))),
      };
    }
    const [key, ...rest] = keys;
    const buckets = new Map();
    for (const row of list) {
      const ent = row[key];
      const id = (ent && ent.id) || 'none';
      const name = (ent && ent.name) || '—';
      if (!buckets.has(id)) buckets.set(id, { id: id === 'none' ? null : id, name, rows: [] });
      buckets.get(id).rows.push(row);
    }
    const groups = [...buckets.values()]
      .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')))
      .map((g) => {
        const nested = nestShakhes(g.rows, rest);
        return {
          id: g.id,
          name: g.name,
          key,
          count: g.rows.length,
          ...nested,
        };
      });
    return { groups };
  }

  return {
    level,
    entity: { id: root._id.toString(), name: root.name },
    vasati: vasatiId
      ? (() => {
          const hit = withItem.concat(withoutItem).find((s) => s.vasati && s.vasati.id === vasatiId);
          return hit && hit.vasati ? hit.vasati : { id: vasatiId, name: null };
        })()
      : null,
    from: range.from,
    to: range.to,
    dayCount: range.dayCount,
    excludeSunday: range.excludeSunday,
    nestKeys,
    yojitaShakheCount: withItem.length + withoutItem.length,
    nadayuthiruvaShakheCount: withItem.length,
    nadayadaShakheCount: withoutItem.length,
    withItem: {
      count: withItem.length,
      ...nestShakhes(withItem, nestKeys),
    },
    withoutItem: {
      count: withoutItem.length,
      ...nestShakhes(withoutItem, nestKeys),
    },
  };
}

module.exports = {
  reportForNagara,
  reportProgramForNagara,
  reportForParentLevel,
  reportProgramForParentLevel,
  listUpavasatisForNagara,
  listShakhesForNagara,
  listProgramItemHits,
  listProgramItemShakheSplit,
  listShakheStatusSplit,
  parseDateRange,
};
