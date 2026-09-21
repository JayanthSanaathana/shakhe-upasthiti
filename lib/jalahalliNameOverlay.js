const mongoose = require('mongoose');

let config = { enabled: false };
try {
  // Optional: Docker images older than this fix may omit /app/config.
  // eslint-disable-next-line import/no-unresolved
  config = require('../config/jalahalli-name-overlay');
} catch (_) {
  config = { enabled: false };
}

/** @type {Map<string, string>|null} entityId → local name */
let nameById = null;
let loadPromise = null;

function isEnabled() {
  return Boolean(config && config.enabled);
}

/**
 * Membership comes from the reference hierarchy, rooted at the configured ID.
 * Only the display labels come from the app DB; cached edges cannot expand it.
 */
async function buildOverlayMap() {
  const map = new Map();
  if (!isEnabled()) return map;
  if (!mongoose.connection || mongoose.connection.readyState !== 1) return map;

  const entities = mongoose.connection.collection('entities');
  const Entity = require('../models/Entity');
  const ParentEntity = require('../models/ParentEntity');
  const Sthara = require('../models/Sthara');
  const nagarSthara = await Sthara.findOne({ name: 'Nagar' }).lean();
  if (!nagarSthara) return map;
  if (!mongoose.Types.ObjectId.isValid(config.nagarId)) return map;
  const root = await Entity.findById(config.nagarId).lean();
  if (!root || String(root.sthara) !== String(nagarSthara._id)) return map;
  const rootIds = [String(root._id)];
  const subtreeIds = new Set(rootIds);
  let frontier = rootIds.slice();
  while (frontier.length) {
    const edges = await ParentEntity.find({ parentEntity: { $in: frontier } })
      .select('currentEntity').lean();
    const next = [];
    for (const edge of edges) {
      const childId = String(edge.currentEntity);
      if (subtreeIds.has(childId)) continue;
      subtreeIds.add(childId);
      next.push(childId);
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
    `Jalahalli name overlay ready (${map.size} labels from local DB; nagarId=${config.nagarId})`
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
