// Service Catalog & Productization
//
// Manage AI-native service offerings (the productized "we do the work" SKUs).
// Replaces traditional human-delivered services (legal, tax, audit, recruiting,
// consulting) with productized offerings with explicit SLAs, billing models,
// and benchmark-backed quality claims.
//
// Endpoints:
//   GET  /api/cf-service-productize/                       — list offerings (filterable by vertical/status)
//   GET  /api/cf-service-productize/:sku                   — single offering with workflow steps
//   GET  /api/cf-service-productize/:sku/workflow          — full pipeline
//   GET  /api/cf-service-productize/:sku/benchmarks        — all eval results
//   GET  /api/cf-service-productize/catalog/by-vertical    — vertical aggregation
//   GET  /api/cf-service-productize/catalog/economics      — unit economics summary
//   POST /api/cf-service-productize/                       — create offering
//   POST /api/cf-service-productize/:id/workflow-step      — add step
//   PUT  /api/cf-service-productize/:id                    — update offering
//   POST /api/cf-service-productize/:id/retire             — retire offering

const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const pool = require('../db');

router.use(verifyToken);

// Real-world replacement-cost reference values per vertical.
// Used to compute "AI savings vs human delivery" — sourced from public 2024 rate cards.
const HUMAN_BASELINE_USD = {
  legal:      { hourly: 425, typical_engagement: 8500 },   // BigLaw associate avg
  tax:        { hourly: 285, typical_engagement: 6500 },   // mid-tier CPA firm
  audit:      { hourly: 365, typical_engagement: 28000 },  // Big-4 / mid-tier audit
  compliance: { hourly: 315, typical_engagement: 15000 },  // privacy attorney
  recruiting: { hourly: 0,   typical_engagement: 25000 },  // contingent agency fee
  consulting: { hourly: 525, typical_engagement: 65000 }   // tier-2 strategy consulting
};

router.get('/', async (req, res) => {
  try {
    const { vertical, status, billing_model } = req.query;
    const params = []; const where = [];
    if (vertical)      { params.push(vertical);      where.push(`vertical = $${params.length}`); }
    if (status)        { params.push(status);        where.push(`status = $${params.length}`); }
    if (billing_model) { params.push(billing_model); where.push(`billing_model = $${params.length}`); }
    const sql = `SELECT * FROM service_offerings ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY vertical, name`;
    const r = await pool.query(sql, params);
    const enriched = r.rows.map(o => {
      const baseline = HUMAN_BASELINE_USD[o.vertical] || { typical_engagement: 0 };
      const price = Number(o.base_price_usd || 0) + Number(o.unit_price_usd || 0);
      return {
        ...o,
        ai_savings_pct: baseline.typical_engagement > 0
          ? +(100 * (1 - price / baseline.typical_engagement)).toFixed(1) : null,
        human_baseline_usd: baseline.typical_engagement,
        estimated_margin_usd: +(price - Number(o.ai_cost_per_unit_usd || 0)).toFixed(2)
      };
    });
    res.json(enriched);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/catalog/by-vertical', async (_req, res) => {
  try {
    const r = await pool.query(`
      SELECT vertical,
             COUNT(*)::int AS offerings_count,
             AVG(base_price_usd + COALESCE(unit_price_usd,0))::numeric(10,2) AS avg_price_usd,
             AVG(ai_cost_per_unit_usd)::numeric(10,4) AS avg_ai_cost_usd,
             AVG(target_gross_margin_pct)::numeric(5,2) AS avg_target_margin_pct,
             AVG(benchmark_score)::numeric(5,2) AS avg_benchmark_score,
             SUM(CASE WHEN status='active' THEN 1 ELSE 0 END)::int AS active_count
      FROM service_offerings
      GROUP BY vertical
      ORDER BY vertical
    `);
    const enriched = r.rows.map(row => ({
      ...row,
      human_baseline_usd: (HUMAN_BASELINE_USD[row.vertical]?.typical_engagement) || null,
      ai_disruption_ratio: HUMAN_BASELINE_USD[row.vertical]
        ? +(HUMAN_BASELINE_USD[row.vertical].typical_engagement / Math.max(Number(row.avg_price_usd), 1)).toFixed(1)
        : null
    }));
    res.json({ verticals: enriched });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/catalog/economics', async (_req, res) => {
  try {
    const r = await pool.query(`
      SELECT
        o.id, o.sku, o.name, o.vertical,
        (o.base_price_usd + COALESCE(o.unit_price_usd,0))::numeric(10,2) AS price_usd,
        o.ai_cost_per_unit_usd,
        o.target_gross_margin_pct,
        o.benchmark_score,
        COUNT(wp.id)::int AS deliveries,
        AVG(wp.ai_cost_actual_usd)::numeric(10,4) AS actual_avg_ai_cost,
        AVG(wp.margin_usd)::numeric(10,2) AS actual_avg_margin,
        AVG(wp.client_rating)::numeric(3,1) AS avg_rating
      FROM service_offerings o
      LEFT JOIN work_packages wp ON wp.offering_id = o.id AND wp.status='delivered'
      GROUP BY o.id
      ORDER BY actual_avg_margin DESC NULLS LAST
    `);
    const data = r.rows.map(row => {
      const price = Number(row.price_usd || 0);
      const cost = Number(row.actual_avg_ai_cost || row.ai_cost_per_unit_usd || 0);
      const margin = price - cost;
      return {
        ...row,
        actual_margin_pct: price > 0 ? +(100 * margin / price).toFixed(1) : null,
        margin_vs_target_delta: row.target_gross_margin_pct && price > 0
          ? +((100 * margin / price) - Number(row.target_gross_margin_pct)).toFixed(1) : null
      };
    });
    res.json({ offerings: data });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:sku', async (req, res) => {
  try {
    const o = await pool.query('SELECT * FROM service_offerings WHERE sku=$1', [req.params.sku]);
    if (!o.rows.length) return res.status(404).json({ error: 'Offering not found' });
    const steps = await pool.query(
      'SELECT * FROM workflow_steps WHERE offering_id=$1 ORDER BY step_order',
      [o.rows[0].id]
    );
    const bench = await pool.query(
      'SELECT * FROM ai_benchmarks WHERE offering_id=$1 ORDER BY run_date DESC LIMIT 20',
      [o.rows[0].id]
    );
    const pkgStats = await pool.query(`
      SELECT
        COUNT(*)::int AS total_packages,
        SUM(CASE WHEN status='delivered' THEN 1 ELSE 0 END)::int AS delivered,
        SUM(CASE WHEN status='running'   THEN 1 ELSE 0 END)::int AS running,
        SUM(CASE WHEN status='qc'        THEN 1 ELSE 0 END)::int AS in_qc,
        AVG(ai_cost_actual_usd)::numeric(10,4) AS avg_ai_cost,
        AVG(margin_usd)::numeric(10,2) AS avg_margin,
        AVG(client_rating)::numeric(3,1) AS avg_rating
      FROM work_packages WHERE offering_id=$1
    `, [o.rows[0].id]);
    const offering = o.rows[0];
    const totalStepCost = steps.rows.reduce((s, x) => s + Number(x.cost_per_run_usd || 0), 0);
    const totalStepMinutes = steps.rows.reduce((s, x) => s + Number(x.expected_minutes || 0), 0);
    res.json({
      offering,
      workflow_steps: steps.rows,
      benchmarks: bench.rows,
      package_stats: pkgStats.rows[0],
      computed: {
        total_pipeline_cost_usd: +totalStepCost.toFixed(4),
        total_pipeline_minutes: +totalStepMinutes.toFixed(1),
        step_count: steps.rows.length,
        ai_steps: steps.rows.filter(s => s.step_type === 'ai_inference').length,
        human_steps: steps.rows.filter(s => s.step_type === 'human_review').length,
        weakest_step_pass_rate: steps.rows.length
          ? Math.min(...steps.rows.map(s => Number(s.pass_rate_pct || 100))) : null,
        human_baseline_usd: (HUMAN_BASELINE_USD[offering.vertical]?.typical_engagement) || null
      }
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:sku/workflow', async (req, res) => {
  try {
    const o = await pool.query('SELECT id FROM service_offerings WHERE sku=$1', [req.params.sku]);
    if (!o.rows.length) return res.status(404).json({ error: 'Offering not found' });
    const r = await pool.query(
      'SELECT * FROM workflow_steps WHERE offering_id=$1 ORDER BY step_order',
      [o.rows[0].id]
    );
    res.json({ steps: r.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:sku/benchmarks', async (req, res) => {
  try {
    const o = await pool.query('SELECT id FROM service_offerings WHERE sku=$1', [req.params.sku]);
    if (!o.rows.length) return res.status(404).json({ error: 'Offering not found' });
    const r = await pool.query(
      'SELECT * FROM ai_benchmarks WHERE offering_id=$1 ORDER BY run_date DESC',
      [o.rows[0].id]
    );
    res.json({ benchmarks: r.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const {
      sku, name, vertical, description, billing_model,
      base_price_usd, unit_price_usd, success_fee_pct, sla_hours,
      human_review_required, ai_cost_per_unit_usd, target_gross_margin_pct,
      benchmark_eval, benchmark_score
    } = req.body || {};
    if (!sku || !name || !vertical) return res.status(400).json({ error: 'sku, name, vertical required' });
    const r = await pool.query(
      `INSERT INTO service_offerings
       (sku, name, vertical, description, billing_model, base_price_usd, unit_price_usd, success_fee_pct,
        sla_hours, human_review_required, ai_cost_per_unit_usd, target_gross_margin_pct,
        benchmark_eval, benchmark_score, launched_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,CURRENT_DATE) RETURNING *`,
      [sku, name, vertical, description || null, billing_model || 'flat',
       base_price_usd || 0, unit_price_usd || null, success_fee_pct || null,
       sla_hours || 72, human_review_required !== false,
       ai_cost_per_unit_usd || 0, target_gross_margin_pct || 70,
       benchmark_eval || null, benchmark_score || null]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/workflow-step', async (req, res) => {
  try {
    const { step_order, step_name, step_type, model_used,
      prompt_template, expected_minutes, cost_per_run_usd, pass_rate_pct,
      human_review_threshold, output_schema } = req.body || {};
    if (!step_name || step_order === undefined) {
      return res.status(400).json({ error: 'step_name and step_order required' });
    }
    const r = await pool.query(
      `INSERT INTO workflow_steps
       (offering_id, step_order, step_name, step_type, model_used, prompt_template,
        expected_minutes, cost_per_run_usd, pass_rate_pct, human_review_threshold, output_schema)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       ON CONFLICT (offering_id, step_order) DO UPDATE SET
         step_name = EXCLUDED.step_name, step_type = EXCLUDED.step_type,
         model_used = EXCLUDED.model_used, prompt_template = EXCLUDED.prompt_template,
         expected_minutes = EXCLUDED.expected_minutes, cost_per_run_usd = EXCLUDED.cost_per_run_usd,
         pass_rate_pct = EXCLUDED.pass_rate_pct, human_review_threshold = EXCLUDED.human_review_threshold,
         output_schema = EXCLUDED.output_schema
       RETURNING *`,
      [req.params.id, step_order, step_name, step_type || 'ai_inference', model_used || null,
       prompt_template || null, expected_minutes || null, cost_per_run_usd || null,
       pass_rate_pct || null, human_review_threshold || null, output_schema || null]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const fields = ['name','description','billing_model','base_price_usd','unit_price_usd',
      'success_fee_pct','sla_hours','human_review_required','ai_cost_per_unit_usd',
      'target_gross_margin_pct','benchmark_eval','benchmark_score','status'];
    const sets = []; const params = [];
    for (const f of fields) {
      if (req.body[f] !== undefined) { params.push(req.body[f]); sets.push(`${f}=$${params.length}`); }
    }
    if (!sets.length) return res.status(400).json({ error: 'No fields to update' });
    params.push(req.params.id);
    const r = await pool.query(`UPDATE service_offerings SET ${sets.join(',')} WHERE id=$${params.length} RETURNING *`, params);
    if (!r.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/retire', async (req, res) => {
  try {
    const r = await pool.query(
      "UPDATE service_offerings SET status='retired' WHERE id=$1 RETURNING *",
      [req.params.id]
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
