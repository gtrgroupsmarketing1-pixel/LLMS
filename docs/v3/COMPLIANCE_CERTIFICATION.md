# LMMS V3 Compliance Certification

This document certifies that LMMS meets the operational, data privacy, and security requirements for the GCC region as defined in the PRD.

## 1. Governing Laws & Frameworks

LMMS enforces data isolation and consent rules for the following jurisdictions:
- **UAE**: Federal Decree-Law No. 45 of 2021 (TDRA)
- **Saudi Arabia**: PDPL (Royal Decree M/19), CST
- **Qatar**: PDPPL (Law No. 13 of 2016)
- **Bahrain**: PDPL (Law No. 30 of 2018)
- **Kuwait**: CITRA Data Privacy Protection Regulation
- **Oman**: PDPL (Royal Decree 6/2022)

## 2. Regulatory Controls Implemented

- **Consent Engine**: Hard-gated validation before any campaign send. EXPRESS consent is required for UAE onshore and Saudi Arabia. SOFT OPT-IN is applied for DIFC/ADGM.
- **Data Processing Agreements**: Fully versioned and digitally accepted via portal with IP and signature tracking (`DpaAcceptance`).
- **Privacy Policy**: AR/EN bilingual versioning tracked per tenant (`PrivacyPolicyAcceptance`).
- **Processing Registry**: An immutable list of processing activities, data categories, legal basis, and retention periods (`ProcessingActivity`).
- **Data Subject Rights**:
  - **Erasure**: Full erasure flow tracking. PII is nullified, but audit logs are retained (hash chain).
  - **Portability**: Asynchronous export module (V3.6) generates JSON of all customer data.
- **Retention Policies**: Automated worker deletes expired marketing/transaction data based on per-country rules.

## 3. Security & Audit

- **Immutable Audit Log**: SHA-256 hash chained. Append-only enforced by Postgres trigger.
- **RBAC**: Route-level RBAC auditing ensures no public route accidentally leaks data.
- **Secret Scanning**: Automated CI ensures no hardcoded credentials.
- **Tenant Isolation**: Enforced at DB level via RLS and at app level via `tenantScopeGuard`.

## 4. Certifications & Declarations

- The system is designed to meet SOC 2 alignment.
- All data residency rules for UAE and KSA are structurally enforced (V3.6).
- Sub-processors (Meta, payment gateways) are tracked in the DPA.
- The V3.12 compliance re-audit has verified the above controls are operational and enforced by the codebase.
