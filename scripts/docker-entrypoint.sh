#!/bin/bash
set -eu

# Optional Tailscale userspace SOCKS5 exit (Railway → Hetzner static IP → Atlas).
# If TS_AUTHKEY is unset, start Node directly (local / no egress VPN).

SOCKS_HOST="${MONGO_SOCKS_HOST:-127.0.0.1}"
SOCKS_PORT="${MONGO_SOCKS_PORT:-1055}"
STATE_DIR="${TS_STATE_DIR:-/var/lib/tailscale}"
SOCKET_DIR="${TS_SOCKET_DIR:-/tmp/tailscale}"

socks_ready() {
  node -e "
const net = require('net');
const s = net.connect({ host: process.env.H, port: Number(process.env.P) }, () => { s.end(); process.exit(0); });
s.on('error', () => process.exit(1));
setTimeout(() => process.exit(1), 1500);
" 
}

start_tailscale() {
  if [ -z "${TS_AUTHKEY:-}" ]; then
    echo "TS_AUTHKEY not set — starting app without Tailscale SOCKS egress"
    return 1
  fi
  if [ -z "${TS_EXIT_NODE:-}" ]; then
    echo "TS_EXIT_NODE is required when TS_AUTHKEY is set" >&2
    exit 1
  fi

  mkdir -p "$STATE_DIR" "$SOCKET_DIR"

  echo "Starting Tailscale userspace SOCKS5 on ${SOCKS_HOST}:${SOCKS_PORT}"
  # shellcheck disable=SC2086
  tailscaled \
    --tun=userspace-networking \
    --socks5-server="${SOCKS_HOST}:${SOCKS_PORT}" \
    --state="${STATE_DIR}/tailscaled.state" \
    --statedir="$STATE_DIR" \
    --socket="${SOCKET_DIR}/tailscaled.sock" \
    ${TS_TAILSCALED_EXTRA_ARGS:-} &

  i=0
  while [ "$i" -lt 60 ]; do
    if H="$SOCKS_HOST" P="$SOCKS_PORT" socks_ready; then
      break
    fi
    i=$((i + 1))
    sleep 1
  done
  if ! H="$SOCKS_HOST" P="$SOCKS_PORT" socks_ready; then
    echo "Tailscale SOCKS5 did not become ready on ${SOCKS_HOST}:${SOCKS_PORT}" >&2
    exit 1
  fi

  HOSTNAME_ARGS=()
  if [ -n "${TS_HOSTNAME:-}" ]; then
    HOSTNAME_ARGS+=(--hostname="${TS_HOSTNAME}")
  fi

  # shellcheck disable=SC2086
  tailscale --socket="${SOCKET_DIR}/tailscaled.sock" up \
    --authkey="$TS_AUTHKEY" \
    --exit-node="$TS_EXIT_NODE" \
    --exit-node-allow-lan-access=false \
    --accept-dns=false \
    "${HOSTNAME_ARGS[@]}" \
    ${TS_EXTRA_ARGS:-}

  export MONGO_SOCKS_PROXY="${MONGO_SOCKS_PROXY:-${SOCKS_HOST}:${SOCKS_PORT}}"
  echo "Tailscale up; MONGO_SOCKS_PROXY=$MONGO_SOCKS_PROXY exit-node=$TS_EXIT_NODE"
  return 0
}

if start_tailscale; then
  :
fi

exec node server.js
