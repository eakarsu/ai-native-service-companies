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
  const existing = await pool.query('SELECT 1 FROM service_identities WHERE lower(email)=lower($1)', [email]);
  if (existing.rowCount) throw new Error(`Refusing to overwrite existing account ${email}`);
  await pool.query(
    `INSERT INTO service_identities(id,tenant_id,email,password_hash,display_name,role)
     VALUES($1,$2,$3,$4,$5,'admin')`,
    [crypto.randomUUID(), tenantId, email, await bcrypt.hash(password, 12), name],
  );
  console.log(`Provisioned initial administrator ${email}`);
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; }).finally(() => pool.end());
