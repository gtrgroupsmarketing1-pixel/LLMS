FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
RUN corepack enable pnpm

FROM base AS builder
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @lmms/db exec prisma generate

FROM base AS runner
WORKDIR /app
COPY --from=builder /app ./
ENV NODE_ENV=production
CMD ["pnpm", "--filter", "@lmms/worker", "start"]
