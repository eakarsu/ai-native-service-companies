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
