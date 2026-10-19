FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
RUN corepack enable pnpm

FROM base AS builder
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @lmms/db exec prisma generate
# We don't build the API, we run it via tsx in this version

FROM base AS runner
WORKDIR /app
COPY --from=builder /app ./
EXPOSE 4000
ENV NODE_ENV=production
CMD ["pnpm", "--filter", "@lmms/api", "start"]
