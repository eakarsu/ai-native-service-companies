# Governed service delivery runbook

The authoritative journey is `/api/governed-delivery` and the Service Delivery frontend. Its primary users are customers, dispatchers, technicians, finance operators, and tenant administrators. Acceptance means that a quote can be created from server-owned skills, schedule, service-area, and inventory data; independently moved through booking, dispatch, partial/full work, change approval, invoice, provider-confirmed payment/refund, cancellation, rescheduling, or reassignment; and reconstructed from append-only events and provider receipts.

## Deployment

Install locked dependencies explicitly, copy `.env.example`, replace every placeholder through the deployment secret manager, and provision durable PostgreSQL. Create tenant identities in `service_identities` with bcrypt hashes; do not use the legacy user table in production. Run backend tests and the frontend build, take and verify a backup, then apply `ALLOW_SCHEMA_MIGRATION=1 ./start.sh migrate`. A second migration run must be a no-op. `./start.sh start` only launches the backend and never installs, seeds, migrates, creates databases, or kills processes.

Run one `npm run provider:run` worker per `PROVIDER_WORKER_NAME` (`maps`, `calendar`, `messaging`, `payment`, `tax`, or `accounting`). Provider endpoints accept authenticated, typed, idempotent `/v1/jobs`; signed webhooks bind a provider event ID and work idempotency key to one payload digest and stable receipt. Rotate API and webhook credentials independently. Pause claims during incidents; never replay a dead-letter item without confirming whether its idempotency key was already applied remotely.

## Operations and recovery

Alert on stale leases, retry/dead-letter growth, webhook signature failures, booking conflicts, inventory reservation imbalance, payment/refund latency, and health migration failures. Reconcile the provider outbox against remote receipts before retrying financial work. Offline mutations carry a mutation ID and expected version; HTTP 409 returns current state for manual/device reconciliation. Append-only service events are the audit source and must be retained under the approved policy.

Back up PostgreSQL before each release and test restore plus point-in-time recovery on the release cadence. Application rollback is allowed only while compatible with the applied additive schema. For database rollback, stop API and workers, reconcile provider side effects, restore the verified backup into a new database, validate counts/receipts, then switch traffic. Never use the destructive legacy `db/schema.sql` or seed script in a retained environment.

Generated gap, sample, and ungrounded AI routes are disabled by default and cannot be enabled in production. Their frontend navigation is also absent unless the development-only flag is explicitly set.

Provider credentials/certification, payment and tax correctness, accounting controls, maps/service-area licensing, communication consent/templates, regulated professional review where relevant, production identity provisioning, monitoring destinations, retention approval, and disaster-recovery rehearsal remain external launch gates.
