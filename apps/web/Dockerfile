FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate

FROM base AS deps
WORKDIR /app
COPY pnpm-lock.yaml ./
COPY turbo.json ./
COPY package.json ./
COPY apps/web/package.json ./apps/web/package.json
COPY packages/ ./packages/
RUN pnpm install --frozen-lockfile

FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY . .
RUN pnpm --filter @app/web build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=build --chown=nextjs:nodejs /app/apps/web/.next ./.next
COPY --from=build --chown=nextjs:nodejs /app/apps/web/public ./public
COPY --from=build --chown=nextjs:nodejs /app/apps/web/package.json ./package.json
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["node_modules/.bin/next", "start"]
