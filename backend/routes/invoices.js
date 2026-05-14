const express = require('express');
const router = express.Router();
const pool = require('../db');
const verifyToken = require('../middleware/auth');
router.use(verifyToken);
router.get('/', async (req, res) => {
  try {
    const r = await pool.query(`SELECT i.*, c.name as client_name, t.service_type FROM invoices i LEFT JOIN clients c ON i.client_id = c.id LEFT JOIN tasks t ON i.task_id = t.id ORDER BY i.issued_date DESC NULLS LAST`);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.get('/:id', async (req, res) => {
  try {
    const r = await pool.query(`SELECT i.*, c.name as client_name FROM invoices i LEFT JOIN clients c ON i.client_id = c.id WHERE i.id=$1`, [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.post('/', async (req, res) => {
  try {
    const { client_id, task_id, amount_usd, status, issued_date, due_date, paid_date, notes } = req.body;
    const r = await pool.query('INSERT INTO invoices (client_id,task_id,amount_usd,status,issued_date,due_date,paid_date,notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *', [client_id, task_id, amount_usd, status || 'draft', issued_date, due_date, paid_date, notes]);
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.put('/:id', async (req, res) => {
  try {
    const { client_id, task_id, amount_usd, status, issued_date, due_date, paid_date, notes } = req.body;
    const r = await pool.query('UPDATE invoices SET client_id=$1,task_id=$2,amount_usd=$3,status=$4,issued_date=$5,due_date=$6,paid_date=$7,notes=$8 WHERE id=$9 RETURNING *', [client_id, task_id, amount_usd, status, issued_date, due_date, paid_date, notes, req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.delete('/:id', async (req, res) => {
  try { await pool.query('DELETE FROM invoices WHERE id=$1', [req.params.id]); res.json({ success: true }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
module.exports = router;
