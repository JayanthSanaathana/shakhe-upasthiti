const Entity = require('../models/Entity');
const ParentEntity = require('../models/ParentEntity');
const Sthara = require('../models/Sthara');
const { isObjectId } = require('./safe');

const STHARA_ORDER = {
  // Display order for Karnataka vibhagas (names as stored in live entity DB).
  Vibhag: [
    'Mysuru',
    'Hassana',
    'Mangaluru',
    'Shivamogga',
    'Tumkuru',
    'Kolar',
    'Bengaluru Uttara',
    'Bangalore Dakshin',
  ],
  Bhag: [
    'DASARAHALLI',
    'YALAHANKA',
    'KRISHNARAJAPURA',
    'HALASUR',
    'HEBBALA',
    'MALLESHWARA',
    'BASAVESHVARA',
  ],
  Nagar: [
    'JALAHALLI',
    'RAJANUKUNTE',
    'HUNASAMARANA HALLI',
    'YALAHANKA',
    'MARUTI NAGARA',
    'AMRUTA HALLI',
    'BYATARAYANAPURA',
    'KUVEMPU NAGARA',
  ],
  Vasati: [
    'MUTYALAMMA NAGARA',
    'BAHUBALI',
    'JALAHALLI',
    'B E L',
    'H M T',
    'SHRI KRISHNA',
    'VENUGOPALA',
    'RAMACHANDRAPURA',
    'CHAMUNDESHWARI',
    'DURGA PARAMESHWARI',
    'SAI BABA',
    'SHAKTI GANAPATI',
  ],
};

const NAME_ALIASES = {
  HALASURU: 'HALASUR',
  DURGAPARAMESHVARI: 'DURGAPARAMESHWARI',
  HASSAN: 'HASSANA',
  BENGALURUDAKSHIN: 'BANGALOREDAKSHIN',
  BANGALOREUTTARA: 'BENGALURUUTTARA',
};

/** UI display names only — DB / sort keys stay as stored in live entity DB. */
const DISPLAY_NAME_BY_FOLD = {
  BANGALOREDAKSHIN: 'Bengaluru Dakshina',
};

function foldName(name) {
  const folded = String(name || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '');
  return NAME_ALIASES[folded] || folded;
}

function displayEntityName(name) {
  const raw = name == null ? '' : String(name);
  if (!raw) return raw;
  const mapped = DISPLAY_NAME_BY_FOLD[foldName(raw)];
  return mapped || raw;
}

const STHARA_RANK = Object.fromEntries(
  Object.entries(STHARA_ORDER).map(([sthara, names]) => [
    sthara,
    new Map(names.map((name, index) => [foldName(name), index])),
  ])
);

function sortEntities(sthara, found) {
  const ranks = STHARA_RANK[sthara];
  found.sort((a, b) => {
    if (ranks) {
      const ra = ranks.has(foldName(a.name)) ? ranks.get(foldName(a.name)) : Number.POSITIVE_INFINITY;
      const rb = ranks.has(foldName(b.name)) ? ranks.get(foldName(b.name)) : Number.POSITIVE_INFINITY;
      if (ra !== rb) return ra - rb;
    }
    return String(a.name || '').localeCompare(String(b.name || ''));
  });
  return found;
}

const CHAIN = [
  { sthara: 'Vibhag', key: 'vibhag', label: 'Vibhaga' },
  { sthara: 'Bhag', key: 'bhag', label: 'Bhaga' },
  { sthara: 'Nagar', key: 'nagar', label: 'Nagara' },
  { sthara: 'Vasati', key: 'vasati', label: 'Vasati' },
  { sthara: 'Upavasati', key: 'upavasati', label: 'Upavasati' },
];

const stharaCache = new Map();
const stharaNameByIdCache = new Map();

/** In-memory parent→children + entity sthara/name index for fast report rollups. */
let adjacencyIndex = null;
let adjacencyBuildPromise = null;
const ADJACENCY_TTL_MS = 30 * 60 * 1000;

function serializeEntity(entity) {
  return { id: entity._id.toString(), name: displayEntityName(entity.name) };
}

async function stharaId(name) {
  if (stharaCache.has(name)) return stharaCache.get(name);
  const sthara = await Sthara.findOne({ name });
  if (!sthara) throw new Error('Unknown sthara: ' + name);
  stharaCache.set(name, sthara._id);
  stharaNameByIdCache.set(sthara._id.toString(), sthara.name);
  return sthara._id;
}

async function stharaName(entity) {
  const sid = entity && entity.sthara ? entity.sthara.toString() : '';
  if (sid && stharaNameByIdCache.has(sid)) return stharaNameByIdCache.get(sid);
  const sthara = await Sthara.findById(entity.sthara);
  if (sthara) {
    stharaNameByIdCache.set(sthara._id.toString(), sthara.name);
    return sthara.name;
  }
  return null;
}

function invalidateAdjacencyIndex() {
  adjacencyIndex = null;
  adjacencyBuildPromise = null;
}

async function buildAdjacencyIndex() {
  const t0 = Date.now();
  const [edges, entities, stharas] = await Promise.all([
    ParentEntity.find({}).select('parentEntity currentEntity').lean(),
    Entity.find({}).select('name sthara').lean(),
    Sthara.find({}).select('name').lean(),
  ]);
  const childrenByParent = new Map();
  const parentByChild = new Map();
  for (const edge of edges) {
    const parentId = edge.parentEntity.toString();
    const childId = edge.currentEntity.toString();
    if (!childrenByParent.has(parentId)) childrenByParent.set(parentId, []);
    childrenByParent.get(parentId).push(childId);
    parentByChild.set(childId, parentId);
  }
  const stharaByEntity = new Map();
  const nameByEntity = new Map();
  for (const entity of entities) {
    const id = entity._id.toString();
    stharaByEntity.set(id, entity.sthara.toString());
    nameByEntity.set(id, entity.name || '');
  }
  const stharaIdByName = new Map();
  for (const sthara of stharas) {
    const id = sthara._id.toString();
    stharaIdByName.set(sthara.name, id);
    stharaNameByIdCache.set(id, sthara.name);
    if (!stharaCache.has(sthara.name)) stharaCache.set(sthara.name, sthara._id);
  }
  adjacencyIndex = {
    childrenByParent,
    parentByChild,
    stharaByEntity,
    nameByEntity,
    stharaIdByName,
    builtAt: Date.now(),
  };
  console.log(
    `Hierarchy adjacency index ready (${edges.length} edges, ${entities.length} entities) in ${Date.now() - t0}ms`
  );
  return adjacencyIndex;
}

async function ensureAdjacencyIndex() {
  if (adjacencyIndex && Date.now() - adjacencyIndex.builtAt < ADJACENCY_TTL_MS) {
    return adjacencyIndex;
  }
  if (!adjacencyBuildPromise) {
    adjacencyBuildPromise = buildAdjacencyIndex().finally(() => {
      adjacencyBuildPromise = null;
    });
  }
  return adjacencyBuildPromise;
}

async function warmAdjacencyIndex() {
  return ensureAdjacencyIndex();
}

/**
 * Live ParentEntity ID walk only (Create Shakhe / auth). No adjacency index.
 * Follows ALL parent edges — some entities have more than one parent link.
 */
async function isDescendantOrSelf(entityId, ancestorId) {
  const target = ancestorId.toString();
  let frontier = [entityId.toString()];
  const seen = new Set(frontier);
  for (let depth = 0; depth < 20 && frontier.length; depth += 1) {
    if (frontier.includes(target)) return true;
    const edges = await ParentEntity.find({ currentEntity: { $in: frontier } })
      .select('parentEntity')
      .lean();
    if (!edges.length) break;
    const next = [];
    for (const edge of edges) {
      const parentId = edge.parentEntity.toString();
      if (parentId === target) return true;
      if (!seen.has(parentId)) {
        seen.add(parentId);
        next.push(parentId);
      }
    }
    frontier = next;
  }
  return false;
}

/**
 * Live Mongo BFS for Create Shakhe dropdowns — ParentEntity/Entity IDs only.
 * Keeps only targets whose upward parent chain reaches root (same rule as isDescendantOrSelf).
 */
async function descendantsOfStharaLive(rootId, targetSthara) {
  const targetId = (await stharaId(targetSthara)).toString();
  const root = rootId.toString();
  const found = [];
  let frontier = [root];

  while (frontier.length) {
    const edges = await ParentEntity.find({ parentEntity: { $in: frontier } })
      .select('parentEntity currentEntity')
      .lean();
    if (!edges.length) break;

    const childIds = edges.map((edge) => edge.currentEntity);
    const children = await Entity.find({ _id: { $in: childIds } })
      .select('name sthara')
      .lean();
    const childById = new Map(children.map((child) => [child._id.toString(), child]));
    const nextFrontier = [];

    for (const edge of edges) {
      const child = childById.get(edge.currentEntity.toString());
      if (!child) continue;
      const childId = child._id.toString();
      if (child.sthara.toString() === targetId) {
        if (await isDescendantOrSelf(child._id, rootId)) {
          found.push(child);
        }
      } else {
        nextFrontier.push(childId);
      }
    }
    frontier = nextFrontier;
  }

  sortEntities(targetSthara, found);
  return found.map(serializeEntity);
}

/** Live ancestor walk for Create Shakhe form locks (no adjacency index). */
async function ancestorsByStharaLive(entityId) {
  const byName = {};
  let current = entityId;
  for (let i = 0; i < 20; i++) {
    const entity = await Entity.findById(current).select('name sthara');
    if (!entity) break;
    const name = await stharaName(entity);
    if (name) byName[name] = entity;
    const edge = await ParentEntity.findOne({ currentEntity: current });
    if (!edge) break;
    current = edge.parentEntity;
  }
  return byName;
}

async function allOfSthara(targetSthara) {
  const targetId = await stharaId(targetSthara);
  const found = await Entity.find({ sthara: targetId }).select('name').lean();
  sortEntities(targetSthara, found);
  return found.map(serializeEntity);
}

/** True when walking parentByChild from entityId reaches rootId (canonical parent chain). */
function isUnderRoot(idx, entityId, rootId) {
  const root = String(rootId);
  let current = String(entityId);
  for (let i = 0; i < 24; i++) {
    if (current === root) return true;
    const parent = idx.parentByChild.get(current);
    if (!parent) return false;
    current = parent;
  }
  return false;
}

async function descendantsOfSthara(rootId, targetSthara) {
  const idx = await ensureAdjacencyIndex();
  const root = rootId.toString();
  const targetId = idx.stharaIdByName.get(targetSthara) || (await stharaId(targetSthara)).toString();
  const found = [];
  let frontier = [root];

  while (frontier.length) {
    const nextFrontier = [];
    for (const parentId of frontier) {
      const childIds = idx.childrenByParent.get(parentId) || [];
      for (const childId of childIds) {
        if (idx.stharaByEntity.get(childId) === targetId) {
          // ParentEntity can have cross-links; keep only canonical descendants.
          if (isUnderRoot(idx, childId, root)) {
            found.push({ _id: childId, name: idx.nameByEntity.get(childId) || '' });
          }
        } else {
          nextFrontier.push(childId);
        }
      }
    }
    frontier = nextFrontier;
  }

  sortEntities(targetSthara, found);
  return found.map((entity) => ({
    id: entity._id.toString(),
    name: displayEntityName(entity.name),
  }));
}

/**
 * For each root id, collect descendant entity ids of targetSthara.
 * Used by parent-level report rollups (avoids per-child Mongo BFS).
 */
async function descendantIdSetsByRoots(rootIds, targetSthara) {
  const groups = new Map((rootIds || []).map((id) => [String(id), new Set()]));
  if (!rootIds || !rootIds.length) return groups;
  const idx = await ensureAdjacencyIndex();
  const targetId = idx.stharaIdByName.get(targetSthara) || (await stharaId(targetSthara)).toString();
  let frontier = rootIds.map((id) => ({ id: String(id), owner: String(id) }));
  while (frontier.length) {
    const next = [];
    for (const item of frontier) {
      const childIds = idx.childrenByParent.get(item.id) || [];
      for (const childId of childIds) {
        if (idx.stharaByEntity.get(childId) === targetId) {
          if (isUnderRoot(idx, childId, item.owner)) {
            groups.get(item.owner).add(childId);
          }
        } else {
          next.push({ id: childId, owner: item.owner });
        }
      }
    }
    frontier = next;
  }
  return groups;
}

/** Ancestors keyed by sthara name, using the adjacency index when available. */
async function ancestorsBySthara(entityId) {
  const byName = {};
  try {
    const idx = await ensureAdjacencyIndex();
    let current = entityId.toString();
    for (let i = 0; i < 20; i++) {
      const name = idx.nameByEntity.get(current);
      const stharaIdValue = idx.stharaByEntity.get(current);
      const stharaLabel = stharaIdValue ? stharaNameByIdCache.get(stharaIdValue) : null;
      if (stharaLabel) {
        byName[stharaLabel] = { _id: current, name: name || '' };
      }
      const parentId = idx.parentByChild.get(current);
      if (!parentId) break;
      current = parentId;
    }
    if (Object.keys(byName).length) return byName;
  } catch (_) {
    /* fall through to live walk */
  }

  let current = entityId;
  for (let i = 0; i < 20; i++) {
    const entity = await Entity.findById(current).select('name sthara');
    if (!entity) break;
    const name = await stharaName(entity);
    if (name) byName[name] = entity;
    const edge = await ParentEntity.findOne({ currentEntity: current });
    if (!edge) break;
    current = edge.parentEntity;
  }
  return byName;
}

/** Batch ancestor maps for many entities (sthara name → {id,name}). */
async function ancestorsByStharaForIds(entityIds) {
  const idx = await ensureAdjacencyIndex();
  const out = new Map();
  for (const rawId of entityIds || []) {
    const id = String(rawId);
    const ancestors = {};
    let current = id;
    for (let i = 0; i < 20; i++) {
      const parentId = idx.parentByChild.get(current);
      if (!parentId) break;
      const stharaIdValue = idx.stharaByEntity.get(parentId);
      const stharaLabel = stharaIdValue ? stharaNameByIdCache.get(stharaIdValue) : null;
      if (stharaLabel && !ancestors[stharaLabel]) {
        ancestors[stharaLabel] = {
          id: parentId,
          name: displayEntityName(idx.nameByEntity.get(parentId) || ''),
        };
      }
      current = parentId;
    }
    out.set(id, ancestors);
  }
  return out;
}

async function optionsUnder(parentId, sthara) {
  if (!isObjectId(parentId)) return { error: 'Invalid parent' };
  if (!CHAIN.some((level) => level.sthara === sthara)) return { error: 'Unknown level' };
  const parent = await Entity.findById(parentId);
  if (!parent) return { error: 'Entity not found' };
  // Create Shakhe dropdowns: live ParentEntity ID walks only (not report index).
  return { options: await descendantsOfStharaLive(parentId, sthara) };
}

async function formState() {
  const vibhags = await allOfSthara('Vibhag');
  return {
    levels: CHAIN.map((level, index) => ({
      sthara: level.sthara,
      key: level.key,
      label: level.label,
      locked: false,
      value: null,
      options: index === 0 ? vibhags : [],
    })),
  };
}

async function formStateForNagara(nagarId) {
  if (!isObjectId(nagarId)) return { error: 'Invalid nagara' };
  const nagar = await Entity.findById(nagarId);
  if (!nagar) return { error: 'Nagara not found' };
  const actual = await stharaName(nagar);
  if (actual !== 'Nagar') return { error: 'Not a nagara' };

  const ancestors = await ancestorsByStharaLive(nagarId);
  const vibhag = ancestors.Vibhag;
  const bhag = ancestors.Bhag;
  if (!vibhag || !bhag) return { error: 'Nagara hierarchy is incomplete' };

  const vasatis = await descendantsOfStharaLive(nagarId, 'Vasati');

  const placed = (entity, sthara) =>
    entity
      ? { id: entity._id.toString(), name: displayEntityName(entity.name), sthara }
      : null;

  return {
    levels: [
      { sthara: 'Vibhag', key: 'vibhag', label: 'Vibhaga', locked: true, value: placed(vibhag, 'Vibhag'), options: [] },
      { sthara: 'Bhag', key: 'bhag', label: 'Bhaga', locked: true, value: placed(bhag, 'Bhag'), options: [] },
      { sthara: 'Nagar', key: 'nagar', label: 'Nagara', locked: true, value: placed(nagar, 'Nagar'), options: [] },
      { sthara: 'Vasati', key: 'vasati', label: 'Vasati', locked: false, value: null, options: vasatis },
      { sthara: 'Upavasati', key: 'upavasati', label: 'Upavasati', locked: false, value: null, options: [] },
    ],
  };
}

async function resolveHierarchy(body) {
  const ids = {
    Vibhag: body.vibhagId,
    Bhag: body.bhagId,
    Nagar: body.nagarId,
    Vasati: body.vasatiId,
    Upavasati: body.upavasatiId,
  };

  for (const level of CHAIN) {
    if (!isObjectId(ids[level.sthara])) return { error: `${level.label} is required` };
  }

  const entities = {};
  for (const level of CHAIN) {
    const entity = await Entity.findById(ids[level.sthara]);
    if (!entity) return { error: `${level.label} not found` };
    const actual = await stharaName(entity);
    if (actual !== level.sthara) return { error: `${level.label} is not a ${level.label}` };
    entities[level.sthara] = entity;
  }

  for (let i = 1; i < CHAIN.length; i++) {
    const child = entities[CHAIN[i].sthara];
    const parent = entities[CHAIN[i - 1].sthara];
    const under = await isDescendantOrSelf(child._id, parent._id);
    if (!under) return { error: `${CHAIN[i].label} is not under the selected ${CHAIN[i - 1].label}` };
  }

  const path = {};
  for (const level of CHAIN) {
    path[level.key] = {
      entity: entities[level.sthara]._id,
      name: entities[level.sthara].name,
    };
  }
  return { path, entities };
}

module.exports = {
  CHAIN,
  serializeEntity,
  displayEntityName,
  isDescendantOrSelf,
  descendantsOfSthara,
  descendantsOfStharaLive,
  descendantIdSetsByRoots,
  ancestorsBySthara,
  ancestorsByStharaLive,
  ancestorsByStharaForIds,
  allOfSthara,
  optionsUnder,
  formState,
  formStateForNagara,
  resolveHierarchy,
  stharaName,
  invalidateAdjacencyIndex,
  warmAdjacencyIndex,
  ensureAdjacencyIndex,
};
