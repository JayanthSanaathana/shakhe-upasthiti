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

async function validatedFields(body) {
  const taruna = nonNegInt(body.taruna, 'Taruna');
  if (taruna.error) return taruna;
  const balaka = nonNegInt(body.balaka, 'Balaka');
  if (balaka.error) return balaka;
  const shishu = nonNegInt(body.shishu, 'Shishu');
  if (shishu.error) return shishu;
  const mataBhagi = nonNegInt(body.mataBhagi, 'Mata Bhagini');
  if (mataBhagi.error) return mataBhagi;
  const samparkitaManegalu = nonNegInt(body.samparkitaManegalu, 'Ottu samparkitha manegalu');
  if (samparkitaManegalu.error) return samparkitaManegalu;
  const samparkitaVyaktigalu = nonNegInt(body.samparkitaVyaktigalu, 'Ottu samparkita vyaktigalu');
  if (samparkitaVyaktigalu.error) return samparkitaVyaktigalu;

  const pravasiSnap = body.pravasiPerson && typeof body.pravasiPerson === 'object' ? body.pravasiPerson : null;
  const rawPravasi = digits((pravasiSnap && pravasiSnap.phone) || body.pravasiPhone);
  let pravasiPhone = null;
  let pravasiName = null;
  let pravasiPersonId = null;
  if (rawPravasi) {
    if (rawPravasi.length < 10 || rawPravasi.length > 15) {
      return { error: 'Pravasi karyakartha phone must be a 10 digit number' };
    }
    pravasiPhone = rawPravasi.length > 10 ? rawPravasi.slice(-10) : rawPravasi;
    pravasiName = clipText((pravasiSnap && pravasiSnap.name) || body.pravasiName, 80) || null;
    if (pravasiSnap && isObjectId(pravasiSnap.personId)) pravasiPersonId = pravasiSnap.personId;
    if (pravasiPhone && !pravasiName) {
      const matches = await searchPeople(pravasiPhone);
      if (matches[0] && matches[0].name) pravasiName = clipText(matches[0].name, 80) || null;
    }
  }

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
    upasthiti: entry ? serialize(entry, shakhe) : null,
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
  saveUpasthiti,
  BOUDHIK,
  SHARIRIK,
};
