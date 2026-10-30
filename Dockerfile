FROM node:22-bookworm-slim AS base

RUN apt-get update \
    && apt-get install --yes --no-install-recommends ca-certificates openssl \
    && rm -rf /var/lib/apt/lists/*

ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN node node_modules/prisma/build/index.js generate
RUN npm run build
RUN npm run build:seed

FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --chown=node:node package.json package-lock.json ./
COPY --from=builder --chown=node:node /app/prisma ./prisma
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/node_modules/.prisma ./node_modules/.prisma
COPY --chown=node:node scripts/check-production-env.mjs ./scripts/check-production-env.mjs

USER node
EXPOSE 3000

CMD ["sh", "-c", "node scripts/check-production-env.mjs && node node_modules/prisma/build/index.js migrate deploy && exec node server.js"]
