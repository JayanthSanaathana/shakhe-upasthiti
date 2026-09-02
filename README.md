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

## This slice

- Home: **Nagara login** and **Upasthiti** (placeholder).
- After nagara login: **Create Shakhe** and **Shakhes**.
- Create form: Vasati, Upavasati, name, timing (prabhat / sayam / ratri), time, type (balaka, Taruna-Vidyarthi, Taruna-Udyogi, Samyuktha), mukhashikshak phone (required; many shakhes per phone), karyavaha and shakha palaka phones (optional).
- Multiple shakhes per upavasati.
