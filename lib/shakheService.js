const Shakhe = require('../models/Shakhe');
const { clipText, isObjectId, MAX_SHAKHE, MIN_STANA, MAX_STANA, MAX_NAME, phoneQuery } = require('./safe');
const { stampCreate, stampUpdate } = require('./audit');
const { resolveHierarchy, CHAIN } = require('./hierarchy');
const { phoneConfirmed } = require('./phoneConfirm');
const { searchPeople } = require('./peopleSearch');

const TIMING = Shakhe.TIMING;
const SHAKHE_TYPE = Shakhe.SHAKHE_TYPE;

function digits(value) {
  return String(value == null ? '' : value).replace(/\D/g, '');
}

function requirePhone(value, label, { optional } = {}) {
  const raw = digits(value);
  if (!raw) {
    if (optional) return { value: null };
    return { error: `${label} is required` };
  }
  if (raw.length < 10 || raw.length > 15) return { error: `${label} must be a 10 digit number` };
  return { value: raw.length > 10 ? raw.slice(-10) : raw };
}

async function validatedFields(body) {
  const placed = await resolveHierarchy(body);
  if (placed.error) return placed;

  const name = clipText(body.name, MAX_SHAKHE);
  if (!name) return { error: 'Shakhe name is required', field: 'shakhe-name' };

  const timing = String(body.timing || '').trim();
  if (!TIMING.includes(timing)) return { error: 'Select Prabhat, Sayam or Ratri' };

  const timeMatch = String(body.time || '').trim().match(/^(\d{2}:\d{2})/);
  if (!timeMatch) return { error: 'Time is required' };
  const time = timeMatch[1];

  const shakheType = String(body.shakheType || '').trim();
  if (!SHAKHE_TYPE.includes(shakheType)) return { error: 'Select shakhe type' };

  const mukha = requirePhone(body.mukhashikshakPhone, 'Mukhashikshak phone');
  if (mukha.error) return mukha;
  const karyavaha = requirePhone(body.karyavahaPhone, 'Karyavaha phone', { optional: true });
  if (karyavaha.error) return karyavaha;
  const palaka = requirePhone(body.shakhaPalakaPhone, 'Shakha palaka phone', { optional: true });
  if (palaka.error) return palaka;

  let mukhashikshakName = clipText(body.mukhashikshakName, MAX_NAME) || null;
  let karyavahaName = karyavaha.value ? clipText(body.karyavahaName, MAX_NAME) || null : null;
  let shakhaPalakaName = palaka.value ? clipText(body.shakhaPalakaName, MAX_NAME) || null : null;
  const needNames = [];
  if (mukha.value && !mukhashikshakName) needNames.push(mukha.value);
  if (karyavaha.value && !karyavahaName) needNames.push(karyavaha.value);
  if (palaka.value && !shakhaPalakaName) needNames.push(palaka.value);
  if (needNames.length) {
    const map = await namesByPhone(needNames);
    if (!mukhashikshakName) mukhashikshakName = map.get(foldPhone(mukha.value)) || null;
    if (karyavaha.value && !karyavahaName) karyavahaName = map.get(foldPhone(karyavaha.value)) || null;
    if (palaka.value && !shakhaPalakaName) shakhaPalakaName = map.get(foldPhone(palaka.value)) || null;
  }

  const place = parsePlace(body);
  if (place.error) return place;

  return {
    fields: {
      ...placed.path,
      name,
      timing,
      time,
      shakheType,
      mukhashikshakPhone: mukha.value,
      mukhashikshakName,
      karyavahaPhone: karyavaha.value,
      karyavahaName,
      shakhaPalakaPhone: palaka.value,
      shakhaPalakaName,
      stanaName: place.stanaName,
      location: place.location,
      setupComplete: true,
    },
  };
}

function parsePlace(body) {
  const rawStana = String(body.stanaName || '').trim();
  if (rawStana.length < MIN_STANA || rawStana.length > MAX_STANA) {
    return { error: `Sthana name must be ${MIN_STANA} to ${MAX_STANA} characters` };
  }
  if (
    !body.location ||
    body.location.lat === null ||
    body.location.lat === undefined ||
    body.location.lng === null ||
    body.location.lng === undefined
  ) {
    return { error: 'Location is required' };
  }
  const lat = Number(body.location.lat);
  const lng = Number(body.location.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return { error: 'Location coordinates are invalid' };
  }
  return {
    stanaName: clipText(rawStana, MAX_STANA),
    location: { lat, lng },
  };
}

async function createShakhe(body, meta) {
  const checked = await validatedFields(body);
  if (checked.error) return checked;
  const shakhe = await Shakhe.create({ ...checked.fields, ...stampCreate(meta && meta.ip) });
  return { shakhe };
}

async function updateShakhe(id, body, meta, nagarId) {
  if (!isObjectId(id)) return { error: 'Invalid shakhe' };
  const shakhe = await Shakhe.findById(id);
  if (!shakhe) return { error: 'Shakhe not found', status: 404 };
  if (nagarId && String(shakhe.nagar.entity) !== String(nagarId)) {
    return { error: 'Not allowed for this entity', status: 403 };
  }
  const checked = await validatedFields(body);
  if (checked.error) return checked;
  Object.assign(shakhe, checked.fields, stampUpdate(meta && meta.ip));
  await shakhe.save();
  return { shakhe };
}

function serialize(shakhe) {
  const path = {};
  for (const level of CHAIN) {
    path[level.key] = {
      id: shakhe[level.key].entity.toString(),
      name: shakhe[level.key].name,
    };
  }
  return {
    id: shakhe._id.toString(),
    ...path,
    name: shakhe.name,
    timing: shakhe.timing,
    time: shakhe.time,
    shakheType: shakhe.shakheType,
    mukhashikshakPhone: shakhe.mukhashikshakPhone,
    mukhashikshakName: shakhe.mukhashikshakName || null,
    karyavahaPhone: shakhe.karyavahaPhone,
    karyavahaName: shakhe.karyavahaName || null,
    shakhaPalakaPhone: shakhe.shakhaPalakaPhone,
    shakhaPalakaName: shakhe.shakhaPalakaName || null,
    stanaName: shakhe.stanaName || null,
    location: shakhe.location || { lat: null, lng: null },
    setupComplete: Boolean(shakhe.setupComplete),
  };
}

function foldPhone(value) {
  const d = String(value || '').replace(/\D/g, '');
  return d.length > 10 ? d.slice(-10) : d;
}

async function namesByPhone(phones) {
  const unique = [...new Set((phones || []).map(foldPhone).filter((p) => p.length >= 10))];
  const map = new Map();
  if (!unique.length) return map;
  await Promise.all(
    unique.map(async (d) => {
      const matches = await searchPeople(d);
      const hit = matches.find((p) => p && p.name);
      if (hit) map.set(d, hit.name);
    })
  );
  return map;
}

async function withPeopleNames(rows) {
  const missing = [];
  for (const row of rows) {
    if (row.mukhashikshakPhone && !row.mukhashikshakName) missing.push(row.mukhashikshakPhone);
    if (row.karyavahaPhone && !row.karyavahaName) missing.push(row.karyavahaPhone);
    if (row.shakhaPalakaPhone && !row.shakhaPalakaName) missing.push(row.shakhaPalakaPhone);
  }
  const map = await namesByPhone(missing);
  return rows.map((row) => ({
    ...row,
    mukhashikshakName: row.mukhashikshakName || map.get(foldPhone(row.mukhashikshakPhone)) || null,
    karyavahaName: row.karyavahaName || map.get(foldPhone(row.karyavahaPhone)) || null,
    shakhaPalakaName: row.shakhaPalakaName || map.get(foldPhone(row.shakhaPalakaPhone)) || null,
  }));
}

function phonePattern(phone) {
  const digits = phoneQuery(phone);
  if (!digits) return null;
  return new RegExp(digits.split('').join('[\\s-]*'));
}

function phonesOnShakhe(shakhe) {
  return [shakhe.mukhashikshakPhone, shakhe.karyavahaPhone, shakhe.shakhaPalakaPhone].filter(Boolean);
}

function confirmShakhePhone(shakhe, confirmPhone) {
  return phonesOnShakhe(shakhe).some((p) => phoneConfirmed(p, confirmPhone));
}

async function listByPhone(phone) {
  const pattern = phonePattern(phone);
  if (!pattern) return { shakhes: [] };
  const rows = await Shakhe.find({
    $or: [
      { mukhashikshakPhone: pattern },
      { karyavahaPhone: pattern },
      { shakhaPalakaPhone: pattern },
    ],
  })
    .sort({ name: 1 })
    .lean();
  return { shakhes: await withPeopleNames(rows.map(serialize)) };
}

async function viewShakhe(id, confirmPhone) {
  if (!isObjectId(id)) return { error: 'Invalid shakhe' };
  const shakhe = await Shakhe.findById(id);
  if (!shakhe) return { error: 'Shakhe not found', status: 404 };
  if (!confirmShakhePhone(shakhe, confirmPhone)) {
    return { error: 'Confirm the phone number to continue', status: 403 };
  }
  const [row] = await withPeopleNames([serialize(shakhe)]);
  return { shakhe: row };
}

async function viewForNagara(id, nagarId) {
  if (!isObjectId(id)) return { error: 'Invalid shakhe' };
  const shakhe = await Shakhe.findById(id);
  if (!shakhe) return { error: 'Shakhe not found', status: 404 };
  if (String(shakhe.nagar.entity) !== String(nagarId)) {
    return { error: 'Not allowed for this entity', status: 403 };
  }
  const [row] = await withPeopleNames([serialize(shakhe)]);
  return { shakhe: row };
}

async function completeSetup(id, body, meta) {
  if (!isObjectId(id)) return { error: 'Invalid shakhe' };
  const shakhe = await Shakhe.findById(id);
  if (!shakhe) return { error: 'Shakhe not found', status: 404 };
  if (!confirmShakhePhone(shakhe, body && body.confirmPhone)) {
    return { error: 'Confirm the phone number to continue', status: 403 };
  }

  const place = parsePlace(body);
  if (place.error) return place;

  Object.assign(
    shakhe,
    {
      stanaName: place.stanaName,
      location: place.location,
      setupComplete: true,
    },
    stampUpdate(meta && meta.ip)
  );
  await shakhe.save();
  return { shakhe: serialize(shakhe) };
}

async function listForNagara(nagarId) {
  if (!isObjectId(nagarId)) return { error: 'Invalid nagara' };
  const rows = await Shakhe.find({ 'nagar.entity': nagarId }).sort({ createdAt: -1 }).lean();
  return { shakhes: await withPeopleNames(rows.map(serialize)) };
}

async function listForUpavasati(upavasatiId) {
  if (!isObjectId(upavasatiId)) return { error: 'Invalid upavasati' };
  const rows = await Shakhe.find({ 'upavasati.entity': upavasatiId }).sort({ name: 1 }).lean();
  return { shakhes: await withPeopleNames(rows.map(serialize)) };
}

async function listForMukhashikshak(phone) {
  const raw = digits(phone);
  const value = raw.length > 10 ? raw.slice(-10) : raw;
  if (value.length < 10) return { shakhes: [] };
  const rows = await Shakhe.find({ mukhashikshakPhone: value }).sort({ name: 1 }).lean();
  return { shakhes: await withPeopleNames(rows.map(serialize)) };
}

module.exports = {
  TIMING,
  SHAKHE_TYPE,
  createShakhe,
  updateShakhe,
  serialize,
  listForNagara,
  listForUpavasati,
  listForMukhashikshak,
  listByPhone,
  viewShakhe,
  viewForNagara,
  completeSetup,
  confirmShakhePhone,
};
