# Issue: Wrong Upavasatis under Avalahalli (Kithaganuru)

**Status:** RESOLVED — user confirmed the production browser shows only the eight expected MHD rows on 2026-09-21. Code fixes are deployed to aws-egress; production uses the corrected live-read configuration.
**Severity:** High — report / Total Upavasati list shows unrelated school Upavasatis  
**Related Nagara:** KITHAGANURU  
**Related Vasati:** AVALAHALLI  

This document explains the data model, the expected ID-only walk, what we observed, and what is still wrong.

## Verified investigation — 2026-09-21

- Read-only queries through the AWS tunnel confirm **live kdpEntities has 8 MHD children**; the app cache still has **17** children (8 MHD + 9 school rows).
- Railway **aws-egress** has `ENTITY_REFERENCE_SOURCE=live` and logs a successful live connection. **Production has the setting unset**, so it defaults to the polluted cache.
- Executing both the previous report implementation and the patched implementation against the live data returns **8** rows for Avalahalli. The historical count of 32 has not been reproduced against the current live source.
- Code inspection found additional risks: report placement trusted saved Shakhe parents, unscoped ancestor walks could mix multi-parent paths, and the overlay derived membership from cached links. Regression tests reproduce these risks with controlled fixtures.
- The patch carries reference parent paths down through each hierarchy level for all three Upavasati filters. The Jalahalli overlay uses Nagar ID `668cfe4f529dc546a1f211bc` and reference links, with local labels for matching IDs only. It is loaded at startup / awaited on first read, not activated by clicking the Nagar.
- Named cache overrides now preserve labels only, not stale parent edges or stale entity levels. Cache version 2 requests a refresh after deployment. Tests: `npm test`.

The historical diagnosis below is retained for context. Deployment verification must distinguish the production and aws-egress URLs.

### Deployment outcome

With user approval, production was switched to `ENTITY_REFERENCE_SOURCE=live`. Deployment `d7f2824c-eeef-4f60-87ae-766c0f31e0b9` succeeded and logs confirm the live connection. Code changes were uploaded to aws-egress only, deployment `75169ab6-8229-45d2-acd3-a2d367a35ded` (successful). Both URLs respond HTTP 200. Four regression tests pass. On 2026-09-21, the user refreshed production and confirmed Kithaganuru → Avalahalli → Total Upavasati shows only the eight MHD rows, satisfying the displayed count and names acceptance criteria.

The version 2 cache refresh completed at `2026-09-21T08:37:40.233Z`; a subsequent read-only query confirms **8** cached Avalahalli links as well. The nine extraneous cached school links were replaced by the source hierarchy. Master kdpEntities was never modified.

---

## Intended hierarchy rule (everywhere)

| Action | Must use |
|---|---|
| Select parent | parent entity `_id` |
| Load children | `parententities` where `parentEntity = that _id` |
| Know level | `entity.sthara` → `stharas._id` |
| Show label | `entity.name` only for display |

**Never** decide hierarchy by place name string (e.g. `"AVALAHALLI"`).

Same display name can exist many times. IDs keep them apart.

---

## The three `kdpEntities` collections

### 1. `stharas` — level types
Defines *kind* of unit: Vibhag, Bhag, Nagar, Vasati, Upavasati, …

Each has `_id`. An entity stores `sthara: <ObjectId>`, not the word `"Vasati"`.

### 2. `entities` — the places
Every Vibhag / Bhag / Nagara / Vasati / Upavasati row:

- `_id` — identity  
- `name` — display only  
- `sthara` — level type id  

### 3. `parententities` — the tree
Each row:

- `parentEntity` → parent `_id`  
- `currentEntity` → child `_id`  

This is the only source of “who is under whom”.

---

## Expected walk: Bhag → Upavasati (IDs only)

Start from Bhag ID `KRISHNARAJAPURA`.

1. **Nagaras under Bhag**  
   `parententities` where `parentEntity = KRISHNARAJAPURA_ID`  
   Keep children whose `sthara` = Nagar → includes `KITHAGANURU_ID`.

2. **Vasatis under Nagara**  
   `parentEntity = KITHAGANURU_ID`  
   Keep `sthara` = Vasati → includes Avalahalli **ID #1** (below).

3. **Upavasatis under that Vasati**  
   `parentEntity = AVALAHALLI_ID_1`  
   Keep `sthara` = Upavasati → **exactly 8** in clean Compass export.

---

## Avalahalli IDs (same name, different places)

From Compass export files in Downloads (`kdpEntities.*.json`, 2026-09-21):

| `_id` | Level | Under |
|---|---|---|
| **`668cfe91529dc546a1f21860`** | **Vasati** | **KITHAGANURU** `668cfe8c529dc546a1f21805` ← **this one** |
| `668d0091529dc546a1f24016` | Vasati | GIRINAGARA (schools belong here) |
| `668d0299529dc546a1f255ce` | Upavasati | DOMMASANDRA |
| `668d0572529dc546a1f292f8` | Upavasati | CHIKKABALLAPURA GRAMANTARA |

Kithaganuru Nagara id: **`668cfe8c529dc546a1f21805`**.

### Correct Upavasatis under Avalahalli @ Kithaganuru (export)

Count **8**:

1. MHD82  
2. MHD83  
3. MHD84  
4. MHD85  
5. MHD86  
6. MHD87  
7. MHD88  
8. MHD96  

### What the UI wrongly showed

Screenshot (2026-09-21): **Total Upavasati — AVALAHALLI** with filters Nagara=`KITHAGANURU`, Vasati=`AVALAHALLI`, count **32**, including school names (Philomena, R K Public, Govt Higher Primary, Bangalore One, etc.).

Those school Upavasatis are **not** children of `668cfe91529dc546a1f21860` in the clean export. They hang under other Vasati IDs (Girinagara Avalahalli, Muneshwara Block, Byatarayanapura, …).

---

## Root cause analysis

### Not name matching in request paths

Runtime create / report / filter code passes **IDs** (`vasatiId`, `entityId`, `parentEntity`).  
The bug is **wrong or mixed `parententities` edges** in the data the app is reading.

### Observed data split

| Source | Children of Avalahalli `668cfe91529dc546a1f21860` |
|---|---|
| Compass export `kdpEntities` | **8** (MHD only) |
| App DB cache `upasthiti` (`MONGO_URI`) | **17** (8 MHD + 9 school Upavasatis wrongly linked) |

So:

- UI asked: children of Vasati **ID** = Kithaganuru Avalahalli?  
- Stale/wrong **local** `parententities` answered with extra school IDs.  
- Clean live export answers 8.

### Why “live” did not fully clear it (yet)

1. Default was historically `ENTITY_REFERENCE_SOURCE=local` (cache).  
2. `ENTITY_LOCAL_HIERARCHY_OVERRIDE_NAMES=JALAHALLI` previously forced **all** hierarchy reads to local (fixed so named override no longer forces global local reads).  
3. On **aws-egress** we set `ENTITY_REFERENCE_SOURCE=live` + SSH egress to Atlas.  
4. **Issue still reported open** after that — needs re-check:
   - Confirm browser is on **aws-egress**, not production.  
   - In Compass (via static IP tunnel), re-run children of `668cfe91529dc546a1f21860`.  
   - If **live** already has 17 school edges, live DB itself is dirty (export was cleaner / different snapshot).  
   - If live has 8 but UI shows 32, app is still not reading live for that request or filters are merging rows incorrectly.

---

## Compass check (static IP only)

1. Atlas Network Access: allow `13.127.136.216/32` only (as required).  
2. Compass → SSH with Identity File → `railway-egress@13.127.136.216`, key `~/.ssh/railway_shakhe_egress`.  
3. DB `kdpEntities`.  
4. `parententities` filter:

```json
{ "parentEntity": { "$oid": "668cfe91529dc546a1f21860" } }
```

5. Resolve each `currentEntity` in `entities`. Expect **8 MHD** rows only.

---

## Jalahalli name overlay (separate, intentional)

Jalahalli is a **one-Nagara temporary display overlay**, not a hierarchy-link override:

- File: `config/jalahalli-name-overlay.js` (`enabled: true/false`)  
- Implementation: `lib/jalahalliNameOverlay.js`  
- **Links** still from live IDs.  
- **Names** under Jalahalli can show local app-DB labels for the same `_id`.  
- Does **not** fix Avalahalli @ Kithaganuru child lists.

---

## Related code / env (aws-egress)

- `ENTITY_REFERENCE_SOURCE=live`  
- `ENTITY_MONGO_URI` → `kdpEntities` via SSH SOCKS (`13.127.136.216`)  
- `ENTITY_LOCAL_HIERARCHY_OVERRIDE_NAMES=JALAHALLI` (sync preserve only; must not force all reads to local)  
- Hierarchy walks: live `ParentEntity` ID BFS (`lib/hierarchy.js`)  
- Docker must `COPY config ./config` (missing config caused “request failed”)

---

## Next debugging steps

1. Reconfirm Compass live children of `668cfe91529dc546a1f21860` (8 vs 17+).  
2. On aws-egress, call `/api/varadi/upavasatis?level=nagara&entityId=668cfe8c529dc546a1f21805&filter=all` (authenticated) and filter rows with `vasati.id === 668cfe91529dc546a1f21860`.  
3. If API returns >8 school rows while Compass shows 8 → still reading wrong connection.  
4. If both show schools → **repair live `parententities`** for that Vasati (remove school edges; keep MHD only).  
5. After live is clean, refresh app cache so fallback matches.

---

## Acceptance criteria

When opening Total Upavasati for Avalahalli under Kithaganuru:

- Count = **8**  
- Names = MHD82–MHD88, MHD96 only  
- No Girinagara / Muneshwara / school Upavasatis  
- Filters still use Vasati **ID**, not name  
