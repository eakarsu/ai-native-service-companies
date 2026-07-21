'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const domain = require('./serviceDelivery');
const adapter = require('./providerAdapter');

test('provider adapter authenticates typed idempotent work and validates receipts', async () => {
  const source = domain.providerJob('calendar', 'booking_create', { orderId: 'o1' }, 'order-1-calendar');
  const job = { ...source, provider: 'calendar', operation: source.operation, payload_digest: source.payloadDigest, idempotency_key: source.idempotencyKey, status: 'leased' };
  const requests = [];
  const receipt = await adapter.dispatch(job, { calendar: { url: 'https://calendar.invalid', token: 'provider-token-long-enough' } }, async (url, options) => {
    requests.push({ url: String(url), options });
    return { status: 202, json: async () => ({ receiptId: 'calendar-receipt-1' }) };
  });
  assert.equal(receipt.receiptId, 'calendar-receipt-1');
  assert.equal(requests[0].options.headers['idempotency-key'], 'order-1-calendar');
  assert.equal(requests[0].options.headers['x-payload-sha256'], source.payloadDigest);
});

test('provider adapter fails closed for changed payloads, missing providers, and bad receipts', async () => {
  const source = domain.providerJob('payment', 'payment_capture', { orderId: 'o1' }, 'order-1-payment');
  const job = { ...source, provider: 'payment', payload_digest: source.payloadDigest, idempotency_key: source.idempotencyKey, status: 'leased' };
  await assert.rejects(adapter.dispatch({ ...job, payload: { orderId: 'changed' } }, { payment: { url: 'https://payment.invalid', token: 'long-enough-provider-token' } }), /digest/);
  await assert.rejects(adapter.dispatch(job, {}), /not configured/);
  await assert.rejects(adapter.dispatch(job, { payment: { url: 'https://payment.invalid', token: 'long-enough-provider-token' } }, async () => ({ status: 202, json: async () => ({}) })), /receiptId/);
});
