-- Users
INSERT INTO users (email, password_hash, name, role) VALUES
('admin@demo.com', '$2b$10$e4dPQpe3XIDluCZCv3b3iu/H/3f816tgim6l5ly5k7pChHG235Dey', 'Admin User', 'admin')
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, name = EXCLUDED.name, role = EXCLUDED.role;

-- Clients
INSERT INTO clients (name, company, email, industry, tier, status, onboarded_at, total_tasks, satisfaction_score) VALUES
('James Morrison', 'Morrison & Associates Insurance', 'james@morrisonins.com', 'insurance', 'enterprise', 'active', '2023-01-15', 47, 4.8),
('Sarah Chen', 'Chen Family Office', 'sarah@chenfamilyoffice.com', 'finance', 'premium', 'active', '2023-03-01', 23, 4.5),
('Robert Walsh', 'Walsh Healthcare Group', 'rwalsh@walshhealth.com', 'healthcare', 'enterprise', 'active', '2022-11-20', 89, 4.7),
('Emily Patel', 'Patel & Sons Accounting', 'emily@patelaccounting.com', 'accounting', 'premium', 'active', '2023-05-10', 31, 4.9),
('Michael Torres', 'Torres Compliance Consulting', 'mtorres@torrescc.com', 'legal', 'premium', 'active', '2023-02-28', 18, 4.2),
('Jennifer Kim', 'Kim Investments LLC', 'jkim@kiminvestments.com', 'finance', 'standard', 'active', '2023-07-15', 12, 4.4),
('David Nguyen', 'Nguyen Medical Practice', 'david@nguyenmed.com', 'healthcare', 'standard', 'active', '2023-08-01', 8, 4.6),
('Lisa Thompson', 'Thompson & Partners Law', 'lisa@thompsonlaw.com', 'legal', 'enterprise', 'active', '2022-09-15', 134, 4.3),
('Carlos Rivera', 'Rivera Construction Corp', 'crivera@riveracc.com', 'insurance', 'standard', 'active', '2023-06-20', 15, 3.9),
('Anna Kowalski', 'Kowalski Financial Services', 'anna@kowaskifs.com', 'accounting', 'premium', 'active', '2023-04-05', 28, 4.7),
('Thomas Brown', 'Brown Realty Group', 'tbrown@brownrealty.com', 'insurance', 'standard', 'active', '2023-09-01', 6, 4.1),
('Rachel Green', 'Green Dental Associates', 'rgreen@greendental.com', 'healthcare', 'premium', 'active', '2023-03-15', 22, 4.8),
('Kevin Park', 'Park Technology Solutions', 'kpark@parktech.com', 'finance', 'standard', 'inactive', '2023-01-01', 4, 3.7),
('Amanda Foster', 'Foster & Foster CPAs', 'afoster@fostercpa.com', 'accounting', 'enterprise', 'active', '2022-07-01', 156, 4.9),
('Steven Wright', 'Wright Manufacturing Inc', 'swright@wrightmfg.com', 'insurance', 'enterprise', 'active', '2022-12-01', 73, 4.5);

-- Staff
INSERT INTO staff (name, role, specialization, email, active_tasks, completed_tasks, success_rate, availability) VALUES
('Alexandra Hayes', 'director', 'insurance_brokerage', 'ahayes@serviceflow.com', 3, 245, 98.5, 'available'),
('Marcus Chen', 'specialist', 'accounting', 'mchen@serviceflow.com', 5, 189, 97.2, 'busy'),
('Priya Sharma', 'analyst', 'compliance', 'psharma@serviceflow.com', 4, 134, 95.8, 'available'),
('James Wilson', 'specialist', 'healthcare_admin', 'jwilson@serviceflow.com', 6, 312, 99.1, 'busy'),
('Sarah Johnson', 'manager', 'insurance_brokerage', 'sjohnson@serviceflow.com', 2, 418, 98.9, 'available'),
('Diego Martinez', 'analyst', 'accounting', 'dmartinez@serviceflow.com', 7, 98, 93.4, 'busy'),
('Emily Clark', 'specialist', 'compliance', 'eclark@serviceflow.com', 3, 167, 96.5, 'available'),
('Ryan Thompson', 'analyst', 'healthcare_admin', 'rthompson@serviceflow.com', 8, 87, 91.8, 'busy'),
('Lisa Anderson', 'director', 'accounting', 'landerson@serviceflow.com', 1, 523, 99.4, 'available'),
('Kevin Lee', 'specialist', 'insurance_brokerage', 'klee@serviceflow.com', 4, 201, 97.6, 'away'),
('Michelle Davis', 'analyst', 'compliance', 'mdavis@serviceflow.com', 2, 145, 96.1, 'available'),
('Nathan Brown', 'specialist', 'healthcare_admin', 'nbrown@serviceflow.com', 5, 178, 94.7, 'busy'),
('Olivia Taylor', 'manager', 'compliance', 'otaylor@serviceflow.com', 3, 289, 98.2, 'available'),
('Patrick White', 'analyst', 'accounting', 'pwhite@serviceflow.com', 6, 112, 94.3, 'busy'),
('Rachel Green', 'specialist', 'insurance_brokerage', 'rgreen@serviceflow.com', 4, 156, 97.8, 'available');

-- Tasks
INSERT INTO tasks (client_id, service_type, description, priority, status, assigned_to, created_at, due_at, completed_at, result_summary, amount_usd) VALUES
(1, 'insurance_brokerage', 'Annual commercial property insurance renewal for 3 locations', 'high', 'completed', 'Alexandra Hayes', NOW() - INTERVAL '20 days', NOW() - INTERVAL '10 days', NOW() - INTERVAL '8 days', 'Successfully renewed all 3 policies at 8% premium reduction', 4500.00),
(3, 'healthcare_admin', 'Medical billing audit for Q3 2024, 1200 claims', 'high', 'completed', 'James Wilson', NOW() - INTERVAL '30 days', NOW() - INTERVAL '15 days', NOW() - INTERVAL '12 days', 'Found $47K in unbilled claims, 98.2% claim acceptance rate', 8750.00),
(4, 'accounting', 'Year-end tax preparation for partnership with 5 partners', 'high', 'completed', 'Marcus Chen', NOW() - INTERVAL '45 days', NOW() - INTERVAL '30 days', NOW() - INTERVAL '28 days', 'Filed on time, identified $23K in deductions', 3200.00),
(5, 'compliance', 'SOX compliance assessment and gap analysis', 'critical', 'processing', 'Emily Clark', NOW() - INTERVAL '5 days', NOW() + INTERVAL '10 days', NULL, NULL, 12500.00),
(8, 'insurance_brokerage', 'Directors & Officers liability insurance placement', 'high', 'processing', 'Sarah Johnson', NOW() - INTERVAL '3 days', NOW() + INTERVAL '5 days', NULL, NULL, 7800.00),
(2, 'accounting', 'Monthly bookkeeping and financial statements Q4', 'medium', 'completed', 'Diego Martinez', NOW() - INTERVAL '15 days', NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days', 'Delivered P&L, balance sheet, cash flow statement', 1800.00),
(7, 'healthcare_admin', 'HIPAA compliance review and staff training program', 'medium', 'review', 'Nathan Brown', NOW() - INTERVAL '7 days', NOW() + INTERVAL '7 days', NULL, NULL, 5500.00),
(9, 'insurance_brokerage', 'Commercial auto fleet insurance for 25 vehicles', 'medium', 'pending', NULL, NOW() - INTERVAL '1 day', NOW() + INTERVAL '14 days', NULL, NULL, 3200.00),
(14, 'accounting', 'IRS audit support and document preparation', 'critical', 'processing', 'Lisa Anderson', NOW() - INTERVAL '2 days', NOW() + INTERVAL '3 days', NULL, NULL, 15000.00),
(15, 'insurance_brokerage', 'Workers compensation insurance renewal for 200 employees', 'high', 'processing', 'Kevin Lee', NOW() - INTERVAL '4 days', NOW() + INTERVAL '8 days', NULL, NULL, 6500.00),
(10, 'accounting', 'Estate planning and trust accounting services', 'medium', 'pending', NULL, NOW(), NOW() + INTERVAL '21 days', NULL, NULL, 4200.00),
(6, 'compliance', 'FINRA compliance review for investment advisor', 'high', 'processing', 'Priya Sharma', NOW() - INTERVAL '6 days', NOW() + INTERVAL '4 days', NULL, NULL, 9500.00),
(12, 'healthcare_admin', 'Patient billing optimization and revenue cycle review', 'medium', 'completed', 'James Wilson', NOW() - INTERVAL '25 days', NOW() - INTERVAL '10 days', NOW() - INTERVAL '9 days', 'Increased collections by 34%, reduced AR days from 52 to 38', 6800.00),
(3, 'compliance', 'Medicare billing compliance audit, 500 records', 'high', 'review', 'Olivia Taylor', NOW() - INTERVAL '8 days', NOW() + INTERVAL '2 days', NULL, NULL, 11000.00),
(1, 'insurance_brokerage', 'Cyber liability insurance assessment and placement', 'high', 'pending', NULL, NOW() - INTERVAL '2 hours', NOW() + INTERVAL '7 days', NULL, NULL, 5500.00);

-- Invoices
INSERT INTO invoices (client_id, task_id, amount_usd, status, issued_date, due_date, paid_date, notes) VALUES
(1, 1, 4500.00, 'paid', CURRENT_DATE - 8, CURRENT_DATE + 22, CURRENT_DATE - 3, 'Insurance renewal services'),
(3, 2, 8750.00, 'paid', CURRENT_DATE - 12, CURRENT_DATE + 18, CURRENT_DATE - 5, 'Medical billing audit'),
(4, 3, 3200.00, 'paid', CURRENT_DATE - 28, CURRENT_DATE + 2, CURRENT_DATE - 25, 'Tax preparation services'),
(5, 4, 6250.00, 'sent', CURRENT_DATE - 2, CURRENT_DATE + 28, NULL, '50% progress payment - SOX assessment'),
(8, 5, 3900.00, 'sent', CURRENT_DATE - 1, CURRENT_DATE + 29, NULL, '50% progress payment - D&O placement'),
(2, 6, 1800.00, 'paid', CURRENT_DATE - 4, CURRENT_DATE + 26, CURRENT_DATE - 1, 'Monthly bookkeeping Q4'),
(14, 9, 7500.00, 'sent', CURRENT_DATE - 1, CURRENT_DATE + 14, NULL, '50% retainer - IRS audit support'),
(15, 10, 3250.00, 'sent', CURRENT_DATE - 2, CURRENT_DATE + 28, NULL, '50% progress - workers comp renewal'),
(6, 12, 4750.00, 'sent', CURRENT_DATE - 4, CURRENT_DATE + 26, NULL, '50% progress - FINRA compliance'),
(12, 13, 6800.00, 'paid', CURRENT_DATE - 9, CURRENT_DATE + 21, CURRENT_DATE - 2, 'Revenue cycle optimization'),
(9, NULL, 450.00, 'overdue', CURRENT_DATE - 45, CURRENT_DATE - 15, NULL, 'Previous month consultation fee'),
(13, NULL, 800.00, 'cancelled', CURRENT_DATE - 30, CURRENT_DATE, NULL, 'Project cancelled by client'),
(10, 11, 2100.00, 'draft', NULL, NULL, NULL, 'Estate planning retainer'),
(7, 7, 5500.00, 'sent', CURRENT_DATE - 3, CURRENT_DATE + 27, NULL, 'HIPAA compliance review'),
(3, 14, 11000.00, 'sent', CURRENT_DATE - 5, CURRENT_DATE + 25, NULL, 'Medicare compliance audit');

-- SLAs
INSERT INTO slas (client_id, service_type, max_hours, penalty_per_hour_usd, current_status, breach_count, last_reviewed) VALUES
(1, 'insurance_brokerage', 48, 250.00, 'compliant', 0, CURRENT_DATE - 30),
(3, 'healthcare_admin', 24, 500.00, 'compliant', 1, CURRENT_DATE - 15),
(4, 'accounting', 72, 150.00, 'compliant', 0, CURRENT_DATE - 30),
(5, 'compliance', 96, 300.00, 'at_risk', 2, CURRENT_DATE - 5),
(8, 'insurance_brokerage', 48, 350.00, 'compliant', 0, CURRENT_DATE - 20),
(2, 'accounting', 48, 100.00, 'compliant', 0, CURRENT_DATE - 30),
(14, 'accounting', 24, 400.00, 'breached', 3, CURRENT_DATE - 2),
(15, 'insurance_brokerage', 72, 200.00, 'at_risk', 1, CURRENT_DATE - 7),
(6, 'compliance', 72, 250.00, 'at_risk', 1, CURRENT_DATE - 10),
(12, 'healthcare_admin', 48, 300.00, 'compliant', 0, CURRENT_DATE - 30),
(9, 'insurance_brokerage', 120, 100.00, 'compliant', 0, CURRENT_DATE - 30),
(7, 'healthcare_admin', 72, 200.00, 'compliant', 0, CURRENT_DATE - 30),
(10, 'accounting', 96, 150.00, 'compliant', 0, CURRENT_DATE - 30),
(3, 'compliance', 48, 400.00, 'at_risk', 0, CURRENT_DATE - 3),
(13, 'accounting', 96, 100.00, 'compliant', 0, CURRENT_DATE - 60);

-- Templates
INSERT INTO templates (service_type, name, description, avg_hours, steps_count, success_rate, last_updated, active) VALUES
('insurance_brokerage', 'Commercial Property Renewal', 'Standard annual commercial property insurance renewal process including coverage review, market analysis, and placement', 24.5, 12, 97.8, CURRENT_DATE - 30, true),
('insurance_brokerage', 'Cyber Liability Assessment', 'Comprehensive cyber risk assessment and insurance placement for technology-dependent businesses', 32.0, 15, 96.2, CURRENT_DATE - 15, true),
('insurance_brokerage', 'Directors & Officers Placement', 'D&O liability insurance placement for corporate clients including coverage analysis and carrier negotiation', 40.0, 18, 95.5, CURRENT_DATE - 7, true),
('insurance_brokerage', 'Workers Compensation Audit', 'Annual workers compensation premium audit and renewal with payroll reconciliation', 16.0, 8, 98.9, CURRENT_DATE - 30, true),
('accounting', 'Monthly Bookkeeping Package', 'Full-service monthly bookkeeping including reconciliation, P&L, balance sheet, and cash flow', 8.0, 6, 99.1, CURRENT_DATE - 30, true),
('accounting', 'Annual Tax Preparation - Business', 'Complete business tax preparation including entity returns, K-1s, and estimated payments', 24.0, 14, 98.7, CURRENT_DATE - 30, true),
('accounting', 'IRS Audit Support', 'Comprehensive audit representation and document preparation for IRS examination', 40.0, 20, 94.3, CURRENT_DATE - 10, true),
('accounting', 'Estate Planning Accounting', 'Trust and estate accounting services including fiduciary returns and distributions', 16.0, 10, 97.2, CURRENT_DATE - 20, true),
('compliance', 'SOX Compliance Assessment', 'Sarbanes-Oxley compliance assessment, gap analysis, and remediation planning', 80.0, 25, 96.8, CURRENT_DATE - 5, true),
('compliance', 'FINRA Compliance Review', 'Financial Industry Regulatory Authority compliance examination preparation', 56.0, 22, 97.4, CURRENT_DATE - 15, true),
('compliance', 'HIPAA Compliance Audit', 'Healthcare privacy and security rule compliance assessment and training', 32.0, 16, 98.1, CURRENT_DATE - 20, true),
('healthcare_admin', 'Medical Billing Audit', 'Comprehensive medical billing audit including claim review, denial analysis, and compliance check', 24.0, 12, 97.6, CURRENT_DATE - 7, true),
('healthcare_admin', 'Revenue Cycle Optimization', 'End-to-end revenue cycle assessment and optimization to improve collections and reduce denials', 48.0, 20, 96.3, CURRENT_DATE - 15, true),
('healthcare_admin', 'HIPAA Risk Assessment', 'Security risk assessment per HIPAA Security Rule requirements with remediation roadmap', 24.0, 14, 98.5, CURRENT_DATE - 10, true),
('healthcare_admin', 'Credentialing Services', 'Provider credentialing and enrollment with insurance payers including primary source verification', 40.0, 18, 95.8, CURRENT_DATE - 30, true);
