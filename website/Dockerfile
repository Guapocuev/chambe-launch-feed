# ============================================================
# Chambé Website — Production Dockerfile
# Multi-stage: builder installs deps + compiles, runtime is the
# Next.js "standalone" output only (see next.config.ts).
# ============================================================

# ---- Stage 1: builder ----------------------------------------
FROM node:20-slim AS builder

WORKDIR /build

COPY package*.json ./
RUN npm ci

COPY . .

# DEMAND_ENGINE_URL isn't needed at build time (Server Actions read it
# at request time via process.env), so no build-arg plumbing here.
RUN npm run build


# ---- Stage 2: runtime ----------------------------------------
FROM node:20-slim AS runtime

RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser

WORKDIR /app

# `standalone` output already contains a minimal node_modules and a
# server.js entrypoint — no separate `npm ci --omit=dev` needed here.
COPY --from=builder /build/.next/standalone ./
COPY --from=builder /build/.next/static ./.next/static
COPY --from=builder /build/public ./public

RUN chown -R appuser:appgroup /app
USER appuser

ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/').then(r=>r.ok?process.exit(0):process.exit(1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
