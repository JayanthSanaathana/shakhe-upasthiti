const COLLECTIONS = [
  'ssdatas',
  'sanghdatas',
  'entities',
  'parententities',
  'stharas',
  'userroles',
  'roles',
];

const DEFAULT_INTERVAL_MS = 6 * 60 * 60 * 1000;

function syncIntervalMs() {
  const value = Number(process.env.ENTITY_CACHE_SYNC_INTERVAL_MS || DEFAULT_INTERVAL_MS);
  return Number.isFinite(value) && value >= 0 ? value : DEFAULT_INTERVAL_MS;
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
  if (elapsed < syncIntervalMs()) return { skipped: true, syncedAt: previous.syncedAt };

  const counts = {};
  for (const name of COLLECTIONS) counts[name] = await copyCollection(sourceDb, targetDb, name);
  const syncedAt = new Date();
  await meta.replaceOne(
    { _id: 'entity-cache' },
    { _id: 'entity-cache', syncedAt, counts },
    { upsert: true }
  );
  return { skipped: false, syncedAt, counts };
}

module.exports = { COLLECTIONS, syncEntityCacheIfNeeded };
