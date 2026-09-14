#!/bin/bash
set -eu

# Optional Tailscale userspace SOCKS5 exit (Railway → Hetzner static IP → Atlas).
# If TS_AUTHKEY is unset, start Node directly (local / no egress VPN).

SOCKS_HOST="${MONGO_SOCKS_HOST:-127.0.0.1}"
SOCKS_PORT="${MONGO_SOCKS_PORT:-1055}"
STATE_DIR="${TS_STATE_DIR:-/var/lib/tailscale}"
SOCKET_DIR="${TS_SOCKET_DIR:-/tmp/tailscale}"

tailscale_ready() {
  [ -S "${SOCKET_DIR}/tailscaled.sock" ]
}

egress_ready() {
  curl --fail --silent --show-error \
    --socks5-hostname "${SOCKS_HOST}:${SOCKS_PORT}" \
    --connect-timeout 5 \
    --max-time 10 \
    https://api.ipify.org
}

egress_is_expected() {
  EGRESS_IP="$(egress_ready 2>/dev/null)" || return 1
  if [ -n "${TS_EXPECTED_EGRESS_IP:-}" ] && [ "$EGRESS_IP" != "$TS_EXPECTED_EGRESS_IP" ]; then
    echo "Waiting for exit node; current public-ip=$EGRESS_IP" >&2
    return 1
  fi
  return 0
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
    if tailscale_ready; then
      break
    fi
    i=$((i + 1))
    sleep 1
  done
  if ! tailscale_ready; then
    echo "Tailscale daemon did not become ready" >&2
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
  i=0
  while [ "$i" -lt 30 ]; do
    if egress_is_expected; then
      echo "Tailscale egress ready; public-ip=$EGRESS_IP"
      break
    fi
    i=$((i + 1))
    sleep 2
  done
  if [ "$i" -ge 30 ]; then
    echo "Tailscale exit-node egress did not become ready" >&2
    exit 1
  fi

  echo "Tailscale up; MONGO_SOCKS_PROXY=$MONGO_SOCKS_PROXY exit-node=$TS_EXIT_NODE"
  return 0
}

if start_tailscale; then
  :
fi

exec node server.js
