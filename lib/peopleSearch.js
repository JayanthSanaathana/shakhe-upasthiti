const Person = require('../models/Person');
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
    shakhe: p.shakhe,
    nagarName: p.nagarName,
  };
}

async function searchPeople(phone) {
  const pattern = phonePattern(phone);
  if (!pattern) return [];
  const matches = await Person.find({ phone: pattern }).limit(15).lean();
  return matches.map(serializePerson);
}

module.exports = { searchPeople };
