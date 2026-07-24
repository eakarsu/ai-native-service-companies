const express = require('express');
const router = express.Router();
const verifyToken = require("../middleware/auth");
const pool = require('../db');
router.use(verifyToken);

async function callAI(userPrompt, systemPrompt = '') {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL;
  const baseUrl = process.env.OPENROUTER_BASE_URL;
  if (!apiKey || !model || !baseUrl) throw new Error('OpenRouter configuration is required');
  const resp = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'HTTP-Referer': 'http://localhost', 'X-Title': 'ServiceFlow' },
    body: JSON.stringify({ model, messages: [...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []), { role: 'user', content: userPrompt }] })
  });
  if (!resp.ok) throw new Error(`OpenRouter returned HTTP ${resp.status}: ${await resp.text()}`);
  const data = await resp.json();
  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || !content.trim()) throw new Error('OpenRouter returned empty content');
  return content;
}

router.post('/route-task', async (req, res) => {
  try {
    const { task } = req.body;
    const staffRes = await pool.query('SELECT * FROM staff WHERE availability = $1 OR availability = $2 ORDER BY success_rate DESC LIMIT 10', ['available', 'busy']);
    const prompt = `You are a task routing AI for a professional services firm. Recommend the best staff assignment and approach for this task.

Task Details:
${JSON.stringify(task, null, 2)}

Available Staff:
${JSON.stringify(staffRes.rows, null, 2)}

Provide routing recommendation including:
1. **Recommended Staff** - Best match with reasoning based on specialization and availability
2. **Alternative Staff** - 2 backup options
3. **Approach Strategy** - Step-by-step approach for this task type
4. **Estimated Hours** - Time estimate with confidence interval
5. **Priority Assessment** - Should this be escalated or deprioritized?
6. **Risk Factors** - Potential complications to watch for
7. **Success Metrics** - How to measure successful completion
8. **Client Communication** - Recommended update frequency and style`;
    const result = await callAI(prompt, 'You are an expert AI operations manager for a professional services firm. You optimize task routing, resource allocation, and service delivery.');
    res.json({ result });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/quality-review', async (req, res) => {
  try {
    const { task_result, service_type } = req.body;
    const prompt = `Review the quality of this completed service task and provide improvement suggestions.

Service Type: ${service_type}
Task Result:
${JSON.stringify(task_result, null, 2)}

Provide quality review including:
1. **Quality Score** - Overall quality rating (1-10) with justification
2. **Compliance Check** - Does the work meet professional standards for ${service_type}?
3. **Accuracy Assessment** - Potential errors or inaccuracies identified
4. **Completeness Review** - What might be missing or incomplete
5. **Client Impact** - How will this quality level affect client satisfaction?
6. **Improvement Recommendations** - Specific improvements to make
7. **Best Practices** - Industry best practices that should be applied
8. **Risk Assessment** - Any compliance or liability risks in the output`;
    const result = await callAI(prompt, 'You are a senior quality assurance manager at a professional services firm with expertise in insurance, accounting, compliance, and healthcare administration.');
    const persisted = await pool.query(
      `INSERT INTO service_ai_results(tenant_id,user_id,feature,input,output,model)
       VALUES($1,$2,'quality-review',$3::jsonb,$4,$5) RETURNING id`,
      [req.user.tenantId, req.user.id, JSON.stringify({ task_result, service_type }), result, process.env.OPENROUTER_MODEL],
    );
    res.json({ id: persisted.rows[0].id, result, model: process.env.OPENROUTER_MODEL });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/client-insights', async (req, res) => {
  try {
    const { client_id, history } = req.body;
    let clientData = {};
    if (client_id) {
      const [clientRes, taskRes, invoiceRes, slaRes] = await Promise.all([
        pool.query('SELECT * FROM clients WHERE id=$1', [client_id]),
        pool.query('SELECT * FROM tasks WHERE client_id=$1 ORDER BY created_at DESC LIMIT 10', [client_id]),
        pool.query('SELECT * FROM invoices WHERE client_id=$1 ORDER BY issued_date DESC LIMIT 5', [client_id]),
        pool.query('SELECT * FROM slas WHERE client_id=$1', [client_id])
      ]);
      clientData = { client: clientRes.rows[0], recentTasks: taskRes.rows, invoices: invoiceRes.rows, slas: slaRes.rows };
    }
    const prompt = `Generate a comprehensive client health report and strategic recommendations.

Client Data:
${JSON.stringify(clientData, null, 2)}

Additional History:
${JSON.stringify(history || {}, null, 2)}

Generate insights including:
1. **Client Health Score** - Overall relationship health (1-10)
2. **Engagement Analysis** - Service usage patterns and trends
3. **Financial Health** - Invoice payment patterns, revenue analysis
4. **SLA Performance** - Compliance history and risk
5. **Satisfaction Indicators** - Signals of client satisfaction or dissatisfaction
6. **Churn Risk** - Probability and warning signs
7. **Upsell Opportunities** - Services they could benefit from
8. **Strategic Recommendations** - Top 3 actions to strengthen the relationship
9. **Retention Strategy** - Specific steps to ensure contract renewal`;
    const result = await callAI(prompt, 'You are a client success director with expertise in B2B professional services. You analyze client data to drive retention, growth, and satisfaction.');
    res.json({ result });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/sla-risk', async (req, res) => {
  try {
    const { active_tasks } = req.body;
    const [tasksRes, slasRes] = await Promise.all([
      pool.query(`SELECT t.*, c.name as client_name, s.max_hours, s.penalty_per_hour_usd, s.current_status as sla_status FROM tasks t LEFT JOIN clients c ON t.client_id = c.id LEFT JOIN slas s ON t.client_id = s.client_id AND t.service_type = s.service_type WHERE t.status NOT IN ('completed','failed') ORDER BY t.due_at NULLS LAST LIMIT 20`),
      pool.query('SELECT s.*, c.name as client_name FROM slas s LEFT JOIN clients c ON s.client_id = c.id WHERE s.current_status != $1', ['compliant'])
    ]);
    const prompt = `Assess SLA breach risk for all active service tasks and provide recommendations.

Active Tasks with SLA Context:
${JSON.stringify(active_tasks || tasksRes.rows, null, 2)}

At-Risk SLAs:
${JSON.stringify(slasRes.rows, null, 2)}

Provide comprehensive SLA risk assessment:
1. **Critical Alerts** - Tasks at immediate breach risk (list each one)
2. **At-Risk Tasks** - Tasks approaching SLA limits in next 24 hours
3. **Breach Impact Analysis** - Financial impact if current at-risk SLAs breach
4. **Root Cause Analysis** - Why are SLAs at risk?
5. **Immediate Actions** - Emergency steps to prevent imminent breaches
6. **Staff Reallocation** - Which staff should be reassigned immediately
7. **Client Communication Plan** - Which clients need proactive outreach
8. **Systemic Improvements** - Process changes to reduce future SLA risk
9. **Priority Queue** - Ranked list of tasks to work on first`;
    const result = await callAI(prompt, 'You are a service operations manager responsible for SLA compliance. You have expertise in risk assessment and operational triage for professional services.');
    res.json({ result });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
