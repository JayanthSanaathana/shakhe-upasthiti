const Person = require('../models/Person');
const { getLiveConnection } = require('./mongo');
const { phoneQuery } = require('./safe');

function phonePattern(phone) {
  const digits = phoneQuery(phone);
  if (!digits) return null;
  return new RegExp(digits.split('').join('[\\s-]*'));
}

function serializePerson(p) {
  return {
    personId: p._id.toString(),
    name: p.name,
    phone: p.phone,
    responsibility: p.responsibility,
    otherResponsibility: p.otherResponsibility,
    shakhe: p.shakhe,
    nagarName: p.nagarName,
  };
}

async function searchPeople(phone) {
  const pattern = phonePattern(phone);
  if (!pattern) return [];
  const matches = await Person.find({ phone: pattern }).limit(15).lean();
  const result = matches.map(serializePerson);

  // `people` is the app's flattened directory. The source responsibility
  // lives in read-only `sanghdatas`, linked through `ssdatas._id`.
  // Enrichment is best-effort so local/app-only environments still work.
  try {
    const live = getLiveConnection();
    if (live && live.readyState === 1 && result.length) {
      const sourcePhones = result.map((p) => p.phone).filter(Boolean);
      const sourcePeople = await live
        .collection('ssdatas')
        .find({ phone: { $in: sourcePhones } }, { projection: { phone: 1 } })
        .toArray();
      const ids = sourcePeople.map((p) => p._id);
      if (ids.length) {
        const sourceByPhone = new Map(sourcePeople.map((p) => [String(p.phone), p._id]));
        const sanghRows = await live
          .collection('sanghdatas')
          .find(
            { ssData: { $in: ids } },
            { projection: { ssData: 1, otherResponsibility: 1 } }
          )
          .toArray();
        const otherBySs = new Map();
        for (const row of sanghRows) {
          const value = String(row.otherResponsibility || '').trim();
          if (value && !otherBySs.has(String(row.ssData))) otherBySs.set(String(row.ssData), value);
        }
        for (const person of result) {
          const ssId = sourceByPhone.get(String(person.phone));
          if (ssId && otherBySs.has(String(ssId))) {
            person.otherResponsibility = otherBySs.get(String(ssId));
          }
        }
      }
    }
  } catch (_) {
    // The flattened people result remains usable if the source enrichment is unavailable.
  }
  return result;
}

module.exports = { searchPeople };
