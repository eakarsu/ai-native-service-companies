// Sample Data seeder
// Inserts 5-10 domain-realistic rows per main entity.
// JWT-protected via the shared verifyToken middleware.
// Mounted in server.js at /api/admin -> POST /api/admin/sample-data/:entity
const express = require('express');
const router = express.Router();
const pool = require('../db');
const verifyToken = require('../middleware/auth');

router.use(verifyToken);

// ------------------------------------------------------------
// Realistic seed pools (services-business flavoured)
// ------------------------------------------------------------
const CLIENT_SAMPLES = [
  { name: 'Marcus Whitfield',  company: 'Acme Plumbing Co',          email: 'marcus@acmeplumbing.com',     industry: 'plumbing',       tier: 'standard',   status: 'active',   total_tasks: 12, satisfaction_score: 4.40 },
  { name: 'Priya Raman',       company: 'Bluewave HVAC Services',    email: 'priya@bluewavehvac.com',      industry: 'hvac',           tier: 'premium',    status: 'active',   total_tasks: 38, satisfaction_score: 4.70 },
  { name: 'Diego Hernandez',   company: 'Sparkline Electrical LLC',  email: 'diego@sparklineelec.com',     industry: 'electrical',     tier: 'enterprise', status: 'active',   total_tasks: 91, satisfaction_score: 4.85 },
  { name: 'Sandra Mihalkova',  company: 'GreenLeaf Landscaping',     email: 'sandra@greenleaflawn.com',    industry: 'landscaping',    tier: 'standard',   status: 'active',   total_tasks: 7,  satisfaction_score: 4.10 },
  { name: 'Henry Tomlinson',   company: 'PrimePoint Pest Control',   email: 'henry@primepointpest.com',    industry: 'pest_control',   tier: 'premium',    status: 'active',   total_tasks: 22, satisfaction_score: 4.55 },
  { name: 'Aisha Mwangi',      company: 'Crystal Clean Janitorial',  email: 'aisha@crystalcleanjt.com',    industry: 'cleaning',       tier: 'standard',   status: 'inactive', total_tasks: 4,  satisfaction_score: 3.60 },
  { name: 'Logan Petrov',      company: 'IronGate Security Group',   email: 'logan@irongatesec.com',       industry: 'security',       tier: 'enterprise', status: 'active',   total_tasks: 64, satisfaction_score: 4.75 },
  { name: 'Yuki Tanaka',       company: 'Northstar Roofing',         email: 'yuki@northstarroofing.com',   industry: 'roofing',        tier: 'premium',    status: 'active',   total_tasks: 18, satisfaction_score: 4.30 }
];

const STAFF_SAMPLES = [
  { name: 'Tomás Alvarez',   role: 'Senior Technician',   specialization: 'HVAC repair, refrigerant systems', email: 'tomas@serviceflow.io',   active_tasks: 3, completed_tasks: 412, success_rate: 97.20, availability: 'available' },
  { name: 'Rebecca Lin',     role: 'Field Plumber',       specialization: 'Commercial plumbing, leak detection', email: 'rebecca@serviceflow.io', active_tasks: 5, completed_tasks: 287, success_rate: 95.10, availability: 'busy' },
  { name: 'Jamal Carter',    role: 'Master Electrician',  specialization: 'Industrial wiring, panel upgrades', email: 'jamal@serviceflow.io',   active_tasks: 2, completed_tasks: 503, success_rate: 98.40, availability: 'available' },
  { name: 'Olena Kozak',     role: 'Dispatch Coordinator', specialization: 'Routing, SLA tracking',           email: 'olena@serviceflow.io',   active_tasks: 0, completed_tasks: 1190, success_rate: 99.10, availability: 'available' },
  { name: 'Brett Hollister', role: 'Pest Control Tech',   specialization: 'Termites, rodent exclusion',       email: 'brett@serviceflow.io',   active_tasks: 4, completed_tasks: 156, success_rate: 93.50, availability: 'busy' },
  { name: 'Lakshmi Rao',     role: 'Crew Lead',           specialization: 'Landscaping, irrigation',          email: 'lakshmi@serviceflow.io', active_tasks: 1, completed_tasks: 240, success_rate: 96.00, availability: 'available' },
  { name: 'Connor Walsh',    role: 'Roofing Specialist',  specialization: 'Flat roofs, leak diagnostics',     email: 'connor@serviceflow.io',  active_tasks: 2, completed_tasks: 198, success_rate: 94.80, availability: 'on_leave' }
];

const TASK_SAMPLES = [
  { service_type: 'plumbing',      description: 'Replace burst PVC riser in basement; verify shutoff valves and pressure-test line.',     priority: 'high',     status: 'in_progress', assigned_to: 'Rebecca Lin',     amount_usd: 685.00 },
  { service_type: 'hvac',          description: 'Annual maintenance on rooftop RTU-3: filters, belts, refrigerant top-up, condensate flush.', priority: 'medium', status: 'pending',     assigned_to: 'Tomás Alvarez',    amount_usd: 420.00 },
  { service_type: 'electrical',    description: '200A panel upgrade with new breakers and tamper-resistant outlets in retail showroom.',   priority: 'high',     status: 'pending',     assigned_to: 'Jamal Carter',     amount_usd: 2450.00 },
  { service_type: 'pest_control',  description: 'Initial termite inspection and bait station deployment on warehouse perimeter.',          priority: 'medium',   status: 'completed',   assigned_to: 'Brett Hollister',  amount_usd: 540.00 },
  { service_type: 'landscaping',   description: 'Spring cleanup: edging, mulching, irrigation head replacement (12 zones).',               priority: 'low',      status: 'completed',   assigned_to: 'Lakshmi Rao',      amount_usd: 1180.00 },
  { service_type: 'cleaning',      description: 'Post-construction janitorial walk-through, floor stripping and waxing for office suite.', priority: 'medium',   status: 'completed',   assigned_to: 'Olena Kozak',      amount_usd: 760.00 },
  { service_type: 'roofing',       description: 'Emergency tarp + leak triage after storm; prep estimate for full membrane replacement.',  priority: 'critical', status: 'in_progress', assigned_to: 'Connor Walsh',     amount_usd: 950.00 },
  { service_type: 'security',      description: 'Quarterly CCTV review, NVR firmware update, and reset of failing perimeter sensor.',      priority: 'medium',   status: 'pending',     assigned_to: 'Olena Kozak',      amount_usd: 320.00 }
];

const INVOICE_SAMPLES = [
  { amount_usd: 685.00,  status: 'paid',     notes: 'NET-15 paid early; emergency riser replacement.' },
  { amount_usd: 420.00,  status: 'sent',     notes: 'Annual HVAC maintenance, includes filters and belts.' },
  { amount_usd: 2450.00, status: 'draft',    notes: 'Panel upgrade quote pending customer approval.' },
  { amount_usd: 540.00,  status: 'paid',     notes: 'Termite inspection + bait stations - 12 month plan.' },
  { amount_usd: 1180.00, status: 'overdue',  notes: 'Spring cleanup - reminder #2 sent.' },
  { amount_usd: 760.00,  status: 'paid',     notes: 'Post-construction janitorial; ACH cleared.' },
  { amount_usd: 950.00,  status: 'sent',     notes: 'Emergency tarp + triage; full re-roof estimate to follow.' },
  { amount_usd: 320.00,  status: 'paid',     notes: 'Quarterly CCTV maintenance retainer.' }
];

const SLA_SAMPLES = [
  { service_type: 'plumbing',     max_hours: 4,  penalty_per_hour_usd: 75.00,  current_status: 'compliant',    breach_count: 0 },
  { service_type: 'hvac',         max_hours: 8,  penalty_per_hour_usd: 50.00,  current_status: 'compliant',    breach_count: 1 },
  { service_type: 'electrical',   max_hours: 6,  penalty_per_hour_usd: 90.00,  current_status: 'at_risk',      breach_count: 2 },
  { service_type: 'pest_control', max_hours: 24, penalty_per_hour_usd: 25.00,  current_status: 'compliant',    breach_count: 0 },
  { service_type: 'landscaping',  max_hours: 48, penalty_per_hour_usd: 15.00,  current_status: 'compliant',    breach_count: 0 },
  { service_type: 'roofing',      max_hours: 2,  penalty_per_hour_usd: 150.00, current_status: 'breached',     breach_count: 3 },
  { service_type: 'security',     max_hours: 1,  penalty_per_hour_usd: 200.00, current_status: 'compliant',    breach_count: 0 }
];

const TEMPLATE_SAMPLES = [
  { service_type: 'plumbing',     name: 'Emergency Leak Triage',           description: 'Same-day shutoff, leak isolation, temporary repair, and customer sign-off.',                avg_hours: 2.5,  steps_count: 6,  success_rate: 96.00, active: true },
  { service_type: 'hvac',         name: 'Annual RTU Maintenance',          description: 'Standard preventative maintenance pass on rooftop units: filters, belts, refrigerant.',     avg_hours: 3.0,  steps_count: 9,  success_rate: 98.50, active: true },
  { service_type: 'electrical',   name: 'Panel Upgrade (200A)',            description: 'Permitted residential/commercial panel upgrade with breaker swap and inspection.',          avg_hours: 8.0,  steps_count: 14, success_rate: 94.00, active: true },
  { service_type: 'pest_control', name: 'Termite Inspection + Baiting',    description: 'Inspection, perimeter bait deployment, customer report, and 30-day follow-up scheduling.', avg_hours: 2.0,  steps_count: 7,  success_rate: 97.00, active: true },
  { service_type: 'landscaping',  name: 'Spring Cleanup Package',          description: 'Edging, mulching, irrigation check, and turf assessment.',                                  avg_hours: 5.5,  steps_count: 10, success_rate: 95.50, active: true },
  { service_type: 'cleaning',     name: 'Post-Construction Walkthrough',   description: 'Detailed punch-list cleanup including floor wax, glass, and dust remediation.',             avg_hours: 6.0,  steps_count: 11, success_rate: 96.50, active: true },
  { service_type: 'roofing',      name: 'Storm Damage Triage',             description: 'Tarp + leak diagnostic visit, photo documentation, and repair estimate within 24h.',        avg_hours: 1.5,  steps_count: 5,  success_rate: 92.00, active: true }
];

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------
function pickClientId(clients) {
  if (!clients || !clients.length) return null;
  return clients[Math.floor(Math.random() * clients.length)].id;
}

function todayMinus(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function todayPlus(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

async function logAudit(req, action, entity, details = {}) {
  try {
    await pool.query(
      'INSERT INTO audit_log (user_email, action, entity, details) VALUES ($1, $2, $3, $4)',
      [req.user?.email || 'system', action, entity, JSON.stringify(details)]
    );
  } catch (e) { /* table may not yet exist; ignore */ }
}

// ------------------------------------------------------------
// Per-entity inserters
// ------------------------------------------------------------
async function seedClients() {
  let inserted = 0;
  for (const c of CLIENT_SAMPLES) {
    await pool.query(
      `INSERT INTO clients (name, company, email, industry, tier, status, onboarded_at, total_tasks, satisfaction_score)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [c.name, c.company, c.email, c.industry, c.tier, c.status,
       todayMinus(30 + Math.floor(Math.random() * 300)),
       c.total_tasks, c.satisfaction_score]
    );
    inserted++;
  }
  return inserted;
}

async function seedStaff() {
  let inserted = 0;
  for (const s of STAFF_SAMPLES) {
    await pool.query(
      `INSERT INTO staff (name, role, specialization, email, active_tasks, completed_tasks, success_rate, availability)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [s.name, s.role, s.specialization, s.email, s.active_tasks, s.completed_tasks, s.success_rate, s.availability]
    );
    inserted++;
  }
  return inserted;
}

async function seedTasks() {
  const clients = (await pool.query('SELECT id FROM clients LIMIT 50')).rows;
  if (!clients.length) {
    const err = new Error('Seed clients first - tasks need a client to attach to.');
    err.statusCode = 409;
    throw err;
  }
  let inserted = 0;
  for (const t of TASK_SAMPLES) {
    const client_id = pickClientId(clients);
    const completed = t.status === 'completed';
    const dueOffset = t.priority === 'critical' ? 1 : (t.priority === 'high' ? 2 : 7);
    await pool.query(
      `INSERT INTO tasks (client_id, service_type, description, priority, status, assigned_to,
                          due_at, completed_at, result_summary, amount_usd)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        client_id, t.service_type, t.description, t.priority, t.status, t.assigned_to,
        todayPlus(dueOffset),
        completed ? todayMinus(Math.floor(Math.random() * 14)) : null,
        completed ? 'Work completed and verified on-site by tech; client signature on file.' : null,
        t.amount_usd
      ]
    );
    inserted++;
  }
  return inserted;
}

async function seedInvoices() {
  const clients = (await pool.query('SELECT id FROM clients LIMIT 50')).rows;
  if (!clients.length) {
    const err = new Error('Seed clients first - invoices need a client.');
    err.statusCode = 409;
    throw err;
  }
  const tasks = (await pool.query('SELECT id, client_id FROM tasks ORDER BY id DESC LIMIT 50')).rows;
  let inserted = 0;
  for (const inv of INVOICE_SAMPLES) {
    const client_id = pickClientId(clients);
    const matchedTask = tasks.find(t => t.client_id === client_id) || null;
    const issued = todayMinus(15 + Math.floor(Math.random() * 30));
    const due = todayPlus(15);
    const paid = inv.status === 'paid' ? todayMinus(Math.floor(Math.random() * 10)) : null;
    await pool.query(
      `INSERT INTO invoices (client_id, task_id, amount_usd, status, issued_date, due_date, paid_date, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [client_id, matchedTask ? matchedTask.id : null, inv.amount_usd, inv.status, issued, due, paid, inv.notes]
    );
    inserted++;
  }
  return inserted;
}

async function seedSLAs() {
  const clients = (await pool.query('SELECT id FROM clients LIMIT 50')).rows;
  if (!clients.length) {
    const err = new Error('Seed clients first - SLAs need a client.');
    err.statusCode = 409;
    throw err;
  }
  let inserted = 0;
  for (const s of SLA_SAMPLES) {
    const client_id = pickClientId(clients);
    await pool.query(
      `INSERT INTO slas (client_id, service_type, max_hours, penalty_per_hour_usd, current_status, breach_count, last_reviewed)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [client_id, s.service_type, s.max_hours, s.penalty_per_hour_usd, s.current_status, s.breach_count, todayMinus(7)]
    );
    inserted++;
  }
  return inserted;
}

async function seedTemplates() {
  let inserted = 0;
  for (const t of TEMPLATE_SAMPLES) {
    await pool.query(
      `INSERT INTO templates (service_type, name, description, avg_hours, steps_count, success_rate, last_updated, active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [t.service_type, t.name, t.description, t.avg_hours, t.steps_count, t.success_rate, todayMinus(14), t.active]
    );
    inserted++;
  }
  return inserted;
}

const SEEDERS = {
  clients:   seedClients,
  staff:     seedStaff,
  tasks:     seedTasks,
  invoices:  seedInvoices,
  slas:      seedSLAs,
  templates: seedTemplates
};

// ------------------------------------------------------------
// Route
// ------------------------------------------------------------
router.post('/sample-data/:entity', async (req, res) => {
  const entity = req.params.entity;
  const seeder = SEEDERS[entity];
  if (!seeder) {
    return res.status(400).json({ error: `Unsupported entity '${entity}'. Allowed: ${Object.keys(SEEDERS).join(', ')}` });
  }
  try {
    const inserted = await seeder();
    await logAudit(req, 'sample_data.seed', entity, { inserted });
    res.json({ inserted, entity });
  } catch (err) {
    if (err.statusCode === 409) return res.status(409).json({ error: err.message, entity });
    console.error('sample-data error', entity, err);
    res.status(500).json({ error: err.message, entity });
  }
});

router.get('/sample-data/_entities', async (req, res) => {
  res.json({ entities: Object.keys(SEEDERS) });
});

module.exports = router;
