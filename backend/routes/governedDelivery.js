'use strict';

const crypto = require('node:crypto');
const express = require('express');
const pool = require('../db');
const auth = require('../middleware/auth');
const domain = require('../governance/serviceDelivery');

const router = express.Router();
const allowedProviders = new Set(Object.keys(domain.providerOperations));

function problem(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function asyncRoute(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

function requireRole(...roles) {
  return (req, _res, next) => roles.includes(req.user.role) || req.user.role === 'admin' ? next() : next(problem(403, 'role is not permitted'));
}

function assertObject(value, name = 'body') {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw problem(400, `${name} must be an object`);
  return value;
}

function assertText(value, name, min = 1, max = 500) {
  if (typeof value !== 'string' || value.trim().length < min || value.length > max) throw problem(400, `${name} is invalid`);
  return value.trim();
}

function assertVersion(value) {
  if (!Number.isInteger(value) || value < 1) throw problem(400, 'expectedVersion must be a positive integer');
  return value;
}

async function queueProvider(client, tenantId, orderId, provider, operation, payload, suffix) {
  const idempotencyKey = `${orderId}:${suffix}`;
  const job = domain.providerJob(provider, operation, payload, idempotencyKey);
  await client.query(
    `INSERT INTO service_provider_outbox(tenant_id,order_id,provider,operation,idempotency_key,payload_digest,payload)
     VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(provider,idempotency_key) DO NOTHING`,
    [tenantId, orderId, provider, operation, job.idempotencyKey, job.payloadDigest, job.payload]
  );
  if (provider === 'messaging') {
    await client.query(
      `INSERT INTO service_customer_messages(id,tenant_id,order_id,channel,template_key,recipient_ref,payload,provider_idempotency_key)
       VALUES($1,$2,$3,'email',$4,$5,$6,$7) ON CONFLICT(provider_idempotency_key) DO NOTHING`,
      [crypto.randomUUID(), tenantId, orderId, operation, String(payload.customerId), payload, job.idempotencyKey]
    );
  }
}

async function appendEvent(client, identity, order, eventType, toStatus, reason, payload = {}) {
  await client.query(
    `INSERT INTO service_delivery_events(tenant_id,order_id,event_type,from_status,to_status,actor_id,actor_role,reason,payload)
     VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [identity.tenantId, order.id, eventType, order.status, toStatus || order.status, String(identity.id), identity.role, reason || null, payload]
  );
}

async function loadAvailability(client, tenantId, input, excludeOrderId = null) {
  const resourceId = assertText(input.resourceId, 'resourceId', 2, 100);
  const resourceResult = await client.query(
    'SELECT * FROM service_resources WHERE tenant_id=$1 AND id=$2 AND active=TRUE FOR SHARE',
    [tenantId, resourceId]
  );
  if (!resourceResult.rowCount) throw problem(422, 'resource is unavailable');
  const resourceRow = resourceResult.rows[0];
  const bookingResult = await client.query(
    `SELECT starts_at AS "startsAt", ends_at AS "endsAt" FROM service_delivery_orders
     WHERE tenant_id=$1 AND resource_id=$2 AND status NOT IN('cancelled','refunded')
       AND starts_at < $4 AND ends_at > $3 AND ($5::uuid IS NULL OR id<>$5::uuid) FOR UPDATE`,
    [tenantId, resourceId, input.startsAt, input.endsAt, excludeOrderId]
  );
  const serviceLocation = assertObject(input.serviceLocation, 'serviceLocation');
  const travelKm = domain.travelKm(
    { latitude: Number(resourceRow.base_latitude), longitude: Number(resourceRow.base_longitude) },
    { latitude: serviceLocation.latitude, longitude: serviceLocation.longitude }
  );
  const inventory = [];
  for (const requested of input.inventory || []) {
    const sku = assertText(requested.sku, 'inventory sku', 1, 100);
    if (!Number.isInteger(requested.quantity) || requested.quantity < 1) throw problem(400, 'inventory quantity is invalid');
    const found = await client.query('SELECT * FROM service_inventory WHERE tenant_id=$1 AND sku=$2 FOR UPDATE', [tenantId, sku]);
    if (!found.rowCount) throw problem(422, `inventory unavailable: ${sku}`);
    inventory.push({ sku, quantity: requested.quantity, available: found.rows[0].available_quantity - found.rows[0].reserved_quantity });
  }
  const resource = { id: resourceRow.id, skills: resourceRow.skills, serviceRadiusKm: Number(resourceRow.service_radius_km) };
  domain.availability({
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    requiredSkills: input.requiredSkills || [],
    resource,
    travelKm,
    bookings: bookingResult.rows,
    inventory
  });
  return { resource, travelKm, inventory };
}

async function releaseReservations(client, order) {
  const reservations = await client.query("SELECT * FROM service_inventory_reservations WHERE order_id=$1 AND state='reserved' FOR UPDATE", [order.id]);
  for (const reservation of reservations.rows) {
    await client.query(
      'UPDATE service_inventory SET reserved_quantity=reserved_quantity-$1,version=version+1 WHERE tenant_id=$2 AND sku=$3',
      [reservation.quantity, order.tenant_id, reservation.sku]
    );
  }
  await client.query("UPDATE service_inventory_reservations SET state='released' WHERE order_id=$1 AND state='reserved'", [order.id]);
}

async function consumeReservations(client, order) {
  const reservations = await client.query("SELECT * FROM service_inventory_reservations WHERE order_id=$1 AND state='reserved' FOR UPDATE", [order.id]);
  for (const reservation of reservations.rows) {
    await client.query(
      'UPDATE service_inventory SET reserved_quantity=reserved_quantity-$1,available_quantity=available_quantity-$1,version=version+1 WHERE tenant_id=$2 AND sku=$3',
      [reservation.quantity, order.tenant_id, reservation.sku]
    );
  }
  await client.query("UPDATE service_inventory_reservations SET state='consumed' WHERE order_id=$1 AND state='reserved'", [order.id]);
}

async function queueForTransition(client, identity, order, toStatus, version) {
  const common = { orderId: order.id, status: toStatus, version, customerId: order.customer_id };
  if (toStatus === 'quote_sent') await queueProvider(client, identity.tenantId, order.id, 'messaging', 'quote_send', { ...common, totalCents: Number(order.total_cents), currency: order.currency }, `quote:${version}`);
  if (toStatus === 'booked') {
    await queueProvider(client, identity.tenantId, order.id, 'maps', 'route_validate', { ...common, resourceId: order.resource_id, serviceAddressRef: order.service_address_ref }, `route:${version}`);
    await queueProvider(client, identity.tenantId, order.id, 'calendar', 'booking_create', { ...common, resourceId: order.resource_id, startsAt: order.starts_at, endsAt: order.ends_at }, `calendar:${version}`);
    await queueProvider(client, identity.tenantId, order.id, 'messaging', 'booking_confirm', common, `booking-message:${version}`);
  }
  if (toStatus === 'dispatched') await queueProvider(client, identity.tenantId, order.id, 'messaging', 'dispatch_notice', common, `dispatch:${version}`);
  if (['in_progress', 'partially_completed', 'completed', 'no_show'].includes(toStatus)) await queueProvider(client, identity.tenantId, order.id, 'messaging', 'status_notice', common, `status:${toStatus}:${version}`);
  if (['completed', 'invoiced'].includes(toStatus)) await consumeReservations(client, order);
  if (toStatus === 'invoiced') {
    await queueProvider(client, identity.tenantId, order.id, 'tax', 'tax_calculate', { ...common, subtotalCents: Number(order.subtotal_cents), taxCents: Number(order.tax_cents) }, `tax:${version}`);
    await queueProvider(client, identity.tenantId, order.id, 'payment', 'invoice_create', { ...common, totalCents: Number(order.total_cents), currency: order.currency }, `invoice:${version}`);
    await queueProvider(client, identity.tenantId, order.id, 'accounting', 'invoice_post', { ...common, totalCents: Number(order.total_cents), currency: order.currency }, `accounting-invoice:${version}`);
    await queueProvider(client, identity.tenantId, order.id, 'messaging', 'invoice_notice', common, `invoice-message:${version}`);
  }
  if (toStatus === 'refund_pending') await queueProvider(client, identity.tenantId, order.id, 'payment', 'refund_create', { ...common, totalCents: Number(order.total_cents), currency: order.currency }, `refund:${version}`);
  if (toStatus === 'cancelled') {
    await releaseReservations(client, order);
    await queueProvider(client, identity.tenantId, order.id, 'calendar', 'booking_cancel', common, `cancel-calendar:${version}`);
    await queueProvider(client, identity.tenantId, order.id, 'messaging', 'cancellation_notice', common, `cancel-message:${version}`);
  }
}

router.post('/webhooks/:provider', asyncRoute(async (req, res) => {
  const provider = req.params.provider;
  if (!allowedProviders.has(provider)) throw problem(404, 'unknown provider');
  const secrets = JSON.parse(process.env.PROVIDER_WEBHOOK_SECRETS_JSON || '{}');
  const eventId = assertText(req.get('x-provider-event-id'), 'provider event id', 4, 200);
  if (!domain.verify(secrets[provider], req.body, req.get('x-provider-signature'))) throw problem(401, 'invalid provider signature');
  const body = assertObject(req.body);
  const idempotencyKey = assertText(body.idempotencyKey, 'idempotencyKey', 8, 200);
  if (!['succeeded', 'failed'].includes(body.outcome)) throw problem(400, 'invalid provider outcome');
  const payloadDigest = domain.digest(body);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const inserted = await client.query(
      `INSERT INTO service_provider_events(provider,event_id,idempotency_key,payload_digest,outcome,provider_receipt)
       VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING RETURNING event_id`,
      [provider, eventId, idempotencyKey, payloadDigest, body.outcome, body.receiptId || null]
    );
    if (!inserted.rowCount) {
      const old = await client.query('SELECT payload_digest FROM service_provider_events WHERE provider=$1 AND event_id=$2', [provider, eventId]);
      await client.query('ROLLBACK');
      if (old.rows[0]?.payload_digest !== payloadDigest) throw problem(409, 'provider event ID conflict');
      return res.json({ duplicate: true });
    }
    const work = await client.query('SELECT * FROM service_provider_outbox WHERE provider=$1 AND idempotency_key=$2 FOR UPDATE', [provider, idempotencyKey]);
    if (!work.rowCount) throw problem(404, 'provider work item not found');
    const job = work.rows[0];
    if (body.outcome === 'succeeded') {
      await client.query("UPDATE service_provider_outbox SET status='succeeded',provider_receipt=$1,lease_until=NULL,updated_at=NOW() WHERE id=$2", [assertText(body.receiptId, 'receiptId', 4, 500), job.id]);
      if (provider === 'messaging') await client.query("UPDATE service_customer_messages SET status='sent',sent_at=NOW() WHERE provider_idempotency_key=$1", [job.idempotency_key]);
      if (provider === 'payment' && ['payment_capture', 'refund_create'].includes(job.operation)) {
        const order = await client.query('SELECT * FROM service_delivery_orders WHERE id=$1 AND tenant_id=$2 FOR UPDATE', [job.order_id, job.tenant_id]);
        const expected = job.operation === 'payment_capture' ? 'invoiced' : 'refund_pending';
        const next = job.operation === 'payment_capture' ? 'paid' : 'refunded';
        if (order.rows[0]?.status === expected) {
          const updated = await client.query('UPDATE service_delivery_orders SET status=$1,version=version+1,updated_at=NOW() WHERE id=$2 RETURNING *', [next, job.order_id]);
          await appendEvent(client, { id: `provider:${provider}`, role: 'provider', tenantId: job.tenant_id }, order.rows[0], 'provider_transition', next, null, { eventId, receiptId: body.receiptId });
          if (next === 'paid') await queueProvider(client, job.tenant_id, job.order_id, 'accounting', 'payment_post', { orderId: job.order_id, totalCents: Number(updated.rows[0].total_cents), receiptId: body.receiptId }, `payment:${updated.rows[0].version}`);
          if (next === 'refunded') await queueProvider(client, job.tenant_id, job.order_id, 'accounting', 'refund_post', { orderId: job.order_id, totalCents: Number(updated.rows[0].total_cents), receiptId: body.receiptId }, `refund:${updated.rows[0].version}`);
        }
      }
    } else {
      const policy = domain.retry(Math.max(0, job.attempts - 1), Boolean(body.retryable));
      await client.query(
        `UPDATE service_provider_outbox SET status=$1,attempts=$2,available_at=NOW()+($3*interval '1 second'),lease_until=NULL,last_error=$4,updated_at=NOW() WHERE id=$5`,
        [policy.status, policy.attempts, policy.delaySeconds || 0, assertText(body.errorCode || 'provider_failed', 'errorCode', 2, 200), job.id]
      );
      if (provider === 'messaging' && policy.status === 'dead_letter') await client.query("UPDATE service_customer_messages SET status='failed' WHERE provider_idempotency_key=$1", [job.idempotency_key]);
      if (job.operation === 'refund_create' && policy.status === 'dead_letter') {
        const order = await client.query("UPDATE service_delivery_orders SET status='refund_failed',version=version+1,updated_at=NOW() WHERE id=$1 AND status='refund_pending' RETURNING *", [job.order_id]);
        if (order.rowCount) await appendEvent(client, { id: `provider:${provider}`, role: 'provider', tenantId: job.tenant_id }, { ...order.rows[0], status: 'refund_pending' }, 'provider_failure', 'refund_failed', body.errorCode);
      }
    }
    await client.query('UPDATE service_provider_events SET processed_at=NOW() WHERE provider=$1 AND event_id=$2', [provider, eventId]);
    await client.query('COMMIT');
    res.status(202).json({ accepted: true });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}));

router.use(auth);

router.post('/resources', requireRole('dispatcher'), asyncRoute(async (req, res) => {
  const body = assertObject(req.body);
  const skills = Array.isArray(body.skills) && body.skills.length <= 50 ? body.skills.map((skill) => assertText(skill, 'skill', 1, 100)) : [];
  const radius = Number(body.serviceRadiusKm);
  domain.travelKm({ latitude: Number(body.baseLatitude), longitude: Number(body.baseLongitude) }, { latitude: Number(body.baseLatitude), longitude: Number(body.baseLongitude) });
  if (!Number.isFinite(radius) || radius < 0 || radius > 5000) throw problem(400, 'serviceRadiusKm is invalid');
  const result = await pool.query(
    `INSERT INTO service_resources(tenant_id,id,display_name,skills,service_radius_km,base_latitude,base_longitude)
     VALUES($1,$2,$3,$4,$5,$6,$7)
     ON CONFLICT(tenant_id,id) DO UPDATE SET display_name=EXCLUDED.display_name,skills=EXCLUDED.skills,service_radius_km=EXCLUDED.service_radius_km,base_latitude=EXCLUDED.base_latitude,base_longitude=EXCLUDED.base_longitude,version=service_resources.version+1
     RETURNING *`,
    [req.user.tenantId, assertText(body.id, 'id', 2, 100), assertText(body.displayName, 'displayName', 2, 200), JSON.stringify(skills), radius, body.baseLatitude, body.baseLongitude]
  );
  res.status(201).json(result.rows[0]);
}));

router.post('/inventory', requireRole('dispatcher'), asyncRoute(async (req, res) => {
  const body = assertObject(req.body);
  if (!Number.isInteger(body.availableQuantity) || body.availableQuantity < 0) throw problem(400, 'availableQuantity is invalid');
  const result = await pool.query(
    `INSERT INTO service_inventory(tenant_id,sku,description,available_quantity) VALUES($1,$2,$3,$4)
     ON CONFLICT(tenant_id,sku) DO UPDATE SET description=EXCLUDED.description,available_quantity=EXCLUDED.available_quantity,version=service_inventory.version+1
     WHERE EXCLUDED.available_quantity>=service_inventory.reserved_quantity RETURNING *`,
    [req.user.tenantId, assertText(body.sku, 'sku', 1, 100), assertText(body.description, 'description', 2, 300), body.availableQuantity]
  );
  if (!result.rowCount) throw problem(409, 'available quantity cannot fall below reservations');
  res.status(201).json(result.rows[0]);
}));

router.post('/orders', asyncRoute(async (req, res) => {
  const body = assertObject(req.body);
  const key = assertText(req.get('idempotency-key'), 'Idempotency-Key', 8, 200);
  if (!Array.isArray(body.requiredSkills) || body.requiredSkills.length > 50) throw problem(400, 'requiredSkills is invalid');
  const requiredSkills = body.requiredSkills.map((skill) => assertText(skill, 'skill', 1, 100));
  const totals = domain.invoice(body.lines, body.taxBasisPoints);
  const currency = assertText(body.currency || 'USD', 'currency', 3, 3).toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) throw problem(400, 'currency is invalid');
  const requestDigest = domain.digest(body);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const old = await client.query('SELECT * FROM service_delivery_orders WHERE tenant_id=$1 AND idempotency_key=$2 FOR UPDATE', [req.user.tenantId, key]);
    if (old.rowCount) {
      await client.query('ROLLBACK');
      if (old.rows[0].request_digest !== requestDigest) throw problem(409, 'idempotency conflict');
      return res.json(old.rows[0]);
    }
    const schedule = await loadAvailability(client, req.user.tenantId, { ...body, requiredSkills });
    const id = crypto.randomUUID();
    const created = await client.query(
      `INSERT INTO service_delivery_orders(id,tenant_id,customer_id,resource_id,required_skills,service_address_ref,service_latitude,service_longitude,travel_km,starts_at,ends_at,subtotal_cents,tax_cents,total_cents,currency,idempotency_key,request_digest)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING *`,
      [id, req.user.tenantId, String(req.user.id), body.resourceId, JSON.stringify(requiredSkills), assertText(body.serviceAddressRef, 'serviceAddressRef', 2, 300), body.serviceLocation.latitude, body.serviceLocation.longitude, schedule.travelKm, body.startsAt, body.endsAt, totals.subtotalCents, totals.taxCents, totals.totalCents, currency, key, requestDigest]
    );
    for (const [index, line] of body.lines.entries()) {
      await client.query('INSERT INTO service_delivery_lines(order_id,line_no,kind,sku,description,quantity,unit_cents) VALUES($1,$2,$3,$4,$5,$6,$7)', [id, index + 1, line.kind || 'labor', line.sku || null, line.description.trim(), line.quantity, line.unitCents]);
    }
    for (const item of schedule.inventory) {
      await client.query('UPDATE service_inventory SET reserved_quantity=reserved_quantity+$1,version=version+1 WHERE tenant_id=$2 AND sku=$3', [item.quantity, req.user.tenantId, item.sku]);
      await client.query('INSERT INTO service_inventory_reservations(order_id,tenant_id,sku,quantity) VALUES($1,$2,$3,$4)', [id, req.user.tenantId, item.sku, item.quantity]);
    }
    await appendEvent(client, req.user, created.rows[0], 'created', 'draft_quote', null, { totals, travelKm: schedule.travelKm });
    await client.query('COMMIT');
    res.status(201).json(created.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}));

router.get('/orders', asyncRoute(async (req, res) => {
  const customerClause = req.user.role === 'customer' ? ' AND customer_id=$2' : '';
  const values = req.user.role === 'customer' ? [req.user.tenantId, String(req.user.id)] : [req.user.tenantId];
  const result = await pool.query(`SELECT * FROM service_delivery_orders WHERE tenant_id=$1${customerClause} ORDER BY created_at DESC LIMIT 200`, values);
  res.json(result.rows);
}));

router.get('/orders/:id', asyncRoute(async (req, res) => {
  const customerClause = req.user.role === 'customer' ? ' AND customer_id=$3' : '';
  const result = await pool.query(
    `SELECT o.*,
      COALESCE((SELECT jsonb_agg(l ORDER BY line_no) FROM service_delivery_lines l WHERE l.order_id=o.id),'[]') lines,
      COALESCE((SELECT jsonb_agg(e ORDER BY occurred_at) FROM service_delivery_events e WHERE e.order_id=o.id),'[]') events,
      COALESCE((SELECT jsonb_agg(p ORDER BY created_at) FROM service_provider_outbox p WHERE p.order_id=o.id),'[]') provider_work
     FROM service_delivery_orders o WHERE o.id=$1 AND o.tenant_id=$2${customerClause}`,
    req.user.role === 'customer' ? [req.params.id, req.user.tenantId, String(req.user.id)] : [req.params.id, req.user.tenantId]
  );
  if (!result.rowCount) throw problem(404, 'order not found');
  res.json(result.rows[0]);
}));

router.post('/orders/:id/transitions', asyncRoute(async (req, res) => {
  const body = assertObject(req.body);
  const toStatus = assertText(body.toStatus, 'toStatus', 2, 40);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const found = await client.query('SELECT * FROM service_delivery_orders WHERE id=$1 AND tenant_id=$2 FOR UPDATE', [req.params.id, req.user.tenantId]);
    if (!found.rowCount) throw problem(404, 'order not found');
    const order = found.rows[0];
    if (req.user.role === 'customer' && order.customer_id !== String(req.user.id)) throw problem(403, 'customer does not own order');
    if (order.version !== assertVersion(body.expectedVersion)) throw problem(409, `version conflict; current version is ${order.version}`);
    domain.transition(order.status, toStatus, req.user.role);
    const updated = await client.query('UPDATE service_delivery_orders SET status=$1,version=version+1,updated_at=NOW() WHERE id=$2 RETURNING *', [toStatus, order.id]);
    await appendEvent(client, req.user, order, 'transition', toStatus, body.reason, {});
    await queueForTransition(client, req.user, order, toStatus, updated.rows[0].version);
    await client.query('COMMIT');
    res.json(updated.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}));

router.post('/orders/:id/payment', requireRole('customer', 'finance'), asyncRoute(async (req, res) => {
  const body = assertObject(req.body);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const found = await client.query('SELECT * FROM service_delivery_orders WHERE id=$1 AND tenant_id=$2 FOR UPDATE', [req.params.id, req.user.tenantId]);
    if (!found.rowCount) throw problem(404, 'order not found');
    const order = found.rows[0];
    if (order.status !== 'invoiced') throw problem(409, 'order is not payable');
    if (order.version !== assertVersion(body.expectedVersion)) throw problem(409, `version conflict; current version is ${order.version}`);
    await queueProvider(client, req.user.tenantId, order.id, 'payment', 'payment_capture', { orderId: order.id, totalCents: Number(order.total_cents), currency: order.currency, paymentMethodRef: assertText(body.paymentMethodRef, 'paymentMethodRef', 4, 300) }, `capture:${order.version}`);
    await appendEvent(client, req.user, order, 'payment_requested', order.status, null, { amountCents: Number(order.total_cents) });
    await client.query('COMMIT');
    res.status(202).json({ accepted: true });
  } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
}));

router.post('/orders/:id/reschedule', requireRole('customer', 'dispatcher'), asyncRoute(async (req, res) => {
  const body = assertObject(req.body);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const found = await client.query('SELECT * FROM service_delivery_orders WHERE id=$1 AND tenant_id=$2 FOR UPDATE', [req.params.id, req.user.tenantId]);
    if (!found.rowCount) throw problem(404, 'order not found');
    const order = found.rows[0];
    if (!['booked', 'dispatched', 'no_show'].includes(order.status)) throw problem(409, 'order cannot be rescheduled');
    if (order.version !== assertVersion(body.expectedVersion)) throw problem(409, `version conflict; current version is ${order.version}`);
    const schedule = await loadAvailability(client, req.user.tenantId, {
      resourceId: order.resource_id,
      requiredSkills: order.required_skills,
      serviceLocation: { latitude: Number(order.service_latitude), longitude: Number(order.service_longitude) },
      startsAt: body.startsAt,
      endsAt: body.endsAt,
      inventory: []
    }, order.id);
    const updated = await client.query("UPDATE service_delivery_orders SET starts_at=$1,ends_at=$2,travel_km=$3,status='booked',version=version+1,updated_at=NOW() WHERE id=$4 RETURNING *", [body.startsAt, body.endsAt, schedule.travelKm, order.id]);
    await appendEvent(client, req.user, order, 'rescheduled', 'booked', body.reason, { startsAt: body.startsAt, endsAt: body.endsAt });
    await queueProvider(client, req.user.tenantId, order.id, 'calendar', 'booking_update', { orderId: order.id, startsAt: body.startsAt, endsAt: body.endsAt, version: updated.rows[0].version }, `reschedule:${updated.rows[0].version}`);
    await client.query('COMMIT');
    res.json(updated.rows[0]);
  } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
}));

router.post('/orders/:id/reassign', requireRole('dispatcher'), asyncRoute(async (req, res) => {
  const body = assertObject(req.body);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const found = await client.query('SELECT * FROM service_delivery_orders WHERE id=$1 AND tenant_id=$2 FOR UPDATE', [req.params.id, req.user.tenantId]);
    if (!found.rowCount) throw problem(404, 'order not found');
    const order = found.rows[0];
    if (order.version !== assertVersion(body.expectedVersion)) throw problem(409, `version conflict; current version is ${order.version}`);
    const schedule = await loadAvailability(client, req.user.tenantId, {
      resourceId: body.resourceId,
      requiredSkills: order.required_skills,
      serviceLocation: { latitude: Number(order.service_latitude), longitude: Number(order.service_longitude) },
      startsAt: order.starts_at,
      endsAt: order.ends_at,
      inventory: []
    }, order.id);
    domain.reassign({ status: order.status, booking: { startsAt: order.starts_at, endsAt: order.ends_at, requiredSkills: order.required_skills, travelKm: schedule.travelKm, bookings: [], inventory: [] } }, schedule.resource);
    const updated = await client.query('UPDATE service_delivery_orders SET resource_id=$1,travel_km=$2,version=version+1,updated_at=NOW() WHERE id=$3 RETURNING *', [body.resourceId, schedule.travelKm, order.id]);
    await appendEvent(client, req.user, order, 'reassigned', order.status, body.reason, { fromResource: order.resource_id, toResource: body.resourceId });
    await queueProvider(client, req.user.tenantId, order.id, 'calendar', 'booking_update', { orderId: order.id, resourceId: body.resourceId, version: updated.rows[0].version }, `reassign:${updated.rows[0].version}`);
    await client.query('COMMIT');
    res.json(updated.rows[0]);
  } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
}));

router.post('/orders/:id/change-orders', requireRole('technician'), asyncRoute(async (req, res) => {
  const body = assertObject(req.body);
  if (!Number.isSafeInteger(body.amountCents) || body.amountCents < 0) throw problem(400, 'amountCents is invalid');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const found = await client.query("SELECT * FROM service_delivery_orders WHERE id=$1 AND tenant_id=$2 AND status='in_progress' FOR UPDATE", [req.params.id, req.user.tenantId]);
    if (!found.rowCount) throw problem(409, 'in-progress order not found');
    const order = found.rows[0];
    if (order.version !== assertVersion(body.expectedVersion)) throw problem(409, `version conflict; current version is ${order.version}`);
    const id = crypto.randomUUID();
    const change = await client.query('INSERT INTO service_change_orders(id,tenant_id,order_id,amount_cents,description,requested_by) VALUES($1,$2,$3,$4,$5,$6) RETURNING *', [id, req.user.tenantId, order.id, body.amountCents, assertText(body.description, 'description', 3, 1000), String(req.user.id)]);
    await client.query("UPDATE service_delivery_orders SET status='change_requested',version=version+1,updated_at=NOW() WHERE id=$1", [order.id]);
    await appendEvent(client, req.user, order, 'change_requested', 'change_requested', null, { changeOrderId: id, amountCents: body.amountCents });
    await client.query('COMMIT');
    res.status(201).json(change.rows[0]);
  } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
}));

router.post('/change-orders/:id/decision', requireRole('customer'), asyncRoute(async (req, res) => {
  const body = assertObject(req.body);
  if (!['approved', 'rejected'].includes(body.decision)) throw problem(400, 'decision is invalid');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const found = await client.query(`SELECT c.*,o.status,o.version,o.customer_id,o.subtotal_cents,o.tax_cents,o.total_cents FROM service_change_orders c JOIN service_delivery_orders o ON o.id=c.order_id WHERE c.id=$1 AND c.tenant_id=$2 FOR UPDATE`, [req.params.id, req.user.tenantId]);
    if (!found.rowCount) throw problem(404, 'change order not found');
    const change = found.rows[0];
    if (change.customer_id !== String(req.user.id)) throw problem(403, 'customer does not own order');
    if (change.state !== 'requested' || change.status !== 'change_requested') throw problem(409, 'change order is no longer pending');
    const nextStatus = 'in_progress';
    await client.query('UPDATE service_change_orders SET state=$1,reviewed_by=$2,reviewed_at=NOW() WHERE id=$3', [body.decision, String(req.user.id), change.id]);
    if (body.decision === 'approved') {
      const lineNo = await client.query('SELECT COALESCE(MAX(line_no),0)+1 AS next FROM service_delivery_lines WHERE order_id=$1', [change.order_id]);
      await client.query("INSERT INTO service_delivery_lines(order_id,line_no,kind,description,quantity,unit_cents) VALUES($1,$2,'change_order',$3,1,$4)", [change.order_id, lineNo.rows[0].next, change.description, change.amount_cents]);
      await client.query("UPDATE service_delivery_orders SET status='in_progress',subtotal_cents=subtotal_cents+$1,total_cents=total_cents+$1,version=version+1,updated_at=NOW() WHERE id=$2", [change.amount_cents, change.order_id]);
    } else {
      await client.query("UPDATE service_delivery_orders SET status='in_progress',version=version+1,updated_at=NOW() WHERE id=$1", [change.order_id]);
    }
    await appendEvent(client, req.user, { id: change.order_id, status: 'change_requested' }, `change_${body.decision}`, nextStatus, body.reason, { changeOrderId: change.id });
    await client.query('COMMIT');
    res.json({ decision: body.decision, status: 'in_progress' });
  } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
}));

router.post('/orders/:id/offline-mutations', asyncRoute(async (req, res) => {
  const body = assertObject(req.body);
  const requestDigest = domain.digest(body);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const existing = await client.query('SELECT * FROM service_offline_mutations WHERE tenant_id=$1 AND mutation_id=$2 FOR UPDATE', [req.user.tenantId, body.mutationId]);
    if (existing.rowCount) {
      await client.query('ROLLBACK');
      if (existing.rows[0].request_digest !== requestDigest) throw problem(409, 'offline mutation ID conflict');
      return res.json(existing.rows[0].result);
    }
    const found = await client.query('SELECT * FROM service_delivery_orders WHERE id=$1 AND tenant_id=$2 FOR UPDATE', [req.params.id, req.user.tenantId]);
    if (!found.rowCount) throw problem(404, 'order not found');
    const order = found.rows[0];
    const resolution = domain.offline(order, body);
    if (!resolution.accepted) {
      await client.query('INSERT INTO service_offline_mutations(tenant_id,mutation_id,order_id,base_version,request_digest,result) VALUES($1,$2,$3,$4,$5,$6)', [req.user.tenantId, body.mutationId, order.id, body.baseVersion, requestDigest, resolution]);
      await client.query('COMMIT');
      return res.status(409).json(resolution);
    }
    const toStatus = assertText(body.changes?.toStatus, 'changes.toStatus', 2, 40);
    domain.transition(order.status, toStatus, req.user.role);
    const updated = await client.query('UPDATE service_delivery_orders SET status=$1,version=version+1,updated_at=NOW() WHERE id=$2 RETURNING *', [toStatus, order.id]);
    const result = { accepted: true, order: updated.rows[0] };
    await appendEvent(client, req.user, order, 'offline_transition', toStatus, body.changes.reason, { mutationId: body.mutationId });
    await queueForTransition(client, req.user, order, toStatus, updated.rows[0].version);
    await client.query('INSERT INTO service_offline_mutations(tenant_id,mutation_id,order_id,base_version,resulting_version,request_digest,result) VALUES($1,$2,$3,$4,$5,$6,$7)', [req.user.tenantId, body.mutationId, order.id, body.baseVersion, updated.rows[0].version, requestDigest, result]);
    await client.query('COMMIT');
    res.json(result);
  } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
}));

router.post('/providers/:provider/claim', requireRole('admin'), asyncRoute(async (req, res) => {
  const provider = req.params.provider;
  if (!allowedProviders.has(provider)) throw problem(404, 'unknown provider');
  const result = await pool.query(
    `WITH candidate AS (
       SELECT id FROM service_provider_outbox WHERE provider=$1 AND
       ((status IN('pending','retry') AND available_at<=NOW()) OR (status='leased' AND lease_until<NOW()))
       ORDER BY available_at,id FOR UPDATE SKIP LOCKED LIMIT 1
     ) UPDATE service_provider_outbox o SET status='leased',attempts=attempts+1,lease_until=NOW()+interval '2 minutes',updated_at=NOW()
       FROM candidate WHERE o.id=candidate.id RETURNING o.*`,
    [provider]
  );
  if (!result.rowCount) return res.status(204).send();
  res.json(result.rows[0]);
}));

router.use((error, _req, res, _next) => {
  const status = Number(error.status) || (/invalid|overbooked|unavailable|outside|missing skill/i.test(error.message) ? 422 : 500);
  if (status >= 500) console.error(error);
  res.status(status).json({ error: status >= 500 ? 'internal server error' : error.message });
});

module.exports = router;
