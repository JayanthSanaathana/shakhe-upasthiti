# Shakhe Upasthiti

Standalone app (sibling of `raksha-bandhan-utsava`) for creating shakhes and, next, taking attendance.

Uses the same MongoDB (`MONGO_URI`) and Varadi/Nagara login as the Utsava app. Shakhe records are stored in a new `shakhes` collection.

## Run

```bash
cp .env.example .env   # or reuse the Utsava .env
npm install
npm run dev
```

Default port: **3002**.

## MongoDB environment variables

`MONGO_URI` is the application database. It stores the app's Shakhe, daily attendance, session, audit and synchronized entity collections. It is the only database this app writes to.

`ENTITY_MONGO_URI` is the read-only source database (`kdpEntities`). The app reads `ssdatas` and `sanghdatas` from it for phone search and responsibility details. It also reads live hierarchy data from the five reference collections when `ENTITY_REFERENCE_SOURCE=live`.

There is no separate person URI. Do not add `PERSON_MONGO_URI`; phone search uses `ssdatas` and `sanghdatas` through `ENTITY_MONGO_URI`.

### Persistent synchronized copies

The following seven source collections are copied into `MONGO_URI` at the configured interval:

```text
ssdatas
sanghdatas
entities
parententities
stharas
userroles
roles
```

These are persistent collections, not temporary files. The copies remain in MongoDB after restarts and are refreshed from the source during synchronization. The source `ENTITY_MONGO_URI` database is never written.

### Choosing live or local reference data

By default, the five relatively static hierarchy/authorization collections are read from their persistent copies in `MONGO_URI`:

```text
ENTITY_REFERENCE_SOURCE=local
```

To read those five collections directly from `ENTITY_MONGO_URI`, set:

```text
ENTITY_REFERENCE_SOURCE=live
```

If the developer entity database is missing corrected Upavasati names, set:

```text
ENTITY_LOCAL_HIERARCHY_OVERRIDE=true
```

This forces `entities` and `parententities` to stay on the local `MONGO_URI` copy and prevents synchronization from overwriting those two collections. Set it back to `false` after the developer data is corrected.

`ssdatas` and `sanghdatas` use `ENTITY_MONGO_URI` by default because person and responsibility data can change. If the live connection is unavailable, all seven collections fall back to their persistent copies in `MONGO_URI`.

### Synchronization interval

Set the interval in minutes with:

```text
ENTITY_CACHE_SYNC_INTERVAL_MINUTES=1440
```

Common values:

```text
5       # refresh every five minutes while testing
1440    # refresh every 24 hours
```

After changing a Railway variable, redeploy the service. A synchronization runs on startup when the live entity database is reachable, and then repeats at the configured interval.

## This slice

- Home: **Nagara login** and **Upasthiti** (placeholder).
- After nagara login: **Create Shakhe** and **Shakhes**.
- Create form: Vasati, Upavasati, name, timing (prabhat / sayam / ratri), time, type (balaka, Taruna-Vidyarthi, Taruna-Udyogi, Samyuktha), mukhashikshak phone (required; many shakhes per phone), karyavaha and shakha palaka phones (optional).
- Multiple shakhes per upavasati.
