const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');

// AI-native service business ops - Custom Views
// Four endpoints:
//  1. /ticket-volume        (VIZ)     - support ticket volume timeline
//  2. /agent-heatmap        (VIZ)     - agent performance heatmap (day x hour)
//  3. /sla-report-pdf       (NON-VIZ) - SLA compliance report document
//  4. /service-workflows    (NON-VIZ) - service workflow editor (CRUD steps)

// In-memory store for workflows so CRUD persists during a session.
const workflowStore = {
  workflows: [
    {
      id: 'wf-onboarding',
      name: 'Customer Onboarding',
      description: 'Standard onboarding workflow for new managed-service customers.',
      steps: [
        { id: 1, title: 'Welcome Call', owner: 'Account Manager', durationHours: 1, automated: false },
        { id: 2, title: 'Provision Workspace', owner: 'Ops Bot', durationHours: 0.5, automated: true },
        { id: 3, title: 'Kickoff Workshop', owner: 'Service Lead', durationHours: 2, automated: false },
        { id: 4, title: 'Send Welcome Kit', owner: 'Ops Bot', durationHours: 0.25, automated: true },
      ],
    },
    {
      id: 'wf-incident',
      name: 'Incident Response',
      description: 'Severity-1 incident triage and resolution playbook.',
      steps: [
        { id: 1, title: 'Detect & Page', owner: 'Monitoring Agent', durationHours: 0.1, automated: true },
        { id: 2, title: 'Acknowledge', owner: 'On-Call Engineer', durationHours: 0.15, automated: false },
        { id: 3, title: 'Diagnose', owner: 'On-Call Engineer', durationHours: 1, automated: false },
        { id: 4, title: 'Remediate', owner: 'On-Call Engineer', durationHours: 2, automated: false },
        { id: 5, title: 'Post-Mortem', owner: 'Service Lead', durationHours: 1, automated: false },
      ],
    },
  ],
};

// ---------- VIZ #1: Ticket Volume Timeline ----------
router.get('/ticket-volume', verifyToken, (req, res) => {
  const days = 30;
  const today = new Date();
  const categories = [
    { key: 'incident', label: 'Incidents', color: '#ef4444', base: 6, amp: 4 },
    { key: 'request', label: 'Service Requests', color: '#3b82f6', base: 18, amp: 7 },
    { key: 'question', label: 'Questions', color: '#10b981', base: 12, amp: 5 },
    { key: 'change', label: 'Change Reqs', color: '#f59e0b', base: 4, amp: 3 },
  ];
  const points = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const dow = d.getDay();
    const weekendDip = (dow === 0 || dow === 6) ? 0.45 : 1;
    const point = { date: dateStr };
    categories.forEach((c, ci) => {
      const seasonal = Math.sin((i + ci * 2) * 0.32) * c.amp;
      const trend = (days - i) * 0.12;
      const val = Math.max(0, Math.round((c.base + seasonal + trend) * weekendDip));
      point[c.key] = val;
    });
    point.total = categories.reduce((a, c) => a + point[c.key], 0);
    points.push(point);
  }
  const totalTickets = points.reduce((a, p) => a + p.total, 0);
  const avgDaily = Math.round(totalTickets / days);
  const peak = points.reduce((m, p) => p.total > m.total ? p : m, points[0]);
  res.json({
    range: { days, start: points[0].date, end: points[points.length - 1].date },
    categories,
    points,
    summary: {
      totalTickets,
      avgDaily,
      peakDay: peak.date,
      peakVolume: peak.total,
      mostCommonCategory: 'Service Requests',
    },
  });
});

// ---------- VIZ #2: Agent Performance Heatmap ----------
router.get('/agent-heatmap', verifyToken, (req, res) => {
  const agents = [
    'Avery Chen', 'Jordan Patel', 'Morgan Diaz', 'Riley Kim',
    'Casey Brooks', 'Sam Rivera', 'Quinn Park', 'Robin Walsh',
  ];
  const hours = ['8a', '9a', '10a', '11a', '12p', '1p', '2p', '3p', '4p', '5p'];
  const rows = agents.map((agent, ai) => {
    const baseSkill = 0.7 + (ai % 4) * 0.06;
    const cells = hours.map((_, hi) => {
      const fatigue = 1 - Math.max(0, hi - 5) * 0.04;
      const noise = (Math.sin((ai + 1) * (hi + 2) * 0.7) + 1) / 2 * 0.18;
      const resolved = Math.round((baseSkill * (4 + Math.sin((hi + ai) * 0.9) * 2) * fatigue + noise * 3));
      const csatScore = +(3.6 + baseSkill * 1.1 + noise - (1 - fatigue) * 0.6).toFixed(2);
      return { hour: hours[hi], ticketsResolved: Math.max(0, resolved), csat: Math.max(1, Math.min(5, csatScore)) };
    });
    const totalResolved = cells.reduce((a, c) => a + c.ticketsResolved, 0);
    const avgCsat = +(cells.reduce((a, c) => a + c.csat, 0) / cells.length).toFixed(2);
    return { agent, totalResolved, avgCsat, cells };
  });
  const flatVals = rows.flatMap(r => r.cells.map(c => c.ticketsResolved));
  const max = Math.max(...flatVals);
  const min = Math.min(...flatVals);
  const topAgent = rows.reduce((m, r) => r.totalResolved > m.totalResolved ? r : m, rows[0]);
  res.json({
    agents,
    hours,
    rows,
    scale: { min, max },
    summary: {
      topAgent: topAgent.agent,
      topAgentResolved: topAgent.totalResolved,
      teamAvgCsat: +(rows.reduce((a, r) => a + r.avgCsat, 0) / rows.length).toFixed(2),
      busiestHour: '10a',
    },
  });
});

// ---------- NON-VIZ #1: SLA Report PDF ----------
router.post('/sla-report-pdf', verifyToken, (req, res) => {
  const { period, clientName, includeBreaches } = req.body || {};
  const reportPeriod = period || 'Q1 2026';
  const client = clientName || 'All Customers';
  const reportId = 'SLA-' + Math.random().toString(36).slice(2, 8).toUpperCase();
  const today = new Date().toISOString().slice(0, 10);
  const slas = [
    { metric: 'First Response Time', target: '< 15 min', actual: '11 min', compliant: true, percent: 98.4 },
    { metric: 'Resolution Time (P1)', target: '< 4 hrs', actual: '3.2 hrs', compliant: true, percent: 96.1 },
    { metric: 'Resolution Time (P2)', target: '< 24 hrs', actual: '21 hrs', compliant: true, percent: 94.8 },
    { metric: 'Uptime', target: '> 99.9%', actual: '99.94%', compliant: true, percent: 99.94 },
    { metric: 'CSAT Score', target: '> 4.5', actual: '4.61', compliant: true, percent: 92.2 },
    { metric: 'Backlog Age (avg)', target: '< 5 days', actual: '6.1 days', compliant: false, percent: 81.9 },
  ];
  const breaches = includeBreaches !== false ? [
    { date: '2026-02-14', metric: 'Backlog Age', detail: 'Backlog exceeded 7 days during product launch surge.', severity: 'minor' },
    { date: '2026-03-02', metric: 'Resolution Time (P1)', detail: 'Single P1 incident took 5.4 hrs due to upstream vendor outage.', severity: 'major' },
  ] : [];
  const document = {
    reportId,
    issuedDate: today,
    period: reportPeriod,
    client,
    summary: {
      overallCompliance: +(slas.reduce((a, s) => a + s.percent, 0) / slas.length).toFixed(2),
      metricsTracked: slas.length,
      metricsCompliant: slas.filter(s => s.compliant).length,
      breachesLogged: breaches.length,
    },
    sections: [
      { title: '1. Executive Summary', body: `This SLA compliance report for ${client} covering ${reportPeriod} indicates strong overall service delivery with one metric below target. Continued investment in backlog automation is recommended.` },
      { title: '2. Metric-by-Metric Results', table: slas },
      { title: '3. Breach Log', table: breaches },
      { title: '4. Recommendations', body: 'Expand triage-bot coverage to weekend windows, add a second-tier on-call rotation for the EU region, and pilot AI-assisted ticket summarization to reduce average handle time by an estimated 18%.' },
      { title: '5. Sign-Off', body: `Prepared by ServiceFlow Service Operations on ${today}. Distribution: Account Lead, Customer Success, Customer Stakeholders.` },
    ],
    signedBy: { name: 'Jordan Lee', title: 'VP Service Operations' },
  };
  res.json({ ok: true, document });
});

// ---------- NON-VIZ #2: Service Workflow Editor (CRUD) ----------
router.get('/service-workflows', verifyToken, (req, res) => {
  res.json({ ok: true, workflows: workflowStore.workflows });
});

router.post('/service-workflows', verifyToken, (req, res) => {
  const { name, description, steps } = req.body || {};
  if (!name) return res.status(400).json({ ok: false, error: 'name required' });
  const id = 'wf-' + Math.random().toString(36).slice(2, 8);
  const workflow = {
    id,
    name,
    description: description || '',
    steps: Array.isArray(steps) ? steps.map((s, i) => ({
      id: i + 1,
      title: s.title || `Step ${i + 1}`,
      owner: s.owner || 'Unassigned',
      durationHours: Number(s.durationHours) || 1,
      automated: !!s.automated,
    })) : [],
  };
  workflowStore.workflows.push(workflow);
  res.json({ ok: true, workflow });
});

router.put('/service-workflows/:id', verifyToken, (req, res) => {
  const { id } = req.params;
  const idx = workflowStore.workflows.findIndex(w => w.id === id);
  if (idx === -1) return res.status(404).json({ ok: false, error: 'not found' });
  const existing = workflowStore.workflows[idx];
  const { name, description, steps } = req.body || {};
  workflowStore.workflows[idx] = {
    ...existing,
    name: name ?? existing.name,
    description: description ?? existing.description,
    steps: Array.isArray(steps) ? steps.map((s, i) => ({
      id: s.id || i + 1,
      title: s.title || `Step ${i + 1}`,
      owner: s.owner || 'Unassigned',
      durationHours: Number(s.durationHours) || 1,
      automated: !!s.automated,
    })) : existing.steps,
  };
  res.json({ ok: true, workflow: workflowStore.workflows[idx] });
});

router.delete('/service-workflows/:id', verifyToken, (req, res) => {
  const { id } = req.params;
  const idx = workflowStore.workflows.findIndex(w => w.id === id);
  if (idx === -1) return res.status(404).json({ ok: false, error: 'not found' });
  const [removed] = workflowStore.workflows.splice(idx, 1);
  res.json({ ok: true, removed });
});

module.exports = router;
