FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
RUN corepack enable pnpm

FROM base AS builder
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @lmms/db exec prisma generate
RUN pnpm --filter @lmms/web build

FROM base AS runner
WORKDIR /app
COPY --from=builder /app ./
EXPOSE 3000
ENV NODE_ENV=production
CMD ["pnpm", "--filter", "@lmms/web", "start"]
