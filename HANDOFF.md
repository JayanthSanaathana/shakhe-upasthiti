# Shakhe Upasthiti — session handoff

**Date:** 2026-09-08  
**Continue here:** `/Users/jayanth/Documents/shakhe-upasthiti`  
**GitHub:** https://github.com/JayanthSanaathana/shakhe-upasthiti  
**Latest commit:** `66f9713` (plus HANDOFF update) on `master`  
**Sibling app (Utsava):** `/Users/jayanth/Documents/raksha-bandhan-utsava`  
**Grok workspace often opens Utsava**, but almost all current work is in this folder. Do not add shakhe features inside Utsava.

A copy of this file also lives at `raksha-bandhan-utsava/HANDOFF-SHAKHE-UPASTHITI.md` (may be stale).

---

## How to run

```bash
cd /Users/jayanth/Documents/shakhe-upasthiti
# reuse Utsava MONGO_URI in .env
npm run dev
```

- Port **3002** (`PORT` or `SHAKHE_PORT`).
- Same `MONGO_URI` as Utsava.
- Cache-bust: `public/index.html` loads `/app.js?v=20260908n` and `/styles.css?v=20260908n`. **Bump both** after every `public/app.js` or `styles.css` change.
- Git: `master` → `origin/master` at https://github.com/JayanthSanaathana/shakhe-upasthiti. `.env` is gitignored.

---

## Auth scope (important)

**Nagara login only** for the entity dashboard and reports.  
Prant / vibhag / bhag logins get “No Nagara access” — multi-level varadi (Utsava-style) is **not** built here yet.

Volunteer path uses **phone session** (`lib/phoneAuth.js`), separate from nagara.

---

## Product (what exists)

Standalone nagara + volunteer attendance app. Not inside Utsava.

### Home (guest)

Create Shakha · Upasthiti · Shakhe Varadi (phone) · Nagara login

### After nagara login — `.action` tiles

1. Create Shakhe  
2. Shakhegala Patti  
3. **Shakhe Varadi**  
4. **Sharirik Varadi**  
5. **Boudhik Varadi**

### Create / Patti

- Create: bearers kept; labels **ಸ್ಥಳ/Sthala** + **ಗೂಗಲ್ ಸ್ಥಳ/Google location**.
- Patti columns: Shakhe, Vasati, Upavasati, Timing, Type, **Sthala**, **Google location**, Edit.  
  **No** Mukhya Shikshak / Karyavaha / Shakha palaka columns on the list.

### Nagara reports (`#nagara-report-view`)

Shared chrome for all three kinds (`nagaraReportKind`: `shakhe` | `boudhik` | `sharirik`):

- From/To (default last 7 days IST, max 62 calendar days).
- Place line: left `ಭಾಗ - …`, right `ನಗರ - …`.
- Full cell borders; Baloo display fonts.
- **ಭಾನುವಾರ ಹೊರತುಪಡಿಸಿ/Exclude Sunday** under Days selected — drops Sundays from day count, day tables, and all sums/averages/checkbox counts.

#### Shakhe Varadi columns

- **Vasati name** (clickable) → upavasati list with **with shakhe** / **without shakhe** dropdowns.  
  With-shakhe: grouped by upavasati; each shakhe row = name, timing, type, mukhyashikshak.  
  (Total upavasati **column removed**.)
- Yojita / Nadayuthiruva / Nadayada (clickable counts).
- **ಸರಾಸರಿ/Sarisumaru** + **ಒಟ್ಟು ಸಂಪರ್ಕ/Ottu samparka**.

**Sarisumaru formula:**  
`ceil(sum(field) ÷ count of upasthiti entries in range)`  
(shakhe×date entries; Sundays excluded when checkbox on). Exact ints stay; always round **up**.

#### Nadayuthiruva list

- Columns: **Upavasati → Shakhe → Details (timing/type collapsed) → Days ran `4/7` → Sarisumaru → Ottu samparka**.
- Click **shakhe name** → shakhe details view.  
- Click **days ran** → day-by-day Shakhe Varadi table + **Total** foot row.  
- Total foot matches pooled vasati calculation from previous screen.  
- Back from day varadi → list; Back from list → report.

#### Boudhik / Sharirik Varadi

- Vasati rows: Days ran, Nadayuthiruva, then **one column per checkbox** (count of entries where that id was ticked).
- Click Nadayuthiruva → shakhe list → click days → day grid with ✓/— per checkbox + Itara + totals.

### Volunteer Upasthiti / phone Varadi

- Sign out → **phone lookup** screen (not main home).  
- Lookup Back → main home.  
- **Recent shakhes** (max 5, `localStorage` `shakhe-phone-recent:v1`): shown when phone field empty; hidden when typing or after Find shakhe. Tap → re-login that phone and open shakhe.
- Daily upasthiti + per-shakhe phone varadi still on `#upasthiti-view` / `#shakhe-varadi-view`.

---

## APIs (nagara session)

| Endpoint | Role |
|---|---|
| `GET /api/nagara/shakhe-varadi?from&to&excludeSunday=` | Vasati aggregate attendance report |
| `GET /api/nagara/program-varadi?kind=boudhik\|sharirik&from&to&excludeSunday=` | Per-checkbox program report |
| `GET /api/nagara/upavasatis?filter=&vasatiId=` | Upavasati with/without shakhe (+ shakhe detail for with) |
| `GET /api/nagara/shakhes?filter=all\|running\|not-running\|varadi&vasatiId=&shakheId=&from=&to=&excludeSunday=` | Shakhe lists + day varadi |

Aggregation: `lib/shakheVaradiReport.js`

---

## Key files

| Path | Role |
|---|---|
| `server.js` | Express + nagara report routes |
| `public/index.html` | Screens; cache-bust `?v=` |
| `public/app.js` | Client (large): nagara reports, lookup recent, volunteer |
| `public/styles.css` | Tiles, report grid, folds, recent list |
| `lib/shakheVaradiReport.js` | Report aggregation |
| `lib/shakheService.js` | create/list/update (+ `withPeopleNames` export) |
| `lib/upasthitiService.js` | Daily upsert/get (phone) |
| `lib/phoneAuth.js` / `models/PhoneSession.js` | Phone sessions |
| `lib/ashtabindu.js` | Boudhik/Sharirik catalog ids |

---

## Do not regress

- Warning modals: **name — number**, not phones only.
- Edit shakhe: bearer names fill; `#form-loading` until done.
- Volunteer page 2: date picker hidden (bold date only).
- Missing varadi session on home: `200 {ok:false,reason:missing}`, not 401.
- Favicon `/favicon.svg` + `/favicon.ico` redirect.
- Keep volunteer `#shakhe-varadi-view` separate from nagara `#nagara-report-view`.
- Nagara-list Back from Yojita/etc. → Shakhe Varadi report (not Patti).
- Exclude Sunday must affect day count, day tables, and all calculations.

---

## Likely next asks

- Prant / vibhag / bhag multi-level reports (like Utsava).
- Different Sarisumaru rule (no ceil, or mean-of-shakhe-avgs).
- Deploy / Railway.

---

## Prompt to paste next session

```
Continue Shakhe Upasthiti, not Utsava.

Project: /Users/jayanth/Documents/shakhe-upasthiti  port 3002
Read HANDOFF.md first.

Latest on master: Nagara tiles — Create, Patti, Shakhe/Sharirik/Boudhik Varadi.
Shakhe Varadi: clickable vasati → with/without shakhe; Yojita/Nadayuthiruva/Nadayada;
Sarisumaru = ceil(sum/entries); Exclude Sunday; Nadayuthiruva list with 4/7 + totals.
Boudhik/Sharirik: per-checkbox columns + day ✓ grid.
Upasthiti sign-out → phone lookup + recent shakhes (max 5).
Auth is nagara-only for reports. Cache bust app.js?v= / styles.css?v= (now 20260908n).
```
