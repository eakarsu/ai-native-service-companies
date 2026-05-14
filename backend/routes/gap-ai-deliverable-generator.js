// Work Packages & Deliverable Generator
//
// Manages the end-to-end lifecycle of an AI-native service delivery:
//   - Start a work package against a service offering
//   - Advance through pipeline steps (recording per-step AI/human costs)
//   - Generate concrete deliverables (contract redline, tax return, audit memo, etc.)
//   - Track per-package margin in real time
//
// Endpoints:
//   GET   /api/gap-ai-deliverable-generator/                       — all packages
//   GET   /api/gap-ai-deliverable-generator/:id                    — single package + deliverables + ledger
//   GET   /api/gap-ai-deliverable-generator/:id/timeline           — step-by-step timeline
//   POST  /api/gap-ai-deliverable-generator/                       — create package
//   POST  /api/gap-ai-deliverable-generator/:id/advance            — advance to next step (records cost)
//   POST  /api/gap-ai-deliverable-generator/:id/deliverable        — generate a deliverable
//   POST  /api/gap-ai-deliverable-generator/:id/deliver            — mark package delivered
//   POST  /api/gap-ai-deliverable-generator/:id/escalate           — escalate to human review
//   GET   /api/gap-ai-deliverable-generator/inflight/queue         — packages in flight

const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const pool = require('../db');

router.use(verifyToken);

// Real LLM model pricing (per million tokens), 2025 prevailing rates.
const MODEL_PRICING_USD_PER_MTOK = {
  'claude-opus-4':     { input: 15.0, output: 75.0 },
  'claude-sonnet-4.5': { input: 3.0,  output: 15.0 },
  'claude-haiku-4.5':  { input: 0.80, output: 4.0 },
  'gpt-5':             { input: 10.0, output: 30.0 },
  'gpt-5-mini':        { input: 0.50, output: 1.50 }
};

function estimateCallCost(model, tokens_in = 0, tokens_out = 0) {
  const p = MODEL_PRICING_USD_PER_MTOK[model];
  if (!p) return 0;
  return +(((tokens_in * p.input) + (tokens_out * p.output)) / 1_000_000).toFixed(4);
}

router.get('/', async (req, res) => {
  try {
    const { status, client_id, offering_id } = req.query;
    const params = []; const where = [];
    if (status)      { params.push(status);      where.push(`wp.status = $${params.length}`); }
    if (client_id)   { params.push(client_id);   where.push(`wp.client_id = $${params.length}`); }
    if (offering_id) { params.push(offering_id); where.push(`wp.offering_id = $${params.length}`); }
    const sql = `
      SELECT wp.*,
             c.company AS client_company,
             c.name AS client_name,
             o.name AS offering_name,
             o.sku  AS offering_sku,
             o.vertical
      FROM work_packages wp
      LEFT JOIN clients c ON c.id = wp.client_id
      LEFT JOIN service_offerings o ON o.id = wp.offering_id
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY wp.started_at DESC
    `;
    const r = await pool.query(sql, params);
    res.json(r.rows.map(row => ({
      ...row,
      margin_pct: row.margin_usd && row.price_charged_usd
        ? +(100 * Number(row.margin_usd) / Number(row.price_charged_usd)).toFixed(1) : null,
      sla_remaining_hours: null
    })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/inflight/queue', async (_req, res) => {
  try {
    const r = await pool.query(`
      SELECT wp.id, wp.case_ref, wp.status, wp.current_step,
             wp.ai_cost_actual_usd, wp.human_minutes_used, wp.price_charged_usd,
             wp.started_at, o.name AS offering_name, o.sla_hours,
             c.company AS client_company,
             EXTRACT(EPOCH FROM (NOW() - wp.started_at))/3600 AS hours_elapsed
      FROM work_packages wp
      LEFT JOIN service_offerings o ON o.id = wp.offering_id
      LEFT JOIN clients c ON c.id = wp.client_id
      WHERE wp.status IN ('intake','running','qc','escalated')
      ORDER BY wp.started_at ASC
    `);
    const queue = r.rows.map(row => {
      const elapsed = Number(row.hours_elapsed) || 0;
      const sla = Number(row.sla_hours || 72);
      const breach_risk = elapsed / sla;
      return {
        ...row,
        hours_elapsed: +elapsed.toFixed(1),
        sla_pct_used: +(100 * breach_risk).toFixed(0),
        sla_status: breach_risk > 1 ? 'breached' : breach_risk > 0.75 ? 'at_risk' : 'on_track'
      };
    });
    res.json({ queue });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const wp = await pool.query(`
      SELECT wp.*, o.name AS offering_name, o.sku AS offering_sku, o.vertical,
             o.sla_hours, o.benchmark_eval, o.benchmark_score,
             c.company AS client_company, c.name AS client_name
      FROM work_packages wp
      LEFT JOIN service_offerings o ON o.id = wp.offering_id
      LEFT JOIN clients c ON c.id = wp.client_id
      WHERE wp.id = $1
    `, [req.params.id]);
    if (!wp.rows[0]) return res.status(404).json({ error: 'Not found' });
    const pkg = wp.rows[0];
    const [steps, deliverables, ledger, qc] = await Promise.all([
      pool.query('SELECT * FROM workflow_steps WHERE offering_id=$1 ORDER BY step_order', [pkg.offering_id]),
      pool.query('SELECT * FROM deliverables WHERE package_id=$1 ORDER BY generated_at DESC', [pkg.id]),
      pool.query('SELECT * FROM margin_events WHERE package_id=$1 ORDER BY occurred_at', [pkg.id]),
      pool.query(`
        SELECT q.* FROM qc_reviews q
        JOIN deliverables d ON d.id = q.deliverable_id
        WHERE d.package_id = $1 ORDER BY q.queued_at DESC
      `, [pkg.id])
    ]);
    const ledgerSum = ledger.rows.reduce((s, e) => s + Number(e.cost_usd || 0), 0);
    res.json({
      package: pkg,
      workflow: steps.rows,
      deliverables: deliverables.rows,
      ledger: ledger.rows,
      qc_reviews: qc.rows,
      computed: {
        ledger_total_cost_usd: +ledgerSum.toFixed(4),
        margin_usd_live: pkg.price_charged_usd ? +(Number(pkg.price_charged_usd) - ledgerSum).toFixed(2) : null,
        margin_pct_live: pkg.price_charged_usd ? +(100 * (Number(pkg.price_charged_usd) - ledgerSum) / Number(pkg.price_charged_usd)).toFixed(1) : null,
        completion_pct: steps.rows.length ? +(100 * Number(pkg.current_step) / steps.rows.length).toFixed(0) : 0
      }
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id/timeline', async (req, res) => {
  try {
    const wp = await pool.query('SELECT offering_id, current_step FROM work_packages WHERE id=$1', [req.params.id]);
    if (!wp.rows[0]) return res.status(404).json({ error: 'Not found' });
    const steps = await pool.query(
      'SELECT * FROM workflow_steps WHERE offering_id=$1 ORDER BY step_order',
      [wp.rows[0].offering_id]
    );
    const events = await pool.query('SELECT * FROM margin_events WHERE package_id=$1 ORDER BY occurred_at', [req.params.id]);
    const timeline = steps.rows.map(s => ({
      ...s,
      state: s.step_order <= Number(wp.rows[0].current_step) ? 'done' : 'pending',
      events_at_step: events.rows.filter(e =>
        e.description && e.description.toLowerCase().includes(String(s.step_name).split(' ')[0].toLowerCase())
      ).length
    }));
    res.json({ timeline });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { offering_sku, offering_id, client_id, case_ref, intake_summary, price_charged_usd } = req.body || {};
    if (!client_id || (!offering_sku && !offering_id)) {
      return res.status(400).json({ error: 'client_id and offering_sku|offering_id required' });
    }
    let oid = offering_id;
    if (!oid) {
      const o = await pool.query('SELECT id, base_price_usd, unit_price_usd FROM service_offerings WHERE sku=$1', [offering_sku]);
      if (!o.rows.length) return res.status(404).json({ error: 'Offering not found' });
      oid = o.rows[0].id;
    }
    const offering = await pool.query('SELECT base_price_usd, unit_price_usd FROM service_offerings WHERE id=$1', [oid]);
    const defaultPrice = Number(offering.rows[0]?.base_price_usd || 0) + Number(offering.rows[0]?.unit_price_usd || 0);
    const r = await pool.query(
      `INSERT INTO work_packages (offering_id, client_id, case_ref, intake_summary, price_charged_usd, status, current_step)
       VALUES ($1,$2,$3,$4,$5,'intake',0) RETURNING *`,
      [oid, client_id, case_ref || `PKG-${Date.now()}`, intake_summary || null,
       price_charged_usd || defaultPrice]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/advance', async (req, res) => {
  try {
    const { tokens_in, tokens_out, model, description, human_minutes, cost_override_usd } = req.body || {};
    const wp = await pool.query('SELECT * FROM work_packages WHERE id=$1', [req.params.id]);
    if (!wp.rows[0]) return res.status(404).json({ error: 'Not found' });
    const pkg = wp.rows[0];
    const stepsRes = await pool.query(
      'SELECT * FROM workflow_steps WHERE offering_id=$1 ORDER BY step_order',
      [pkg.offering_id]
    );
    const nextOrder = Number(pkg.current_step) + 1;
    const step = stepsRes.rows.find(s => s.step_order === nextOrder);
    if (!step) return res.status(400).json({ error: 'No further steps (already at final step)' });
    // Compute cost
    let cost;
    if (cost_override_usd !== undefined) {
      cost = Number(cost_override_usd);
    } else if (step.step_type === 'ai_inference' && model) {
      cost = estimateCallCost(model, Number(tokens_in || 0), Number(tokens_out || 0));
    } else if (step.step_type === 'human_review' && human_minutes) {
      // Default reviewer cost ≈ $1/min ($60/hr loaded for offshore reviewers).
      cost = +(Number(human_minutes) * 1.0).toFixed(2);
    } else {
      cost = Number(step.cost_per_run_usd || 0);
    }
    // Record ledger event
    await pool.query(
      `INSERT INTO margin_events (package_id, event_type, description, cost_usd, tokens_in, tokens_out, model)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [pkg.id,
       step.step_type === 'human_review' ? 'human_time' : (step.step_type === 'tool_call' ? 'tool_call' : 'ai_call'),
       description || step.step_name,
       cost, tokens_in || null, tokens_out || null, model || step.model_used]
    );
    // Advance package state
    const isFinal = nextOrder === stepsRes.rows.length;
    const newStatus = isFinal ? 'qc' : (pkg.status === 'intake' ? 'running' : pkg.status);
    const newCost = Number(pkg.ai_cost_actual_usd) + (step.step_type !== 'human_review' ? cost : 0);
    const newHumanMin = Number(pkg.human_minutes_used) + Number(human_minutes || 0);
    const u = await pool.query(
      `UPDATE work_packages SET current_step=$1, status=$2, ai_cost_actual_usd=$3, human_minutes_used=$4
       WHERE id=$5 RETURNING *`,
      [nextOrder, newStatus, newCost, newHumanMin, pkg.id]
    );
    res.json({ package: u.rows[0], step, cost_recorded_usd: cost });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/deliverable', async (req, res) => {
  try {
    const { doc_type, filename, content_summary, pages, ai_confidence, citations_count, hallucination_flag } = req.body || {};
    if (!doc_type || !filename) return res.status(400).json({ error: 'doc_type and filename required' });
    const conf = Number(ai_confidence || 0);
    const grade = conf >= 92 ? 'A' : conf >= 84 ? 'B' : conf >= 75 ? 'C' : conf >= 65 ? 'D' : 'F';
    const r = await pool.query(
      `INSERT INTO deliverables (package_id, doc_type, filename, content_summary, pages, ai_confidence,
        quality_grade, citations_count, hallucination_flag)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [req.params.id, doc_type, filename, content_summary || null, pages || 0, conf,
       grade, citations_count || 0, !!hallucination_flag]
    );
    // Auto-queue QC if grade < A or hallucination flag
    if (grade !== 'A' || hallucination_flag) {
      await pool.query(
        `INSERT INTO qc_reviews (deliverable_id, review_type, priority, ai_score, status)
         VALUES ($1,$2,$3,$4,'queued')`,
        [r.rows[0].id, hallucination_flag ? 'escalation' : 'spot_check',
         hallucination_flag ? 'urgent' : (grade === 'B' ? 'normal' : 'high'), conf]
      );
    }
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/deliver', async (req, res) => {
  try {
    const { outcome = 'successful', client_rating } = req.body || {};
    const ledger = await pool.query(
      'SELECT COALESCE(SUM(cost_usd),0) AS total FROM margin_events WHERE package_id=$1',
      [req.params.id]
    );
    const totalCost = Number(ledger.rows[0].total);
    const r = await pool.query(`
      UPDATE work_packages
      SET status='delivered', delivered_at=NOW(), outcome=$1, client_rating=$2,
          margin_usd = COALESCE(price_charged_usd,0) - $3
      WHERE id=$4 RETURNING *
    `, [outcome, client_rating || null, totalCost, req.params.id]);
    if (!r.rows[0]) return res.status(404).json({ error: 'Not found' });
    // Mark all deliverables as delivered
    await pool.query('UPDATE deliverables SET delivered_to_client=TRUE WHERE package_id=$1', [req.params.id]);
    res.json({ package: r.rows[0], total_cost_usd: totalCost });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/escalate', async (req, res) => {
  try {
    const { reason } = req.body || {};
    const r = await pool.query(
      "UPDATE work_packages SET status='escalated' WHERE id=$1 RETURNING *",
      [req.params.id]
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'Not found' });
    await pool.query(
      `INSERT INTO margin_events (package_id, event_type, description, cost_usd)
       VALUES ($1,'human_time',$2,0)`,
      [req.params.id, `Escalated: ${reason || 'manual'}`]
    );
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
