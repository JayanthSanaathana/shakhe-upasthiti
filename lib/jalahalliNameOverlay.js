const mongoose = require('mongoose');
const config = require('../config/jalahalli-name-overlay');

/** @type {Map<string, string>|null} entityId → local name */
let nameById = null;
let loadPromise = null;

function isEnabled() {
  return Boolean(config && config.enabled);
}

function overlayNagarName() {
  return String((config && config.nagarName) || 'JALAHALLI').trim().toUpperCase();
}

/**
 * Build id→localName for Jalahalli Nagara + all descendants in the app DB cache.
 * Uses IDs only for the tree walk; names come from local entities collection.
 */
async function buildOverlayMap() {
  const map = new Map();
  if (!isEnabled()) return map;
  if (!mongoose.connection || mongoose.connection.readyState !== 1) return map;

  const entities = mongoose.connection.collection('entities');
  const parents = mongoose.connection.collection('parententities');
  const stharas = mongoose.connection.collection('stharas');

  const nagarSthara = await stharas.findOne({ name: 'Nagar' });
  if (!nagarSthara) return map;

  const nagarName = overlayNagarName();
  const roots = await entities
    .find({ sthara: nagarSthara._id })
    .project({ _id: 1, name: 1 })
    .toArray();
  const rootIds = roots
    .filter((row) => String(row.name || '').trim().toUpperCase() === nagarName)
    .map((row) => String(row._id));
  if (!rootIds.length) return map;

  const allEdges = await parents.find({}).project({ parentEntity: 1, currentEntity: 1 }).toArray();
  const childrenByParent = new Map();
  for (const edge of allEdges) {
    const parentId = String(edge.parentEntity);
    const childId = String(edge.currentEntity);
    if (!childrenByParent.has(parentId)) childrenByParent.set(parentId, []);
    childrenByParent.get(parentId).push(childId);
  }

  const subtreeIds = new Set(rootIds);
  let frontier = rootIds.slice();
  while (frontier.length) {
    const next = [];
    for (const parentId of frontier) {
      for (const childId of childrenByParent.get(parentId) || []) {
        if (subtreeIds.has(childId)) continue;
        subtreeIds.add(childId);
        next.push(childId);
      }
    }
    frontier = next;
  }

  const ObjectId = mongoose.Types.ObjectId;
  const objectIds = [...subtreeIds]
    .filter((id) => ObjectId.isValid(id))
    .map((id) => new ObjectId(id));
  if (!objectIds.length) return map;

  const localRows = await entities
    .find({ _id: { $in: objectIds } })
    .project({ _id: 1, name: 1 })
    .toArray();
  for (const row of localRows) {
    const name = String(row.name || '').trim();
    if (name) map.set(String(row._id), name);
  }

  console.log(
    `Jalahalli name overlay ready (${map.size} entities from local DB; nagar=${nagarName})`
  );
  return map;
}

async function ensureOverlayMap() {
  if (!isEnabled()) {
    nameById = null;
    return null;
  }
  if (nameById) return nameById;
  if (!loadPromise) {
    loadPromise = buildOverlayMap()
      .then((map) => {
        nameById = map;
        return map;
      })
      .finally(() => {
        loadPromise = null;
      });
  }
  return loadPromise;
}

function invalidateOverlay() {
  nameById = null;
  loadPromise = null;
}

/** Sync lookup after ensureOverlayMap() has run (or returns liveName if off/unloaded). */
function overlayName(entityId, liveName) {
  if (!isEnabled() || !nameById || !entityId) return liveName;
  const local = nameById.get(String(entityId));
  return local != null && local !== '' ? local : liveName;
}

async function warmOverlay() {
  if (!isEnabled()) return null;
  return ensureOverlayMap();
}

module.exports = {
  isEnabled,
  ensureOverlayMap,
  overlayName,
  invalidateOverlay,
  warmOverlay,
};
