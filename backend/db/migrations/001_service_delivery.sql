BEGIN;

CREATE TABLE IF NOT EXISTS service_identities (
  id UUID PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN('customer','dispatcher','technician','finance','admin')),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id,email)
);
CREATE UNIQUE INDEX IF NOT EXISTS service_identity_email_idx ON service_identities(lower(email));

CREATE TABLE IF NOT EXISTS service_resources (
  tenant_id TEXT NOT NULL,
  id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  skills JSONB NOT NULL DEFAULT '[]',
  service_radius_km NUMERIC(8,2) NOT NULL CHECK(service_radius_km >= 0),
  base_latitude NUMERIC(9,6) NOT NULL CHECK(base_latitude BETWEEN -90 AND 90),
  base_longitude NUMERIC(9,6) NOT NULL CHECK(base_longitude BETWEEN -180 AND 180),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  version INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY(tenant_id,id)
);

CREATE TABLE IF NOT EXISTS service_inventory (
  tenant_id TEXT NOT NULL,
  sku TEXT NOT NULL,
  description TEXT NOT NULL,
  available_quantity INTEGER NOT NULL CHECK(available_quantity >= 0),
  reserved_quantity INTEGER NOT NULL DEFAULT 0 CHECK(reserved_quantity >= 0 AND reserved_quantity <= available_quantity),
  version INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY(tenant_id,sku)
);

CREATE TABLE IF NOT EXISTS service_delivery_orders (
  id UUID PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft_quote' CHECK(status IN('draft_quote','quote_sent','booked','dispatched','in_progress','change_requested','partially_completed','completed','invoiced','paid','refund_pending','refund_failed','refunded','no_show','cancelled')),
  version INTEGER NOT NULL DEFAULT 1 CHECK(version > 0),
  resource_id TEXT NOT NULL,
  required_skills JSONB NOT NULL DEFAULT '[]',
  service_address_ref TEXT NOT NULL,
  service_latitude NUMERIC(9,6) NOT NULL CHECK(service_latitude BETWEEN -90 AND 90),
  service_longitude NUMERIC(9,6) NOT NULL CHECK(service_longitude BETWEEN -180 AND 180),
  travel_km NUMERIC(8,2) NOT NULL CHECK(travel_km >= 0),
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL CHECK(ends_at > starts_at),
  subtotal_cents BIGINT NOT NULL CHECK(subtotal_cents >= 0),
  tax_cents BIGINT NOT NULL CHECK(tax_cents >= 0),
  total_cents BIGINT NOT NULL CHECK(total_cents = subtotal_cents + tax_cents),
  currency TEXT NOT NULL DEFAULT 'USD' CHECK(currency ~ '^[A-Z]{3}$'),
  idempotency_key TEXT NOT NULL,
  request_digest TEXT NOT NULL CHECK(request_digest ~ '^[a-f0-9]{64}$'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id,idempotency_key),
  FOREIGN KEY(tenant_id,resource_id) REFERENCES service_resources(tenant_id,id)
);

CREATE TABLE IF NOT EXISTS service_delivery_lines (
  order_id UUID REFERENCES service_delivery_orders(id) ON DELETE CASCADE,
  line_no INTEGER NOT NULL CHECK(line_no > 0),
  kind TEXT NOT NULL CHECK(kind IN('labor','inventory','change_order')),
  sku TEXT,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK(quantity > 0),
  unit_cents BIGINT NOT NULL CHECK(unit_cents >= 0),
  PRIMARY KEY(order_id,line_no)
);

CREATE TABLE IF NOT EXISTS service_inventory_reservations (
  order_id UUID REFERENCES service_delivery_orders(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL,
  sku TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK(quantity > 0),
  state TEXT NOT NULL DEFAULT 'reserved' CHECK(state IN('reserved','consumed','released')),
  PRIMARY KEY(order_id,sku),
  FOREIGN KEY(tenant_id,sku) REFERENCES service_inventory(tenant_id,sku)
);

CREATE TABLE IF NOT EXISTS service_change_orders (
  id UUID PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  order_id UUID NOT NULL REFERENCES service_delivery_orders(id) ON DELETE CASCADE,
  amount_cents BIGINT NOT NULL CHECK(amount_cents >= 0),
  description TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'requested' CHECK(state IN('requested','approved','rejected')),
  requested_by TEXT NOT NULL,
  reviewed_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS service_customer_messages (
  id UUID PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  order_id UUID NOT NULL REFERENCES service_delivery_orders(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK(channel IN('sms','email','push')),
  template_key TEXT NOT NULL,
  recipient_ref TEXT NOT NULL,
  payload JSONB NOT NULL,
  provider_idempotency_key TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'queued' CHECK(status IN('queued','sent','failed','cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS service_delivery_events (
  id BIGSERIAL PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  order_id UUID NOT NULL REFERENCES service_delivery_orders(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  from_status TEXT,
  to_status TEXT,
  actor_id TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  reason TEXT,
  payload JSONB NOT NULL DEFAULT '{}',
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION immutable_service_event() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'service events are append-only'; END $$;
DROP TRIGGER IF EXISTS service_delivery_events_immutable ON service_delivery_events;
CREATE TRIGGER service_delivery_events_immutable BEFORE UPDATE OR DELETE ON service_delivery_events FOR EACH ROW EXECUTE FUNCTION immutable_service_event();

CREATE TABLE IF NOT EXISTS service_offline_mutations (
  tenant_id TEXT NOT NULL,
  mutation_id TEXT NOT NULL,
  order_id UUID NOT NULL REFERENCES service_delivery_orders(id) ON DELETE CASCADE,
  base_version INTEGER NOT NULL,
  resulting_version INTEGER,
  request_digest TEXT NOT NULL,
  result JSONB NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY(tenant_id,mutation_id)
);

CREATE TABLE IF NOT EXISTS service_provider_outbox (
  id BIGSERIAL PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  order_id UUID REFERENCES service_delivery_orders(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK(provider IN('maps','calendar','messaging','payment','tax','accounting')),
  operation TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  payload_digest TEXT NOT NULL CHECK(payload_digest ~ '^[a-f0-9]{64}$'),
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN('pending','leased','retry','succeeded','dead_letter','cancelled')),
  attempts INTEGER NOT NULL DEFAULT 0 CHECK(attempts >= 0 AND attempts <= 10),
  available_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  lease_until TIMESTAMPTZ,
  provider_receipt TEXT,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(provider,idempotency_key)
);

CREATE TABLE IF NOT EXISTS service_provider_events (
  provider TEXT NOT NULL,
  event_id TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  payload_digest TEXT NOT NULL,
  outcome TEXT NOT NULL CHECK(outcome IN('succeeded','failed')),
  provider_receipt TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  PRIMARY KEY(provider,event_id)
);

CREATE INDEX IF NOT EXISTS service_delivery_schedule_idx ON service_delivery_orders(tenant_id,resource_id,starts_at,ends_at) WHERE status NOT IN('cancelled','refunded');
CREATE INDEX IF NOT EXISTS service_provider_claim_idx ON service_provider_outbox(status,available_at,lease_until);
CREATE INDEX IF NOT EXISTS service_delivery_event_idx ON service_delivery_events(tenant_id,order_id,occurred_at);

COMMIT;
