# LMMS V3.11 Security Audit Report

This document certifies the security posture of LMMS as of V3.11.

## 1. Authentication & Authorization

- **JWT Protection**: All agency and client routes require a valid JWT signed with a secure HS256 secret.
- **RBAC**: Route-level access control is enforced via `requireAgency` and `requireClient` middlewares. Roles are validated against the database.
- **Brute-force Protection**: `/auth/*` endpoints are protected by an IP+Email sliding window rate limiter (5 attempts / 15 mins, 30 min lockout).
- **Session Rotation**: Refresh tokens use a rotation family model. Re-use detection invalidates the entire family.

## 2. Data Isolation

- **Tenant Guard**: A middleware (`tenantScopeGuard`) ensures that a client token cannot access another tenant's ID in the URL parameters.
- **RLS**: Postgres Row-Level Security is enabled on sensitive tables (`ConsentRecord`, `DoNotContact`) using the `app.current_tenant_id` local variable.
- **Prisma Extension**: All queries scoped to a tenant must pass through the `withTenant` helper which enforces the `tenant_id` at the database level.

## 3. Webhook Security

- **HMAC Verification**: Incoming webhooks (WhatsApp, payments) must pass the `verifyWebhookSignature` middleware which computes an HMAC-SHA256 of the raw payload and compares it using `crypto.timingSafeEqual` to prevent timing attacks.

## 4. Infrastructure & Headers

- **HTTP Headers**: Helmet-equivalent headers are set (`Strict-Transport-Security`, `X-Frame-Options`, `Content-Security-Policy`).
- **Rate Limiting**: Global rate limit of 300 requests/minute per IP.
- **Body Size Limits**: JSON payloads are capped at 10MB; CSV uploads capped at 200MB.
- **No Fingerprinting**: `X-Powered-By` is removed.

## 5. Automated CI Scanning

- **Secret Scanning**: The `@lmms/security` package parses all source files to detect exposed AWS, Stripe, or generic secrets (regex + entropy-based checks).
- **RBAC Auditing**: A static analysis script scans all Express routes to verify that every route contains either an auth middleware or a `// @public` comment.

## 6. Known Limitations (To Be Addressed in V3.12+)

- CSRF protection is not implemented for cookie-based sessions (we use stateless JWTs in headers, which mitigates this).
- The mock payment adapters do not validate gateway signatures yet (real adapters will).
- CSP currently allows `'unsafe-inline'` for styles due to Tailwind + Next.js inline styles.
