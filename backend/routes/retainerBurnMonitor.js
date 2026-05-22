const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    summary: { retainers_tracked: 18, overburn_risk: 4, margin_at_risk: 12600, renewals_due: 5 },
    clients: [
      { client: 'Northstar Labs', retainer: 12000, burned: 11250, projected_margin: 0.18, risk: 'high', action: 'scope review' },
      { client: 'Civic Analytics', retainer: 8000, burned: 6100, projected_margin: 0.32, risk: 'medium', action: 'rebalance senior hours' },
      { client: 'Atlas Foods', retainer: 15000, burned: 7400, projected_margin: 0.48, risk: 'low', action: 'package upsell' },
    ],
  });
});

router.post('/forecast', (req, res) => {
  const { client = 'Client', remainingHours = 20, blendedRate = 165 } = req.body || {};
  res.json({
    client,
    projected_burn: remainingHours * blendedRate,
    recommendation: remainingHours > 30 ? 'Request change order before assigning more delivery work.' : 'Retainer can absorb planned work.',
  });
});

module.exports = router;
