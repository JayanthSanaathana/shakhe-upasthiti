# Shakhe Upasthiti — session handoff

**Date:** 2026-09-02  
**Continue here:** `/Users/jayanth/Documents/shakhe-upasthiti`  
**Sibling app (Utsava):** `/Users/jayanth/Documents/raksha-bandhan-utsava`  
**Grok workspace often opens Utsava**, but almost all current work is in the sibling folder. Do not add shakhe features inside Utsava.

A copy of this file also lives at `raksha-bandhan-utsava/HANDOFF-SHAKHE-UPASTHITI.md`.

---

## How to run

```bash
cd /Users/jayanth/Documents/shakhe-upasthiti
# reuse Utsava MONGO_URI in .env
npm run dev
```

- Port **3002** (`PORT` or `SHAKHE_PORT`).
- Same `MONGO_URI` as Utsava. Atlas cluster rss `vxrxuqt`.
- If Mongo TLS / `alert 80`: current public IP is not allowlisted (example seen: `104.28.220.169` Cloudflare).
- Cache-bust: `public/index.html` loads `/app.js?v=20260902j`. **Bump this** after every `public/app.js` or `styles.css` change.
- `shakhe-upasthiti` has **no git repo** yet. Utsava git is unrelated.

---

## Product (what exists)

Standalone nagara + volunteer attendance app. Not inside Utsava.

**Home:** Nagara login (Varadi email/password, nagara only) and Upasthiti.

**After nagara login**
- Create Shakhe / list Shakhes.
- Locked vibhag / bhag / nagar from session.
- Fields: vasati, upavasati, name, timing (`prabhat` / `sayam` / `ratri`), time, type (`balaka`, `Taruna-Vidyarthi`, `Taruna-Udyogi`, `Samyuktha`).
- Bearers via people phone-search: mukhashikshak **required**, karyavaha + shakha palaka optional. Store **name + phone**. Many shakhes per phone; many shakhes per upavasati.
- Upavasati-exists and phone-exists **warning** modals (do not block create). Cards must show **name — number**, not phones only.
- List: edit + hide/unhide (`localStorage` key `shakhe-hide:v1:${nagaraId}`).
- Edit: `#form-loading` grey overlay until fill completes; `formFilling` skips vasati-change wipe; `selectBearerByPhone(key, blockId, phone, name)` paints immediately then enriches.

**Upasthiti (phone login)**
- List shakhes for that phone; tap one.
- First time: nagara details + required **sthana 5–15 chars** + map (Leaflet/OSM; Google Maps link from lat/lng).
- Daily unique index `shakhe + date` (IST `en-CA` / Asia/Kolkata). POST upserts.
- Calendar date, IST today default, display `DD-MM-YYYY`. Title: today → `ಇಂದಿನ ಶಾಖಾ ಉಪಸ್ಥಿತಿ/Indina Shakha Upasthiti`, else `ಶಾಖಾ ಉಪಸ್ಥಿತಿ/Shakha Upasthiti`.
- Volunteer writes gated by `confirmPhone` vs stored bearer phones.

**Two screens (form and saved view)**

| Page | Content | Date chrome |
|---|---|---|
| 1 | Counts (taruna, balaka, shishu, mata bhagini, total taruna+balaka), pravasi (people search), samparka manegalu/vyaktigalu | Native picker **and** bold `ದಿನಾಂಕ/Date DD-MM-YYYY` |
| 2 | Ashtabindu: Boudhik, Sharirik, Seva | Bold date **only** (no picker). Bold click must **not** open picker |

- After submit: `ಉಪಸ್ಥಿತಿ ಸಲ್ಲಿಸಲಾಗಿದೆ/Upasthiti submitted` + shakhe name + date; then saved two-step view; Edit on page 2.
- Helpers: `setDateChrome(step)` used by `setDailyStep` and `setSavedStep`. Do **not** hide picker in `showSavedUpasthiti`.

**Boudhik / Sharirik UI (latest)**

- **Not** a `<select>` + chips.
- **Open/close `<details class="program-fold">`**. Summary is the bilingual title. Open → **checkboxes** (one column, kn + en wrap). Closed by default.
- Same on **form** (`#boudhik-checks`, `#sharirik-checks`) and **saved view** (`savedProgramFold`, checkboxes disabled).
- Extra fields still appear when the matching box is ticked: sanna/deergha text, boudhik/charche people (`name — number`), itara.
- Kannada spelling: **ಬೌದ್ಧಿಕ್ / Boudhik** (not ಬೌಧಿಕ್).
- Seva is **free text only** (not checkboxes).

---

## Key files

| Path | Role |
|---|---|
| `server.js` | Express, CSP (unpkg for Leaflet), APIs |
| `public/index.html` | Screens; cache-bust query |
| `public/app.js` | All client logic |
| `public/styles.css` | `.program-fold`, `.check-grid`, date bold |
| `models/Shakhe.js` | `shakhes` |
| `models/ShakheUpasthiti.js` | `shakheupasthitis` unique `{shakhe, date}` |
| `models/ShakheAudit.js` | `shakheaudits` |
| `lib/shakheService.js` | create/list/update; people names |
| `lib/upasthitiService.js` | daily upsert/get |
| `lib/ashtabindu.js` | allowed boudhik/sharirik ids |
| `lib/peopleSearch.js` | `/api/people/search` |
| `lib/varadiAuth.js` / `nagaraAuth.js` | nagara session |
| Shared entity models | Entity, Person, Role, VaradiSession — same DB as Utsava |

Client notes:
- `programPicked = { boudhik: Set, sharirik: Set }`
- `renderProgramChecks` / `fillChecks` / `setChecks`
- `bindBearerSearch` + `selectBearer` / `selectBearerByPhone`
- `personCell` for name — number
- Maps: `https://www.google.com/maps?q=lat,lng`

---

## Last user-facing changes (this session)

1. Page 1 always: picker `ದಿನಾಂಕ/Date` + native `02/09/2026` **and** bold `ದಿನಾಂಕ/Date 02-09-2026`. Page 2: bold only.
2. Saved ashtabindu was wrongly done as disabled select + chips. User rejected that.
3. Replaced with **open/close details** that reveal **checkboxes** (form + saved). Cache `20260902j`.

---

## Do not regress

- Warning modals: names, not phones only.
- Edit shakhe: karyavaha/palaka names fill; overlay until loaded.
- Boudhik/charche persist and show **name — number**.
- Page 2 date picker must stay hidden (it overlapped ashtabindu before).
- 3-column checkboxes clipped Kannada — folds use **1 column**.
- Missing Varadi session is `200 {ok:false,reason:missing}`, not 401 on home.
- Favicon: `/favicon.svg` + `/favicon.ico` redirect.

---

## Likely next asks

- Polish program-fold (open by default if anything is ticked; count in summary).
- Saved-view extras still as `kv` rows — may want them to match form fields.
- Git-init / deploy `shakhe-upasthiti` (Dockerfile + railway.toml already there).
- Anything still in Utsava `git status` is a **different** app.

---

## Prompt to paste next session

```
Continue Shakhe Upasthiti, not Utsava.

Project: /Users/jayanth/Documents/shakhe-upasthiti  port 3002
Read HANDOFF.md in that folder first.

Latest: Boudhik/Sharirik are <details class="program-fold"> open/close showing checkboxes
(not select+chips). Date: page 1 picker+bold, page 2 bold only.
Cache bust public/index.html app.js?v= after JS/CSS edits.
```
