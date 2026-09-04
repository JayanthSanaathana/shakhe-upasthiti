const Shakhe = require('../models/Shakhe');
const ShakheUpasthiti = require('../models/ShakheUpasthiti');
const { isObjectId, nonNegInt, clipText } = require('./safe');
const { stampCreate, stampUpdate } = require('./audit');
const { confirmShakhePhone, serialize: serializeShakhe } = require('./shakheService');
const { BOUDHIK, SHARIRIK, pickItems } = require('./ashtabindu');
const { searchPeople } = require('./peopleSearch');

function todayIst(now = new Date()) {
  return now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

function digits(value) {
  return String(value == null ? '' : value).replace(/\D/g, '');
}

function optionalNonNegInt(value, label) {
  if (value == null || value === '') return { value: null };
  return nonNegInt(value, label);
}

function countField(value, label) {
  if (value == null || value === '') return { value: 0, provided: false };
  const parsed = nonNegInt(value, label);
  if (parsed.error) return parsed;
  return { value: parsed.value, provided: true };
}

async function validatedFields(body) {
  const taruna = countField(body.taruna, 'Taruna');
  if (taruna.error) return taruna;
  const balaka = countField(body.balaka, 'Balaka');
  if (balaka.error) return balaka;
  const shishu = countField(body.shishu, 'Shishu');
  if (shishu.error) return shishu;
  const mataBhagi = countField(body.mataBhagi, 'Mata Bhagini');
  if (mataBhagi.error) return mataBhagi;
  if (!taruna.provided && !balaka.provided && !shishu.provided && !mataBhagi.provided) {
    return { error: 'Enter at least one of Taruna, Balaka, Shishu, or Mata Bhagini' };
  }
  const samparkitaManegalu = optionalNonNegInt(body.samparkitaManegalu, 'Ottu samparkitha manegalu');
  if (samparkitaManegalu.error) return samparkitaManegalu;
  const samparkitaVyaktigalu = optionalNonNegInt(body.samparkitaVyaktigalu, 'Ottu samparkita vyaktigalu');
  if (samparkitaVyaktigalu.error) return samparkitaVyaktigalu;

  const rawPravasiList = Array.isArray(body.pravasis)
    ? body.pravasis
    : body.pravasiPerson || body.pravasiPhone
      ? [body.pravasiPerson && typeof body.pravasiPerson === 'object' ? body.pravasiPerson : { phone: body.pravasiPhone, name: body.pravasiName }]
      : [];
  const pravasis = [];
  const seenPravasi = new Set();
  for (const raw of rawPravasiList) {
    if (!raw || typeof raw !== 'object') continue;
    let phone = digits(raw.phone);
    if (!phone) continue;
    if (phone.length < 10 || phone.length > 15) {
      return { error: 'Pravasi karyakartha phone must be a 10 digit number' };
    }
    phone = phone.length > 10 ? phone.slice(-10) : phone;
    if (seenPravasi.has(phone)) continue;
    seenPravasi.add(phone);
    let name = clipText(raw.name, 80) || null;
    let responsibility = clipText(raw.responsibility, 120) || null;
    let shakheName = clipText(raw.shakhe, 80) || null;
    let nagarName = clipText(raw.nagarName, 80) || null;
    let personId = isObjectId(raw.personId) ? raw.personId : null;
    if (phone && (!name || !responsibility || !personId)) {
      const matches = await searchPeople(phone);
      const match = matches[0];
      if (match) {
        if (!name && match.name) name = clipText(match.name, 80) || null;
        if (!responsibility && match.responsibility) {
          responsibility = clipText(match.responsibility, 120) || null;
        }
        if (!shakheName && match.shakhe) shakheName = clipText(match.shakhe, 80) || null;
        if (!nagarName && match.nagarName) nagarName = clipText(match.nagarName, 80) || null;
        if (!personId && match.personId && isObjectId(match.personId)) personId = match.personId;
      }
    }
    pravasis.push({
      personId,
      name,
      phone,
      responsibility,
      shakhe: shakheName,
      nagarName,
    });
    if (pravasis.length >= 20) break;
  }
  const pravasiPhone = pravasis[0] ? pravasis[0].phone : null;
  const pravasiName = pravasis[0] ? pravasis[0].name : null;
  const pravasiPersonId = pravasis[0] ? pravasis[0].personId : null;

  const boudhik = pickItems(body.boudhik, BOUDHIK);
  const sharirik = pickItems(body.sharirik, SHARIRIK);
  const sannaKatheText = boudhik.includes('sannaKathe') ? clipText(body.sannaKatheText, 200) || null : null;
  const deerghaKatheText = boudhik.includes('deerghaKathe') ? clipText(body.deerghaKatheText, 200) || null : null;
  const boudhikItara = boudhik.includes('itara') ? clipText(body.boudhikItara, 80) || null : null;
  const sharirikItara = sharirik.includes('itara') ? clipText(body.sharirikItara, 80) || null : null;
  const seva = clipText(body.seva, 200) || null;

  async function snapPerson(raw, enabled) {
    if (!enabled || !raw || typeof raw !== 'object') return { personId: null, name: null, phone: null };
    const phone = digits(raw.phone);
    let name = clipText(raw.name, 80) || null;
    const personId = isObjectId(raw.personId) ? raw.personId : null;
    if (!phone && !name && !personId) return { personId: null, name: null, phone: null };
    if (phone && !name) {
      const matches = await searchPeople(phone);
      if (matches[0] && matches[0].name) name = clipText(matches[0].name, 80) || null;
    }
    return { personId, name, phone: phone || null };
  }
  const boudhikPerson = await snapPerson(body.boudhikPerson, boudhik.includes('boudhik'));
  const charchePerson = await snapPerson(body.charchePerson, boudhik.includes('charche'));

  return {
    fields: {
      taruna: taruna.value,
      balaka: balaka.value,
      shishu: shishu.value,
      mataBhagi: mataBhagi.value,
      pravasiPhone,
      pravasiName,
      pravasiPersonId,
      pravasis,
      samparkitaManegalu: samparkitaManegalu.value,
      samparkitaVyaktigalu: samparkitaVyaktigalu.value,
      boudhik,
      sannaKatheText,
      deerghaKatheText,
      boudhikPerson,
      charchePerson,
      boudhikItara,
      sharirik,
      sharirikItara,
      seva,
    },
  };
}

function serializePersonSnap(person) {
  if (!person || (!person.personId && !person.name && !person.phone)) return null;
  return {
    personId: person.personId ? String(person.personId) : null,
    name: person.name || null,
    phone: person.phone || null,
    responsibility: person.responsibility || null,
    shakhe: person.shakhe || null,
    nagarName: person.nagarName || null,
  };
}

async function enrichPravasiSnap(person) {
  const snap = serializePersonSnap(person);
  if (!snap) return null;
  if (snap.name && snap.responsibility) return snap;
  if (!snap.phone) return snap;
  const matches = await searchPeople(snap.phone);
  const match = matches[0];
  if (!match) return snap;
  return {
    ...snap,
    name: snap.name || match.name || null,
    responsibility: snap.responsibility || match.responsibility || null,
    shakhe: snap.shakhe || match.shakhe || null,
    nagarName: snap.nagarName || match.nagarName || null,
    personId: snap.personId || (match.personId ? String(match.personId) : null),
  };
}

async function serializePravasis(entry) {
  const list = Array.isArray(entry.pravasis) ? entry.pravasis : [];
  const mapped = [];
  for (const row of list) {
    const enriched = await enrichPravasiSnap(row);
    if (enriched) mapped.push(enriched);
  }
  if (mapped.length) return mapped;
  const legacy = await enrichPravasiSnap({
    personId: entry.pravasiPersonId,
    name: entry.pravasiName,
    phone: entry.pravasiPhone,
  });
  return legacy ? [legacy] : [];
}

async function serialize(entry, shakhe) {
  const pravasis = await serializePravasis(entry);
  return {
    id: entry._id.toString(),
    date: entry.date,
    taruna: entry.taruna,
    balaka: entry.balaka,
    shishu: entry.shishu,
    mataBhagi: entry.mataBhagi,
    total: entry.taruna + entry.balaka,
    pravasiPhone: entry.pravasiPhone,
    pravasiName: entry.pravasiName || null,
    pravasiPerson: pravasis[0] || serializePersonSnap({
      personId: entry.pravasiPersonId,
      name: entry.pravasiName,
      phone: entry.pravasiPhone,
    }),
    pravasis,
    samparkitaManegalu: entry.samparkitaManegalu,
    samparkitaVyaktigalu: entry.samparkitaVyaktigalu,
    boudhik: entry.boudhik || [],
    sannaKatheText: entry.sannaKatheText || null,
    deerghaKatheText: entry.deerghaKatheText || null,
    boudhikPerson: serializePersonSnap(entry.boudhikPerson),
    charchePerson: serializePersonSnap(entry.charchePerson),
    boudhikItara: entry.boudhikItara || null,
    sharirik: entry.sharirik || [],
    sharirikItara: entry.sharirikItara || null,
    seva: entry.seva || null,
    shakhe: shakhe ? serializeShakhe(shakhe) : { id: entry.shakhe.toString() },
  };
}

async function loadForDay(shakheId, confirmPhone, date) {
  if (!isObjectId(shakheId)) return { error: 'Invalid shakhe' };
  const shakhe = await Shakhe.findById(shakheId);
  if (!shakhe) return { error: 'Shakhe not found', status: 404 };
  if (!confirmShakhePhone(shakhe, confirmPhone)) {
    return { error: 'Confirm the phone number to continue', status: 403 };
  }
  if (!shakhe.setupComplete) {
    return { error: 'Complete shakhe location first', status: 409, shakhe: serializeShakhe(shakhe) };
  }
  const day = String(date || todayIst());
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return { error: 'Invalid date' };
  const entry = await ShakheUpasthiti.findOne({ shakhe: shakhe._id, date: day });
  return {
    shakhe: serializeShakhe(shakhe),
    date: day,
    upasthiti: entry ? await serialize(entry, shakhe) : null,
  };
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

async function loadForRange(shakheId, confirmPhone, fromDate, toDate) {
  if (!isObjectId(shakheId)) return { error: 'Invalid shakhe' };
  const shakhe = await Shakhe.findById(shakheId);
  if (!shakhe) return { error: 'Shakhe not found', status: 404 };
  if (!confirmShakhePhone(shakhe, confirmPhone)) {
    return { error: 'Confirm the phone number to continue', status: 403 };
  }
  if (!shakhe.setupComplete) {
    return { error: 'Complete shakhe location first', status: 409, shakhe: serializeShakhe(shakhe) };
  }
  let from = String(fromDate || '');
  let to = String(toDate || '');
  if (!isIsoDate(from) || !isIsoDate(to)) return { error: 'Select from and to dates' };
  if (from > to) {
    const swap = from;
    from = to;
    to = swap;
  }
  const span = eachIsoDay(from, to, 63);
  if (span.length > 62) return { error: 'Select at most 62 days' };
  const rows = await ShakheUpasthiti.find({
    shakhe: shakhe._id,
    date: { $gte: from, $lte: to },
  })
    .sort({ date: 1 })
    .lean();
  const byDate = new Map();
  for (const row of rows) {
    byDate.set(row.date, await serialize(row, shakhe));
  }
  return {
    shakhe: serializeShakhe(shakhe),
    from,
    to,
    dayCount: span.length,
    days: span.map((date) => ({
      date,
      upasthiti: byDate.get(date) || null,
    })),
  };
}

async function saveUpasthiti(body, meta) {
  const shakheId = body && body.shakheId;
  if (!isObjectId(shakheId)) return { error: 'Invalid shakhe' };
  const shakhe = await Shakhe.findById(shakheId);
  if (!shakhe) return { error: 'Shakhe not found', status: 404 };
  if (!confirmShakhePhone(shakhe, body && body.confirmPhone)) {
    return { error: 'Confirm the phone number to continue', status: 403 };
  }
  if (!shakhe.setupComplete) {
    return { error: 'Complete shakhe location first', status: 409 };
  }

  const day = String(body.date || todayIst());
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return { error: 'Invalid date' };

  const checked = await validatedFields(body);
  if (checked.error) return checked;

  let entry = await ShakheUpasthiti.findOne({ shakhe: shakhe._id, date: day });
  if (entry) {
    Object.assign(entry, checked.fields, stampUpdate(meta && meta.ip));
    await entry.save();
    return { entry, shakhe, created: false };
  }
  entry = await ShakheUpasthiti.create({
    shakhe: shakhe._id,
    date: day,
    ...checked.fields,
    ...stampCreate(meta && meta.ip),
  });
  return { entry, shakhe, created: true };
}

module.exports = {
  todayIst,
  serialize,
  loadForDay,
  loadForRange,
  saveUpasthiti,
  BOUDHIK,
  SHARIRIK,
};
