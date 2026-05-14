const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken } = require('../middleware/auth');
router.use(verifyToken);
router.get('/', async (req, res) => {
  try {
    const r = await pool.query(`SELECT s.*, c.name as client_name, c.tier FROM slas s LEFT JOIN clients c ON s.client_id = c.id ORDER BY s.current_status`);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.get('/:id', async (req, res) => {
  try {
    const r = await pool.query(`SELECT s.*, c.name as client_name FROM slas s LEFT JOIN clients c ON s.client_id = c.id WHERE s.id=$1`, [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.post('/', async (req, res) => {
  try {
    const { client_id, service_type, max_hours, penalty_per_hour_usd, current_status, breach_count, last_reviewed } = req.body;
    const r = await pool.query('INSERT INTO slas (client_id,service_type,max_hours,penalty_per_hour_usd,current_status,breach_count,last_reviewed) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *', [client_id, service_type, max_hours, penalty_per_hour_usd, current_status || 'compliant', breach_count || 0, last_reviewed]);
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.put('/:id', async (req, res) => {
  try {
    const { client_id, service_type, max_hours, penalty_per_hour_usd, current_status, breach_count, last_reviewed } = req.body;
    const r = await pool.query('UPDATE slas SET client_id=$1,service_type=$2,max_hours=$3,penalty_per_hour_usd=$4,current_status=$5,breach_count=$6,last_reviewed=$7 WHERE id=$8 RETURNING *', [client_id, service_type, max_hours, penalty_per_hour_usd, current_status, breach_count, last_reviewed, req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.delete('/:id', async (req, res) => {
  try { await pool.query('DELETE FROM slas WHERE id=$1', [req.params.id]); res.json({ success: true }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
module.exports = router;
