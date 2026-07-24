'use strict';
const crypto = require('node:crypto');
const bcrypt = require('bcrypt');
const pool = require('../db');

async function main() {
  if (process.env.BOOTSTRAP_ACKNOWLEDGEMENT !== 'create-initial-admin') throw new Error('Refusing admin provisioning without explicit acknowledgement');
  const tenantId = String(process.env.TENANT_ID || '').trim();
  const email = String(process.env.PROVISION_ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.PROVISION_ADMIN_PASSWORD || '';
  const name = String(process.env.PROVISION_ADMIN_NAME || 'Initial Administrator').trim();
  if (!tenantId || !email || password.length < 12) throw new Error('Tenant, administrator email, and a password of at least 12 characters are required');
  const passwordHash = await bcrypt.hash(password, 10);
  await pool.query(
    `INSERT INTO service_identities(id,tenant_id,email,password_hash,display_name,role)
     VALUES($1,$2,$3,$4,$5,'admin')
     ON CONFLICT(tenant_id,email) DO UPDATE SET
       password_hash=EXCLUDED.password_hash,display_name=EXCLUDED.display_name,role='admin',active=TRUE`,
    [crypto.randomUUID(), tenantId, email, passwordHash, name],
  );
  console.log(`Provisioned initial administrator ${email}`);
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; }).finally(() => pool.end());
