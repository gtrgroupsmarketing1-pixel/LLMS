# LMMS (Laundry Marketing Management System)

A production-ready, multi-tenant marketing SaaS for the GCC region.

## Overview
LMMS is operated by an internal agency team serving laundry clients, with a client-facing portal for approvals, reporting, and data management. It supports ERP-connected, Standalone, and Upgrading modes.

## Architecture
- **Monorepo**: pnpm + Turbo
- **Apps**: Next.js 14 (Web), Express (API), Node.js (Worker)
- **Packages**: 39 shared libraries covering everything from Auth to Compliance to Ads.
- **Database**: PostgreSQL + Prisma (113 models)
- **Infrastructure**: Docker, GitHub Actions CI

## Key Features
- **ERP-Optional**: Works Standalone or connected to our Laundry ERP.
- **WhatsApp-First**: Template management, AR/EN pairs, and opt-out automation.
- **Compliance**: PDPL, TDRA, and CST ready. Hash-chained audit logs, hard consent gates, and data residency.
- **Journey Builder**: Visual automation flow for customer retention.
- **Marketplace**: Share and install templates across tenants.
- **Multi-Mode**: Agency (managed service) and Self-Serve tiers.

## Getting Started (Dev)
1. `pnpm install`
2. `docker compose -f infra/docker/docker-compose.yml up -d`
3. `pnpm --filter @lmms/db exec prisma migrate dev`
4. `pnpm dev`

## Testing
- `pnpm test` (runs all API tests)
- `pnpm --filter @lmms/security audit` (scans for leaked secrets and unauthenticated routes)

## Documentation
- [PRD](./docs/prd.md)
- [V2 Contracts](./docs/contracts/V2_CONTRACTS.md)
- [V3 Security Audit](./docs/v3/SECURITY_AUDIT.md)
- [V3 Compliance Certification](./docs/v3/COMPLIANCE_CERTIFICATION.md)

