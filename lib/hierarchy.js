const Entity = require('../models/Entity');
const ParentEntity = require('../models/ParentEntity');
const Sthara = require('../models/Sthara');
const { isObjectId } = require('./safe');

const STHARA_ORDER = {
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
};

function foldName(name) {
  const folded = String(name || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '');
  return NAME_ALIASES[folded] || folded;
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

function serializeEntity(entity) {
  return { id: entity._id.toString(), name: entity.name };
}

async function stharaId(name) {
  if (stharaCache.has(name)) return stharaCache.get(name);
  const sthara = await Sthara.findOne({ name });
  if (!sthara) throw new Error('Unknown sthara: ' + name);
  stharaCache.set(name, sthara._id);
  return sthara._id;
}

async function stharaName(entity) {
  const sthara = await Sthara.findById(entity.sthara);
  return sthara ? sthara.name : null;
}

async function isDescendantOrSelf(entityId, ancestorId) {
  if (entityId.toString() === ancestorId.toString()) return true;
  let current = entityId;
  for (let i = 0; i < 20; i++) {
    const edge = await ParentEntity.findOne({ currentEntity: current });
    if (!edge) return false;
    if (edge.parentEntity.toString() === ancestorId.toString()) return true;
    current = edge.parentEntity;
  }
  return false;
}

async function allOfSthara(targetSthara) {
  const targetId = await stharaId(targetSthara);
  const found = await Entity.find({ sthara: targetId }).select('name').sort({ name: 1 }).lean();
  return found.map(serializeEntity);
}

async function descendantsOfSthara(rootId, targetSthara) {
  const targetId = (await stharaId(targetSthara)).toString();
  const found = [];
  let frontier = [rootId.toString()];

  while (frontier.length) {
    const edges = await ParentEntity.find({ parentEntity: { $in: frontier } }).lean();
    if (!edges.length) break;

    const childIds = edges.map((e) => e.currentEntity);
    const children = await Entity.find({ _id: { $in: childIds } })
      .select('name sthara')
      .lean();

    const nextFrontier = [];
    for (const child of children) {
      if (child.sthara.toString() === targetId) found.push(child);
      else nextFrontier.push(child._id.toString());
    }
    frontier = nextFrontier;
  }

  sortEntities(targetSthara, found);
  return found.map(serializeEntity);
}

async function ancestorsBySthara(entityId) {
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

async function optionsUnder(parentId, sthara) {
  if (!isObjectId(parentId)) return { error: 'Invalid parent' };
  if (!CHAIN.some((level) => level.sthara === sthara)) return { error: 'Unknown level' };
  const parent = await Entity.findById(parentId);
  if (!parent) return { error: 'Entity not found' };
  return { options: await descendantsOfSthara(parentId, sthara) };
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

  const ancestors = await ancestorsBySthara(nagarId);
  const vibhag = ancestors.Vibhag;
  const bhag = ancestors.Bhag;
  if (!vibhag || !bhag) return { error: 'Nagara hierarchy is incomplete' };

  const vasatis = await descendantsOfSthara(nagarId, 'Vasati');

  const placed = (entity, sthara) =>
    entity
      ? { id: entity._id.toString(), name: entity.name, sthara }
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
  isDescendantOrSelf,
  descendantsOfSthara,
  allOfSthara,
  optionsUnder,
  formState,
  formStateForNagara,
  resolveHierarchy,
  stharaName,
};
