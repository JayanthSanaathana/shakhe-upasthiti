# Static Atlas egress via Hetzner + Tailscale (Railway)

Railway Hobby has **no static outbound IP**. This setup keeps the app on Railway and makes Atlas see a **fixed Hetzner IPv4** for `ENTITY_MONGO_URI` reads.

```text
Railway app  →  SOCKS5 (Tailscale userspace)
             →  Hetzner exit node (WireGuard/Tailscale)
             →  public Hetzner IPv4
             →  MongoDB Atlas (kdpEntities)
```

## Plan B (simpler)

If you can use **Railway Pro**:

1. Service → **Settings → Networking → Enable Static IPs**
2. Allowlist those IPs on Atlas
3. Do **not** set `TS_AUTHKEY` / `MONGO_SOCKS_PROXY`

No VPS required.

---

## 1. Create Hetzner VPS

1. [Hetzner Cloud](https://console.hetzner.cloud/) → New project → **Add Server**
2. Location: Falkenstein / Helsinki / Nuremberg
3. Image: **Ubuntu 24.04**
4. Type: **CX22** (or CX23)
5. SSH key: your key (disable password auth later)
6. Create → copy **IPv4** (this is the Atlas allowlist IP)

## 2. Install Tailscale exit node on Hetzner

SSH in, then:

```bash
curl -fsSL https://tailscale.com/install.sh | sh

echo 'net.ipv4.ip_forward = 1' | sudo tee /etc/sysctl.d/99-tailscale.conf
echo 'net.ipv6.conf.all.forwarding = 1' | sudo tee -a /etc/sysctl.d/99-tailscale.conf
sudo sysctl -p /etc/sysctl.d/99-tailscale.conf

sudo tailscale up --advertise-exit-node --hostname=shakhe-atlas-egress
curl -4 ifconfig.me; echo
```

Confirm `ifconfig.me` prints the same Hetzner IPv4.

### Tailscale admin console

1. [Machines](https://login.tailscale.com/admin/machines) → `shakhe-atlas-egress`
2. **⋯ → Edit route settings → Use as exit node → Save**
3. **Access controls** — allow exit-node use (example):

```json
{
  "grants": [
    {
      "src": ["tag:railway-upasthiti"],
      "dst": ["autogroup:internet"],
      "ip": ["*"]
    }
  ],
  "tagOwners": {
    "tag:railway-upasthiti": ["autogroup:admin"]
  }
}
```

(Adjust to your ACL style; the important part is permitting `autogroup:internet` via the exit node.)

4. **Settings → Keys → Generate auth key**
   - Reusable: yes (or use a volume + one-time key)
   - Tags: `tag:railway-upasthiti` if you use tags
   - Save as Railway secret `TS_AUTHKEY`

## 3. Atlas Network Access

On the **live** cluster project (`kdpEntities`):

1. **Network Access → Add IP**
2. Add `HETZNER_IPV4/32`
3. Comment: `Upasthiti Railway via Hetzner egress`
4. Prefer a **read-only** DB user for `ENTITY_MONGO_URI`

Do **not** open a public Mongo port on Hetzner. Atlas stays the database; Hetzner is only an egress hop.

## 4. Railway variables

| Variable | Example | Notes |
|----------|---------|--------|
| `MONGO_URI` | your write DB | Unchanged |
| `ENTITY_MONGO_URI` | `mongodb+srv://…@kdp2025…/kdpEntities` | Read-only live |
| `MONGO_SOCKS_PROXY` | `127.0.0.1:1055` | Set automatically by entrypoint if Tailscale starts |
| `TS_AUTHKEY` | `tskey-auth-…` | Secret |
| `TS_EXIT_NODE` | `shakhe-atlas-egress` | Tailscale hostname or 100.x IP |
| `TS_HOSTNAME` | `shakhe-upasthiti-prod` | Unique per environment |

Redeploy after setting vars.

Optional: attach a Railway **volume** at `/var/lib/tailscale` so Tailscale state survives restarts.

## 5. Verify

### From a laptop (optional)

Install Tailscale → use exit node `shakhe-atlas-egress` → `curl -4 ifconfig.me` should show Hetzner IP.

### Railway logs

Look for:

```text
Starting Tailscale userspace SOCKS5 on 127.0.0.1:1055
Tailscale up; MONGO_SOCKS_PROXY=127.0.0.1:1055 exit-node=…
ENTITY_MONGO_URI connected (read-only via SOCKS5 127.0.0.1:1055) db=kdpEntities
```

### App

Phone search + vibhaga dropdowns load from live data.

## Failure modes

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Live reads fail; writes OK | Exit node down / Tailscale auth | Check Hetzner + Tailscale admin |
| TLS / IP errors to Atlas | Hetzner IP not allowlisted | Add `/32` on Atlas |
| `socks` module missing | Bad image build | Rebuild; `socks` is in `package.json` |
| Local laptop without Tailscale | Normal | Leave `TS_AUTHKEY` unset locally |

## Fallback

Unset `TS_AUTHKEY` and `MONGO_SOCKS_PROXY`, redeploy, and temporarily allow `0.0.0.0/0` on Atlas if egress is broken.
