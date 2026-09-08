# Shakhe Upasthiti — session handoff

**Date:** 2026-09-08  
**Continue here:** `/Users/jayanth/Documents/shakhe-upasthiti`  
**GitHub:** https://github.com/JayanthSanaathana/shakhe-upasthiti  
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
- Cache-bust: `public/index.html` loads `/app.js?v=20260908a` and `/styles.css?v=20260908a`. **Bump these** after every `public/app.js` or `styles.css` change.
- Git: `master` tracking `origin` at https://github.com/JayanthSanaathana/shakhe-upasthiti (public). `.env` is gitignored.

---

## Product (what exists)

Standalone nagara + volunteer attendance app. Not inside Utsava.

**Home (guest):** Create Shakha, Upasthiti, Shakhe Varadi (per-shakhe phone path), Nagara login.

**After nagara login** — bordered `.action` tiles (same as Patti):
1. Create Shakhe
2. Shakhegala Patti
3. **Shakhe Varadi** (nagara aggregate report)
4. **Sharirik Varadi** (placeholder / coming soon)
5. **Boudhik Varadi** (placeholder / coming soon)

### Nagara Shakhe Varadi (`#nagara-report-view`)

- Date range From/To (default last 7 days IST, max 62).
- Place line: left `ಭಾಗ - …`, right `ನಗರ - …`. Full cell borders. Averages use ceil.
- Vasati rows + total foot. Columns:
  - Total upavasati (click → with/without shakhe dropdowns)
  - **ಯೋಜಿತ ಶಾಖೆ/Yojita Shakhe** — all created shakhes (click → shakhe patti)
  - **ನಡೆಯುತ್ತಿರುವ ಶಾಖೆಗಳು/Nadayuthiruva** — ≥1 upasthiti day in range (click → each shakhe + varadi table)
  - **ನಡೆಯದ ಶಾಖೆ/Nadayada** — created but no upasthiti in range (click → shakhe patti)
  - **ಸರಾಸರಿ/Sarisumaru** + **ಒಟ್ಟು ಸಂಪರ್ಕ/Ottu samparka**

APIs:
- `GET /api/nagara/shakhe-varadi?from&to`
- `GET /api/nagara/upavasatis?filter=&vasatiId=`
- `GET /api/nagara/shakhes?filter=all|running|not-running&vasatiId=&from=&to=`
- Aggregation: `lib/shakheVaradiReport.js`

### Volunteer Upasthiti / per-shakhe Varadi (phone)

- Phone login → list shakhes → daily upasthiti or per-shakhe date-range varadi (`#shakhe-varadi-view`).
- Daily unique index `shakhe + date` (IST). Program folds for Boudhik/Sharirik checkboxes.

**After nagara login (create/list)**
- Create Shakhe / list Shakhes.
- Locked vibhag / bhag / nagar from session.
- Bearers via people phone-search; warning modals (do not block create). Cards show **name — number**.

---

## Key files

| Path | Role |
|---|---|
| `server.js` | Express, CSP, APIs including nagara shakhe-varadi |
| `public/index.html` | Screens; cache-bust query |
| `public/app.js` | Client logic |
| `public/styles.css` | action tiles, report table, list-dropdown |
| `lib/shakheVaradiReport.js` | Nagara aggregate report + upavasati lists |
| `lib/shakheService.js` | create/list/update |
| `lib/upasthitiService.js` | daily upsert/get (phone) |
| `lib/phoneAuth.js` / `models/PhoneSession.js` | volunteer phone sessions |
| `lib/ashtabindu.js` | allowed boudhik/sharirik ids |
| Shared entity models | Entity, Person, Role, VaradiSession — same DB as Utsava |

---

## Do not regress

- Warning modals: names, not phones only.
- Edit shakhe: karyavaha/palaka names fill; overlay until loaded.
- Boudhik/charche persist and show **name — number**.
- Page 2 date picker must stay hidden on volunteer daily form.
- Missing Varadi session is `200 {ok:false,reason:missing}`, not 401 on home.
- Favicon: `/favicon.svg` + `/favicon.ico` redirect.
- Volunteer `#shakhe-varadi-view` stays separate from nagara `#nagara-report-view`.

---

## Likely next asks

- Implement Sharirik / Boudhik nagara varadi reports (buttons already present).
- Confirm average denominator if users want distinct calendar days instead of shakhe×date entries.
- Drill into shakhe list from with-shakhe dropdown.
- Deploy / Railway.

---

## Prompt to paste next session

```
Continue Shakhe Upasthiti, not Utsava.

Project: /Users/jayanth/Documents/shakhe-upasthiti  port 3002
Read HANDOFF.md in that folder first.

Latest: After nagara login — Create, Patti, Shakhe Varadi, Sharirik Varadi, Boudhik Varadi tiles.
Shakhe Varadi is nagara report with date range, Sarisumaru averages, Ottu samparka sums;
Total upavasati opens with/without shakhe dropdowns. Sharirik/Boudhik are placeholders.
Cache bust public/index.html app.js?v= / styles.css?v= after JS/CSS edits.
```
