const { test } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

const id = (n) => n.toString(16).padStart(24, '0');
const nagar = '668cfe8c529dc546a1f21805';
const avalahalli = '668cfe91529dc546a1f21860';
const jalahalli = '668cfe4f529dc546a1f211bc';
const types = ['Prant', 'Vibhag', 'Bhag', 'Nagar', 'Vasati', 'Upavasati']
  .map((name, i) => ({ _id: id(i + 1), name }));
const entities = [];
const edges = [];
function entity(_id, name, level, parent) {
  entities.push({ _id, name, sthara: types.find((s) => s.name === level)._id });
  if (parent) edges.push({ parentEntity: parent, currentEntity: _id });
}
entity(id(10), 'Bhag', 'Bhag');
entity(nagar, 'KITHAGANURU', 'Nagar', id(10));
entity(avalahalli, 'AVALAHALLI', 'Vasati', nagar);
entity(id(20), 'Other Vasati', 'Vasati', nagar);
entity(id(30), 'GIRINAGARA', 'Nagar', id(10));
entity(id(31), 'AVALAHALLI', 'Vasati', id(30));
const mhdNames = ['MHD82', 'MHD83', 'MHD84', 'MHD85', 'MHD86', 'MHD87', 'MHD88', 'MHD96'];
mhdNames.forEach((name, i) => entity(id(100 + i), name, 'Upavasati', avalahalli));
entity(id(200), 'School elsewhere in Kithaganuru', 'Upavasati', id(20));
entity(id(201), 'Girinagara school', 'Upavasati', id(31));
// A legitimate second parent must not replace the selected scope's parent path.
edges.unshift({ parentEntity: id(31), currentEntity: id(100) });
entity(jalahalli, 'JALAHALLI', 'Nagar', id(10));
entity(id(40), 'Jalahalli Vasati', 'Vasati', jalahalli);
entity(id(41), 'Original Jalahalli name', 'Upavasati', id(40));

const shakhes = [100, 200, 201].map((n) => ({
  _id: id(n + 1000), name: 'Shakhe',
  nagar: { entity: nagar, name: 'KITHAGANURU' },
  vasati: { entity: avalahalli, name: 'AVALAHALLI' },
  upavasati: { entity: id(n), name: 'Stale saved label' },
}));
function matches(row, filter) {
  return Object.entries(filter).every(([key, expected]) => {
    const actual = key.split('.').reduce((value, part) => value?.[part], row);
    return expected?.$in
      ? expected.$in.some((value) => String(value) === String(actual))
      : String(actual) === String(expected);
  });
}
function query(value) {
  return { select() { return this; }, lean() { return Promise.resolve(value); },
    then(resolve, reject) { return Promise.resolve(value).then(resolve, reject); } };
}
function model(rows) {
  return {
    find(filter) { return query(rows.filter((row) => matches(row, filter))); },
    findOne(filter) { return query(rows.find((row) => matches(row, filter))); },
    findById(value) { return query(rows.find((row) => String(row._id) === String(value))); },
  };
}
for (const [name, rows] of Object.entries({ Entity: entities, ParentEntity: edges, Sthara: types, Shakhe: shakhes })) {
  const filename = require.resolve(`../models/${name}`);
  require.cache[filename] = { id: filename, filename, loaded: true, exports: model(rows) };
}

// A polluted local cache contains wrong names outside Jalahalli. It must only
// supply labels for IDs whose membership is established by reference edges.
const localRows = entities.map((row) => ({ ...row, name: `Cached ${row.name}` }));
const overlay = require('../lib/jalahalliNameOverlay');
const hierarchy = require('../lib/hierarchy');
// Load application schemas before marking the mock connection ready.
const report = require('../lib/shakheVaradiReport');
mongoose.connection.collection = function (name) {
  assert.equal(name, 'entities');
  return { find(filter) {
    return { project() { return this; }, async toArray() { return localRows.filter((row) => matches(row, filter)); } };
  } };
};
mongoose.connection.readyState = 1;

test('first dropdown read applies Jalahalli labels without a preceding click', async () => {
  overlay.invalidateOverlay();
  const rows = await hierarchy.descendantsOfStharaLive(jalahalli, 'Upavasati');
  assert.equal(rows[0].name, 'Cached Original Jalahalli name');
  assert.equal(overlay.overlayName(id(100), 'MHD82'), 'MHD82');
});

test('scope paths retain the selected parent and keep duplicate place names separate', async () => {
  const rows = await hierarchy.upavasatiPathsUnder(nagar);
  const selected = rows.filter((row) => row.placed.vasati.id === avalahalli);
  assert.deepEqual(selected.map((row) => row.name).sort(), [...mhdNames].sort());
  assert.ok(selected.every((row) => row.placed.nagar.id === nagar));
  const wider = await hierarchy.upavasatiPathsUnder(id(10));
  assert.equal(wider.filter((row) => row.id === id(100)).length, 2);
});

test('all report filters use reference parents despite incorrect Shakhe snapshots', async () => {
  for (const [filter, count] of [['all', 8], ['with-shakhe', 1], ['without-shakhe', 7]]) {
    const result = await report.listUpavasatisForScope({ level: 'nagara', entityId: nagar, filter });
    assert.equal(result.error, undefined);
    const selected = result.upavasatis.filter((row) => row.vasati.id === avalahalli);
    assert.equal(selected.length, count, filter);
    assert.ok(selected.every((row) => mhdNames.includes(row.name)));
    assert.ok(!result.upavasatis.some((row) => row.id === id(201)));
    const school = result.upavasatis.find((row) => row.id === id(200));
    if (school) assert.equal(school.vasati.id, id(20));
  }
});
