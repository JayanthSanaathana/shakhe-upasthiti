const STHARA = new Set(['Vibhag', 'Bhag', 'Nagar', 'Vasati', 'Upavasati']);
const OBJECT_ID = /^[a-fA-F0-9]{24}$/;
const MAX_INT = 99999;
const MIN_STANA = 5;
const MAX_STANA = 15;
const MIN_PLACE = 5;
const MAX_PLACE = 15;
const MAX_PHONE = 20;
const MAX_GEOCODE = 80;
const MAX_NAME = 80;
const MAX_EMAIL = 80;
const MAX_ADDRESS = 80;
const MAX_JOB = 120;
const MAX_SHAKHE = 40;

function isObjectId(id) {
  return typeof id === 'string' && OBJECT_ID.test(id);
}

function scalar(value) {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
}

function clipText(value, max) {
  return String(value == null ? '' : value).trim().slice(0, max);
}

function phoneQuery(value) {
  const raw = scalar(value).slice(0, MAX_PHONE);
  const digits = raw.replace(/\D/g, '').slice(0, 15);
  return digits.length >= 3 ? digits : '';
}

function nonNegInt(value, label) {
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    return { error: `${label} must be 0 or more` };
  }
  if (value < 0 || value > MAX_INT) return { error: `${label} must be 0 to ${MAX_INT}` };
  return { value };
}

function isSthara(name) {
  return typeof name === 'string' && STHARA.has(name);
}

module.exports = {
  isObjectId,
  scalar,
  clipText,
  phoneQuery,
  nonNegInt,
  isSthara,
  MIN_STANA,
  MAX_STANA,
  MIN_PLACE,
  MAX_PLACE,
  MAX_PHONE,
  MAX_GEOCODE,
  MAX_INT,
  MAX_SHAKHE,
};
