require('dotenv').config();
const mongoose = require('mongoose');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  const cols = (await db.listCollections().toArray())
    .map((c) => c.name)
    .filter((n) => /role|user|person|entity|sthara/i.test(n))
    .sort();
  console.log('cols', cols);

  const Sthara = db.collection('stharas');
  const Role = db.collection('roles');
  const UserRole = db.collection('userroles');
  const Entity = db.collection('entities');

  const stharas = await Sthara.find({ name: { $in: ['Prant', 'Vibhag', 'Bhag', 'Nagar'] } }).toArray();
  console.log(
    'stharas',
    stharas.map((s) => ({ id: s._id.toString(), name: s.name }))
  );
  const byName = Object.fromEntries(stharas.map((s) => [s.name, s._id]));

  for (const level of ['Prant', 'Vibhag', 'Bhag', 'Nagar']) {
    const roles = await Role.find({ sthara: byName[level] }).limit(3).toArray();
    console.log(
      level,
      'roles',
      roles.map((r) => ({
        id: r._id.toString(),
        name: r.name,
        entity: r.entity && r.entity.toString ? r.entity.toString() : r.entity,
      }))
    );
  }

  const sample = await UserRole.aggregate([
    { $limit: 500 },
    { $lookup: { from: 'roles', localField: 'role', foreignField: '_id', as: 'roleDoc' } },
    { $unwind: '$roleDoc' },
    { $lookup: { from: 'stharas', localField: 'roleDoc.sthara', foreignField: '_id', as: 'stharaDoc' } },
    { $unwind: '$stharaDoc' },
    { $match: { 'stharaDoc.name': { $in: ['Prant', 'Vibhag', 'Bhag', 'Nagar'] } } },
    { $lookup: { from: 'entities', localField: 'roleDoc.entity', foreignField: '_id', as: 'ent' } },
    { $unwind: { path: '$ent', preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: { level: '$stharaDoc.name', user: '$user' },
        entityName: { $first: '$ent.name' },
        entityId: { $first: '$ent._id' },
      },
    },
    { $limit: 30 },
  ]).toArray();
  console.log('userroles', JSON.stringify(sample, null, 2));

  for (const c of ['users', 'people', 'persons', 'accounts']) {
    try {
      const n = await db.collection(c).countDocuments();
      console.log(c, n);
      if (n) {
        const one = await db.collection(c).findOne();
        console.log(c, 'keys', Object.keys(one || {}));
      }
    } catch (_) {}
  }

  // Known entity ids from Utsava handoff
  const known = [
    '668cfdff529dc546a1f2092c',
    '668cfe4f529dc546a1f211b9',
    '668cfe4f529dc546a1f211bc',
  ];
  for (const id of known) {
    const e = await Entity.findById(id);
    console.log('entity', id, e && e.name);
  }

  // Find a Prant entity
  const prantSthara = byName.Prant;
  if (prantSthara) {
    const prants = await Entity.find({ sthara: prantSthara }).limit(5).toArray();
    console.log(
      'prants',
      prants.map((p) => ({ id: p._id.toString(), name: p.name }))
    );
  }

  await mongoose.disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
