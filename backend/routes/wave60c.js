"use strict";
const express = require("express");
const pool = require("../db");
const verifyToken = require("../middleware/auth");
const { analyzeFallback, fallbackKinds, filterRecords, toCSV } = require("../wave60cCore.cjs");

const router = express.Router();
router.use(verifyToken);

async function loadTasks() {
  return (await pool.query("SELECT t.*, c.name AS client_name FROM tasks t LEFT JOIN clients c ON t.client_id = c.id ORDER BY t.created_at DESC LIMIT 500")).rows;
}
router.get("/tasks", async (req, res, next) => {
  try {
    const items = filterRecords(await loadTasks(), { q: req.query.q, status: req.query.status });
    res.json({ items, count: items.length });
  } catch (e) { next(e); }
});
router.get("/tasks/export", async (req, res, next) => {
  try {
    const items = filterRecords(await loadTasks(), { q: req.query.q, status: req.query.status });
    if (String(req.query.format || "csv").toLowerCase() === "json") return res.json({ items, count: items.length });
    res.type("text/csv").set("Content-Disposition", "attachment; filename=tasks.csv").send(toCSV(items));
  } catch (e) { next(e); }
});
router.post("/ai/fallback/:kind", (req, res) => {
  const result = analyzeFallback(req.params.kind, req.body?.records ?? req.body?.record ?? []);
  if (!result) return res.status(404).json({ error: "Unknown fallback analysis", kinds: fallbackKinds });
  res.json({ result });
});
module.exports = router;
