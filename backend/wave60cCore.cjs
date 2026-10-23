"use strict";
// Wave 60C pure helpers — deterministic offline fallbacks, no provider calls.
function showValue(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return String(value);
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
function filterRecords(rows, { q = "", status = "" } = {}) {
  const needle = String(q || "").trim().toLowerCase();
  return (Array.isArray(rows) ? rows : []).filter((row) => {
    if (status && String(row?.status ?? "") !== status) return false;
    if (!needle) return true;
    return Object.values(row || {}).some((v) => showValue(v).toLowerCase().includes(needle));
  });
}
function toCSV(rows) {
  const list = Array.isArray(rows) ? rows : [];
  const keys = [];
  for (const row of list) for (const key of Object.keys(row || {})) if (!keys.includes(key)) keys.push(key);
  const cell = (v) => { const s = showValue(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  return [keys.join(","), ...list.map((row) => keys.map((k) => cell(row?.[k])).join(","))].join("\n") + "\n";
}
function fallbackEnvelope(kind, sections, extra = {}) {
  return { aiGenerated: false, source: "deterministic-fallback", label: "Deterministic offline fallback — not AI-generated", kind, sections, ...extra };
}
function num(value) { const n = Number(value); return Number.isFinite(n) ? n : 0; }
function parseTaskInput(body = {}) {
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) return { error: "title is required" };
  const status = ["OPEN", "DONE", "CANCELLED"].includes(body.status) ? body.status : "OPEN";
  const priority = ["LOW", "HIGH"].includes(body.priority) ? body.priority : "NORMAL";
  return { title: title.slice(0, 200), description: typeof body.description === "string" ? body.description.slice(0, 2000) : null, status, priority };
}
function analyze_sla_risk_scan(rows) {
  const open = rows.filter((r) => !["DONE", "Closed", "completed"].includes(String(r?.status ?? ""))).length;
  const total = rows.reduce((s, r) => s + num(r?.amount_usd ?? r?.amount), 0);
  return fallbackEnvelope("sla-risk-scan", [
    { title: "SLA risk scan — scope", detail: `${rows.length} record(s) reviewed; ${open} still open. Recorded total $${total} (zero amounts are preserved, not hidden).` },
    { title: "SLA risk scan — finding", detail: `${open} task(s) remain open; prioritise overdue or high-priority client work against SLA targets.` },
    { title: "SLA risk scan — next step", detail: "Assign an accountable owner, attach source evidence, and re-run this check after updating the record." },
  ], { recordsReviewed: rows.length, openCount: open, totalAmount: total });
}
function analyze_margin_outlier_scan(rows) {
  const open = rows.filter((r) => !["DONE", "Closed", "completed"].includes(String(r?.status ?? ""))).length;
  const total = rows.reduce((s, r) => s + num(r?.amount_usd ?? r?.amount), 0);
  return fallbackEnvelope("margin-outlier-scan", [
    { title: "Margin outlier scan — scope", detail: `${rows.length} record(s) reviewed; ${open} still open. Recorded total $${total} (zero amounts are preserved, not hidden).` },
    { title: "Margin outlier scan — finding", detail: `Task value totals $${total} across ${rows.length} record(s); review zero-amount or outlier tasks for margin leakage.` },
    { title: "Margin outlier scan — next step", detail: "Assign an accountable owner, attach source evidence, and re-run this check after updating the record." },
  ], { recordsReviewed: rows.length, openCount: open, totalAmount: total });
}
function analyze_capacity_summary(rows) {
  const open = rows.filter((r) => !["DONE", "Closed", "completed"].includes(String(r?.status ?? ""))).length;
  const total = rows.reduce((s, r) => s + num(r?.amount_usd ?? r?.amount), 0);
  return fallbackEnvelope("capacity-summary", [
    { title: "Capacity summary — scope", detail: `${rows.length} record(s) reviewed; ${open} still open. Recorded total $${total} (zero amounts are preserved, not hidden).` },
    { title: "Capacity summary — finding", detail: `${open} open task(s) drive near-term capacity; rebalance assignees before accepting new retainers.` },
    { title: "Capacity summary — next step", detail: "Assign an accountable owner, attach source evidence, and re-run this check after updating the record." },
  ], { recordsReviewed: rows.length, openCount: open, totalAmount: total });
}
const ANALYZERS = { "sla-risk-scan": analyze_sla_risk_scan, "margin-outlier-scan": analyze_margin_outlier_scan, "capacity-summary": analyze_capacity_summary };
const fallbackKinds = ["sla-risk-scan", "margin-outlier-scan", "capacity-summary"];
function analyzeFallback(kind, records) {
  const fn = ANALYZERS[kind];
  return fn ? fn(Array.isArray(records) ? records : records ? [records] : []) : null;
}
module.exports = { showValue, filterRecords, toCSV, fallbackEnvelope, parseTaskInput, analyzeFallback, fallbackKinds };
