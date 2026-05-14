const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const pool = require('../db');
router.use(verifyToken);

// ============================================================
// AI HELPER (mirrors ai.js with 503 handling for missing key)
// ============================================================
async function callAI(userPrompt, systemPrompt = '') {
  if (!process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY === 'your-key-here') {
    const err = new Error('AI service not configured. Set OPENROUTER_API_KEY in .env');
    err.statusCode = 503;
    throw err;
  }
  const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost',
      'X-Title': 'ServiceFlow'
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5',
      messages: [
        ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
        { role: 'user', content: userPrompt }
      ]
    })
  });
  if (!resp.ok) {
    const err = new Error(`AI provider returned ${resp.status}`);
    err.statusCode = 503;
    throw err;
  }
  const data = await resp.json();
  return data.choices?.[0]?.message?.content || 'AI unavailable';
}

function aiError(res, err) {
  if (err.statusCode === 503) return res.status(503).json({ error: err.message });
  return res.status(500).json({ error: err.message });
}

async function logAudit(req, action, entity, details = {}) {
  try {
    await pool.query(
      'INSERT INTO audit_log (user_email, action, entity, details) VALUES ($1, $2, $3, $4)',
      [req.user?.email || 'system', action, entity, JSON.stringify(details)]
    );
  } catch (e) { /* table may not yet exist; ignore */ }
}

// ============================================================
// AI #1: Client Churn Predictor
// ============================================================
router.post('/ai/churn-predictor', async (req, res) => {
  try {
    const { client_id } = req.body;
    let context = {};
    if (client_id) {
      const [c, t, i] = await Promise.all([
        pool.query('SELECT * FROM clients WHERE id=$1', [client_id]),
        pool.query('SELECT * FROM tasks WHERE client_id=$1 ORDER BY created_at DESC LIMIT 15', [client_id]),
        pool.query('SELECT * FROM invoices WHERE client_id=$1 ORDER BY issued_date DESC LIMIT 10', [client_id])
      ]);
      context = { client: c.rows[0], tasks: t.rows, invoices: i.rows };
    } else {
      const c = await pool.query('SELECT * FROM clients ORDER BY satisfaction_score ASC NULLS LAST LIMIT 10');
      context = { clientsAtRisk: c.rows };
    }
    const prompt = `Predict client churn risk based on the data below.

Data:
${JSON.stringify(context, null, 2)}

Provide:
1. **Churn Probability** (0-100%) with confidence interval
2. **Top 5 Risk Signals** observed
3. **Health Indicators** that are still positive
4. **Time-to-Churn Estimate** (days/weeks/months)
5. **Retention Playbook** - 5 specific actions to reduce churn risk
6. **Re-engagement Talking Points** for the account manager
7. **Comparable Client Patterns** - what similar clients show before leaving`;
    const result = await callAI(prompt, 'You are a senior B2B retention analyst. You predict churn from behavioral data and recommend retention plays.');
    await logAudit(req, 'ai.churn_predictor', 'client', { client_id });
    res.json({ result });
  } catch (err) { aiError(res, err); }
});

// ============================================================
// AI #2: Service-Time Estimator
// ============================================================
router.post('/ai/time-estimator', async (req, res) => {
  try {
    const { service_type, description, priority } = req.body;
    const tplRes = await pool.query('SELECT * FROM templates WHERE service_type=$1 OR $1 IS NULL ORDER BY last_updated DESC LIMIT 5', [service_type || null]);
    const histRes = await pool.query(
      `SELECT service_type, AVG(EXTRACT(EPOCH FROM (completed_at - created_at))/3600) AS avg_hours, COUNT(*) AS n
       FROM tasks WHERE completed_at IS NOT NULL ${service_type ? 'AND service_type=$1' : ''} GROUP BY service_type`,
      service_type ? [service_type] : []
    );
    const prompt = `Estimate the time required to complete a service task.

Request:
${JSON.stringify({ service_type, description, priority }, null, 2)}

Matching Templates (planned hours):
${JSON.stringify(tplRes.rows, null, 2)}

Historical Actuals:
${JSON.stringify(histRes.rows, null, 2)}

Provide:
1. **Best-Case Estimate** (hours)
2. **Likely Estimate** (hours) - your point prediction
3. **Worst-Case Estimate** (hours)
4. **Confidence Level** (low/medium/high) with reasoning
5. **Drivers** - what factors push the estimate up or down
6. **Risk Buffer Recommendation** (% padding)
7. **Milestone Breakdown** - how to slice the work`;
    const result = await callAI(prompt, 'You are a delivery operations lead. You predict realistic effort for professional service tasks.');
    await logAudit(req, 'ai.time_estimator', 'task', { service_type });
    res.json({ result });
  } catch (err) { aiError(res, err); }
});

// ============================================================
// AI #3: Complaint Sentiment Classifier
// ============================================================
router.post('/ai/sentiment-classifier', async (req, res) => {
  try {
    const { text, client_id } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ error: 'text is required' });
    let clientCtx = null;
    if (client_id) {
      const c = await pool.query('SELECT id,name,company,tier,satisfaction_score FROM clients WHERE id=$1', [client_id]);
      clientCtx = c.rows[0];
    }
    const prompt = `Classify the sentiment and intent of the following customer message.

Message:
"""
${text}
"""

Client Context (optional):
${JSON.stringify(clientCtx, null, 2)}

Provide:
1. **Sentiment** - positive / neutral / negative / very_negative
2. **Sentiment Score** (-1.0 to +1.0)
3. **Primary Emotion** (frustration, anger, confusion, satisfaction, etc.)
4. **Intent Category** - complaint / question / praise / cancellation / billing_dispute / feature_request
5. **Urgency** - low / medium / high / critical
6. **Escalation Recommended?** (yes/no, with reason)
7. **Key Issues Mentioned** (bulleted list)
8. **Suggested Reply Tone** for the responder`;
    const result = await callAI(prompt, 'You are a customer experience analyst expert in B2B service sentiment classification.');
    await logAudit(req, 'ai.sentiment_classifier', 'complaint', { client_id, len: text.length });
    res.json({ result });
  } catch (err) { aiError(res, err); }
});

// ============================================================
// AI #4: Invoice-Anomaly Detector
// ============================================================
router.post('/ai/invoice-anomaly', async (req, res) => {
  try {
    const { invoice_id } = req.body;
    let target = null;
    let peers = [];
    if (invoice_id) {
      const t = await pool.query(
        `SELECT i.*, c.name AS client_name, c.tier, t.service_type
         FROM invoices i LEFT JOIN clients c ON i.client_id = c.id
         LEFT JOIN tasks t ON i.task_id = t.id WHERE i.id=$1`, [invoice_id]);
      target = t.rows[0];
      if (target) {
        const p = await pool.query(
          `SELECT amount_usd, status, issued_date FROM invoices
           WHERE client_id=$1 AND id<>$2 ORDER BY issued_date DESC LIMIT 10`, [target.client_id, invoice_id]);
        peers = p.rows;
      }
    } else {
      const recent = await pool.query(
        `SELECT i.*, c.name AS client_name FROM invoices i LEFT JOIN clients c ON i.client_id=c.id ORDER BY i.issued_date DESC NULLS LAST LIMIT 25`);
      peers = recent.rows;
    }
    const prompt = `Inspect the following invoice data for anomalies (price outliers, duplicate billing, suspicious status patterns, etc.).

Target Invoice:
${JSON.stringify(target, null, 2)}

Peer / Recent Invoices:
${JSON.stringify(peers, null, 2)}

Provide:
1. **Anomaly Verdict** - normal / suspicious / clearly anomalous
2. **Anomaly Score** (0-100)
3. **Specific Red Flags** (bulleted)
4. **Possible Explanations** for each flag
5. **Recommended Investigation Steps**
6. **Auto-Hold Recommendation?** (yes/no with reason)
7. **Comparable Past Pattern** if any`;
    const result = await callAI(prompt, 'You are a financial controls auditor specialized in B2B service billing anomalies.');
    await logAudit(req, 'ai.invoice_anomaly', 'invoice', { invoice_id });
    res.json({ result });
  } catch (err) { aiError(res, err); }
});

// ============================================================
// AI #5: Smart Dispatch (which agent to assign)
// ============================================================
router.post('/ai/smart-dispatch', async (req, res) => {
  try {
    const { task_id, service_type, priority, description } = req.body;
    let task = null;
    if (task_id) {
      const t = await pool.query(
        `SELECT t.*, c.name AS client_name, c.tier FROM tasks t LEFT JOIN clients c ON t.client_id=c.id WHERE t.id=$1`, [task_id]);
      task = t.rows[0];
    } else {
      task = { service_type, priority, description };
    }
    const staff = await pool.query(
      `SELECT id,name,role,specialization,active_tasks,success_rate,availability FROM staff ORDER BY availability ASC, success_rate DESC LIMIT 25`);
    const prompt = `You are an AI dispatcher. Pick the optimal staff member to handle this task and explain.

Task:
${JSON.stringify(task, null, 2)}

Available Staff Pool:
${JSON.stringify(staff.rows, null, 2)}

Provide:
1. **Primary Assignment** - staff name and id, with 3-line rationale
2. **Backup Assignments** - 2 alternates, each with rationale
3. **Match Score** for primary (0-100)
4. **Workload Impact** - how this affects the chosen staff's capacity
5. **Skill Gap Notes** - any training needed
6. **Expected Outcome** - quality/speed expectations
7. **Auto-Approve Recommendation?** (yes/no)`;
    const result = await callAI(prompt, 'You are a service operations dispatcher. You assign work to maximize quality, speed, and team balance.');
    await logAudit(req, 'ai.smart_dispatch', 'task', { task_id });
    res.json({ result });
  } catch (err) { aiError(res, err); }
});

// ============================================================
// UTILITY #1: CSV Export (clients/tasks/invoices/staff/slas)
// ============================================================
function toCSV(rows) {
  if (!rows || !rows.length) return '';
  const cols = Object.keys(rows[0]);
  const escape = (v) => {
    if (v === null || v === undefined) return '';
    const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = cols.join(',');
  const body = rows.map(r => cols.map(c => escape(r[c])).join(',')).join('\n');
  return header + '\n' + body;
}

router.get('/export/:entity', async (req, res) => {
  try {
    const allowed = ['clients', 'tasks', 'invoices', 'staff', 'slas', 'templates'];
    const entity = req.params.entity;
    if (!allowed.includes(entity)) return res.status(400).json({ error: 'Unsupported entity' });
    const r = await pool.query(`SELECT * FROM ${entity} LIMIT 5000`);
    const csv = toCSV(r.rows);
    await logAudit(req, 'export.csv', entity, { rows: r.rows.length });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${entity}_${Date.now()}.csv"`);
    res.send(csv);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ============================================================
// UTILITY #2: Search + Filter (cross-entity)
// ============================================================
router.get('/search', async (req, res) => {
  try {
    const q = (req.query.q || '').toString().trim();
    const entity = (req.query.entity || 'all').toString();
    const status = (req.query.status || '').toString();
    const tier = (req.query.tier || '').toString();
    if (!q && !status && !tier) return res.json({ results: [], total: 0 });
    const like = `%${q}%`;
    const out = { clients: [], tasks: [], invoices: [], staff: [] };

    if (entity === 'all' || entity === 'clients') {
      const params = [like];
      let where = `(name ILIKE $1 OR company ILIKE $1 OR email ILIKE $1 OR industry ILIKE $1)`;
      if (status) { params.push(status); where += ` AND status=$${params.length}`; }
      if (tier) { params.push(tier); where += ` AND tier=$${params.length}`; }
      const r = await pool.query(`SELECT id,name,company,industry,tier,status FROM clients WHERE ${where} LIMIT 50`, params);
      out.clients = r.rows;
    }
    if (entity === 'all' || entity === 'tasks') {
      const params = [like];
      let where = `(description ILIKE $1 OR service_type ILIKE $1 OR assigned_to ILIKE $1)`;
      if (status) { params.push(status); where += ` AND status=$${params.length}`; }
      const r = await pool.query(`SELECT id,client_id,service_type,description,priority,status,assigned_to FROM tasks WHERE ${where} ORDER BY created_at DESC LIMIT 50`, params);
      out.tasks = r.rows;
    }
    if (entity === 'all' || entity === 'invoices') {
      const params = [like];
      let where = `(notes ILIKE $1 OR status ILIKE $1)`;
      if (status) { params.push(status); where += ` AND status=$${params.length}`; }
      const r = await pool.query(`SELECT id,client_id,amount_usd,status,issued_date FROM invoices WHERE ${where} ORDER BY issued_date DESC NULLS LAST LIMIT 50`, params);
      out.invoices = r.rows;
    }
    if (entity === 'all' || entity === 'staff') {
      const r = await pool.query(`SELECT id,name,role,specialization,availability FROM staff WHERE name ILIKE $1 OR specialization ILIKE $1 OR role ILIKE $1 LIMIT 50`, [like]);
      out.staff = r.rows;
    }
    const total = out.clients.length + out.tasks.length + out.invoices.length + out.staff.length;
    await logAudit(req, 'search', entity, { q, total });
    res.json({ ...out, total });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ============================================================
// UTILITY #3: Audit Log (read + write helper for clients UI)
// ============================================================
router.get('/audit-log', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 100, 500);
    const action = (req.query.action || '').toString();
    const entity = (req.query.entity || '').toString();
    const params = [];
    let where = '1=1';
    if (action) { params.push(`%${action}%`); where += ` AND action ILIKE $${params.length}`; }
    if (entity) { params.push(entity); where += ` AND entity = $${params.length}`; }
    params.push(limit);
    const r = await pool.query(
      `SELECT id, user_email, action, entity, details, created_at FROM audit_log WHERE ${where} ORDER BY created_at DESC LIMIT $${params.length}`,
      params
    );
    res.json(r.rows);
  } catch (err) {
    if (/relation .* does not exist/i.test(err.message)) return res.json([]);
    res.status(500).json({ error: err.message });
  }
});

router.post('/audit-log', async (req, res) => {
  try {
    const { action, entity, details } = req.body;
    if (!action) return res.status(400).json({ error: 'action is required' });
    const r = await pool.query(
      'INSERT INTO audit_log (user_email, action, entity, details) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user?.email || 'system', action, entity || null, JSON.stringify(details || {})]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
