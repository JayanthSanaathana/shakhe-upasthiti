#!/bin/bash
set -eu

# Optional static egress for the entity database.
# Preferred: Railway → SSH SOCKS5 → AWS static IP → Atlas.
# Legacy fallback: Railway → Tailscale userspace exit → AWS static IP → Atlas.

SOCKS_HOST="${MONGO_SOCKS_HOST:-127.0.0.1}"
SOCKS_PORT="${MONGO_SOCKS_PORT:-1055}"
STATE_DIR="${TS_STATE_DIR:-/var/lib/tailscale}"
SOCKET_DIR="${TS_SOCKET_DIR:-/tmp/tailscale}"
SSH_DIR="${SSH_EGRESS_DIR:-/tmp/ssh-egress}"
TUNNEL_PID=""

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

wait_for_egress() {
  i=0
  while [ "$i" -lt 30 ]; do
    if egress_is_expected; then
      echo "Static egress ready; public-ip=$EGRESS_IP"
      return 0
    fi
    i=$((i + 1))
    sleep 2
  done
  echo "Static egress did not become ready" >&2
  return 1
}

start_ssh_egress() {
  if [ -z "${SSH_EGRESS_PRIVATE_KEY_B64:-}" ]; then
    return 1
  fi
  if [ -z "${SSH_EGRESS_HOST:-}" ] || [ -z "${SSH_EGRESS_KNOWN_HOSTS_B64:-}" ]; then
    echo "SSH_EGRESS_HOST and SSH_EGRESS_KNOWN_HOSTS_B64 are required" >&2
    exit 1
  fi

  mkdir -p "$SSH_DIR"
  chmod 700 "$SSH_DIR"
  printf '%s' "$SSH_EGRESS_PRIVATE_KEY_B64" | base64 -d >"$SSH_DIR/id_ed25519"
  printf '%s' "$SSH_EGRESS_KNOWN_HOSTS_B64" | base64 -d >"$SSH_DIR/known_hosts"
  chmod 600 "$SSH_DIR/id_ed25519" "$SSH_DIR/known_hosts"

  echo "Starting SSH SOCKS5 egress on ${SOCKS_HOST}:${SOCKS_PORT}"
  ssh -N \
    -D "${SOCKS_HOST}:${SOCKS_PORT}" \
    -i "$SSH_DIR/id_ed25519" \
    -o BatchMode=yes \
    -o ConnectTimeout=15 \
    -o ExitOnForwardFailure=yes \
    -o ServerAliveInterval=20 \
    -o ServerAliveCountMax=3 \
    -o StrictHostKeyChecking=yes \
    -o UserKnownHostsFile="$SSH_DIR/known_hosts" \
    -o TCPKeepAlive=yes \
    "${SSH_EGRESS_USER:-railway-egress}@${SSH_EGRESS_HOST}" &
  TUNNEL_PID=$!

  export MONGO_SOCKS_PROXY="${SOCKS_HOST}:${SOCKS_PORT}"
  if ! wait_for_egress; then
    kill "$TUNNEL_PID" 2>/dev/null || true
    wait "$TUNNEL_PID" 2>/dev/null || true
    # Keep the application running so its local MONGO_URI entity cache can
    # serve requests while the static egress host is unavailable.
    unset MONGO_SOCKS_PROXY
    return 1
  fi
  echo "SSH egress up; MONGO_SOCKS_PROXY=$MONGO_SOCKS_PROXY host=$SSH_EGRESS_HOST"
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
  if ! wait_for_egress; then
    echo "Tailscale exit-node egress did not become ready" >&2
    # Keep the application running so its local MONGO_URI entity cache can
    # serve requests while the exit node is unavailable.
    unset MONGO_SOCKS_PROXY
    return 1
  fi

  echo "Tailscale up; MONGO_SOCKS_PROXY=$MONGO_SOCKS_PROXY exit-node=$TS_EXIT_NODE"
  return 0
}

if start_ssh_egress; then
  node server.js &
  APP_PID=$!
  trap 'kill "$APP_PID" "$TUNNEL_PID" 2>/dev/null || true' INT TERM EXIT
  if wait -n "$APP_PID" "$TUNNEL_PID"; then
    STATUS=0
  else
    STATUS=$?
  fi
  kill "$APP_PID" "$TUNNEL_PID" 2>/dev/null || true
  wait "$APP_PID" 2>/dev/null || true
  wait "$TUNNEL_PID" 2>/dev/null || true
  trap - INT TERM EXIT
  exit "$STATUS"
elif start_tailscale; then
  :
fi

exec node server.js
