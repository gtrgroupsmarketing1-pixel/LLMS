# LMMS V3 Contracts — Frozen

This document records the frozen interfaces that V3 gates build against.
Any change requires a new V3 contract entry and a version bump.

## 1. Website & Landing Page Builder (V3.2)

A tenant-owned public website, rendered from structured blocks. No arbitrary
HTML or JS is accepted from tenants — only whitelisted block types with
validated config.

### 1.1 Website

- One Website per tenant.
- Fields: `subdomain` (unique per deployment), `customDomain` (optional),
  `status` (DRAFT | PUBLISHED | UNPUBLISHED), `theme` (Json), `brandKitId`
  (links to the V2.4 brand kit).

### 1.2 WebsitePage

- A page belongs to a Website. Slug is scoped to the website.
- `blocks` is a Json array of block objects validated against the block schema.
- `seo` holds `titleEn`, `titleAr`, `descriptionEn`, `descriptionAr`,
  `ogImageUrl`.
- Status per page: DRAFT | PUBLISHED. Only PUBLISHED pages are served publicly.

### 1.3 Block types (whitelisted)

`hero`, `features`, `text`, `image`, `cta`, `form`, `testimonials`,
`pricing`, `faq`, `gallery`, `contact`, `footer`. Each block has a
config schema validated at save time. Unknown block types are rejected.

### 1.4 Lead capture

- `form` block submits to `WebsiteLead`.
- Lead fields: `name`, `phone`, `email`, `zone`, `message`, plus attribution
  hints (`utmSource`, `utmMedium`, `utmCampaign`, `promoCode`).
- Leads are created with `consentStatus = 'PENDING'` and require explicit
  opt-in before campaign eligibility (V1.6 consent engine).

### 1.5 Public delivery

- Website served at `<subdomain>.<PUBLIC_SITE_DOMAIN>` OR at `/s/<subdomain>`.
- Delivery is read-only, cacheable, and never requires auth.
- No client-side JavaScript is injected by tenants. Only first-party scripts.

## 2. Cross-cutting V3 rules

- **No arbitrary HTML from tenants.** Blocks are structured and validated.
- **No arbitrary JS from tenants.** Same reason.
- **Data residency (V3.6)** will add a per-tenant region selector. Contracts
  here do not assume a single region.
- **White-label (V3.5)** will allow overriding the public domain. Contracts
  here accept a `customDomain` field on Website.
- **Template marketplace (V3.7)** will distribute block presets. Contracts
  here define blocks as portable JSON so they can be exported/imported.

## 3. Authority

- Block schema source of truth: `packages/website/blocks.ts`.
- Validator source of truth: `packages/website/validate.ts`.
- Rendering: `packages/website/render.tsx` (React components).
- Public route source of truth: `apps/web/app/s/[subdomain]/page.tsx`.
