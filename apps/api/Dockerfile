FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate

FROM base AS deps
WORKDIR /app
COPY pnpm-lock.yaml ./
COPY turbo.json ./
COPY package.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY packages/ ./packages/
RUN pnpm install --frozen-lockfile

FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY apps/api ./apps/api
COPY turbo.json package.json ./
RUN pnpm --filter @app/api prisma:generate
RUN pnpm --filter @app/api build

FROM base AS production
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nestjs
COPY --from=deps --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=nestjs:nodejs /app/apps/api/dist ./dist
COPY --from=build --chown=nestjs:nodejs /app/apps/api/prisma ./prisma
USER nestjs
ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "dist/src/main"]
