const UserRole = require('../models/UserRole');
const Role = require('../models/Role');
const Sthara = require('../models/Sthara');
const Entity = require('../models/Entity');

const STHARA_TO_LEVEL = {
  Prant: 'prant',
  Vibhag: 'vibhag',
  Bhag: 'bhag',
  Nagar: 'nagara',
};

const LEVEL_RANK = {
  prant: 4,
  vibhag: 3,
  bhag: 2,
  nagara: 1,
};

function asIdString(value) {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value._id) return String(value._id);
  return String(value);
}

/**
 * Resolve Varadi scopes for an auth-service user id (JWT sub).
 * Prefers userroles.sthara name; dedupes by entity.
 */
async function scopesForUser(userId) {
  const uid = String(userId || '').trim();
  if (!uid) return [];

  // userroles.user is stored as a string matching JWT sub.
  const rows = await UserRole.find({ user: uid }).lean();
  if (!rows.length) return [];

  const stharaIds = [...new Set(rows.map((r) => asIdString(r.sthara)).filter(Boolean))];
  const entityIds = [...new Set(rows.map((r) => asIdString(r.entity)).filter(Boolean))];
  const roleIds = [...new Set(rows.map((r) => asIdString(r.role)).filter(Boolean))];

  const [stharas, entities, roles] = await Promise.all([
    stharaIds.length
      ? Sthara.find({ _id: { $in: stharaIds } }).select('name').lean()
      : [],
    entityIds.length
      ? Entity.find({ _id: { $in: entityIds } }).select('name').lean()
      : [],
    roleIds.length ? Role.find({ _id: { $in: roleIds } }).select('name').lean() : [],
  ]);

  const stharaNameById = new Map(stharas.map((s) => [s._id.toString(), s.name]));
  const entityNameById = new Map(entities.map((e) => [e._id.toString(), e.name]));
  const roleNameById = new Map(roles.map((r) => [r._id.toString(), r.name]));

  const byEntity = new Map();
  for (const row of rows) {
    const entityId = asIdString(row.entity);
    const stharaName = stharaNameById.get(asIdString(row.sthara));
    const level = STHARA_TO_LEVEL[stharaName];
    if (!entityId || !level) continue;

    const prev = byEntity.get(entityId);
    const next = {
      level,
      entityId,
      entityName: entityNameById.get(entityId) || '',
      sthara: stharaName,
      roleName: roleNameById.get(asIdString(row.role)) || '',
      userId: uid,
    };
    if (!prev || (LEVEL_RANK[next.level] || 0) > (LEVEL_RANK[prev.level] || 0)) {
      byEntity.set(entityId, next);
    }
  }

  return [...byEntity.values()].sort((a, b) => {
    const rank = (LEVEL_RANK[b.level] || 0) - (LEVEL_RANK[a.level] || 0);
    if (rank) return rank;
    return String(a.entityName || '').localeCompare(String(b.entityName || ''));
  });
}

module.exports = {
  STHARA_TO_LEVEL,
  LEVEL_RANK,
  scopesForUser,
};
