const express = require('express');
const router = express.Router();
const pool = require('../db');
const verifyToken = require("../middleware/auth");
router.use(verifyToken);
router.get('/', async (req, res) => {
  try {
    const r = await pool.query(`SELECT t.*, c.name as client_name, c.company, c.tier FROM tasks t LEFT JOIN clients c ON t.client_id = c.id ORDER BY t.created_at DESC`);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.get('/:id', async (req, res) => {
  try {
    const r = await pool.query(`SELECT t.*, c.name as client_name, c.company, c.tier FROM tasks t LEFT JOIN clients c ON t.client_id = c.id WHERE t.id=$1`, [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.post('/', async (req, res) => {
  try {
    const { client_id, service_type, description, priority, status, assigned_to, due_at, completed_at, result_summary, amount_usd } = req.body;
    const r = await pool.query('INSERT INTO tasks (client_id,service_type,description,priority,status,assigned_to,due_at,completed_at,result_summary,amount_usd) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *', [client_id, service_type, description, priority || 'medium', status || 'pending', assigned_to, due_at, completed_at, result_summary, amount_usd]);
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.put('/:id', async (req, res) => {
  try {
    const { client_id, service_type, description, priority, status, assigned_to, due_at, completed_at, result_summary, amount_usd } = req.body;
    const r = await pool.query('UPDATE tasks SET client_id=$1,service_type=$2,description=$3,priority=$4,status=$5,assigned_to=$6,due_at=$7,completed_at=$8,result_summary=$9,amount_usd=$10 WHERE id=$11 RETURNING *', [client_id, service_type, description, priority, status, assigned_to, due_at, completed_at, result_summary, amount_usd, req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.delete('/:id', async (req, res) => {
  try { await pool.query('DELETE FROM tasks WHERE id=$1', [req.params.id]); res.json({ success: true }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
module.exports = router;
