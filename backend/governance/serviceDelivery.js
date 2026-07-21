'use strict';

const crypto = require('node:crypto');

const states = Object.freeze({
  draft_quote: ['quote_sent', 'cancelled'],
  quote_sent: ['booked', 'cancelled'],
  booked: ['dispatched', 'cancelled'],
  dispatched: ['in_progress', 'no_show', 'booked', 'cancelled'],
  in_progress: ['partially_completed', 'completed', 'change_requested'],
  change_requested: ['in_progress', 'cancelled'],
  partially_completed: ['in_progress', 'invoiced'],
  completed: ['invoiced'],
  invoiced: ['refund_pending'],
  paid: ['refund_pending'],
  refund_pending: [],
  refund_failed: ['refund_pending'],
  refunded: [],
  no_show: ['booked', 'cancelled'],
  cancelled: []
});

const roles = Object.freeze({
  customer: ['draft_quote:quote_sent', 'quote_sent:booked', 'quote_sent:cancelled', 'booked:cancelled'],
  dispatcher: ['booked:dispatched', 'dispatched:no_show', 'dispatched:booked', 'dispatched:cancelled', 'no_show:booked'],
  technician: ['dispatched:in_progress', 'in_progress:partially_completed', 'in_progress:completed', 'in_progress:change_requested', 'partially_completed:in_progress'],
  finance: ['completed:invoiced', 'partially_completed:invoiced', 'invoiced:refund_pending', 'paid:refund_pending', 'refund_failed:refund_pending'],
  admin: ['*']
});

const providerOperations = Object.freeze({
  maps: new Set(['route_validate']),
  calendar: new Set(['booking_create', 'booking_update', 'booking_cancel']),
  messaging: new Set(['quote_send', 'booking_confirm', 'dispatch_notice', 'status_notice', 'invoice_notice', 'cancellation_notice']),
  payment: new Set(['invoice_create', 'payment_capture', 'refund_create']),
  tax: new Set(['tax_calculate']),
  accounting: new Set(['invoice_post', 'payment_post', 'refund_post'])
});

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).filter((key) => value[key] !== undefined).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

const digest = (value) => crypto.createHash('sha256').update(canonical(value)).digest('hex');

function transition(from, to, role) {
  if (!states[from]?.includes(to)) throw new Error(`invalid transition ${from} -> ${to}`);
  const grants = roles[role] || [];
  if (!grants.includes('*') && !grants.includes(`${from}:${to}`)) throw new Error('role cannot perform transition');
  return true;
}

function coordinate(value, name, min, max) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) throw new Error(`invalid ${name}`);
  return value;
}

function travelKm(from, to) {
  const lat1 = coordinate(from.latitude, 'origin latitude', -90, 90) * Math.PI / 180;
  const lat2 = coordinate(to.latitude, 'destination latitude', -90, 90) * Math.PI / 180;
  const deltaLat = lat2 - lat1;
  const deltaLon = (coordinate(to.longitude, 'destination longitude', -180, 180) - coordinate(from.longitude, 'origin longitude', -180, 180)) * Math.PI / 180;
  const a = Math.sin(deltaLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function availability(input) {
  const start = Date.parse(input.startsAt);
  const end = Date.parse(input.endsAt);
  if (!Number.isFinite(start) || !Number.isFinite(end) || start >= end) throw new Error('invalid interval');
  if (end - start > 24 * 60 * 60 * 1000) throw new Error('booking duration exceeds 24 hours');
  const skills = new Set(input.resource.skills || []);
  for (const skill of input.requiredSkills || []) if (!skills.has(skill)) throw new Error(`missing skill: ${skill}`);
  if (typeof input.travelKm !== 'number' || input.travelKm < 0 || input.travelKm > input.resource.serviceRadiusKm) throw new Error('outside service area');
  if ((input.bookings || []).some((item) => start < Date.parse(item.endsAt) && end > Date.parse(item.startsAt))) throw new Error('overbooked');
  for (const item of input.inventory || []) {
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || !Number.isInteger(item.available) || item.quantity > item.available) throw new Error(`inventory unavailable: ${item.sku}`);
  }
  return true;
}

function invoice(lines, taxBasisPoints) {
  if (!Array.isArray(lines) || !lines.length || lines.length > 100) throw new Error('invoice lines required');
  const subtotalCents = lines.reduce((sum, line) => {
    if (!Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > 10_000 || !Number.isSafeInteger(line.unitCents) || line.unitCents < 0) throw new Error('invalid line');
    if (typeof line.description !== 'string' || line.description.trim().length < 2 || line.description.length > 500) throw new Error('invalid line description');
    const next = sum + line.quantity * line.unitCents;
    if (!Number.isSafeInteger(next)) throw new Error('invoice total exceeds safe range');
    return next;
  }, 0);
  if (!Number.isInteger(taxBasisPoints) || taxBasisPoints < 0 || taxBasisPoints > 10_000) throw new Error('invalid tax');
  const taxCents = Math.round(subtotalCents * taxBasisPoints / 10_000);
  return { subtotalCents, taxCents, totalCents: subtotalCents + taxCents };
}

function providerJob(provider, operation, payload, idempotencyKey) {
  if (!providerOperations[provider]?.has(operation)) throw new Error('unsupported provider operation');
  if (typeof idempotencyKey !== 'string' || idempotencyKey.length < 8 || idempotencyKey.length > 200) throw new Error('valid idempotency key required');
  if (/secret|password|api.?key|token/i.test(canonical(payload))) throw new Error('credentials forbidden');
  return { provider, operation, payload, payloadDigest: digest(payload), idempotencyKey, status: 'pending', attempts: 0 };
}

function sign(secret, event) {
  if (typeof secret !== 'string' || secret.length < 32) throw new Error('secret must be at least 32 characters');
  return crypto.createHmac('sha256', secret).update(canonical(event)).digest('hex');
}

function verify(secret, event, signature) {
  if (typeof secret !== 'string' || secret.length < 32 || !/^[a-f0-9]{64}$/.test(String(signature))) return false;
  const actual = Buffer.from(sign(secret, event), 'hex');
  const supplied = Buffer.from(String(signature), 'hex');
  return actual.length === supplied.length && crypto.timingSafeEqual(actual, supplied);
}

function retry(attempts, retryable, max = 5) {
  if (!Number.isInteger(attempts) || attempts < 0 || !Number.isInteger(max) || max < 1 || max > 10) throw new Error('invalid retry policy');
  const next = attempts + 1;
  return !retryable || next >= max
    ? { status: 'dead_letter', attempts: next }
    : { status: 'retry', attempts: next, delaySeconds: Math.min(900, 2 ** next * 5) };
}

function offline(current, mutation) {
  if (!mutation || typeof mutation.mutationId !== 'string' || mutation.mutationId.length < 8) throw new Error('mutationId required');
  return mutation.baseVersion === current.version
    ? { accepted: true, nextVersion: current.version + 1, changes: mutation.changes }
    : { accepted: false, currentVersion: current.version };
}

function reassign(job, resource) {
  if (!['booked', 'dispatched', 'no_show'].includes(job.status)) throw new Error('work already started');
  return availability({ ...job.booking, resource });
}

module.exports = { states, roles, providerOperations, canonical, digest, transition, travelKm, availability, invoice, providerJob, sign, verify, retry, offline, reassign };
