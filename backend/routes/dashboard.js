// Dashboard stats endpoint
// JWT-protected. Returns KPI counts + recent audit-log entries for the
// post-login landing page.
const express = require('express');
const router = express.Router();
const pool = require('../db');
const verifyToken = require('../middleware/auth');

router.use(verifyToken);

router.get('/stats', async (req, res) => {
  try {
    const safe = async (sql, params = [], fallback = 0) => {
      try { const r = await pool.query(sql, params); return r.rows; }
      catch (e) { return fallback === 0 ? [{ count: 0 }] : fallback; }
    };

    const [
      clientsTotal, clientsActive,
      tasksOpen, tasksScheduled,
      invoicesOverdue, invoicesUnpaid,
      staffTotal, staffAvailable,
      recent
    ] = await Promise.all([
      safe(`SELECT COUNT(*)::int AS count FROM clients`),
      safe(`SELECT COUNT(*)::int AS count FROM clients WHERE status='active'`),
      safe(`SELECT COUNT(*)::int AS count FROM tasks WHERE status IN ('pending','in_progress','open')`),
      safe(`SELECT COUNT(*)::int AS count FROM tasks WHERE due_at IS NOT NULL AND completed_at IS NULL AND due_at >= NOW()`),
      safe(`SELECT COUNT(*)::int AS count FROM invoices WHERE status NOT IN ('paid','cancelled') AND due_date IS NOT NULL AND due_date < CURRENT_DATE`),
      safe(`SELECT COUNT(*)::int AS count FROM invoices WHERE status NOT IN ('paid','cancelled')`),
      safe(`SELECT COUNT(*)::int AS count FROM staff`),
      safe(`SELECT COUNT(*)::int AS count FROM staff WHERE availability='available'`),
      (async () => {
        try {
          const r = await pool.query(
            `SELECT id, user_email, action, entity, details, created_at
             FROM audit_log ORDER BY created_at DESC LIMIT 10`
          );
          return r.rows;
        } catch (e) { return []; }
      })()
    ]);

    res.json({
      kpis: {
        clients: { total: clientsTotal[0]?.count ?? 0, active: clientsActive[0]?.count ?? 0 },
        open_tasks: { total: tasksOpen[0]?.count ?? 0 },
        scheduled_jobs: { total: tasksScheduled[0]?.count ?? 0 },
        overdue_invoices: { total: invoicesOverdue[0]?.count ?? 0, unpaid: invoicesUnpaid[0]?.count ?? 0 },
        technicians: { total: staffTotal[0]?.count ?? 0, available: staffAvailable[0]?.count ?? 0 }
      },
      recent_activity: recent || []
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
