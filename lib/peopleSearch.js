const { getLiveConnection } = require('./mongo');
const { phoneQuery } = require('./safe');

function phonePattern(phone) {
  const digits = phoneQuery(phone);
  if (!digits) return null;
  return new RegExp(digits.split('').join('[\\s-]*'));
}

function serializePerson(person, sangh, nagarName) {
  const otherResponsibility = String((sangh && sangh.otherResponsibility) || '').trim();
  return {
    personId: person._id.toString(),
    name: person.name || '',
    phone: person.phone || '',
    responsibility: null,
    otherResponsibility: otherResponsibility || 'Swayamsevak',
    shakhe: sangh && sangh.shakhe ? String(sangh.shakhe) : '',
    nagarName: nagarName || '',
  };
}

/** Search the live source records; the retained people copy is not used. */
async function searchPeople(phone) {
  const pattern = phonePattern(phone);
  if (!pattern) return [];
  const live = getLiveConnection();
  if (!live || live.readyState !== 1) return [];

  const sourcePeople = await live
    .collection('ssdatas')
    .find({ phone: pattern }, { projection: { name: 1, phone: 1 } })
    .limit(15)
    .toArray();
  if (!sourcePeople.length) return [];

  const ids = sourcePeople.map((person) => person._id);
  const sanghRows = await live
    .collection('sanghdatas')
    .find(
      { ssData: { $in: ids } },
      { projection: { ssData: 1, otherResponsibility: 1, shakhe: 1, nagar: 1 } }
    )
    .toArray();

  const sanghByPerson = new Map();
  for (const row of sanghRows) {
    const key = String(row.ssData);
    if (!sanghByPerson.has(key)) sanghByPerson.set(key, []);
    sanghByPerson.get(key).push(row);
  }

  const nagarIds = [
    ...new Map(
      sanghRows.filter((row) => row.nagar).map((row) => [String(row.nagar), row.nagar])
    ).values(),
  ];
  const entities = nagarIds.length
    ? await live
        .collection('entities')
        .find({ _id: { $in: nagarIds } }, { projection: { name: 1 } })
        .toArray()
    : [];
  const nagarNames = new Map(entities.map((entity) => [String(entity._id), entity.name || '']));

  return sourcePeople.map((person) => {
    const rows = sanghByPerson.get(String(person._id)) || [];
    const sangh = rows.find((row) => String(row.otherResponsibility || '').trim()) || rows[0] || null;
    return serializePerson(person, sangh, sangh && nagarNames.get(String(sangh.nagar)));
  });
}

module.exports = { searchPeople };
