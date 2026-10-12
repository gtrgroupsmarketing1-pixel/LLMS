# LMMS V2 Contracts — Frozen

This document records the frozen interfaces that V2 gates build against.
Any change requires a new V2 contract entry and a version bump.

## 1. Journey Definition Schema (V2.2)

A journey is a JSON-serializable graph with six node types and directed edges.
Defined and validated in `packages/journey-builder/schema.ts`.

### Node types
- `TRIGGER` — exactly one per journey. Config: `{ type, value?, mode }`.
  - `type` is one of: `ORDER_DELIVERED`, `NEW_CUSTOMER`,
    `PROMO_SENT_NOT_REDEEMED`, `REVIEW_POSTED`, `AD_SPEND_THRESHOLD`,
    `TEMPLATE_REJECTED`, `ERP_SYNC_FAILED`, `CSV_IMPORT_COMPLETED`,
    `DAYS_SINCE_LAST_ORDER`, `DAYS_SINCE_LAST_ENGAGEMENT`, `BIRTHDAY`,
    `SUBSCRIPTION_RENEWAL_SOON`, `ANNIVERSARY`.
- `WAIT` — config: `{ amount: 5..525600, unit: MINUTES|HOURS|DAYS }`.
- `CONDITION` — config: `{ logic: AND|OR, rules: [...] }`. Rules reuse the
  V1.4 segmentation DSL.
- `SEND` — config: `{ templateGroupId, channel: WHATSAPP|SMS|EMAIL }`.
  Must pass `assertConsent` at execution time.
- `SPLIT` — config: `{ aWeight: 0..100, bWeight: 0..100 }` where `a + b = 100`.
- `END` — terminal. No outgoing edges.

### Edge schema
`{ id, from, to, branch?: a|b|yes|no|default }`

### Exit rules (default set)
`CUSTOMER_REPLIED`, `CUSTOMER_OPTED_OUT`, `CUSTOMER_ON_DNC`,
`ERP_DATA_STALE`, `FREQUENCY_CAP`.

### Validation invariants
- Exactly one TRIGGER node.
- At least one END node.
- Every node reachable from the trigger.
- All paths terminate at an END.
- SPLIT weights sum to 100.

## 2. Journey Lifecycle (V2.2)

States: `DRAFT → ACTIVE ↔ PAUSED → ARCHIVED`.

- Creation always starts in DRAFT.
- `publish` runs `assertGraphValid` then moves to ACTIVE.
- Only ACTIVE journeys execute during ticks.
- Kill switch sets PAUSED and adds a `JourneyKillSwitch` row.
- ARCHIVED journeys cannot be edited.

## 3. Execution Contract (V2.2)

Worker job `journey-runner` runs every 60 seconds. Per tick, per tenant:

1. Load ACTIVE journeys ordered by priority (lower number wins).
2. Skip journeys with a `JourneyKillSwitch` row.
3. Evaluate trigger → candidate customerIds.
4. For each candidate:
   - Skip if already ENTERED/RUNNING in this journey.
   - Run exit rules; skip if any triggers.
   - Run `assertConsent`; skip and journal if denied.
   - Check `FrequencyLedger` against journey.frequencyCapHours; skip if
     within window.
   - Send via WhatsApp adapter (mock in V2; real in V2.x).
   - Write `Message`, update `FrequencyLedger`, journal `JourneyRun`.

Max 200 customers processed per tick per tenant.

## 4. Authority

- Schema source of truth: `packages/journey-builder/schema.ts`.
- Validator source of truth: `packages/journey-builder/validate.ts`.
- Frequency cap shared with V1.7 automations via `FrequencyLedger`.
- Consent gate hard requirement from V1.6 `assertConsent`.

## 5. Compat with V1

- V1.7 automations continue to run via `automation-runner`. Journeys and
  automations share `FrequencyLedger`, so a customer receives at most one
  marketing message per 24h across both systems.
- Priority resolution remains per-customer per-tick: only one message sent.
