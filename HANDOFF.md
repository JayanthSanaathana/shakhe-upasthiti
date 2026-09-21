# Shakhe Upasthiti — handoff

**Updated:** 2026-09-21

**Repository:** https://github.com/JayanthSanaathana/shakhe-upasthiti

**Branch:** `master`

**Latest application commit:** `5929547` (`Include config/ in Docker image for Jalahalli overlay`)

This document intentionally contains no passwords, MongoDB URIs, Tailscale keys, or SSH private-key contents.

---

## Open issues (read first)

### Avalahalli @ Kithaganuru — wrong Upavasatis in UI

**Status: OPEN** — still reproduces after switching hierarchy reads to live.

Full write-up:

→ **[`docs/issue-avalahalli-kithaganuru-upavasatis.md`](docs/issue-avalahalli-kithaganuru-upavasatis.md)**

Summary:

- Clean Compass export: Vasati `668cfe91529dc546a1f21860` (AVALAHALLI under KITHAGANURU) has **8** Upavasatis (MHD82–96).
- UI Total Upavasati list showed **~32**, including school Upavasatis that belong under **other** Vasati IDs (same display name `AVALAHALLI` elsewhere, Muneshwara Block, etc.).
- Hierarchy must always use **entity IDs** + `parententities`, never place-name matching.
- App DB cache (`upasthiti`) had **extra** parent edges (17 children) vs clean export (8).
- `ENTITY_REFERENCE_SOURCE=live` is set on **aws-egress**; re-verify live Compass vs API if UI still wrong.

### Hierarchy ID rule (product requirement)

| Action | Uses |
|---|---|
| Select parent | parent `_id` |
| Load children | `parententities` where `parentEntity = that _id` |
| Know level | `entity.sthara` → `stharas._id` |
| Show label | `entity.name` display only |

Applies to create / view / edit / delete / Patti / reports / filters / login-scoped screens.  
Sthara *type* lookups by name (`Vasati`, `Nagar`) are OK; place names are not.

---

## Environments

| Environment | URL / notes |
|---|---|
| **aws-egress** (active test) | https://shakhe-upasthiti-aws-egress.up.railway.app — prefer this for entity/egress work |
| **production** | https://shakhe-upasthiti-production.up.railway.app — avoid redeploy unless asked |

Railway project: `alluring-warmth`  
Service: `shakhe-upasthiti`

### aws-egress entity config (2026-09-21)

- `ENTITY_MONGO_URI` — set (kdpEntities via SSH SOCKS)
- `ENTITY_REFERENCE_SOURCE=live`
- `SSH_EGRESS_HOST=13.127.136.216` (+ key / known_hosts)
- `ENTITY_LOCAL_HIERARCHY_OVERRIDE_NAMES=JALAHALLI` (sync preserve only)
- Startup logs should show: SSH egress up, `ENTITY_MONGO_URI connected … db=kdpEntities`, optional `Jalahalli name overlay ready`

---

## Database routing

| Variable | Purpose |
|---|---|
| `MONGO_URI` | App DB `upasthiti`: shakhes, attendance, sessions, audits, **entity cache** |
| `ENTITY_MONGO_URI` | Read-only master `kdpEntities`: entities, parententities, stharas, roles, userroles, ssdatas, sanghdatas |

### How reads choose live vs local

- `ENTITY_REFERENCE_SOURCE=live` → `entities` / `parententities` / `stharas` / `userroles` / `roles` from **live**
- Default / `local` → those five from **app DB cache**
- `ssdatas` / `sanghdatas` → live when `ENTITY_MONGO_URI` is connected (phone search)
- If live connect fails → fall back to cache (log: `ENTITY_MONGO_URI unavailable; using cached…`)

Named override `ENTITY_LOCAL_HIERARCHY_OVERRIDE_NAMES=JALAHALLI`:

- **Sync:** preserves Jalahalli subtree in local cache when refreshing from live  
- **Reads:** must **not** force all hierarchy onto local when `live` is set (fixed in `a615934`)

### Jalahalli display-name overlay (temporary)

- Config: `config/jalahalli-name-overlay.js` (`enabled: true/false`)
- Code: `lib/jalahalliNameOverlay.js`
- **Links** always from live IDs; **names** under Jalahalli can show local cache labels for same `_id`
- Turn off by setting `enabled: false` in that file
- Does not fix Kithaganuru Avalahalli child lists

Dockerfile must `COPY config ./config` (omitting it caused “request failed” / missing module).

---

## Static MongoDB egress (AWS Lightsail)

```text
Railway app
  → SOCKS5 127.0.0.1:1055
  → SSH tunnel to AWS
  → static IPv4 13.127.136.216
  → MongoDB Atlas
```

- Lightsail instance: `shakhe-atlas-egress` (`ap-south-1`)
- User: `railway-egress` (restricted)
- Free credits ended earlier; instance may still run but watch **Billing → Lightsail**
- Compass to `kdpEntities` should use **SSH identity file** through `13.127.136.216` when Atlas allowlists only that IP

Railway vars: `SSH_EGRESS_HOST`, `SSH_EGRESS_USER`, `SSH_EGRESS_PRIVATE_KEY_B64`, `SSH_EGRESS_KNOWN_HOSTS_B64`, `TS_EXPECTED_EGRESS_IP`

---

## Recent commits (entity / hierarchy)

- `5929547` — Docker COPY `config/` (fix request failed)
- `b2c4ef8` — Jalahalli display-name overlay
- `a615934` — `ENTITY_REFERENCE_SOURCE=live` honored for hierarchy reads
- `d700adc` — reports use live ParentEntity walks (no adjacency index)
- `449c16a` / `46f2623` — multi-parent / all children under selected parent
- `f9ffafb` / `649dd67` — Patti Mukhashikshak / Karyavaha / Palaka columns

---

## Continue on another computer

```bash
git clone https://github.com/JayanthSanaathana/shakhe-upasthiti.git
cd shakhe-upasthiti
npm ci
cp .env.example .env   # fill MONGO_URI; optional ENTITY_* / SSH_*
npm start
```

Prefer testing entity issues on **aws-egress**, not production.

### Compass (entity DB via static IP)

1. Atlas Network Access: `13.127.136.216/32`
2. Compass → SSH with Identity File → host `13.127.136.216`, user `railway-egress`, key `~/.ssh/railway_shakhe_egress`
3. URI host `kdp2025….mongodb.net`, DB **`kdpEntities`**
4. For Avalahalli children: `parententities` filter `parentEntity = ObjectId("668cfe91529dc546a1f21860")`

---

## Historical notes (2026-09-15)

Earlier production used SSH egress successfully; phone search via `ssdatas`/`sanghdatas` was verified. Entity cache sync interval: `ENTITY_CACHE_SYNC_INTERVAL_MINUTES` (default 1440).

See also: `docs/static-egress-hetzner.md` (alternate egress option).
