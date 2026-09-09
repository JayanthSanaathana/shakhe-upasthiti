/**
 * Seed Tumkuru vibhag with shakhe + upasthiti rows for UI edge-case demos.
 * Safe to re-run: deletes prior seed tagged by phone prefix 9990000.
 *
 * Usage: node scripts/seed-tumkuru-test-data.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Entity = require('../models/Entity');
const Shakhe = require('../models/Shakhe');
const ShakheUpasthiti = require('../models/ShakheUpasthiti');
const hierarchy = require('../lib/hierarchy');

const PHONE_PREFIX = '9990000';
const SEED_TAG = 'TK-SEED';

const IDS = {
  vibhag: '668d0987529dc546a1f2f388', // Tumkuru
  bhagTumkuru: '668d0987529dc546a1f2f38b', // TUMKURU
  nagara: '668d0988529dc546a1f2f38e', // TUMAKURU NAGARA
  gramantara: '668d099e529dc546a1f2f688', // TUMAKURU GRAMANTARA
};

const DATES = [
  '2026-09-03', // Thu
  '2026-09-04', // Fri
  '2026-09-05', // Sat
  '2026-09-06', // Sun
  '2026-09-07', // Mon
  '2026-09-08', // Tue
  '2026-09-09', // Wed
];

function placed(ent) {
  return { entity: ent.id || ent._id, name: ent.name };
}

function baseEntry(shakheId, date, counts = {}) {
  return {
    shakhe: shakheId,
    date,
    taruna: counts.taruna != null ? counts.taruna : 4,
    balaka: counts.balaka != null ? counts.balaka : 3,
    shishu: counts.shishu != null ? counts.shishu : 1,
    mataBhagi: counts.mataBhagi != null ? counts.mataBhagi : 1,
    samparkitaManegalu: counts.manegalu != null ? counts.manegalu : null,
    samparkitaVyaktigalu: counts.vyaktigalu != null ? counts.vyaktigalu : null,
    boudhik: counts.boudhik || [],
    sharirik: counts.sharirik || [],
    sannaKatheText: counts.sannaKatheText || null,
    deerghaKatheText: counts.deerghaKatheText || null,
    boudhikPerson: counts.boudhikPerson || { personId: null, name: null, phone: null },
    charchePerson: counts.charchePerson || { personId: null, name: null, phone: null },
    boudhikItara: counts.boudhikItara || null,
    sharirikItara: counts.sharirikItara || null,
    seva: counts.seva || null,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdIp: 'seed',
    updatedIp: 'seed',
  };
}

async function resolveChain() {
  const vibhag = await Entity.findById(IDS.vibhag).lean();
  const bhag = await Entity.findById(IDS.bhagTumkuru).lean();
  const nagara = await Entity.findById(IDS.nagara).lean();
  const gram = await Entity.findById(IDS.gramantara).lean();
  if (!vibhag || !bhag || !nagara || !gram) throw new Error('Tumkuru hierarchy missing');

  const pickVasati = async (nagarId, names) => {
    const vasatis = await hierarchy.descendantsOfSthara(nagarId, 'Vasati');
    const byName = Object.fromEntries(vasatis.map((v) => [v.name, v]));
    const out = [];
    for (const name of names) {
      const v = byName[name];
      if (!v) throw new Error(`Vasati not found under nagar ${nagarId}: ${name}`);
      const upas = await hierarchy.descendantsOfSthara(v.id, 'Upavasati');
      if (!upas.length) throw new Error(`No upavasati under ${name}`);
      out.push({ vasati: v, upavasatis: upas });
    }
    return out;
  };

  return {
    vibhag: { id: vibhag._id.toString(), name: vibhag.name },
    bhag: { id: bhag._id.toString(), name: bhag.name },
    nagara: { id: nagara._id.toString(), name: nagara.name },
    gram: { id: gram._id.toString(), name: gram.name },
    nagaraVasatis: await pickVasati(IDS.nagara, [
      'ASHOKA NAGARA',
      'BANASHANKARI',
      'BADDIHALLI',
      'ANTARASANA HALLI', // intentionally no shakhes
    ]),
    gramVasatis: await pickVasati(IDS.gramantara, ['ARAKERE', 'AREGUJJANAHALLI']),
  };
}

function shakheDoc(chain, vasati, upa, spec, phoneIdx) {
  return {
    vibhag: placed(chain.vibhag),
    bhag: placed(chain.bhag),
    nagar: placed(spec.nagar),
    vasati: placed(vasati),
    upavasati: placed(upa),
    name: `${SEED_TAG} ${spec.name}`.slice(0, 40),
    timing: spec.timing || 'prabhat',
    time: spec.time || '06:30',
    shakheType: spec.shakheType || 'Samyuktha',
    mukhashikshakPhone: `${PHONE_PREFIX}${String(phoneIdx).padStart(3, '0')}`,
    mukhashikshakName: `Seed Mukha ${phoneIdx}`,
    karyavahaPhone: `${PHONE_PREFIX}8${String(phoneIdx).padStart(2, '0')}`,
    karyavahaName: `Seed Karya ${phoneIdx}`,
    shakhaPalakaPhone: null,
    shakhaPalakaName: null,
    stanaName: 'SEED-TUMKURU',
    location: { lat: 13.34, lng: 77.1 },
    setupComplete: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdIp: 'seed',
    updatedIp: 'seed',
  };
}

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  const chain = await resolveChain();

  const old = await Shakhe.find({
    $or: [
      { mukhashikshakPhone: { $regex: `^${PHONE_PREFIX}` } },
      { stanaName: 'SEED-TUMKURU' },
      { name: { $regex: `^${SEED_TAG}` } },
    ],
  })
    .select('_id')
    .lean();
  const oldIds = old.map((s) => s._id);
  if (oldIds.length) {
    const delU = await ShakheUpasthiti.deleteMany({ shakhe: { $in: oldIds } });
    const delS = await Shakhe.deleteMany({ _id: { $in: oldIds } });
    console.log('cleaned', { shakhes: delS.deletedCount, upasthiti: delU.deletedCount });
  }

  const [ashoka, banashankari, baddihalli] = chain.nagaraVasatis;
  const [arakere, areguj] = chain.gramVasatis;

  let phoneIdx = 1;
  const plans = [];

  // ASHOKA NAGARA — mix of full / partial / not-running
  plans.push({
    nagar: chain.nagara,
    vasati: ashoka.vasati,
    upa: ashoka.upavasatis[0],
    name: 'Ashoka Prabhat',
    timing: 'prabhat',
    time: '06:15',
    shakheType: 'Samyuktha',
    // all 7 days, rich programs + samparka
    days: DATES.map((date, i) => ({
      date,
      taruna: 5 + (i % 3),
      balaka: 2,
      shishu: 1,
      mataBhagi: 1,
      manegalu: 3,
      vyaktigalu: 8,
      boudhik: ['geethe', 'amruthavacha', 'shloka', 'panchaga', 'boudhik'],
      sharirik: ['suryanamaskar', 'samata', 'danda', 'niyuddha'],
      boudhikPerson: { name: 'Ramesh', phone: '9876500001' },
      seva: i === 0 ? 'Blood donation awareness' : null,
    })),
  });
  plans.push({
    nagar: chain.nagara,
    vasati: ashoka.vasati,
    upa: ashoka.upavasatis[1] || ashoka.upavasatis[0],
    name: 'Ashoka Sayam',
    timing: 'sayam',
    time: '18:30',
    shakheType: 'balaka',
    // 3 weekdays, partial programs, NO suryanamaskar
    days: ['2026-09-03', '2026-09-05', '2026-09-08'].map((date) => ({
      date,
      taruna: 1,
      balaka: 6,
      shishu: 2,
      mataBhagi: 0,
      boudhik: ['geethe'],
      sharirik: ['samata'],
    })),
  });
  plans.push({
    nagar: chain.nagara,
    vasati: ashoka.vasati,
    upa: ashoka.upavasatis[2] || ashoka.upavasatis[0],
    name: 'Ashoka Planned',
    timing: 'ratri',
    time: '20:00',
    shakheType: 'Taruna-Vidyarthi',
    days: [], // yojita only / nadayada
  });

  // BANASHANKARI — Sunday-only, rich text extras, ceil averages
  plans.push({
    nagar: chain.nagara,
    vasati: banashankari.vasati,
    upa: banashankari.upavasatis[0],
    name: 'Bana Sunday',
    timing: 'prabhat',
    time: '07:00',
    shakheType: 'Proudha',
    days: [
      {
        date: '2026-09-06',
        taruna: 10,
        balaka: 4,
        shishu: 0,
        mataBhagi: 2,
        manegalu: 5,
        vyaktigalu: 12,
        boudhik: ['sannaKathe', 'deerghaKathe', 'charche', 'itara'],
        sharirik: ['suryanamaskar', 'yeshti', 'itara'],
        sannaKatheText: 'Chanakya neeti short story',
        deerghaKatheText: 'Swami Vivekananda Chicago speech summary',
        charchePerson: { name: 'Suresh', phone: '9876500002' },
        boudhikItara: 'Quiz on Bharat',
        sharirikItara: 'Yoga stretching',
      },
    ],
  });
  plans.push({
    nagar: chain.nagara,
    vasati: banashankari.vasati,
    upa: banashankari.upavasatis[1] || banashankari.upavasatis[0],
    name: 'Bana Sparse',
    timing: 'sayam',
    time: '19:00',
    shakheType: 'Taruna-Udyogi',
    // 2 days with awkward averages (ceil): 5/2 -> 3
    days: [
      { date: '2026-09-04', taruna: 2, balaka: 1, shishu: 0, mataBhagi: 0, boudhik: ['amruthavacha'], sharirik: ['sanchalana'] },
      { date: '2026-09-07', taruna: 3, balaka: 0, shishu: 1, mataBhagi: 1, boudhik: ['amruthavacha', 'panchaga'], sharirik: ['suryanamaskar', 'sanchalana'] },
    ],
  });

  // BADDIHALLI — all running; one with every item, one with none of programs
  plans.push({
    nagar: chain.nagara,
    vasati: baddihalli.vasati,
    upa: baddihalli.upavasatis[0],
    name: 'Baddi Full',
    timing: 'prabhat',
    time: '06:00',
    shakheType: 'Samyuktha',
    days: DATES.filter((d) => d !== '2026-09-06').map((date) => ({
      date,
      taruna: 4,
      balaka: 4,
      shishu: 1,
      mataBhagi: 1,
      manegalu: 2,
      vyaktigalu: 5,
      boudhik: [
        'geethe',
        'amruthavacha',
        'shloka',
        'panchaga',
        'sannaKathe',
        'deerghaKathe',
        'boudhik',
        'charche',
        'samacharaSamekhe',
        'prathanaAbhyasa',
      ],
      sharirik: [
        'suryanamaskar',
        'samata',
        'sanchalana',
        'danda',
        'niyuddha',
        'yeshti',
        'dandaYuddha',
        'padavinyas',
      ],
      sannaKatheText: 'Seed sanna kathe',
      deerghaKatheText: 'Seed deergha kathe',
      boudhikPerson: { name: 'Anand', phone: '9876500003' },
      charchePerson: { name: 'Prakash', phone: '9876500004' },
    })),
  });
  plans.push({
    nagar: chain.nagara,
    vasati: baddihalli.vasati,
    upa: baddihalli.upavasatis[1] || baddihalli.upavasatis[0],
    name: 'Baddi Bare',
    timing: 'ratri',
    time: '21:00',
    shakheType: 'balaka',
    // running but empty program arrays
    days: ['2026-09-03', '2026-09-05', '2026-09-08', '2026-09-09'].map((date) => ({
      date,
      taruna: 0,
      balaka: 8,
      shishu: 3,
      mataBhagi: 0,
      boudhik: [],
      sharirik: [],
    })),
  });

  // GRAMANTARA ARAKERE — two running, mixed item hit rates
  plans.push({
    nagar: chain.gram,
    vasati: arakere.vasati,
    upa: arakere.upavasatis[0],
    name: 'Arakere Main',
    timing: 'prabhat',
    time: '06:45',
    shakheType: 'Samyuktha',
    days: DATES.slice(0, 5).map((date) => ({
      date,
      taruna: 3,
      balaka: 2,
      shishu: 0,
      mataBhagi: 1,
      boudhik: ['geethe', 'shloka'],
      sharirik: ['suryanamaskar', 'padavinyas'],
    })),
  });
  plans.push({
    nagar: chain.gram,
    vasati: arakere.vasati,
    upa: arakere.upavasatis[1] || arakere.upavasatis[0],
    name: 'Arakere Branch',
    timing: 'sayam',
    time: '17:45',
    shakheType: 'Taruna-Vidyarthi',
    days: ['2026-09-07', '2026-09-08', '2026-09-09'].map((date) => ({
      date,
      taruna: 6,
      balaka: 0,
      shishu: 0,
      mataBhagi: 0,
      boudhik: ['charche'],
      sharirik: ['niyuddha'],
      charchePerson: { name: 'Mahesh', phone: '9876500005' },
    })),
  });

  // AREGUJJANAHALLI — yojita only
  plans.push({
    nagar: chain.gram,
    vasati: areguj.vasati,
    upa: areguj.upavasatis[0],
    name: 'Areguj Planned',
    timing: 'prabhat',
    time: '06:20',
    shakheType: 'Proudha',
    days: [],
  });

  // Same upavasati multi-shakhe (ASHOKA first upa gets a second shakhe for multi-shakhe edge)
  plans.push({
    nagar: chain.nagara,
    vasati: ashoka.vasati,
    upa: ashoka.upavasatis[0],
    name: 'Ashoka Twin',
    timing: 'sayam',
    time: '19:15',
    shakheType: 'Samyuktha',
    days: ['2026-09-04', '2026-09-06', '2026-09-09'].map((date) => ({
      date,
      taruna: 2,
      balaka: 2,
      shishu: 1,
      mataBhagi: 1,
      boudhik: ['prathanaAbhyasa'],
      sharirik: ['suryanamaskar'],
    })),
  });

  const created = [];
  const entries = [];
  for (const plan of plans) {
    const doc = shakheDoc(chain, plan.vasati, plan.upa, plan, phoneIdx++);
    const shakhe = await Shakhe.create(doc);
    created.push(shakhe);
    for (const day of plan.days) {
      entries.push(baseEntry(shakhe._id, day.date, day));
    }
  }
  if (entries.length) await ShakheUpasthiti.insertMany(entries, { ordered: false });

  const running = created.filter((s) =>
    entries.some((e) => e.shakhe.toString() === s._id.toString())
  ).length;

  console.log(
    JSON.stringify(
      {
        ok: true,
        vibhag: chain.vibhag,
        bhag: chain.bhag,
        shakhes: created.length,
        running,
        nadayada: created.length - running,
        upasthitiRows: entries.length,
        dateRange: { from: DATES[0], to: DATES[DATES.length - 1] },
        notes: [
          'ANTARASANA HALLI left with 0 shakhes (empty vasati)',
          'GUBBI/KUNIGAL nagars and MADHUGIRI/TIPATURU/RAMANAGARA bhags left empty',
          'Includes Sunday-only, partial programs, bare running, planned-only, rich boudhik/sharirik extras',
        ],
      },
      null,
      2
    )
  );

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err);
  try {
    await mongoose.disconnect();
  } catch (_) {}
  process.exit(1);
});
