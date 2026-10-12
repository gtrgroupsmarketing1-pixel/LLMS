# V2.3 Content Approval — Contract Addendum

Extends the V2.2 contracts. See `docs/contracts/V2_CONTRACTS.md` for the base.

## 1. Approval Lifecycle (unchanged from V1.10)

DRAFT → INTERNAL_REVIEW → CLIENT_REVIEW → APPROVED → SCHEDULED → LIVE → COMPLETED
                            ↘ REJECTED

The transitions table lives in `packages/content-calendar/transitions.ts`.

## 2. One-tap approval link

- Issued by `sendForClientReview`.
- Raw token: 32 random bytes, hex-encoded.
- Stored hash: SHA-256 of the raw token in `ContentApprovalLink.tokenHash`.
- TTL: 7 days.
- Consumption is atomic: a single-use link is marked `usedAt` inside a
  transaction with the card transition.

## 3. Notifications (new)

`ContentNotification` records all outbound notifications:

- `APPROVAL_REQUEST` — sent when a card first enters CLIENT_REVIEW.
- `APPROVAL_REMINDER` — created by the worker for cards stuck in CLIENT_REVIEW
  for over 48 hours.
- `REJECTION_NOTICE` — created by the expiry sweeper when an approval link
  expires unused; also created by the client portal reject flow.
- `APPROVAL_CONFIRMED` — reserved for V2.4+ when ERP-connected clients get
  auto-acknowledgement.

Notifications are advisory: they never gate the send. The hard gate remains
`assertConsent` at execution time.

## 4. Portal endpoints (new)

Client-scoped:
- `GET /content-portal/cards` — list visible cards for the tenant.
- `GET /content-portal/cards/:cardId` — full card detail.
- `POST /content-portal/cards/:cardId/reject` — client-driven rejection with
  reason. Adds a CLIENT comment and journals a `content_card.client_reject`
  audit entry.

The portal does NOT expose APPROVE via this endpoint — approval is done via
the one-tap WhatsApp link so the client authentication footprint stays small.

## 5. Audit trail

Every transition, comment, and notification writes an audit entry through
`logAudit`. Retention follows the country rule set from V1.6 (minimum 3 years).
