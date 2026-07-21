'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');

test('quote-to-refund, no-show, overbooking, change order, reassignment, and offline recovery', { skip: !process.env.TEST_DATABASE_URL }, async () => {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  process.env.JWT_SECRET = 'integration-secret-with-at-least-32-characters';
  process.env.JWT_ISSUER = 'serviceflow-integration';
  process.env.JWT_AUDIENCE = 'serviceflow-api-integration';
  process.env.PROVIDER_WEBHOOK_SECRETS_JSON = JSON.stringify({ payment: 'p'.repeat(32) });
  process.env.CORS_ORIGIN = 'http://localhost:5173';
  process.env.NODE_ENV = 'test';
  const jwt = require('jsonwebtoken');
  const domain = require('./serviceDelivery');
  const pool = require('../db');
  const { createApp } = require('../server');
  const server = createApp().listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const tenant = `tenant-${crypto.randomUUID()}`;
  const tokens = Object.fromEntries(['customer','dispatcher','technician','finance','admin'].map((role) => [role, jwt.sign({ id: `${role}-1`, role, tenantId: tenant }, process.env.JWT_SECRET, { algorithm: 'HS256', issuer: process.env.JWT_ISSUER, audience: process.env.JWT_AUDIENCE, expiresIn: '5m' })]));
  const providerEvents = [];
  const call = async (pathname, { role = 'customer', headers = {}, ...options } = {}) => {
    const response = await fetch(`${base}${pathname}`, { ...options, headers: { authorization: `Bearer ${tokens[role]}`, ...(options.body ? { 'content-type': 'application/json' } : {}), ...headers } });
    const body = response.status === 204 ? null : await response.json();
    return { response, body };
  };
  const transition = (id, expectedVersion, toStatus, role) => call(`/api/governed-delivery/orders/${id}/transitions`, { role, method: 'POST', body: JSON.stringify({ expectedVersion, toStatus, reason: 'integration fixture' }) });
  const fixture = (resourceId, start, inventory = []) => ({ resourceId, requiredSkills: ['electrical'], serviceAddressRef: 'address-ref-1', serviceLocation: { latitude: 40.715, longitude: -74.001 }, startsAt: start, endsAt: new Date(Date.parse(start) + 60 * 60 * 1000).toISOString(), inventory, lines: [{ kind: 'labor', description: 'Service labor', quantity: 1, unitCents: 10000 }], taxBasisPoints: 500, currency: 'USD' });
  try {
    assert.equal((await fetch(`${base}/api/health`)).status, 200);
    for (const id of ['tech-a','tech-b']) assert.equal((await call('/api/governed-delivery/resources', { role: 'dispatcher', method: 'POST', body: JSON.stringify({ id, displayName: id, skills: ['electrical'], serviceRadiusKm: 50, baseLatitude: 40.7128, baseLongitude: -74.006 }) })).response.status, 201);
    assert.equal((await call('/api/governed-delivery/inventory', { role: 'dispatcher', method: 'POST', body: JSON.stringify({ sku: 'WIRE', description: 'Wire kit', availableQuantity: 2 }) })).response.status, 201);

    const start = '2030-08-01T10:00:00.000Z';
    const created = await call('/api/governed-delivery/orders', { method: 'POST', headers: { 'idempotency-key': 'integration-order-1' }, body: JSON.stringify(fixture('tech-a', start, [{ sku: 'WIRE', quantity: 1 }])) });
    assert.equal(created.response.status, 201);
    const orderId = created.body.id;
    assert.equal((await call('/api/governed-delivery/orders', { method: 'POST', headers: { 'idempotency-key': 'integration-overbook' }, body: JSON.stringify(fixture('tech-a', start)) })).response.status, 422);
    assert.equal((await call(`/api/governed-delivery/orders/${orderId}/offline-mutations`, { method: 'POST', body: JSON.stringify({ mutationId: 'offline-stale-1', baseVersion: 999, changes: { toStatus: 'quote_sent' } }) })).response.status, 409);

    let order = (await transition(orderId, 1, 'quote_sent', 'customer')).body;
    order = (await transition(orderId, order.version, 'booked', 'customer')).body;
    order = (await transition(orderId, order.version, 'dispatched', 'dispatcher')).body;
    order = (await transition(orderId, order.version, 'in_progress', 'technician')).body;
    const change = await call(`/api/governed-delivery/orders/${orderId}/change-orders`, { role: 'technician', method: 'POST', body: JSON.stringify({ expectedVersion: order.version, amountCents: 2500, description: 'Additional safe wiring' }) });
    assert.equal(change.response.status, 201);
    assert.equal((await call(`/api/governed-delivery/change-orders/${change.body.id}/decision`, { method: 'POST', body: JSON.stringify({ decision: 'approved', reason: 'Customer accepted scope' }) })).response.status, 200);
    order = (await call(`/api/governed-delivery/orders/${orderId}`)).body;
    order = (await transition(orderId, order.version, 'partially_completed', 'technician')).body;
    order = (await transition(orderId, order.version, 'in_progress', 'technician')).body;
    order = (await transition(orderId, order.version, 'completed', 'technician')).body;
    order = (await transition(orderId, order.version, 'invoiced', 'finance')).body;
    assert.equal((await call(`/api/governed-delivery/orders/${orderId}/payment`, { method: 'POST', body: JSON.stringify({ expectedVersion: order.version, paymentMethodRef: 'method-fixture-1' }) })).response.status, 202);
    let detail = (await call(`/api/governed-delivery/orders/${orderId}`)).body;
    const payment = detail.provider_work.find((item) => item.operation === 'payment_capture');
    const paymentEvent = { idempotencyKey: payment.idempotency_key, outcome: 'succeeded', receiptId: 'payment-receipt-1' };
    providerEvents.push(`${tenant}-paid`);
    assert.equal((await fetch(`${base}/api/governed-delivery/webhooks/payment`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-provider-event-id': `${tenant}-paid`, 'x-provider-signature': domain.sign('p'.repeat(32), paymentEvent) }, body: JSON.stringify(paymentEvent) })).status, 202);
    detail = (await call(`/api/governed-delivery/orders/${orderId}`)).body;
    assert.equal(detail.status, 'paid');
    order = (await transition(orderId, detail.version, 'refund_pending', 'finance')).body;
    detail = (await call(`/api/governed-delivery/orders/${orderId}`)).body;
    const refund = detail.provider_work.find((item) => item.operation === 'refund_create');
    const refundEvent = { idempotencyKey: refund.idempotency_key, outcome: 'succeeded', receiptId: 'refund-receipt-1' };
    providerEvents.push(`${tenant}-refunded`);
    assert.equal((await fetch(`${base}/api/governed-delivery/webhooks/payment`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-provider-event-id': `${tenant}-refunded`, 'x-provider-signature': domain.sign('p'.repeat(32), refundEvent) }, body: JSON.stringify(refundEvent) })).status, 202);
    assert.equal((await call(`/api/governed-delivery/orders/${orderId}`)).body.status, 'refunded');

    const noShowCreated = await call('/api/governed-delivery/orders', { method: 'POST', headers: { 'idempotency-key': 'integration-no-show' }, body: JSON.stringify(fixture('tech-a', '2030-08-02T10:00:00.000Z')) });
    let noShow = (await transition(noShowCreated.body.id, 1, 'quote_sent', 'customer')).body;
    noShow = (await transition(noShow.id, noShow.version, 'booked', 'customer')).body;
    noShow = (await transition(noShow.id, noShow.version, 'dispatched', 'dispatcher')).body;
    noShow = (await transition(noShow.id, noShow.version, 'no_show', 'dispatcher')).body;
    const rescheduled = await call(`/api/governed-delivery/orders/${noShow.id}/reschedule`, { role: 'dispatcher', method: 'POST', body: JSON.stringify({ expectedVersion: noShow.version, startsAt: '2030-08-03T10:00:00.000Z', endsAt: '2030-08-03T11:00:00.000Z', reason: 'Customer requested' }) });
    assert.equal(rescheduled.body.status, 'booked');
    const reassigned = await call(`/api/governed-delivery/orders/${noShow.id}/reassign`, { role: 'dispatcher', method: 'POST', body: JSON.stringify({ expectedVersion: rescheduled.body.version, resourceId: 'tech-b', reason: 'Coverage' }) });
    assert.equal(reassigned.body.resource_id, 'tech-b');
  } finally {
    await pool.query('DELETE FROM service_provider_events WHERE event_id=ANY($1)', [providerEvents]);
    await new Promise((resolve) => server.close(resolve));
    await pool.end();
  }
});
