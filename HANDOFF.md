# Shakhe Upasthiti — handoff

**Updated:** 2026-09-15

**Repository:** https://github.com/JayanthSanaathana/shakhe-upasthiti

**Branch:** `master`

**Latest application commit:** `449cb09` (`Add dedicated person database connection`)

This document intentionally contains no passwords, MongoDB URIs, Tailscale keys, or SSH private-key contents.

## Current production state

- Railway project: `alluring-warmth`
- Railway service: `shakhe-upasthiti`
- Railway environment: `production`
- Deployment `39d0dfa2-b0e4-4472-bfc9-f7739ed20778` succeeded.
- Public HTTP check returned `200`.
- Application binds to Railway's `PORT` on `0.0.0.0`; the verified production port was `8080`.
- Startup logs confirmed:

```text
Static egress ready; public-ip=13.127.136.216
ENTITY_MONGO_URI connected (read-only via SOCKS5 127.0.0.1:1055) db=kdpEntities
Phone search uses read-only `ssdatas`, `sanghdatas`, and `entities` queries through `ENTITY_MONGO_URI`.
Shakhe Upasthiti running on 0.0.0.0:8080
```

## Database routing

There are three logical database variables:

| Variable | Current purpose |
|---|---|
| `MONGO_URI` | Writable application data: shakhes, attendance, sessions, audits, deleted shakhes, and related app collections. |
| `ENTITY_MONGO_URI` | Read-only hierarchy and authorization master data in `kdpEntities`. |
| `people` collection on `MONGO_URI` | Retained combined directory; not used by current phone search. |

Phone search reads source collections directly through the read-only entity connection. The retained `people` collection is not deleted and is available for future use.

The seven entity collections are periodically copied into the application database as a fallback cache. If `ENTITY_MONGO_URI` is unavailable, the same collection names in `MONGO_URI` are used automatically. The source entity database is never written. The interval is controlled by `ENTITY_CACHE_SYNC_INTERVAL_MINUTES` (default `1440`; set to `5` for rapid sync testing).

### Read-only audit results (2026-09-15)

Application database `upasthiti`:

- `people`: 149,667 records
- Records with a phone value: 149,665
- A production `/api/people/search` test returned one correctly shaped result.

Entity database `kdpEntities`:

- `entities`: 37,639
- `parententities`: 37,611
- `stharas`: 10
- `roles`: 117
- `userroles`: 365
- There is no `people` collection.
- Representative Entity→Sthara, parent-child, and UserRole references resolved successfully.

Phone search now starts in `ENTITY_MONGO_URI.ssdatas`, joins `sanghdatas` through `ssData`, and resolves Nagar names from `entities`. Blank `otherResponsibility` displays as `Swayamsevak`.

### Model routing

- `lib/peopleSearch.js` → `ENTITY_MONGO_URI` (`ssdatas` + `sanghdatas` + `entities`)
- `lib/entityCache.js` → periodic read-only source copy into the application database
- `Entity`, `ParentEntity`, `Sthara`, `Role`, `UserRole` → `getLiveModel()` → `ENTITY_MONGO_URI`
- Shakhe, attendance, deletion archive, sessions, and audits → default Mongoose connection → `MONGO_URI`

Person lookup is used by Mukhya Shikshak, Karyavaha, Shakha Palaka, Pravasi, Boudhik/Charche speaker search, and automatic name resolution from phone numbers.

## Static MongoDB egress

Railway uses a restricted SSH dynamic SOCKS tunnel through AWS. This replaced the unreliable Tailscale userspace exit-node SOCKS route.

```text
Railway app
  → SOCKS5 127.0.0.1:1055
  → SSH tunnel to AWS
  → AWS static public IPv4 13.127.136.216
  → MongoDB Atlas
```

AWS resources:

- Lightsail instance: `shakhe-atlas-egress`
- Region: `ap-south-1`
- Static IPv4: `13.127.136.216`
- Restricted tunnel user: `railway-egress`
- The user has no sudo access; PTY, agent forwarding, and X11 forwarding are disabled.

Railway variables used by the SSH tunnel:

- `SSH_EGRESS_HOST`
- `SSH_EGRESS_USER`
- `SSH_EGRESS_PRIVATE_KEY_B64`
- `SSH_EGRESS_KNOWN_HOSTS_B64`
- `TS_EXPECTED_EGRESS_IP` (name retained; used to verify the expected AWS public IP)

Implementation:

- `Dockerfile` installs `openssh-client`.
- `scripts/docker-entrypoint.sh` creates the SOCKS tunnel, verifies its public IP, starts Node, and monitors both processes.
- If SSH dies, the container exits so Railway can restart it.
- Tailscale variables may remain in Railway as an unused fallback. SSH takes precedence whenever `SSH_EGRESS_PRIVATE_KEY_B64` is set.

## Important commits

- `449cb09` — corrected phone-search source and read-only person model routing
- `6dd6ead` — reliable SSH static-egress tunnel and explicit `0.0.0.0` HTTP bind
- `a1c8e70` — expected-egress verification and Mongo diagnostics
- `3ff00fa` — earlier Tailscale userspace workaround
- `60f5722` — scoped shakhe management and recoverable deletion
- `c45de2f` — linked PDF and Excel report exports

## Continue on another computer

Clone and install:

```bash
git clone https://github.com/JayanthSanaathana/shakhe-upasthiti.git
cd shakhe-upasthiti
npm ci
```

Local `.env` is not stored in Git. Obtain values from Railway rather than sending secrets through chat.

Railway CLI:

```bash
npx -y @railway/cli login
npx -y @railway/cli link
```

Select workspace `My Projects`, project `alluring-warmth`, environment `production`, and service `shakhe-upasthiti`.

Safe status commands:

```bash
npx -y @railway/cli deployment list --service shakhe-upasthiti --environment production --limit 5
npx -y @railway/cli logs --service shakhe-upasthiti --environment production --lines 100
```

Do not run `railway variable list --json` or `--kv` in shared output because those commands print secret values.

## MongoDB Compass from another computer

For person data, paste `MONGO_URI` into Compass and open `upasthiti → people`.

For `ENTITY_MONGO_URI`, generate a device-specific SSH key on the new computer:

```bash
ssh-keygen -t ed25519 -a 100 -f ~/.ssh/shakhe_compass -C shakhe-compass
```

Only the `.pub` file may be shared. Add its public key to `/home/railway-egress/.ssh/authorized_keys` on AWS. Never share the private `shakhe_compass` file.

The existing private tunnel key on the original Mac is `/Users/jayanth/.ssh/railway_shakhe_egress`. Do not commit, upload, email, or paste it.

Test from Windows PowerShell:

```powershell
Test-NetConnection 13.127.136.216 -Port 22
ssh -i "$env:USERPROFILE\.ssh\shakhe_compass" -N -D 127.0.0.1:1055 railway-egress@13.127.136.216
```

On macOS/Linux:

```bash
nc -vz 13.127.136.216 22
ssh -i ~/.ssh/shakhe_compass -N -D 127.0.0.1:1055 railway-egress@13.127.136.216
```

If SSH remains open without output, leave it running. In Compass choose Advanced Connection Options → Proxy / SSH Tunnel → Socks5, hostname `127.0.0.1`, port `1055`, then connect with `ENTITY_MONGO_URI`.

If port 22 times out only on the new computer, test another network or inspect the AWS Lightsail firewall. The AWS CLI profile on the original Mac was `shakhe-deployer`, but its temporary login expired and must be renewed with `aws login`.

## Safety and secrets

- Do not write to `ENTITY_MONGO_URI` or the `people` collection during diagnostics.
- Use only `find`, aggregation, collection listing, counts, and metadata inspection unless the user explicitly authorizes a write.
- Never point `MONGO_URI` at the owner/master entity database.
- A MongoDB credential and an earlier Tailscale auth key were pasted in chat. Rotate/revoke them if not already completed.
- Never print Railway variables containing URIs, session secrets, or private keys.
- MongoDB Compass can write unless permissions prevent it; prefer a read-only MongoDB user for inspection.

## Local checks

```bash
node --check server.js
node --check lib/mongo.js
bash -n scripts/docker-entrypoint.sh
git diff --check
```

There is currently no `npm test` script.

## Prompt for the next session

```text
Continue work on Shakhe Upasthiti.

Repository: <local clone>/shakhe-upasthiti
Read HANDOFF.md completely before taking action.

Current production architecture:
- Railway project alluring-warmth, service shakhe-upasthiti, production.
- MONGO_URI is the writable app DB.
- ENTITY_MONGO_URI is read-only hierarchy/roles in kdpEntities.
- Phone search reads `ssdatas`, `sanghdatas`, and `entities` from ENTITY_MONGO_URI; `people` is retained but unused.
- Railway reaches Atlas through an SSH SOCKS tunnel via AWS static IP 13.127.136.216.
- Production and public HTTP checks succeeded on 2026-09-15.

Do not reveal secrets. Do not perform any database write operation unless I explicitly authorize it. Use read-only diagnostics by default.
```
