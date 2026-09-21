const { test } = require('node:test');
const assert = require('node:assert/strict');
const { syncEntityCacheIfNeeded } = require('../lib/entityCache');

function database(data) {
  return { data, collection(name) {
    if (!data[name]) data[name] = [];
    return {
      async findOne(filter) { return data[name].find((row) => Object.entries(filter).every(([k, v]) => row[k] === v)); },
      find() {
        const rows = [...data[name]];
        return { async toArray() { return rows; }, async *[Symbol.asyncIterator]() { yield* rows; } };
      },
      async deleteMany() { data[name] = []; },
      async insertMany(rows) { data[name].push(...rows); },
      async replaceOne(filter, row) { data[name] = [row]; },
    };
  } };
}

test('named overlay refresh keeps local labels but replaces polluted edges and stale entity fields', async () => {
  const before = process.env.ENTITY_LOCAL_HIERARCHY_OVERRIDE_NAMES;
  process.env.ENTITY_LOCAL_HIERARCHY_OVERRIDE_NAMES = 'JALAHALLI';
  try {
    const root = '668cfe4f529dc546a1f211bc';
    const source = database({
      entities: [{ _id: root, name: 'JALAHALLI', sthara: 'nagar' },
        { _id: 'child', name: 'Master label', sthara: 'vasati' },
        { _id: 'outside', name: 'Outside', sthara: 'vasati' }],
      parententities: [{ _id: 'link', parentEntity: root, currentEntity: 'child' }],
      stharas: [{ _id: 'nagar', name: 'Nagar' }],
    });
    const target = database({
      entities: [{ _id: root, name: 'JALAHALLI', sthara: 'nagar' },
        { _id: 'child', name: 'Custom label', sthara: 'wrong-level' },
        { _id: 'outside', name: 'Wrong rename', sthara: 'vasati' }],
      parententities: [{ _id: 'link', parentEntity: root, currentEntity: 'child' },
        { _id: 'dirty', parentEntity: root, currentEntity: 'outside' }],
      entitycache_meta: [{ _id: 'entity-cache', syncedAt: new Date(), localHierarchyOverrides: ['JALAHALLI'] }],
    });
    const result = await syncEntityCacheIfNeeded(source, target);
    assert.equal(result.skipped, false, 'old cache version must be refreshed immediately');
    assert.deepEqual(target.data.parententities, source.data.parententities);
    assert.deepEqual(target.data.entities.find((e) => e._id === 'child'), {
      _id: 'child', name: 'Custom label', sthara: 'vasati',
    });
    assert.equal(target.data.entities.find((e) => e._id === 'outside').name, 'Outside');
    assert.equal((await syncEntityCacheIfNeeded(source, target)).skipped, true);
  } finally {
    if (before === undefined) delete process.env.ENTITY_LOCAL_HIERARCHY_OVERRIDE_NAMES;
    else process.env.ENTITY_LOCAL_HIERARCHY_OVERRIDE_NAMES = before;
  }
});
