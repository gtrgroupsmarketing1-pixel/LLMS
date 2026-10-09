# LMMS

Multi-tenant marketing operations SaaS for GCC laundry businesses.

- **Modes:** ERP-Connected and Standalone
- **Channels:** WhatsApp-first, AR/EN bilingual with RTL
- **Stack:** pnpm + Turbo, TypeScript strict, Express API, Next.js 14, BullMQ worker, Prisma + Postgres 16, Redis 7

## Agent protocol

This repo is built session-by-session. See:

- `docs/agent/PROJECT_CHARTER.md` — invariants and scope
- `docs/agent/AUTHOR_PROTOCOL.md` — how sessions are executed

## Quick start

```bash
pnpm install
pnpm typecheck
```

Infrastructure (Postgres + Redis):

```bash
docker compose -f infra/docker/docker-compose.yml up -d
```

## Status

Bootstrap (Session 0). V1 begins Session 1.
