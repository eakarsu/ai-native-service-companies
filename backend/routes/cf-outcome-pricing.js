// Outcome-Based Pricing & QC Queue
//
// The core differentiator of AI-native services: pricing tied to *verified*
// deliverable quality. This route:
//   - Manages the QC queue (human reviewers grade AI deliverables)
//   - Computes outcome-based payouts (full / partial / refund based on QC)
//   - Tracks AI-vs-human agreement rate (eval the eval)
//   - Provides outcome-based pricing recommendations for new SKUs
//
// Endpoints:
//   GET   /api/cf-outcome-pricing/queue                    — QC queue (filterable)
//   GET   /api/cf-outcome-pricing/queue/:id                — single review with deliverable context
//   POST  /api/cf-outcome-pricing/queue/:id/claim          — reviewer claims a review
//   POST  /api/cf-outcome-pricing/queue/:id/submit         — submit review verdict
//   GET   /api/cf-outcome-pricing/agreement-rate           — AI-human agreement metrics
//   GET   /api/cf-outcome-pricing/sla-snapshot             — QC SLA performance
//   POST  /api/cf-outcome-pricing/payout-calc              — compute outcome-based payout
//   GET   /api/cf-outcome-pricing/recommend-pricing        — pricing recommendations
//   POST  /api/cf-outcome-pricing/dispute                  — file a client dispute against a delivery

const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const pool = require('../db');

router.use(verifyToken);

// Payout policy by quality grade — outcome-based pricing curve.
const PAYOUT_BY_GRADE = {
  A: { payout_pct: 100, customer_satisfaction_floor: 4.5 },
  B: { payout_pct:  90, customer_satisfaction_floor: 4.0 },
  C: { payout_pct:  60, customer_satisfaction_floor: 3.0 },
  D: { payout_pct:  25, customer_satisfaction_floor: 0.0 },
  F: { payout_pct:   0, customer_satisfaction_floor: 0.0 }
};

router.get('/queue', async (req, res) => {
  try {
    const { status, priority, reviewer } = req.query;
    const params = []; const where = [];
    if (status)   { params.push(status);   where.push(`q.status = $${params.length}`); }
    if (priority) { params.push(priority); where.push(`q.priority = $${params.length}`); }
    if (reviewer) { params.push(reviewer); where.push(`q.reviewer_email = $${params.length}`); }
    const sql = `
      SELECT q.*,
             d.filename, d.doc_type, d.quality_grade, d.ai_confidence, d.pages,
             wp.case_ref, wp.price_charged_usd,
             o.name AS offering_name, o.vertical,
             c.company AS client_company
      FROM qc_reviews q
      JOIN deliverables d ON d.id = q.deliverable_id
      JOIN work_packages wp ON wp.id = d.package_id
      LEFT JOIN service_offerings o ON o.id = wp.offering_id
      LEFT JOIN clients c ON c.id = wp.client_id
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY
        CASE q.priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'normal' THEN 3 ELSE 4 END,
        q.queued_at ASC
    `;
    const r = await pool.query(sql, params);
    const queue = r.rows.map(row => ({
      ...row,
      hours_in_queue: row.queued_at
        ? +((Date.now() - new Date(row.queued_at).getTime()) / 3_600_000).toFixed(1) : null
    }));
    res.json({ queue, depth: queue.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/queue/:id', async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT q.*,
             d.filename, d.doc_type, d.content_summary, d.ai_confidence, d.quality_grade,
             d.citations_count, d.hallucination_flag, d.pages,
             wp.case_ref, wp.price_charged_usd, wp.intake_summary,
             o.name AS offering_name, o.vertical, o.benchmark_eval, o.benchmark_score,
             c.company AS client_company, c.name AS client_name
      FROM qc_reviews q
      JOIN deliverables d ON d.id = q.deliverable_id
      JOIN work_packages wp ON wp.id = d.package_id
      LEFT JOIN service_offerings o ON o.id = wp.offering_id
      LEFT JOIN clients c ON c.id = wp.client_id
      WHERE q.id=$1
    `, [req.params.id]);
    if (!r.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/queue/:id/claim', async (req, res) => {
  try {
    const { reviewer_email } = req.body || {};
    if (!reviewer_email) return res.status(400).json({ error: 'reviewer_email required' });
    const r = await pool.query(
      "UPDATE qc_reviews SET reviewer_email=$1, status='in_review' WHERE id=$2 AND status='queued' RETURNING *",
      [reviewer_email, req.params.id]
    );
    if (!r.rows[0]) return res.status(409).json({ error: 'Already claimed or not queued' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/queue/:id/submit', async (req, res) => {
  try {
    const { human_score, issues_found, notes, minutes_spent, verdict } = req.body || {};
    // verdict: approved | rejected | revision_needed
    if (!verdict) return res.status(400).json({ error: 'verdict required' });
    const cur = await pool.query('SELECT * FROM qc_reviews WHERE id=$1', [req.params.id]);
    if (!cur.rows[0]) return res.status(404).json({ error: 'Not found' });
    const aiScore = Number(cur.rows[0].ai_score || 0);
    const hScore = Number(human_score || 0);
    const agreement = Math.abs(aiScore - hScore) <= 5; // within 5 points = agreement
    const r = await pool.query(
      `UPDATE qc_reviews
       SET human_score=$1, issues_found=$2, notes=$3, minutes_spent=$4,
           status=$5, agreement=$6, completed_at=NOW()
       WHERE id=$7 RETURNING *`,
      [hScore, issues_found || 0, notes || null, minutes_spent || null,
       verdict, agreement, req.params.id]
    );
    // If revision_needed, re-queue the deliverable
    if (verdict === 'revision_needed') {
      await pool.query(
        `UPDATE work_packages wp SET status='running', current_step=GREATEST(current_step-1,0)
         FROM deliverables d WHERE d.id=$1 AND wp.id=d.package_id`,
        [cur.rows[0].deliverable_id]
      );
    }
    // If approved, update deliverable
    if (verdict === 'approved') {
      await pool.query(
        `UPDATE deliverables SET approved_by=$1, approved_at=NOW() WHERE id=$2`,
        [cur.rows[0].reviewer_email, cur.rows[0].deliverable_id]
      );
    }
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/agreement-rate', async (_req, res) => {
  try {
    const r = await pool.query(`
      SELECT o.vertical,
             COUNT(q.*) FILTER (WHERE q.status IN ('approved','rejected','revision_needed') AND q.agreement IS NOT NULL)::int AS reviews,
             SUM(CASE WHEN q.agreement THEN 1 ELSE 0 END)::int AS agreements,
             AVG(q.ai_score)::numeric(5,2) AS avg_ai_score,
             AVG(q.human_score)::numeric(5,2) AS avg_human_score,
             AVG(ABS(q.ai_score - q.human_score))::numeric(5,2) AS avg_delta
      FROM qc_reviews q
      JOIN deliverables d ON d.id = q.deliverable_id
      JOIN work_packages wp ON wp.id = d.package_id
      JOIN service_offerings o ON o.id = wp.offering_id
      WHERE q.completed_at IS NOT NULL
      GROUP BY o.vertical
      ORDER BY o.vertical
    `);
    res.json({ by_vertical: r.rows.map(row => ({
      ...row,
      agreement_rate_pct: row.reviews > 0
        ? +(100 * Number(row.agreements) / Number(row.reviews)).toFixed(1) : null
    })) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/sla-snapshot', async (_req, res) => {
  try {
    // QC SLA: queued reviews aging out.
    const SLA_HOURS = { urgent: 2, high: 8, normal: 24, low: 72 };
    const r = await pool.query(`
      SELECT priority, status, queued_at, completed_at,
             EXTRACT(EPOCH FROM (COALESCE(completed_at, NOW()) - queued_at))/3600 AS hours_in_queue
      FROM qc_reviews
    `);
    const bucket = { urgent: { count: 0, breached: 0 }, high: { count: 0, breached: 0 },
                     normal: { count: 0, breached: 0 }, low: { count: 0, breached: 0 } };
    r.rows.forEach(row => {
      const b = bucket[row.priority]; if (!b) return;
      b.count++;
      if (Number(row.hours_in_queue) > SLA_HOURS[row.priority]) b.breached++;
    });
    res.json({
      sla_targets_hours: SLA_HOURS,
      buckets: bucket,
      total_reviews: r.rows.length,
      total_breached: Object.values(bucket).reduce((s, b) => s + b.breached, 0)
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/payout-calc', async (req, res) => {
  try {
    const { package_id, override_grade } = req.body || {};
    if (!package_id) return res.status(400).json({ error: 'package_id required' });
    const wp = await pool.query(`
      SELECT wp.*, o.target_gross_margin_pct, o.success_fee_pct
      FROM work_packages wp
      JOIN service_offerings o ON o.id = wp.offering_id
      WHERE wp.id=$1
    `, [package_id]);
    if (!wp.rows[0]) return res.status(404).json({ error: 'Package not found' });
    const dels = await pool.query('SELECT quality_grade, ai_confidence FROM deliverables WHERE package_id=$1', [package_id]);
    if (!dels.rows.length) return res.status(400).json({ error: 'No deliverables on package' });
    // Worst-grade dominates.
    const order = ['F','D','C','B','A'];
    let worst = 'A';
    for (const d of dels.rows) {
      if (order.indexOf(d.quality_grade) < order.indexOf(worst)) worst = d.quality_grade;
    }
    const grade = override_grade || worst;
    const policy = PAYOUT_BY_GRADE[grade] || PAYOUT_BY_GRADE.F;
    const price = Number(wp.rows[0].price_charged_usd || 0);
    const payout = +(price * policy.payout_pct / 100).toFixed(2);
    const refund = +(price - payout).toFixed(2);
    res.json({
      package_id, grade_used: grade, worst_grade: worst,
      price_usd: price,
      payout_pct: policy.payout_pct,
      payout_usd: payout,
      refund_usd: refund,
      customer_satisfaction_floor: policy.customer_satisfaction_floor,
      deliverables_count: dels.rows.length
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/recommend-pricing', async (req, res) => {
  try {
    const vertical = String(req.query.vertical || '').trim();
    if (!vertical) return res.status(400).json({ error: 'vertical query param required' });
    const HUMAN_BASELINE = {
      legal: 8500, tax: 6500, audit: 28000, compliance: 15000, recruiting: 25000, consulting: 65000
    };
    const baseline = HUMAN_BASELINE[vertical] || 0;
    const stats = await pool.query(`
      SELECT AVG(wp.ai_cost_actual_usd)::numeric(10,2) AS avg_ai_cost,
             AVG(wp.human_minutes_used)::numeric(10,2) AS avg_human_min,
             AVG(wp.client_rating)::numeric(3,1) AS avg_rating,
             COUNT(*)::int AS sample_size
      FROM work_packages wp
      JOIN service_offerings o ON o.id = wp.offering_id
      WHERE o.vertical=$1 AND wp.status='delivered'
    `, [vertical]);
    const aiCost = Number(stats.rows[0]?.avg_ai_cost || 0);
    const humanCost = Number(stats.rows[0]?.avg_human_min || 0) * 1.0;
    const totalCost = aiCost + humanCost;
    // 3-tier pricing recommendation
    const tiers = {
      aggressive: { price: +(totalCost * 3).toFixed(2),  margin_pct: 66.7, vs_human_baseline_pct: baseline > 0 ? +(100 * (totalCost*3) / baseline).toFixed(1) : null },
      balanced:   { price: +(totalCost * 5).toFixed(2),  margin_pct: 80.0, vs_human_baseline_pct: baseline > 0 ? +(100 * (totalCost*5) / baseline).toFixed(1) : null },
      premium:    { price: +(totalCost * 10).toFixed(2), margin_pct: 90.0, vs_human_baseline_pct: baseline > 0 ? +(100 * (totalCost*10) / baseline).toFixed(1) : null }
    };
    res.json({
      vertical,
      avg_ai_cost_usd: aiCost,
      avg_human_review_cost_usd: humanCost,
      total_cost_basis_usd: +totalCost.toFixed(2),
      human_baseline_usd: baseline,
      recommended_tiers: tiers,
      sample_size: stats.rows[0]?.sample_size || 0
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/dispute', async (req, res) => {
  try {
    const { deliverable_id, reason, requested_action } = req.body || {};
    if (!deliverable_id || !reason) return res.status(400).json({ error: 'deliverable_id and reason required' });
    const r = await pool.query(
      `INSERT INTO qc_reviews (deliverable_id, review_type, priority, status, notes)
       VALUES ($1,'client_dispute','urgent','queued',$2) RETURNING *`,
      [deliverable_id, `Client dispute: ${reason}. Requested: ${requested_action || 'review'}`]
    );
    await pool.query(`
      UPDATE work_packages wp SET status='escalated'
      FROM deliverables d WHERE d.id=$1 AND wp.id=d.package_id
    `, [deliverable_id]);
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
