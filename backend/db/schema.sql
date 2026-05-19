DROP TABLE IF EXISTS templates CASCADE;
DROP TABLE IF EXISTS slas CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS staff CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE clients (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  company VARCHAR(255),
  email VARCHAR(255),
  industry VARCHAR(100),
  tier VARCHAR(20) DEFAULT 'standard',
  status VARCHAR(20) DEFAULT 'active',
  onboarded_at DATE,
  total_tasks INTEGER DEFAULT 0,
  satisfaction_score DECIMAL(4,2)
);

CREATE TABLE staff (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(100),
  specialization VARCHAR(255),
  email VARCHAR(255),
  active_tasks INTEGER DEFAULT 0,
  completed_tasks INTEGER DEFAULT 0,
  success_rate DECIMAL(5,2) DEFAULT 100,
  availability VARCHAR(20) DEFAULT 'available'
);

CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
  service_type VARCHAR(50),
  description TEXT,
  priority VARCHAR(20) DEFAULT 'medium',
  status VARCHAR(20) DEFAULT 'pending',
  assigned_to VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  due_at TIMESTAMP,
  completed_at TIMESTAMP,
  result_summary TEXT,
  amount_usd DECIMAL(10,2)
);

CREATE TABLE invoices (
  id SERIAL PRIMARY KEY,
  client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
  task_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL,
  amount_usd DECIMAL(10,2),
  status VARCHAR(20) DEFAULT 'draft',
  issued_date DATE,
  due_date DATE,
  paid_date DATE,
  notes TEXT
);

CREATE TABLE slas (
  id SERIAL PRIMARY KEY,
  client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
  service_type VARCHAR(100),
  max_hours INTEGER,
  penalty_per_hour_usd DECIMAL(8,2),
  current_status VARCHAR(20) DEFAULT 'compliant',
  breach_count INTEGER DEFAULT 0,
  last_reviewed DATE
);

CREATE TABLE templates (
  id SERIAL PRIMARY KEY,
  service_type VARCHAR(100),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  avg_hours DECIMAL(6,2),
  steps_count INTEGER,
  success_rate DECIMAL(5,2) DEFAULT 95,
  last_updated DATE,
  active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS audit_log (
  id SERIAL PRIMARY KEY,
  user_email VARCHAR(255),
  action VARCHAR(100) NOT NULL,
  entity VARCHAR(100),
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);

-- ============================================================================
-- AI-Native Services Catalog
-- Replace human-delivered services (legal, tax, audit, recruiting, consulting)
-- with productized AI offerings. Real billing models: per-outcome, per-document,
-- subscription, or hybrid (base + success fee).
-- ============================================================================
CREATE TABLE IF NOT EXISTS service_offerings (
  id SERIAL PRIMARY KEY,
  sku VARCHAR(64) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  vertical VARCHAR(50),                  -- legal, tax, audit, compliance, recruiting, consulting
  description TEXT,
  billing_model VARCHAR(40),             -- per_outcome | per_document | per_seat_month | hybrid | flat
  base_price_usd DECIMAL(10,2),
  unit_price_usd DECIMAL(10,2),          -- per document / per outcome
  success_fee_pct DECIMAL(5,2),          -- for hybrid contingency
  sla_hours INTEGER,                     -- target turnaround
  human_review_required BOOLEAN DEFAULT TRUE,
  ai_cost_per_unit_usd DECIMAL(8,4),     -- expected LLM cost per delivery
  target_gross_margin_pct DECIMAL(5,2),  -- target margin
  benchmark_eval VARCHAR(80),            -- LegalBench / FinanceBench / CUAD / SWE-bench
  benchmark_score DECIMAL(5,2),          -- current accuracy on that eval
  status VARCHAR(20) DEFAULT 'active',   -- active | beta | retired
  launched_at DATE,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_service_offerings_vertical ON service_offerings(vertical);
CREATE INDEX IF NOT EXISTS idx_service_offerings_status ON service_offerings(status);

-- Workflow templates per offering — real pipeline steps (intake → research → draft → review → deliver).
CREATE TABLE IF NOT EXISTS workflow_steps (
  id SERIAL PRIMARY KEY,
  offering_id INTEGER REFERENCES service_offerings(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  step_name VARCHAR(120) NOT NULL,
  step_type VARCHAR(30),                 -- ai_inference | human_review | retrieval | tool_call | dispatch
  model_used VARCHAR(80),                -- claude-opus-4 / gpt-5 / mixtral-8x22b
  prompt_template TEXT,
  expected_minutes DECIMAL(6,2),
  cost_per_run_usd DECIMAL(8,4),
  pass_rate_pct DECIMAL(5,2),            -- empirical pass-through rate
  human_review_threshold DECIMAL(5,2),   -- below this confidence → escalate
  output_schema JSONB,                   -- expected JSON output shape
  UNIQUE(offering_id, step_order)
);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_offering ON workflow_steps(offering_id);

-- Per-delivery work packages: a task may use an offering and generate deliverables.
CREATE TABLE IF NOT EXISTS work_packages (
  id SERIAL PRIMARY KEY,
  offering_id INTEGER REFERENCES service_offerings(id),
  client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
  task_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL,
  case_ref VARCHAR(80),                  -- e.g. CUAD-2024-0012, F500-DD-Q1
  intake_summary TEXT,
  status VARCHAR(20) DEFAULT 'intake',   -- intake | running | qc | delivered | escalated | failed
  current_step INTEGER DEFAULT 0,
  ai_cost_actual_usd DECIMAL(10,4) DEFAULT 0,
  human_minutes_used DECIMAL(8,2) DEFAULT 0,
  price_charged_usd DECIMAL(10,2),
  margin_usd DECIMAL(10,2),
  started_at TIMESTAMP DEFAULT NOW(),
  delivered_at TIMESTAMP,
  outcome VARCHAR(40),                   -- successful | partial | client_rejected | refunded
  client_rating DECIMAL(3,1)
);
CREATE INDEX IF NOT EXISTS idx_work_packages_client ON work_packages(client_id);
CREATE INDEX IF NOT EXISTS idx_work_packages_status ON work_packages(status);
CREATE INDEX IF NOT EXISTS idx_work_packages_offering ON work_packages(offering_id);

-- Concrete deliverables (a contract markup, a tax return, an audit report).
CREATE TABLE IF NOT EXISTS deliverables (
  id SERIAL PRIMARY KEY,
  package_id INTEGER REFERENCES work_packages(id) ON DELETE CASCADE,
  doc_type VARCHAR(80),                  -- contract_redline | tax_return_1120 | audit_report | due_diligence_memo
  filename VARCHAR(255),
  content_summary TEXT,
  pages INTEGER,
  ai_confidence DECIMAL(5,2),            -- 0..100
  quality_grade VARCHAR(2),              -- A / B / C / D / F
  citations_count INTEGER DEFAULT 0,
  hallucination_flag BOOLEAN DEFAULT FALSE,
  generated_at TIMESTAMP DEFAULT NOW(),
  approved_by VARCHAR(120),              -- human reviewer
  approved_at TIMESTAMP,
  delivered_to_client BOOLEAN DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_deliverables_package ON deliverables(package_id);
CREATE INDEX IF NOT EXISTS idx_deliverables_quality ON deliverables(quality_grade);

-- Human-in-the-loop QC queue (review of ai-generated deliverables).
CREATE TABLE IF NOT EXISTS qc_reviews (
  id SERIAL PRIMARY KEY,
  deliverable_id INTEGER REFERENCES deliverables(id) ON DELETE CASCADE,
  reviewer_email VARCHAR(255),
  review_type VARCHAR(40),               -- spot_check | full_review | client_dispute | escalation
  priority VARCHAR(20) DEFAULT 'normal', -- low | normal | high | urgent
  status VARCHAR(20) DEFAULT 'queued',   -- queued | in_review | approved | rejected | revision_needed
  ai_score DECIMAL(5,2),
  human_score DECIMAL(5,2),
  agreement BOOLEAN,                     -- did human agree with AI?
  issues_found INTEGER DEFAULT 0,
  notes TEXT,
  minutes_spent DECIMAL(6,2),
  queued_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_qc_reviews_status ON qc_reviews(status);
CREATE INDEX IF NOT EXISTS idx_qc_reviews_priority ON qc_reviews(priority);

-- AI benchmark snapshots — real evals against published datasets.
CREATE TABLE IF NOT EXISTS ai_benchmarks (
  id SERIAL PRIMARY KEY,
  offering_id INTEGER REFERENCES service_offerings(id) ON DELETE CASCADE,
  eval_name VARCHAR(80),                 -- LegalBench / CUAD / FinanceBench / SWE-bench / TaxLLM / MMLU-Law
  eval_subset VARCHAR(80),               -- e.g. CUAD-anti_assignment, LegalBench-rule_qa
  model_name VARCHAR(80),
  score DECIMAL(5,2),                    -- accuracy / F1 / pass@1
  metric VARCHAR(30),                    -- accuracy | f1 | exact_match | pass_at_1
  sample_size INTEGER,
  baseline_human_score DECIMAL(5,2),     -- human expert baseline (if known)
  run_date DATE,
  cost_per_eval_usd DECIMAL(8,4),
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_ai_benchmarks_offering ON ai_benchmarks(offering_id);
CREATE INDEX IF NOT EXISTS idx_ai_benchmarks_eval ON ai_benchmarks(eval_name);

-- Margin / unit-economics ledger per package.
CREATE TABLE IF NOT EXISTS margin_events (
  id SERIAL PRIMARY KEY,
  package_id INTEGER REFERENCES work_packages(id) ON DELETE CASCADE,
  event_type VARCHAR(30),                -- ai_call | human_time | tool_call | refund | bonus
  description TEXT,
  cost_usd DECIMAL(10,4),                -- negative for revenue, positive for cost
  tokens_in INTEGER,
  tokens_out INTEGER,
  model VARCHAR(80),
  occurred_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_margin_events_package ON margin_events(package_id);
CREATE INDEX IF NOT EXISTS idx_margin_events_type ON margin_events(event_type);
