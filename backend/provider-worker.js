'use strict';

require('dotenv').config({ path: require('node:path').join(__dirname, '../.env') });
const pool = require('./db');
const domain = require('./governance/serviceDelivery');
const adapter = require('./governance/providerAdapter');

async function runOnce(provider) {
  if (!domain.providerOperations[provider]) throw new Error('PROVIDER_WORKER_NAME is invalid');
  const claimed = await pool.query(
    `WITH candidate AS (
       SELECT id FROM service_provider_outbox WHERE provider=$1 AND
       ((status IN('pending','retry') AND available_at<=NOW()) OR (status='leased' AND lease_until<NOW()))
       ORDER BY available_at,id FOR UPDATE SKIP LOCKED LIMIT 1
     ) UPDATE service_provider_outbox o SET status='leased',attempts=attempts+1,lease_until=NOW()+interval '2 minutes',updated_at=NOW()
       FROM candidate WHERE o.id=candidate.id RETURNING o.*`,
    [provider]
  );
  if (!claimed.rowCount) return false;
  const job = claimed.rows[0];
  try {
    const receipt = await adapter.dispatch(job, adapter.configuration());
    await pool.query("UPDATE service_provider_outbox SET provider_receipt=$1,lease_until=NOW()+interval '30 minutes',updated_at=NOW() WHERE id=$2 AND status='leased'", [receipt.receiptId, job.id]);
  } catch (error) {
    const policy = domain.retry(Math.max(0, job.attempts - 1), true);
    await pool.query(
      `UPDATE service_provider_outbox SET status=$1,attempts=$2,available_at=NOW()+($3*interval '1 second'),lease_until=NULL,last_error=$4,updated_at=NOW() WHERE id=$5`,
      [policy.status, policy.attempts, policy.delaySeconds || 0, error.message.slice(0, 1000), job.id]
    );
  }
  return true;
}

async function main() {
  const provider = process.env.PROVIDER_WORKER_NAME;
  const once = process.argv.includes('--once');
  do {
    const worked = await runOnce(provider);
    if (once) break;
    await new Promise((resolve) => setTimeout(resolve, worked ? 100 : 2000));
  } while (true);
}

if (require.main === module) main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => process.argv.includes('--once') && pool.end());

module.exports = { runOnce };
