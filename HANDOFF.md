# Shakhe Upasthiti — session handoff

**Date:** 2026-09-09  
**Continue here:** `/Users/jayanth/Documents/shakhe-upasthiti`  
**GitHub:** https://github.com/JayanthSanaathana/shakhe-upasthiti  
**Latest commit:** `cee0b46` on `master` → `origin/master`  
**Sibling app (Utsava):** `/Users/jayanth/Documents/raksha-bandhan-utsava`  
**Grok workspace often opens Utsava**, but almost all current work is in this folder. Do not add shakhe features inside Utsava.

A short pointer also lives at `raksha-bandhan-utsava/HANDOFF-SHAKHE-UPASTHITI.md` (may lag).

---

## How to run

```bash
cd /Users/jayanth/Documents/shakhe-upasthiti
# reuse Utsava MONGO_URI in .env
npm run dev
```

- Port **3002** (`PORT` or `SHAKHE_PORT`).
- Same `MONGO_URI` / Atlas DB `upasthiti` as Utsava.
- Cache-bust: `public/index.html` → `/app.js?v=20260910j` and `/styles.css?v=20260910j`. **Bump both** after every `public/app.js` or `styles.css` change.
- `.env` is gitignored.

---

## Auth scope

**Prant / vibhag / bhag / nagara** varadi login (email+password via auth service), same pattern as Utsava.

- Entity dashboard + reports for the logged-in level.
- Volunteer path uses **phone session** (`lib/phoneAuth.js`), separate from varadi.
- Test-login UI/API was **removed** (seed script `scripts/seed-tumkuru-test-data.js` kept for optional local seed; Tumkuru seed data was deleted from Atlas).

---

## Product (what exists)

Standalone attendance + varadi app. Not inside Utsava.

### Home (guest)

Create Shakha · Upasthiti · Shakhe Varadi (phone) · Nagara / hierarchy login

### After varadi login — action tiles (nagara)

1. Create Shakhe  
2. **Shakhegala Patti** (hide/unhide lives here)  
3. **Shakhe Varadi**  
4. **Sharirik Varadi**  
5. **Boudhik Varadi**

Higher levels (prant/vibhag/bhag) get the three report tiles (no Patti create flow the same way).

### Create / Patti

- Create/Edit: bearers; **ಸ್ಥಳ/Sthala** + optional **ಗೂಗಲ್ ಸ್ಥಳ/Google location**.
- Validation UX: under-field warnings; text max 60 (sthana min 5); counts max 1000; empty attendance → 0 then ≥1 of Taruna/Balaka/Shishu/Mata > 0.
- Edit can proceed without re-entering phone when already set.
- Patti columns: Vasati, Upavasati, Shakhe, Timing, Type, Sthala, Google location, Edit.  
  **No** bearer phone columns on the list.

### Report hide / unhide (nagara Patti) — **2026-09-09**

- **Not** localStorage. Server field on shakhe: `reportHideIntervals: [{ from, to }]`.
- Interval is **`[from, to)`** (ISO `YYYY-MM-DD` IST calendar days). `to: null` = still hidden.
- **Hide** = open interval from **today IST** (date the button is clicked).  
- **Unhide** = close interval with **today IST** as `to` (that day and after show again; days inside the closed window stay hidden).
- APIs (nagara session only):
  - `POST /api/shakhe/:id/report-hide` body `{ date? }`
  - `POST /api/shakhe/:id/report-unhide` body `{ date? }`
- Serialized list includes `reportHidden` + `reportHideIntervals`.
- **Applies to** Shakhe / Sharirik / Boudhik reports, status splits, program splits, and **prant/vibhag/bhag hierarchy rollups** (same day filter).
- Helpers: `lib/reportVisibility.js`. Wired through `lib/shakheVaradiReport.js` via `applyShakheReportVisibility`.
- **How to verify without waiting until tomorrow:** set report **from = to = hide date (today)**. Shakhe must disappear. A range that still includes **pre-hide** days can still show the shakhe (only post-hide days are dropped).

### Varadi reports (all levels)

Shared chrome (`nagaraReportKind` / level reports): From/To (default last 7 days IST, max 62), Exclude Sunday, place line, Baloo fonts.

#### Shakhe Varadi

- Hierarchy drill: Prant→Vibhag→Bhag→Nagara→Vasati→Upavasati→Shakhe as appropriate.
- **Yojita**: grouped hierarchy + list (Vasati→Upavasati→Shakhe, rowspan). Plain shakhe names on status lists.
- **Nadayuthiruva**: hierarchy + metrics (**no** Details column). Days-ran footer **not** summed as re-average; **list Total = sum of row Sarisumaru/Ottu** (integer averages).
- Clickable counts → `openShakheStatusSplit` / day varadi; higher scopes resolve `nagarId` when drilling.
- Day varadi / Edit → **Back** must restore Yojita/status list context (`returnToNagaraListContext`), not bounce to Upavasati / “Nagara is required”.
- Back from drilled Yojita (`All › X`): first clears path to full Yojita; second Back → main report.

#### Sarisumaru rollup

- Nagara: from attendance (ceil rules as implemented in report lib).
- **Bhag:** each nagara’s Sarisumaru as-is; footer = sum of nagara Sarisumaru.
- **Vibhag / Prant:** each child = (sum of nagara Sarisumaru) ÷ daysSelected; footer = sum of child rows.

#### Boudhik / Sharirik

- Per-checkbox columns; Nadayuthiruva → shakhe split → day grid with ✓/—.
- Vasati clickable on program reports too.

### Volunteer Upasthiti / phone Varadi

- Sign out → phone lookup (not main home). Recent shakhes (max 5, `localStorage`).
- Daily upasthiti + per-shakhe phone varadi on `#upasthiti-view` / `#shakhe-varadi-view`.

---

## APIs (high level)

| Endpoint | Role |
|---|---|
| `GET /api/nagara/shakhe-varadi` / `program-varadi` | Nagara aggregates |
| `GET /api/varadi/:level/report` / `program-varadi` | Prant/vibhag/bhag |
| `GET /api/varadi/shakhe-status-shakhes` | Yojita / running / not-running splits |
| `GET /api/varadi/program-item-shakhes` | Program item shakhe splits |
| `GET /api/nagara/shakhes?...` | Lists + day varadi |
| `POST /api/shakhe/:id/report-hide` / `report-unhide` | Patti hide windows |

Aggregation: `lib/shakheVaradiReport.js` + `lib/reportVisibility.js`.

---

## Key files

| Path | Role |
|---|---|
| `server.js` | Express + varadi + hide routes |
| `public/index.html` | Screens; cache-bust `?v=20260910j` |
| `public/app.js` | Client (large) |
| `public/styles.css` | Tiles, report grid, Patti hide bar |
| `lib/shakheVaradiReport.js` | Report aggregation + visibility filter |
| `lib/reportVisibility.js` | Hide interval helpers |
| `lib/shakheService.js` | CRUD + `setReportHidden` + serialize `reportHidden` |
| `models/Shakhe.js` | `reportHideIntervals` |
| `lib/upasthitiService.js` | Daily upsert/get |
| `lib/varadiAuth.js` | Hierarchy sessions |
| `scripts/seed-tumkuru-test-data.js` | Optional seed (not wired to UI) |

---

## Do not regress

- Hide is **server-side** and must affect hierarchy, not only Patti UI.
- Unhide must close intervals via **plain** `{ from, to }` objects (Mongoose subdoc spread breaks `to`).
- Warning modals: **name — number**, not phones only.
- Edit shakhe: bearer names fill; `#form-loading` until done.
- Volunteer page 2: date picker hidden (bold date only).
- Missing varadi session on home: `200 {ok:false,reason:missing}`, not 401.
- Keep volunteer `#shakhe-varadi-view` separate from nagara `#nagara-report-view`.
- Nagara-list Back from Yojita/etc. → report (not Patti); drill Back clears path first.
- Exclude Sunday must affect day count, day tables, and calculations.
- Nadayuthiruva list footer: **sum rows**, do not re-average.

---

## Likely next asks

- Deploy / Railway for this app.
- Patti hide date picker (not only “today”).
- Further Sarisumaru / UX polish from field feedback.

---

## Prompt to paste next session

```
Continue Shakhe Upasthiti, not Utsava.

Project: /Users/jayanth/Documents/shakhe-upasthiti  port 3002
Read HANDOFF.md first.

Latest: prant/vibhag/bhag/nagara varadi; Yojita/Nadayuthiruva hierarchy;
Sarisumaru rollups; Back restores list context; Patti report-hide/unhide
(server reportHideIntervals [from,to)) filters Shakhe/Sharirik/Boudhik + hierarchy
from hide date inclusive. Cache bust ?v=20260910j.
Verify hide: set report from=to=hide day (today) — shakhe must disappear.
```
