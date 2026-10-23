'use strict';

const path = require('node:path');
const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

function createApp() {
  const app = express();
  const origins = String(process.env.CORS_ORIGIN || '').split(',').map((value) => value.trim()).filter(Boolean);
  if (process.env.NODE_ENV === 'production' && !origins.length) throw new Error('CORS_ORIGIN is required in production');
  app.disable('x-powered-by');
  app.use((_req, res, next) => {
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('Referrer-Policy', 'no-referrer');
    res.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
  });
  app.use(cors({ origin: origins.length ? origins : false }));
  app.use(express.json({ limit: '256kb', type: ['application/json', 'application/*+json'] }));
  app.get('/api/health', async (_req, res) => {
    try {
      const pool = require('./db');
      const result = await pool.query("SELECT to_regclass('public.service_delivery_orders') IS NOT NULL AS migrated");
      res.status(result.rows[0].migrated ? 200 : 503).json({ ok: result.rows[0].migrated, service: 'serviceflow-backend', migrations: result.rows[0].migrated });
    } catch {
      res.status(503).json({ ok: false, service: 'serviceflow-backend' });
    }
  });
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/governed-delivery', require('./routes/governedDelivery'));
  app.use('/api/clients', require('./routes/clients'));
  app.use('/api/tasks', require('./routes/tasks'));
  app.use('/api/staff', require('./routes/staff'));
  app.use('/api/invoices', require('./routes/invoices'));
  app.use('/api/slas', require('./routes/slas'));
  app.use('/api/templates', require('./routes/templates'));
  if (process.env.ENABLE_GENERATED_FEATURES === 'true' && process.env.NODE_ENV !== 'production') app.use('/api/ai', require('./routes/ai'));
  else {
    const disabledAIFeatures = [
      'route-task', 'quality-review', 'client-insights', 'sla-risk',
      'churn-predictor', 'time-estimator', 'sentiment-classifier', 'invoice-anomaly', 'smart-dispatch',
    ];
    const unavailable = (_req, res) => res.json({ result: {
      availability: 'Unavailable',
      reason: 'Legacy AI generation is disabled in this environment. No analysis was run.',
      next_step: 'Open AI reports to prepare a reviewable advisory draft.',
    } });
    for (const feature of disabledAIFeatures) app.post(`/api/ai/${feature}`, unavailable);
  }
  app.use('/api', require('./routes/features'));
  if (process.env.ENABLE_GENERATED_FEATURES === 'true' && process.env.NODE_ENV !== 'production') {
    app.use('/api/admin', require('./routes/sample_data'));
    for (const route of [
      'gap-ai-template-recommendation','gap-ai-pricing-optimizer','gap-ai-capacity-forecast','gap-ai-deliverable-generator','gap-ai-client-churn-predictor',
      'gap-nonai-time-tracking','gap-nonai-client-portal','gap-nonai-deliverable-storage','gap-nonai-payment-gateway','gap-nonai-notification-layer',
      'cf-agent-fleet','cf-outcome-pricing','cf-slack-channel-auto','cf-margin-analyzer','cf-service-productize'
    ]) app.use(`/api/${route}`, require(`./routes/${route}`));
  }
  app.use('/api/dashboard', require('./routes/dashboard'));
  app.use('/api/custom-views', require('./routes/customViews'));
  app.use('/api/retainer-burn-monitor', require('./routes/retainerBurnMonitor'));

// Advisory AI reports only; native execution and approval routes stay unchanged.
const aiWorkspaceSupport = require("./aiWorkspaceAdapters.cjs");
const aiWorkspaceDatabase = require("./db.js");
app.use('/api/wave', require('./routes/wave60c'));
app.use('/api/report-workspace', require("./aiWorkspace.cjs").createAIWorkspaceRouter({
  pool: aiWorkspaceDatabase, authenticateToken: aiWorkspaceSupport.verifiedActorAuth(require("./middleware/auth.js")),
  aiRateLimiter: aiWorkspaceSupport.createWorkspaceLimiter(), features: require("./aiWorkspaceFeatures.json"),
}));
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found', path: req.originalUrl }));
  app.use((error, _req, res, _next) => {
    if (error.type === 'entity.too.large') return res.status(413).json({ error: 'Request too large' });
    console.error(error.stack);
    res.status(500).json({ error: 'Internal server error' });
  });
  return app;
}

if (require.main === module) {
  const port = Number(process.env.BACKEND_PORT);
  const host = process.env.BACKEND_HOST;
  if (!Number.isInteger(port) || port < 1024 || port > 65535 || host !== '127.0.0.1') throw new Error('BACKEND_PORT and BACKEND_HOST=127.0.0.1 are required');
  createApp().listen(port, host, () => console.log(`ServiceFlow backend running on http://${host}:${port}`));
}

module.exports = { createApp };
