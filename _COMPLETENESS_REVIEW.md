# Completeness Review: ai-native-service-companies

**Review date:** 2026-07-20

## Assessment basis

Static inspection plus isolated PostgreSQL schema/migration application, explicit administrator provisioning, backend startup, database-backed login/authenticated API acceptance, maintained tests, and a production frontend build. Live provider credentials and certification remain external gates.

## Classification

**Functional but incomplete**

This is a substantive but unfinished field/local services application, not just an empty scaffold. Inspection found 97 source files across `frontend/`, `backend/` using Next.js, React, Express; however, the checked-in workflow and delivery controls do not yet demonstrate a complete, production-operable product.

## Why it is not complete

- Generated gap/visualization routes describe missing capabilities or simulate recommendations; they do not implement the underlying domain operation.
- Generic LLM calls are used as product behavior without enough typed tools, grounded evidence, deterministic rules, or output evaluation.
- Mock, demo, sample, fixture, or placeholder behavior remains in executable/product paths.
- No recognizable project-owned automated tests were found for the main workflow.
- No checked-in CI workflow proves builds, tests, migrations, and security checks on every change.

## Needed features

1. Implement quote, availability, booking, dispatch, job status, change-order, invoice, payment, and cancellation lifecycles.
2. Add technician/resource skills, travel/service-area constraints, inventory, customer communications, and offline recovery.
3. Integrate maps, calendar, messaging, payment, tax, and accounting providers with idempotent webhooks.
4. Test overbooking, no-shows, partial work, refunds, rescheduling, and technician reassignment end to end.
5. Add risk-based unit, integration, and end-to-end tests in CI, including migration and failure-path coverage.

## Risks or launch blockers

- Credential/configuration exposure: environment files are present in the repository tree and must be checked against Git history and rotated if real.
- Startup appears coupled to seed/migration behavior, risking data mutation or non-repeatable launches.
- AI-provider availability, cost, privacy, prompt injection, and unvalidated output are launch risks until bounded and evaluated.
- Regression risk is high because no recognizable project-owned automated tests cover the main path.

## Evidence inspected

- `frontend/src/App.tsx:20`
- `backend/routes/sample_data.js:1`
- `backend/server.js`
- `backend/middleware/auth.js`
- `requirements.txt`
- `start.sh`

## Recommended next action

Choose one real field/local services journey, define acceptance criteria and external contracts, then close its persistence, permission, integration, failure, and test gaps before expanding features.

## Implementation progress (2026-07-19)

The source-actionable requirements are implemented on the authoritative `/api/governed-delivery` path and its Service Delivery UI. Generated/sample/gap and ungrounded AI routes are disabled by default, return HTTP 410 where applicable, cannot be enabled in production, and are absent from production navigation.

1. **Complete service lifecycle:** Added durable, versioned quote/order records and guarded transitions for quote send, booking, dispatch, in-progress work, partial completion, completion, change requests/decisions, invoicing, provider-confirmed payment, refund/retry/failure, cancellation, no-show, rescheduling, and reassignment. Monetary calculations use integer cents; mutations use idempotency keys, optimistic versions, and append-only audit events. A production UI creates validated quotes, displays status/provider progress, and exposes role-checked lifecycle actions.
2. **Resources and recovery:** Added tenant-owned technician/resource skills and service radii, deterministic travel validation, database overlap locking, inventory availability/reservation/consumption/release, customer-message records, and versioned idempotent offline mutations with explicit conflict recovery. Booking no longer trusts client-supplied resource availability, travel, bookings, or inventory counts.
3. **Provider integrations:** Added typed maps, calendar, messaging, payment, tax, and accounting operations; a recoverable outbox with leases, bounded exponential retry and dead-letter states; authenticated provider workers; strict operation/payload-digest/receipt validation; and HMAC-signed, event-ID-idempotent webhooks that reconcile receipts and drive payment/refund state. Provider configuration fails closed and requires HTTPS in production.
4. **Scenario coverage:** Added fixture and real-Postgres coverage for overbooking, skills/service-area/inventory rejection, no-show and reschedule, partial work, change-order approval, payment and refund, offline conflict, technician reassignment, cross-role transition denial, provider tampering/failover behavior, retry limits, and safe integer pricing.
5. **CI and operations:** CI provisions fresh Postgres, applies the additive migration twice, executes unit/provider-contract/full HTTP integration tests, builds the frontend, and audits production dependencies. Identity is tenant-scoped with strict JWT issuer/audience/algorithm checks; request size and CORS controls fail closed. Startup is nondestructive, health checks migration state, and the runbook covers provider workers, monitoring, backup, reconciliation, rollback, retention, and incident handling.

Verification completed: 15/15 tests passed against a disposable real PostgreSQL database; the migration passed on a fresh database and an idempotence rerun; backend syntax checks and the Vite/TypeScript production build passed; backend and frontend production dependency audits reported zero vulnerabilities. The disposable database was removed. Git history contains no tracked `.env` revision, and the present environment files are ignored; their weak local values are rejected by the new startup/auth checks and must be replaced and rotated if ever shared.

External release gates remain: provider credentials and certification, production maps/calendar/messaging/payment/tax/accounting endpoints, service-area licensing and inventory sources, payment/tax/accounting review, communication consent/templates, production identity provisioning, monitoring destinations, retention approval, and a rehearsed disaster recovery restore.

**Ledger readiness:** Ready to ledger as source-complete for all five reviewed requirements, with only the explicitly external production contracts, credentials, governance approvals, and infrastructure validation outstanding.

## Runtime acceptance (2026-07-20)

- `start.sh start` requires an explicit validated `BACKEND_PORT`, refuses an occupied port, binds only to loopback, and supplies test-only tenant/issuer/audience/CORS values from the validator's assigned environment. `backend/server.js` has no fallback listener port, and startup performs no installation, migration, or seed.
- The administrator provisioner is a separate acknowledgement-gated command. It refuses overwrite and creates one active tenant-scoped `service_identities` record with a bcrypt cost-12 password. The authenticated `/api/auth/me` path was corrected to reload that authoritative identity and tenant rather than querying the legacy integer-ID demo table.
- The first and only recorded attempt in `_runtime_non_suite_repair_shard2l.tsv` is `API_VERIFIED / startup_login_session_api`. PostgreSQL ran at `127.0.0.1:55623`, the backend at `127.0.0.1:6060`, and reserved UI port `6061` remained listener-free. Login verified the persisted service identity, returned a constrained JWT, and `/api/auth/me` validated the token then reloaded the active PostgreSQL identity.
- Current verification passed 15 maintained tests (14 passed and one opt-in PostgreSQL integration journey skipped in the local non-database invocation), backend syntax checks, and the TypeScript/Vite production build. Shell syntax, diff checks, and assigned-port release checks passed.
