'use strict';

const domain = require('./serviceDelivery');

function configuration(environment = process.env) {
  let endpoints;
  let tokens;
  try {
    endpoints = JSON.parse(environment.PROVIDER_ENDPOINTS_JSON || '{}');
    tokens = JSON.parse(environment.PROVIDER_TOKENS_JSON || '{}');
  } catch {
    throw new Error('provider configuration must be valid JSON');
  }
  const result = {};
  for (const provider of Object.keys(domain.providerOperations)) {
    if (!endpoints[provider] || !tokens[provider] || String(tokens[provider]).length < 16) continue;
    const url = new URL(endpoints[provider]);
    if (environment.NODE_ENV === 'production' && url.protocol !== 'https:') throw new Error(`provider ${provider} must use HTTPS`);
    result[provider] = { url: url.toString(), token: String(tokens[provider]) };
  }
  return result;
}

async function dispatch(job, providers, fetchImpl = fetch) {
  if (job.status !== 'leased') throw new Error('provider job must be leased');
  const expected = domain.providerJob(job.provider, job.operation, job.payload, job.idempotency_key);
  if (expected.payloadDigest !== job.payload_digest) throw new Error('provider job payload digest mismatch');
  const provider = providers[job.provider];
  if (!provider) throw new Error(`provider is not configured: ${job.provider}`);
  const response = await fetchImpl(new URL('/v1/jobs', provider.url), {
    method: 'POST',
    headers: {
      authorization: `Bearer ${provider.token}`,
      'content-type': 'application/json',
      'idempotency-key': job.idempotency_key,
      'x-payload-sha256': job.payload_digest
    },
    body: JSON.stringify({ operation: job.operation, payload: job.payload, callbackReference: job.idempotency_key }),
    signal: AbortSignal.timeout(15_000)
  });
  if (![200, 202].includes(response.status)) throw new Error(`provider returned HTTP ${response.status}`);
  const receipt = await response.json();
  if (typeof receipt.receiptId !== 'string' || receipt.receiptId.length < 4) throw new Error('provider omitted receiptId');
  return { receiptId: receipt.receiptId, acceptedAt: new Date().toISOString() };
}

module.exports = { configuration, dispatch };
