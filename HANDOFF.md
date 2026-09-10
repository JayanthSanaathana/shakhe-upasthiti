# Shakhe Upasthiti — session handoff

**Date:** 2026-09-10  
**Continue here:** `/Users/jayanth/Documents/shakhe-upasthiti`  
**GitHub:** https://github.com/JayanthSanaathana/shakhe-upasthiti  
**Latest local tip:** `399f84c` (`Vibhag reorder`) on `master` — **ahead of origin**; also **uncommitted** Tailscale/SOCKS + Dockerfile work (see below).  
**Sibling app (Utsava):** `/Users/jayanth/Documents/raksha-bandhan-utsava`  
**Grok workspace often opens Utsava**, but almost all current work is in this folder. Do not add shakhe features inside Utsava.

A short pointer also lives at `raksha-bandhan-utsava/HANDOFF-SHAKHE-UPASTHITI.md` (may lag).

---

## How to run

```bash
cd /Users/jayanth/Documents/shakhe-upasthiti
npm run dev   # or: npm start
```

- Port **3002** locally (`PORT` or `SHAKHE_PORT`). Railway public port is often **8080** (`PORT` env).
- `.env` is gitignored. See `.env.example`.
- Cache-bust: `public/index.html` → `/app.js?v=…` and `/styles.css?v=…`. **Bump both** after every `public/app.js` or `styles.css` change. Current: **`?v=20260910w`**.

### Env (two Mongo URIs)

| Variable | Purpose |
|----------|---------|
| `MONGO_URI` | **Write** DB (app data): `shakhes`, `shakheupasthitis`, `shakheaudits`, `phonesessions`, `varadisessions`. Historically Atlas DB `upasthiti` (shared with Utsava). |
| `ENTITY_MONGO_URI` | **Read-only** live master data from owner cluster `kdpEntities` (e.g. `…@kdp2025.2yq8i0o.mongodb.net/kdpEntities`). |
| `MONGO_SOCKS_PROXY` | Optional `127.0.0.1:1055` — SOCKS5 for **ENTITY only** (Tailscale userspace on Railway). |
| `TS_AUTHKEY` / `TS_EXIT_NODE` / `TS_HOSTNAME` | Railway Tailscale egress (see `docs/static-egress-hetzner.md`). Leave unset locally. |

If `ENTITY_MONGO_URI` is empty, people/entities/roles fall back to `MONGO_URI`.

**Local verification:** with WARP off and owner IP allowlisted, logs show  
`ENTITY_MONGO_URI connected (read-only) db=kdpEntities`.  
Jalahalli upavasati names that exist only in the write DB disappear from dropdowns — proves reads hit live DB.

---

## Dual DB: what is live vs app-local

### Read from `ENTITY_MONGO_URI` (never write)

Wired via `lib/mongo.js` + `getLiveModel` — schema hooks **refuse all writes**.

| Collection | Used for |
|------------|----------|
| `people` | Phone search / bearer names (`lib/peopleSearch.js`) |
| `entities` | Dropdowns, hierarchy, reports |
| `parententities` | Parent/child tree |
| `stharas` | Level names |
| `userroles` | Varadi hierarchy scopes after auth-service login (`lib/varadiScope.js`) |
| `roles` | Role name on those scopes |

Phone/volunteer login does **not** use `userroles` (phone session + confirm). Varadi email login **does**.

`accounts` exists on shared DBs but is **not** used by this app (auth is `AUTH_SERVICE_URL`).

### Write on `MONGO_URI` only

`shakhes`, `shakheupasthitis`, `shakheaudits`, `phonesessions`, `varadisessions`.

Utsava collections (`utsavas`, etc.) may sit on the same write DB; Upasthiti does not use them.

**Do not** point `MONGO_URI` at the live owner URI (would write into their cluster / break the split).  
**Do not** expect a Railway-hosted Mongo service to replace live `ENTITY_MONGO_URI` without syncing copies (loses “always latest from owner”).

---

## UI / hierarchy changes (2026-09-10)

### Upavasati list labels (`public/app.js`)

- Summary: **ಶಾಖಾಯುಕ್ತ/Shakhayuktha**, **ಶಾಖಾರಹಿತ/Shakharahita** (no space).
- Dropdown titles:  
  - `ಶಾಖಾಯುಕ್ತ ಗ್ರಾಮ/ಉಪವಸತಿ/Shakhayuktha Grama/Upavasati`  
  - `ಶಾಖಾರಹಿತ ಗ್ರಾಮ/ಉಪವಸತಿ/Shakharahita Grama/Upavasati`
- `stackedLabel()` updated to split at first `/` where English (Latin) begins, so English may contain `/` (e.g. `Shakhayuktha Grama/Upavasati`).

### Vibhaga order (`lib/hierarchy.js` `STHARA_ORDER.Vibhag`)

Live DB English names, display order:

1. Mysuru  
2. Hassana  
3. Mangaluru  
4. Shivamogga  
5. Tumkuru  
6. Kolar  
7. Bengaluru Uttara  
8. Bangalore Dakshin → **UI display** `Bengaluru Dakshina` via `displayEntityName()` (DB unchanged)

`allOfSthara` uses `sortEntities` (not raw `sort({ name: 1 })`). Display mapping also applied in shakhe serialize, varadi scopes, reports.

---

## Railway + Atlas IP (open work)

### Problem

Railway Hobby has **no static outbound IP**. Owner Atlas must allowlist client IPs; laptop IP (`223.x` with WARP off) ≠ Railway egress. Cloudflare WARP IPs (`104.28.x`) change and are not static.

### Chosen approach (in progress in repo)

**Keep Railway** + **Hetzner VPS as Tailscale exit node** (WireGuard under the hood) + app uses MongoDB driver **SOCKS5** (`proxyHost`/`proxyPort`) for `ENTITY_MONGO_URI` only.

Doc: **`docs/static-egress-hetzner.md`**

Repo pieces (may still be uncommitted):

- `lib/mongo.js` — SOCKS options for live connection; needs package `socks`
- `Dockerfile` — Tailscale + Node
- `scripts/docker-entrypoint.sh` — userspace SOCKS on `127.0.0.1:1055`, then `node server.js`
- `.env.example` — `ENTITY_MONGO_URI`, `MONGO_SOCKS_PROXY`, `TS_*`

`127.0.0.1:1055` = **localhost SOCKS inside the container** (not an Atlas allowlist IP). Atlas allowlists the **Hetzner public IPv4**.

### Plan B

Railway **Pro → Static Outbound IPs** → allowlist those IPs on Atlas; no VPS/Tailscale.

### Not a substitute

Creating a **MongoDB service on Railway** only hosts *your* DB. It does not give live owner `kdpEntities` without export/sync.

### Railway vars (when egress is ready)

`MONGO_URI`, `ENTITY_MONGO_URI`, `TS_AUTHKEY`, `TS_EXIT_NODE`, `TS_HOSTNAME`, secrets, `AUTH_SERVICE_URL`, etc. Redeploy; logs should show `read-only via SOCKS5`.

---

## Auth scope

**Prant / vibhag / bhag / nagara** varadi login (email+password via auth service), same pattern as Utsava.

- Entity dashboard + reports for the logged-in level.
- Volunteer path uses **phone session** (`lib/phoneAuth.js`), separate from varadi.
- Test-login UI/API was **removed** (seed script `scripts/seed-tumkuru-test-data.js` kept for optional local seed).

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

### Report hide / unhide (nagara Patti)

- Server field: `reportHideIntervals: [{ from, to }]`, interval **`[from, to)`** IST dates; `to: null` = still hidden.
- APIs: `POST /api/shakhe/:id/report-hide` / `report-unhide`.
- Applies to Shakhe / Sharirik / Boudhik + hierarchy rollups. Helpers: `lib/reportVisibility.js`.

### Varadi reports

Shared chrome: From/To (default last 7 days IST, max 62), Exclude Sunday.  
Yojita / Nadayuthiruva hierarchy; Sarisumaru rollups (bhag = sum nagara; vibhag/prant = child averages ÷ days).  
Volunteer: phone lookup, recent shakhes, separate `#shakhe-varadi-view`.

---

## Key files

| Path | Role |
|------|------|
| `server.js` | Express; `connectMongo()` from `lib/mongo.js` |
| `lib/mongo.js` | Dual connection + read-only live models + optional SOCKS |
| `lib/hierarchy.js` | Vibhag order, `displayEntityName`, entity tree |
| `lib/peopleSearch.js` | Live `people` |
| `lib/varadiScope.js` | Live `userroles` / `roles` / entities |
| `lib/shakheVaradiReport.js` | Reports + display names |
| `public/app.js` | Client; upavasati labels; `stackedLabel` |
| `public/index.html` | Cache-bust `?v=20260910w` |
| `Dockerfile` | Node + Tailscale userspace entrypoint |
| `scripts/docker-entrypoint.sh` | Tailscale SOCKS then Node |
| `docs/static-egress-hetzner.md` | Hetzner + Tailscale + Railway runbook / Plan B |
| `models/{Entity,Person,ParentEntity,Sthara,UserRole,Role}.js` | Live-bound via `getLiveModel` |
| `models/Shakhe.js` (+ upasthiti/sessions/audits) | App/write DB |

---

## Do not regress

- Live models must **never** write to `ENTITY_MONGO_URI`.
- Hide is **server-side** and must affect hierarchy, not only Patti UI.
- Unhide must close intervals via **plain** `{ from, to }` objects (Mongoose subdoc spread breaks `to`).
- Warning modals: **name — number**, not phones only.
- Missing varadi session on home: `200 {ok:false,reason:missing}`, not 401.
- Keep volunteer `#shakhe-varadi-view` separate from nagara `#nagara-report-view`.
- Exclude Sunday must affect day count, day tables, and calculations.
- Nadayuthiruva list footer: **sum rows**, do not re-average.
- Bump cache-bust on every `public/app.js` / `styles.css` change.

---

## Likely next asks

1. Finish Hetzner Tailscale exit + Railway deploy vars (or switch to Railway Pro static IPs).  
2. Commit/push uncommitted SOCKS/Dockerfile/docs if not done.  
3. Ask owner for Atlas `HETZNER_IP/32` (or `0.0.0.0/0` temporary) + prefer read-only DB user.  
4. Patti hide date picker; further field UX polish.

---

## Prompt to paste next session

```
Continue Shakhe Upasthiti, not Utsava.

Project: /Users/jayanth/Documents/shakhe-upasthiti  port 3002
Read HANDOFF.md first.

State (2026-09-10):
- Dual Mongo: MONGO_URI writes; ENTITY_MONGO_URI read-only live kdpEntities
  (people/entities/parententities/stharas/userroles/roles). lib/mongo.js blocks writes.
- Local live reads work (WARP off + owner IP allowlist). Railway needs static egress:
  docs/static-egress-hetzner.md (Hetzner Tailscale exit + SOCKS 127.0.0.1:1055) or Pro static IPs.
- UI: ಶಾಖಾಯುಕ್ತ / ಶಾಖಾರಹಿತ labels; Vibhag order; Bangalore Dakshin → display Bengaluru Dakshina.
- Cache bust ?v=20260910w. Check git status — SOCKS/Dockerfile/docs may be uncommitted.

Do not put live owner URI into MONGO_URI. Do not write to ENTITY_MONGO_URI.
```
