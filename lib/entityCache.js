const COLLECTIONS = [
  'ssdatas',
  'sanghdatas',
  'entities',
  'parententities',
  'stharas',
  'userroles',
  'roles',
];

const DEFAULT_INTERVAL_MINUTES = 24 * 60;

function localHierarchyOverrideNames() {
  const raw = String(process.env.ENTITY_LOCAL_HIERARCHY_OVERRIDE_NAMES || '').trim();
  if (raw) return raw.split(',').map((name) => name.trim().toUpperCase()).filter(Boolean);
  if (/^(1|true|yes|on)$/i.test(String(process.env.ENTITY_LOCAL_HIERARCHY_OVERRIDE || '').trim())) return ['*'];
  return [];
}

async function protectedLocalHierarchy(targetDb) {
  const names = localHierarchyOverrideNames();
  if (!names.length) return { entityIds: new Set(), entities: [], parententities: [] };
  const localEntities = await targetDb.collection('entities').find({}).toArray();
  const allEdges = await targetDb.collection('parententities').find({}).toArray();
  const wanted = new Set(names);
  const entityIds = new Set(
    localEntities
      .filter((entity) => wanted.has('*') || wanted.has(String(entity.name || '').trim().toUpperCase()))
      .map((entity) => String(entity._id))
  );
  let changed = true;
  while (changed) {
    changed = false;
    for (const edge of allEdges) {
      if (entityIds.has(String(edge.parentEntity)) && !entityIds.has(String(edge.currentEntity))) {
        entityIds.add(String(edge.currentEntity));
        changed = true;
      }
    }
  }
  return {
    entityIds,
    entities: localEntities.filter((entity) => entityIds.has(String(entity._id))),
    parententities: allEdges.filter((edge) => entityIds.has(String(edge.currentEntity)) || entityIds.has(String(edge.parentEntity))),
  };
}

function syncIntervalMinutes() {
  const value = Number(process.env.ENTITY_CACHE_SYNC_INTERVAL_MINUTES || DEFAULT_INTERVAL_MINUTES);
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_INTERVAL_MINUTES;
}

async function copyCollection(sourceDb, targetDb, name) {
  const source = sourceDb.collection(name);
  const target = targetDb.collection(name);
  const cursor = source.find({});
  let batch = [];
  let copied = 0;

  // The cache is only used on entity-connection failure. Refreshing it in
  // batches keeps memory bounded and never writes to the source database.
  await target.deleteMany({});
  for await (const doc of cursor) {
    batch.push(doc);
    if (batch.length < 1000) continue;
    await target.insertMany(batch, { ordered: false });
    copied += batch.length;
    batch = [];
  }
  if (batch.length) {
    await target.insertMany(batch, { ordered: false });
    copied += batch.length;
  }
  return copied;
}

async function syncEntityCacheIfNeeded(sourceDb, targetDb) {
  const meta = targetDb.collection('entitycache_meta');
  const previous = await meta.findOne({ _id: 'entity-cache' });
  const elapsed = previous && previous.syncedAt ? Date.now() - new Date(previous.syncedAt).getTime() : Infinity;
  const overrides = localHierarchyOverrideNames();
  const previousOverrides = previous && Array.isArray(previous.localHierarchyOverrides)
    ? previous.localHierarchyOverrides : [];
  const overrideChanged = JSON.stringify(overrides) !== JSON.stringify(previousOverrides);
  if (elapsed < syncIntervalMinutes() * 60 * 1000 && !overrideChanged) {
    return { skipped: true, syncedAt: previous.syncedAt };
  }

  const protectedHierarchy = await protectedLocalHierarchy(targetDb);
  const counts = {};
  for (const name of COLLECTIONS) {
    const preserved = name === 'entities' ? protectedHierarchy.entities
      : name === 'parententities' ? protectedHierarchy.parententities : [];
    const source = sourceDb.collection(name);
    const target = targetDb.collection(name);
    const preservedIds = new Set(preserved.map((doc) => String(doc._id)));
    const cursor = source.find({});
    let batch = [];
    let copied = 0;
    await target.deleteMany({});
    for await (const doc of cursor) {
      if (preservedIds.has(String(doc._id))) continue;
      batch.push(doc);
      if (batch.length < 1000) continue;
      await target.insertMany(batch, { ordered: false });
      copied += batch.length;
      batch = [];
    }
    if (batch.length) {
      await target.insertMany(batch, { ordered: false });
      copied += batch.length;
    }
    if (preserved.length) {
      await target.insertMany(preserved, { ordered: false });
      copied += preserved.length;
    }
    counts[name] = copied;
  }
  const syncedAt = new Date();
  await meta.replaceOne(
    { _id: 'entity-cache' },
    { _id: 'entity-cache', syncedAt, counts, localHierarchyOverrides: overrides },
    { upsert: true }
  );
  try {
    const hierarchy = require('./hierarchy');
    hierarchy.invalidateAdjacencyIndex();
    hierarchy.warmAdjacencyIndex().catch((err) => {
      console.error('Hierarchy index rewarm failed:', err.message);
    });
  } catch (_) {
    /* ignore circular/load errors during bootstrap */
  }
  return { skipped: false, syncedAt, counts };
}

function startEntityCacheScheduler(sourceDb, targetDb) {
  let running = false;
  const timer = setInterval(async () => {
    if (running) return;
    running = true;
    try {
      const result = await syncEntityCacheIfNeeded(sourceDb, targetDb);
      if (!result.skipped) console.log(`Entity cache refreshed at ${result.syncedAt.toISOString()}`);
    } catch (err) {
      console.error('Entity cache refresh failed:', err.message);
    } finally {
      running = false;
    }
  }, syncIntervalMinutes() * 60 * 1000);
  timer.unref();
  return timer;
}

module.exports = { COLLECTIONS, syncEntityCacheIfNeeded, startEntityCacheScheduler };
