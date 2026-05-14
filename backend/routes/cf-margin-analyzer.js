// Per-Task Margin Analyzer
//
// Computes real unit economics for AI-native service delivery:
//   - Cost of AI inference (per-model token billing)
//   - Cost of human review time
//   - Tool / external API costs
//   - Margin vs price charged
//   - Margin trend, outlier packages, model-mix breakdown
//
// Endpoints:
//   GET   /api/cf-margin-analyzer/summary                — overall + per-vertical
//   GET   /api/cf-margin-analyzer/by-offering            — per-offering economics
//   GET   /api/cf-margin-analyzer/package/:id            — full ledger for a package
//   GET   /api/cf-margin-analyzer/outliers               — high-cost / low-margin packages
//   GET   /api/cf-margin-analyzer/model-mix              — cost by model
//   GET   /api/cf-margin-analyzer/trend                  — weekly trend
//   POST  /api/cf-margin-analyzer/package/:id/event      — manually record cost
//   GET   /api/cf-margin-analyzer/forecast               — project end-of-quarter margin

const express = require('express');
const router = express.Router();
const verifyToken = require("../middleware/auth");
const pool = require('../db');

router.use(verifyToken);

const MODEL_PRICING_USD_PER_MTOK = {
  'claude-opus-4':     { input: 15.0, output: 75.0 },
  'claude-sonnet-4.5': { input: 3.0,  output: 15.0 },
  'claude-haiku-4.5':  { input: 0.80, output: 4.0 },
  'gpt-5':             { input: 10.0, output: 30.0 },
  'gpt-5-mini':        { input: 0.50, output: 1.50 }
};

router.get('/summary', async (_req, res) => {
  try {
    const totals = await pool.query(`
      SELECT
        COUNT(*)::int AS packages_total,
        SUM(CASE WHEN status='delivered' THEN 1 ELSE 0 END)::int AS delivered,
        SUM(price_charged_usd)::numeric(12,2) AS revenue_total,
        SUM(ai_cost_actual_usd)::numeric(12,2) AS ai_cost_total,
        SUM(margin_usd)::numeric(12,2) AS margin_total,
        AVG(margin_usd)::numeric(10,2) AS avg_margin_per_pkg,
        AVG(client_rating)::numeric(3,1) AS avg_rating
      FROM work_packages
    `);
    const byVertical = await pool.query(`
      SELECT o.vertical,
             COUNT(wp.id)::int AS packages,
             SUM(wp.price_charged_usd)::numeric(12,2) AS revenue,
             SUM(wp.ai_cost_actual_usd)::numeric(12,2) AS ai_cost,
             SUM(wp.margin_usd)::numeric(12,2) AS margin,
             AVG(wp.client_rating)::numeric(3,1) AS rating
      FROM work_packages wp
      JOIN service_offerings o ON o.id = wp.offering_id
      WHERE wp.status='delivered'
      GROUP BY o.vertical
      ORDER BY margin DESC
    `);
    const t = totals.rows[0];
    res.json({
      totals: {
        ...t,
        gross_margin_pct: t.revenue_total > 0
          ? +(100 * Number(t.margin_total) / Number(t.revenue_total)).toFixed(1) : null
      },
      by_vertical: byVertical.rows.map(v => ({
        ...v,
        margin_pct: v.revenue > 0
          ? +(100 * Number(v.margin) / Number(v.revenue)).toFixed(1) : null
      }))
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/by-offering', async (_req, res) => {
  try {
    const r = await pool.query(`
      SELECT o.id, o.sku, o.name, o.vertical,
             (o.base_price_usd + COALESCE(o.unit_price_usd,0))::numeric(10,2) AS price_usd,
             o.target_gross_margin_pct,
             COUNT(wp.id)::int AS deliveries,
             AVG(wp.ai_cost_actual_usd)::numeric(10,4) AS avg_ai_cost,
             AVG(wp.human_minutes_used)::numeric(10,2) AS avg_human_min,
             AVG(wp.margin_usd)::numeric(10,2) AS avg_margin,
             SUM(wp.margin_usd)::numeric(12,2) AS total_margin,
             AVG(wp.client_rating)::numeric(3,1) AS avg_rating
      FROM service_offerings o
      LEFT JOIN work_packages wp ON wp.offering_id = o.id AND wp.status='delivered'
      GROUP BY o.id
      ORDER BY total_margin DESC NULLS LAST
    `);
    const out = r.rows.map(row => {
      const price = Number(row.price_usd || 0);
      const cost = Number(row.avg_ai_cost || 0) + Number(row.avg_human_min || 0) * 1.0;
      const actualPct = price > 0 ? (100 * (price - cost) / price) : null;
      const targetPct = row.target_gross_margin_pct !== null ? Number(row.target_gross_margin_pct) : null;
      return {
        ...row,
        actual_margin_pct: actualPct !== null ? +actualPct.toFixed(1) : null,
        margin_health: actualPct === null ? 'no_data'
          : (targetPct !== null && actualPct >= targetPct) ? 'on_target'
          : (targetPct !== null && actualPct >= targetPct - 5) ? 'near_target'
          : 'below_target'
      };
    });
    res.json({ offerings: out });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/package/:id', async (req, res) => {
  try {
    const wp = await pool.query(`
      SELECT wp.*, o.name AS offering_name, o.vertical, o.target_gross_margin_pct,
             c.company AS client_company
      FROM work_packages wp
      LEFT JOIN service_offerings o ON o.id = wp.offering_id
      LEFT JOIN clients c ON c.id = wp.client_id
      WHERE wp.id=$1
    `, [req.params.id]);
    if (!wp.rows[0]) return res.status(404).json({ error: 'Not found' });
    const events = await pool.query(
      'SELECT * FROM margin_events WHERE package_id=$1 ORDER BY occurred_at',
      [req.params.id]
    );
    // Aggregate by event_type and model
    const byType = {}; const byModel = {};
    events.rows.forEach(e => {
      const c = Number(e.cost_usd || 0);
      byType[e.event_type] = (byType[e.event_type] || 0) + c;
      if (e.model) byModel[e.model] = (byModel[e.model] || 0) + c;
    });
    const totalCost = Object.values(byType).reduce((s, x) => s + x, 0);
    const price = Number(wp.rows[0].price_charged_usd || 0);
    res.json({
      package: wp.rows[0],
      ledger: events.rows,
      breakdown_by_type: Object.entries(byType).map(([k, v]) => ({ type: k, cost_usd: +v.toFixed(4) })),
      breakdown_by_model: Object.entries(byModel).map(([k, v]) => ({ model: k, cost_usd: +v.toFixed(4) })),
      totals: {
        total_cost_usd: +totalCost.toFixed(4),
        price_charged_usd: price,
        margin_usd: +(price - totalCost).toFixed(4),
        margin_pct: price > 0 ? +(100 * (price - totalCost) / price).toFixed(1) : null,
        target_pct: wp.rows[0].target_gross_margin_pct ? Number(wp.rows[0].target_gross_margin_pct) : null
      }
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/outliers', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '20'), 100);
    const r = await pool.query(`
      SELECT wp.id, wp.case_ref, wp.status, wp.price_charged_usd, wp.ai_cost_actual_usd,
             wp.human_minutes_used, wp.margin_usd,
             o.name AS offering_name, o.target_gross_margin_pct,
             c.company AS client_company
      FROM work_packages wp
      LEFT JOIN service_offerings o ON o.id = wp.offering_id
      LEFT JOIN clients c ON c.id = wp.client_id
      WHERE wp.status='delivered' AND wp.price_charged_usd > 0
      ORDER BY (wp.margin_usd / NULLIF(wp.price_charged_usd,0)) ASC NULLS LAST
      LIMIT $1
    `, [limit]);
    const out = r.rows.map(row => {
      const margin_pct = row.price_charged_usd > 0
        ? 100 * Number(row.margin_usd) / Number(row.price_charged_usd) : null;
      const target = row.target_gross_margin_pct ? Number(row.target_gross_margin_pct) : null;
      return {
        ...row,
        margin_pct: margin_pct !== null ? +margin_pct.toFixed(1) : null,
        target_pct: target,
        delta_pct: (margin_pct !== null && target !== null) ? +(margin_pct - target).toFixed(1) : null
      };
    });
    res.json({ outliers: out });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/model-mix', async (_req, res) => {
  try {
    const r = await pool.query(`
      SELECT model,
             COUNT(*)::int AS calls,
             SUM(cost_usd)::numeric(12,4) AS total_cost,
             SUM(tokens_in)::bigint AS tokens_in,
             SUM(tokens_out)::bigint AS tokens_out
      FROM margin_events WHERE model IS NOT NULL
      GROUP BY model ORDER BY total_cost DESC NULLS LAST
    `);
    const totalCost = r.rows.reduce((s, x) => s + Number(x.total_cost || 0), 0);
    const enriched = r.rows.map(row => {
      const p = MODEL_PRICING_USD_PER_MTOK[row.model];
      return {
        ...row,
        share_pct: totalCost > 0 ? +(100 * Number(row.total_cost) / totalCost).toFixed(1) : 0,
        input_price_per_mtok: p?.input || null,
        output_price_per_mtok: p?.output || null
      };
    });
    res.json({ model_mix: enriched, total_cost_usd: +totalCost.toFixed(2) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/trend', async (_req, res) => {
  try {
    const r = await pool.query(`
      SELECT
        DATE_TRUNC('week', delivered_at) AS week,
        COUNT(*)::int AS deliveries,
        SUM(price_charged_usd)::numeric(12,2) AS revenue,
        SUM(ai_cost_actual_usd)::numeric(12,2) AS ai_cost,
        SUM(margin_usd)::numeric(12,2) AS margin
      FROM work_packages
      WHERE status='delivered' AND delivered_at IS NOT NULL
      GROUP BY 1
      ORDER BY 1
    `);
    res.json({ weeks: r.rows.map(w => ({
      ...w,
      margin_pct: w.revenue > 0 ? +(100 * Number(w.margin) / Number(w.revenue)).toFixed(1) : null
    })) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/package/:id/event', async (req, res) => {
  try {
    const { event_type, description, cost_usd, tokens_in, tokens_out, model } = req.body || {};
    if (!event_type) return res.status(400).json({ error: 'event_type required' });
    let cost = cost_usd;
    if (cost === undefined && model && (tokens_in || tokens_out)) {
      const p = MODEL_PRICING_USD_PER_MTOK[model];
      if (p) cost = +(((Number(tokens_in||0) * p.input) + (Number(tokens_out||0) * p.output)) / 1_000_000).toFixed(4);
    }
    const r = await pool.query(
      `INSERT INTO margin_events (package_id, event_type, description, cost_usd, tokens_in, tokens_out, model)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [req.params.id, event_type, description || null, cost || 0, tokens_in || null, tokens_out || null, model || null]
    );
    // Roll-up to work_packages.ai_cost_actual_usd
    await pool.query(`
      UPDATE work_packages SET ai_cost_actual_usd = (
        SELECT COALESCE(SUM(cost_usd),0) FROM margin_events WHERE package_id=$1
      ) WHERE id=$1
    `, [req.params.id]);
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/forecast', async (_req, res) => {
  try {
    // Q-to-date and projection (linear extrapolation of weekly margin).
    const q = await pool.query(`
      SELECT
        SUM(price_charged_usd)::numeric(12,2) AS revenue,
        SUM(margin_usd)::numeric(12,2) AS margin,
        COUNT(*)::int AS deliveries
      FROM work_packages
      WHERE status='delivered'
        AND delivered_at >= DATE_TRUNC('quarter', CURRENT_DATE)
    `);
    const wkly = await pool.query(`
      SELECT AVG(weekly_margin)::numeric(12,2) AS avg_weekly_margin
      FROM (
        SELECT DATE_TRUNC('week', delivered_at) AS wk, SUM(margin_usd) AS weekly_margin
        FROM work_packages WHERE status='delivered'
        GROUP BY 1
      ) sub
    `);
    const now = new Date();
    const qEnd = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 + 3, 0);
    const weeksLeft = Math.max(1, Math.ceil((qEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 7)));
    res.json({
      qtd: q.rows[0],
      weekly_avg_margin: wkly.rows[0]?.avg_weekly_margin || 0,
      weeks_remaining_in_quarter: weeksLeft,
      projected_quarter_end_margin:
        Number(q.rows[0]?.margin || 0) + weeksLeft * Number(wkly.rows[0]?.avg_weekly_margin || 0)
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
