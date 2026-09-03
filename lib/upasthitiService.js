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

async function validatedFields(body) {
  const taruna = nonNegInt(body.taruna, 'Taruna');
  if (taruna.error) return taruna;
  const balaka = nonNegInt(body.balaka, 'Balaka');
  if (balaka.error) return balaka;
  const shishu = nonNegInt(body.shishu, 'Shishu');
  if (shishu.error) return shishu;
  const mataBhagi = nonNegInt(body.mataBhagi, 'Mata Bhagini');
  if (mataBhagi.error) return mataBhagi;
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
    const personId = isObjectId(raw.personId) ? raw.personId : null;
    if (phone && !name) {
      const matches = await searchPeople(phone);
      if (matches[0] && matches[0].name) name = clipText(matches[0].name, 80) || null;
    }
    pravasis.push({ personId, name, phone });
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
  };
}

function serialize(entry, shakhe) {
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
    pravasiPerson: serializePersonSnap({
      personId: entry.pravasiPersonId,
      name: entry.pravasiName,
      phone: entry.pravasiPhone,
    }),
    pravasis: (() => {
      const list = Array.isArray(entry.pravasis) ? entry.pravasis : [];
      const mapped = list
        .map((p) => serializePersonSnap(p))
        .filter(Boolean);
      if (mapped.length) return mapped;
      const legacy = serializePersonSnap({
        personId: entry.pravasiPersonId,
        name: entry.pravasiName,
        phone: entry.pravasiPhone,
      });
      return legacy ? [legacy] : [];
    })(),
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
  if (isSundayIso(day)) {
    return { error: 'Sanghik', status: 422, sanghik: true, date: day };
  }
  const entry = await ShakheUpasthiti.findOne({ shakhe: shakhe._id, date: day });
  return {
    shakhe: serializeShakhe(shakhe),
    date: day,
    upasthiti: entry ? serialize(entry, shakhe) : null,
  };
}

function isSundayIso(iso) {
  const [y, m, d] = String(iso || '').split('-').map(Number);
  if (!y || !m || !d) return false;
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay() === 0;
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
  const shakheDays = span.filter((date) => !isSundayIso(date));
  const rows = await ShakheUpasthiti.find({
    shakhe: shakhe._id,
    date: { $gte: from, $lte: to },
  })
    .sort({ date: 1 })
    .lean();
  const byDate = new Map(rows.map((row) => [row.date, serialize(row, shakhe)]));
  return {
    shakhe: serializeShakhe(shakhe),
    from,
    to,
    dayCount: span.length,
    shakheDayCount: shakheDays.length,
    days: shakheDays.map((date) => ({
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
  if (isSundayIso(day)) return { error: 'Sanghik', status: 422, sanghik: true };

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
