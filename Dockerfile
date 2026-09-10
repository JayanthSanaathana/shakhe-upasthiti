# Production image for Railway: Node app + optional Tailscale userspace SOCKS egress.
FROM node:20-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# Tailscale userspace needs the CLI binaries; keep image as root for tailscaled, then node drops via user if desired.
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates curl iptables \
  && curl -fsSL https://pkgs.tailscale.com/stable/debian/bookworm.noarmor.gpg \
    | tee /usr/share/keyrings/tailscale-archive-keyring.gpg >/dev/null \
  && curl -fsSL https://pkgs.tailscale.com/stable/debian/bookworm.tailscale-keyring.list \
    | tee /etc/apt/sources.list.d/tailscale.list \
  && apt-get update \
  && apt-get install -y --no-install-recommends tailscale \
  && rm -rf /var/lib/apt/lists/*

COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY server.js ./
COPY lib ./lib
COPY models ./models
COPY public ./public
COPY scripts/docker-entrypoint.sh /app/scripts/docker-entrypoint.sh
RUN chmod +x /app/scripts/docker-entrypoint.sh \
  && mkdir -p /var/lib/tailscale /tmp/tailscale

EXPOSE 3002
ENTRYPOINT ["/app/scripts/docker-entrypoint.sh"]
