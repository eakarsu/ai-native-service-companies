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

-- ============================================================================
-- Service offerings — productized AI-native services replacing human delivery.
-- Real billing models, real benchmarks (CUAD/LegalBench/FinanceBench/SWE-bench).
-- ============================================================================
INSERT INTO service_offerings (sku, name, vertical, description, billing_model, base_price_usd, unit_price_usd, success_fee_pct, sla_hours, human_review_required, ai_cost_per_unit_usd, target_gross_margin_pct, benchmark_eval, benchmark_score, status, launched_at) VALUES
('LEGAL-CONTRACT-REVIEW-CUAD', 'Contract Redline & Risk Review', 'legal', 'AI-first contract review against CUAD-trained model. Identifies 41 risk categories (assignment, indemnity, IP ownership, change-of-control, anti-assignment). Replaces $400/hr associate work.', 'per_document', 0, 149.00, NULL, 4, true, 1.20, 92.0, 'CUAD', 87.4, 'active', '2024-03-15'),
('LEGAL-NDA-AUTODRAFT', 'NDA Auto-Drafting Agent', 'legal', 'Mutual / unilateral NDA drafting with party intake form. Output benchmarked vs LegalBench rule_qa. 99% delivered in <30 minutes.', 'flat', 79.00, NULL, NULL, 1, false, 0.18, 95.0, 'LegalBench', 83.2, 'active', '2024-01-08'),
('LEGAL-MA-DUE-DILIGENCE', 'M&A Due Diligence Memo', 'legal', 'End-to-end DD: data room ingestion (avg 1,200 docs), risk-flag extraction, draft memo with Quality of Earnings cross-references. Replaces Big-Law $80k engagement.', 'per_outcome', 4500.00, NULL, 3.0, 168, true, 280.00, 70.0, 'LegalBench', 81.1, 'active', '2024-06-20'),
('TAX-1120-PREP-AGENT', 'C-Corp 1120 Tax Return Agent', 'tax', 'Federal 1120 filing for SaaS / startup C-Corps with R&D credit Sec.174 amortization, Sec.382 NOL tracking, state apportionment. Replaces $8k tax-prep engagement.', 'flat', 1850.00, NULL, NULL, 72, true, 4.20, 75.0, 'TaxLLM-1120', 91.8, 'active', '2024-09-01'),
('TAX-RD-CREDIT-CALC', 'Section 174 / R&D Credit Calculator', 'tax', 'R&D credit substantiation: payroll allocation, contractor 65% test, QRE classification. Outputs Form 6765 + nexus report.', 'hybrid', 750.00, NULL, 8.0, 96, true, 3.40, 78.0, 'TaxLLM-R&D', 88.6, 'active', '2024-04-12'),
('TAX-STATE-NEXUS-SCAN', 'Multi-State Nexus & Apportionment Scan', 'tax', 'Wayfair-era state economic nexus scan across 50 states. Identifies registration gaps, computes back-tax exposure, generates VDA application drafts.', 'per_outcome', 1200.00, NULL, NULL, 120, true, 2.80, 80.0, 'TaxLLM-Nexus', 86.4, 'active', '2024-11-05'),
('AUDIT-SOC2-READINESS', 'SOC 2 Type II Readiness Audit', 'audit', 'Automated control mapping (CC1-CC9 + availability/confidentiality), evidence collection from AWS/GCP/Okta/Jira, gap remediation roadmap, ready-for-Type-II in <14 days.', 'flat', 12500.00, NULL, NULL, 240, true, 38.00, 82.0, 'SOC2Bench', 89.5, 'active', '2024-02-20'),
('AUDIT-FINANCEBENCH-FSA', 'Financial Statement Analysis (10-K)', 'audit', '10-K & 10-Q analytical review against FinanceBench eval. Ratio analysis, footnote anomaly detection, MD&A cross-check, going-concern flags.', 'per_document', 0, 295.00, NULL, 8, false, 2.40, 85.0, 'FinanceBench', 79.3, 'active', '2024-05-14'),
('AUDIT-CODE-SECAUDIT', 'Codebase Security Audit', 'audit', 'Static + agentic dynamic analysis. Benchmarked on SWE-bench Verified for fix-quality. Outputs CVSS-scored findings, fixes as PRs.', 'per_outcome', 3500.00, NULL, NULL, 96, true, 22.00, 76.0, 'SWE-bench Verified', 71.5, 'active', '2024-07-30'),
('COMPLY-GDPR-DPIA', 'GDPR DPIA & ROPA Generation', 'compliance', 'Data Protection Impact Assessment + Record of Processing Activities for SaaS controllers. Maps Art.30 inventory from product surface area.', 'flat', 2400.00, NULL, NULL, 72, true, 5.80, 84.0, 'PrivacyBench', 84.7, 'active', '2024-03-04'),
('COMPLY-HIPAA-BAA-DRAFT', 'HIPAA BAA + Risk Analysis', 'compliance', 'Business Associate Agreement drafting + §164.308(a)(1) risk analysis. Replaces $15k healthcare-attorney engagement.', 'flat', 1950.00, NULL, NULL, 48, true, 3.20, 87.0, 'LegalBench', 82.0, 'active', '2024-08-15'),
('RECRUIT-EXEC-SOURCING', 'Executive Search (VP/C-Level)', 'recruiting', 'AI-first executive sourcing replacing Korn Ferry / Heidrick. Public-data candidate graph (60M+ profiles), warm-intro pathfinder, structured competency interviews.', 'per_outcome', 8000.00, NULL, 20.0, 720, true, 65.00, 68.0, 'TalentBench', 76.8, 'active', '2024-04-22'),
('RECRUIT-IC-TECH-SOURCING', 'Technical IC Sourcing Pipeline', 'recruiting', 'L4-L6 engineer sourcing: GitHub/Stack/papers signal, take-home eval, behavioral interviews. Replaces $25k/hire agency fees.', 'per_outcome', 1500.00, NULL, NULL, 240, true, 18.00, 73.0, 'TalentBench', 78.4, 'active', '2024-06-10'),
('CONSULT-MKT-ANALYSIS', 'Market & Competitor Analysis', 'consulting', 'Bain/MBB-style market sizing, competitor matrix, TAM/SAM/SOM with primary-source citations. Replaces $50-80k MBB engagement.', 'flat', 4900.00, NULL, NULL, 96, true, 14.00, 72.0, 'ConsultBench', 81.2, 'active', '2024-05-01'),
('CONSULT-FINMODEL-3STMT', '3-Statement Financial Model', 'consulting', 'Operating model (income, balance, cash flow) with 3-year forecast, driver-based assumptions, sensitivity & Monte Carlo. Output in Excel + Notion.', 'flat', 2200.00, NULL, NULL, 72, true, 6.40, 79.0, 'FinanceBench', 84.5, 'active', '2024-09-18'),
('CONSULT-PITCH-DECK-AGENT', 'Investor Pitch Deck Generator', 'consulting', 'Series A/B deck: narrative, market, GTM, financials, comps. Tailored to investor thesis (Sequoia/a16z/Founders Fund style).', 'flat', 1200.00, NULL, NULL, 48, false, 1.80, 88.0, 'PitchBench', 77.3, 'beta', '2024-12-01'),
('LEGAL-PATENT-OFFICE-ACTION', 'USPTO Office Action Response', 'legal', 'Non-final / final office action response drafting with prior-art rebuttal, claim amendments. Replaces $5k patent-prosecution engagement.', 'flat', 950.00, NULL, NULL, 120, true, 4.80, 80.0, 'LegalBench', 75.6, 'active', '2024-10-12'),
('AUDIT-SOX-WALKTHROUGH', 'SOX 404 Walkthrough & Testing', 'audit', 'PCAOB-aligned control walkthrough + design-effectiveness testing for ICFR. Auto-generated narratives, sampling plan, control deficiency log.', 'flat', 18500.00, NULL, NULL, 336, true, 52.00, 75.0, 'SOC2Bench', 88.1, 'active', '2024-01-30')
ON CONFLICT (sku) DO NOTHING;

-- Workflow steps per offering (real pipeline: intake → research → draft → review → deliver).
INSERT INTO workflow_steps (offering_id, step_order, step_name, step_type, model_used, prompt_template, expected_minutes, cost_per_run_usd, pass_rate_pct, human_review_threshold, output_schema) VALUES
((SELECT id FROM service_offerings WHERE sku='LEGAL-CONTRACT-REVIEW-CUAD'), 1, 'Intake & document split', 'retrieval', 'claude-haiku-4.5', 'Split the uploaded contract into sections (preamble, recitals, definitions, ops clauses, boilerplate). Return JSON.', 2.0, 0.04, 99.5, 90.0, '{"sections":[]}'),
((SELECT id FROM service_offerings WHERE sku='LEGAL-CONTRACT-REVIEW-CUAD'), 2, 'CUAD 41-category extraction', 'ai_inference', 'claude-opus-4', 'For each of the 41 CUAD risk categories (anti-assignment, change-of-control, exclusivity, IP ownership, etc.) extract clauses with spans and confidence.', 8.0, 0.85, 94.2, 75.0, '{"findings":[]}'),
((SELECT id FROM service_offerings WHERE sku='LEGAL-CONTRACT-REVIEW-CUAD'), 3, 'Risk scoring vs playbook', 'ai_inference', 'claude-opus-4', 'Score each finding against client playbook (red/yellow/green) with cited prior-deal precedent.', 4.0, 0.22, 96.0, 80.0, '{"scored_findings":[]}'),
((SELECT id FROM service_offerings WHERE sku='LEGAL-CONTRACT-REVIEW-CUAD'), 4, 'Redline draft generation', 'ai_inference', 'claude-opus-4', 'Generate Word redline with tracked changes for all red/yellow findings.', 6.0, 0.18, 92.5, 85.0, '{"redline_docx_url":""}'),
((SELECT id FROM service_offerings WHERE sku='LEGAL-CONTRACT-REVIEW-CUAD'), 5, 'Attorney spot-check QC', 'human_review', NULL, 'Licensed-attorney 15-minute spot check on high-risk findings.', 15.0, 12.50, 98.0, NULL, '{"approved":true}'),
((SELECT id FROM service_offerings WHERE sku='LEGAL-CONTRACT-REVIEW-CUAD'), 6, 'Client delivery', 'dispatch', NULL, 'Email DOCX + summary memo + risk-heatmap PDF.', 1.0, 0.01, 99.9, NULL, '{"delivered":true}'),

((SELECT id FROM service_offerings WHERE sku='TAX-1120-PREP-AGENT'), 1, 'QBO/Xero pull & TB tie-out', 'tool_call', 'claude-sonnet-4.5', 'Pull trial balance, reconcile to GL, flag tie-out variances >$500.', 12.0, 0.32, 97.0, 88.0, '{"trial_balance":{}}'),
((SELECT id FROM service_offerings WHERE sku='TAX-1120-PREP-AGENT'), 2, 'M-1/M-3 book-tax reconciliation', 'ai_inference', 'claude-opus-4', 'Compute book-to-tax differences: meals 50%, accruals, depreciation §168 vs book, stock comp §83(b)/(h).', 18.0, 0.92, 93.5, 80.0, '{"m1_m3":{}}'),
((SELECT id FROM service_offerings WHERE sku='TAX-1120-PREP-AGENT'), 3, 'R&D / Sec.174 amortization', 'ai_inference', 'claude-opus-4', 'Apply 5-year (domestic) / 15-year (foreign) Sec.174 amortization. Compute Form 6765 if applicable.', 14.0, 0.78, 91.2, 82.0, '{"sec174":{}}'),
((SELECT id FROM service_offerings WHERE sku='TAX-1120-PREP-AGENT'), 4, 'State apportionment', 'ai_inference', 'claude-sonnet-4.5', 'Apply throwback/throwout rules, sales-factor sourcing for SaaS revenue across 30+ states.', 10.0, 0.42, 89.8, 78.0, '{"state_returns":[]}'),
((SELECT id FROM service_offerings WHERE sku='TAX-1120-PREP-AGENT'), 5, 'CPA partner review', 'human_review', NULL, 'CPA partner reviews return, signs as preparer.', 45.0, 38.00, 99.5, NULL, '{"signed":true}'),
((SELECT id FROM service_offerings WHERE sku='TAX-1120-PREP-AGENT'), 6, 'E-file via MeF', 'tool_call', NULL, 'Modernized e-File transmission to IRS, await acknowledgement.', 2.0, 0.05, 99.7, NULL, '{"mef_ack":""}'),

((SELECT id FROM service_offerings WHERE sku='AUDIT-CODE-SECAUDIT'), 1, 'Repo crawl & dependency graph', 'tool_call', 'claude-sonnet-4.5', 'Clone repo, build CallGraph + dep tree, identify entry points.', 8.0, 0.62, 98.5, 90.0, '{"call_graph":{}}'),
((SELECT id FROM service_offerings WHERE sku='AUDIT-CODE-SECAUDIT'), 2, 'SAST: CWE Top-25 scan', 'ai_inference', 'claude-opus-4', 'Run static analysis for SQL injection (CWE-89), XSS (CWE-79), SSRF (CWE-918), auth bypass, etc.', 22.0, 4.20, 88.5, 75.0, '{"findings":[]}'),
((SELECT id FROM service_offerings WHERE sku='AUDIT-CODE-SECAUDIT'), 3, 'Agentic exploitation attempt', 'ai_inference', 'claude-opus-4', 'For each high-severity finding, attempt to construct a working PoC against a local repro.', 35.0, 8.40, 72.0, 70.0, '{"pocs":[]}'),
((SELECT id FROM service_offerings WHERE sku='AUDIT-CODE-SECAUDIT'), 4, 'Generate fix PRs', 'ai_inference', 'claude-opus-4', 'For each confirmed finding, generate a PR with fix + test. Score against SWE-bench rubric.', 28.0, 6.80, 84.0, 75.0, '{"prs":[]}'),
((SELECT id FROM service_offerings WHERE sku='AUDIT-CODE-SECAUDIT'), 5, 'Security engineer review', 'human_review', NULL, 'OSCP/CISSP-certified reviewer validates findings, signs report.', 90.0, 165.00, 99.0, NULL, '{"signed":true}'),

((SELECT id FROM service_offerings WHERE sku='LEGAL-MA-DUE-DILIGENCE'), 1, 'Data room ingest', 'retrieval', 'claude-sonnet-4.5', 'OCR & classify all data room docs (avg 1200). Build per-folder topic map.', 45.0, 14.00, 99.0, 92.0, '{"docs":[]}'),
((SELECT id FROM service_offerings WHERE sku='LEGAL-MA-DUE-DILIGENCE'), 2, 'Material contract review', 'ai_inference', 'claude-opus-4', 'Identify and review every material contract: change-of-control, exclusivity, MFN.', 180.0, 78.00, 91.5, 78.0, '{"red_flags":[]}'),
((SELECT id FROM service_offerings WHERE sku='LEGAL-MA-DUE-DILIGENCE'), 3, 'Cap-table & equity-grant audit', 'ai_inference', 'claude-opus-4', 'Reconcile cap table, ISO/NSO grants, §409A, vesting acceleration triggers.', 60.0, 22.00, 94.0, 82.0, '{"cap_table_audit":{}}'),
((SELECT id FROM service_offerings WHERE sku='LEGAL-MA-DUE-DILIGENCE'), 4, 'Final DD memo synthesis', 'ai_inference', 'claude-opus-4', 'Produce 30-50 page DD memo with categorized findings, severity, recommended deal-doc changes.', 50.0, 18.00, 89.0, 80.0, '{"memo_pdf_url":""}'),
((SELECT id FROM service_offerings WHERE sku='LEGAL-MA-DUE-DILIGENCE'), 5, 'Senior partner review', 'human_review', NULL, 'M&A partner reviews and signs DD memo.', 240.0, 1200.00, 99.5, NULL, '{"signed":true}'),

((SELECT id FROM service_offerings WHERE sku='RECRUIT-EXEC-SOURCING'), 1, 'Brief intake + scorecard', 'ai_inference', 'claude-opus-4', 'Convert hiring brief into 6-dimension scorecard (functional, leadership, IQ, EQ, drive, ethics).', 12.0, 0.45, 97.5, 88.0, '{"scorecard":{}}'),
((SELECT id FROM service_offerings WHERE sku='RECRUIT-EXEC-SOURCING'), 2, 'Candidate graph sourcing', 'tool_call', 'claude-sonnet-4.5', 'Query 60M+ profile graph (LinkedIn + Crunchbase + papers + patents). Return top-200 ranked.', 25.0, 4.20, 96.0, 85.0, '{"candidates":[]}'),
((SELECT id FROM service_offerings WHERE sku='RECRUIT-EXEC-SOURCING'), 3, 'Warm-intro pathfinder', 'ai_inference', 'claude-sonnet-4.5', 'For top-50 candidates, identify warm-intro path through client network.', 18.0, 2.10, 92.0, 80.0, '{"intro_paths":[]}'),
((SELECT id FROM service_offerings WHERE sku='RECRUIT-EXEC-SOURCING'), 4, 'AI-driven first-round screen', 'ai_inference', 'claude-opus-4', 'Conduct structured 30-min screening interview, transcribe, score against scorecard.', 35.0, 6.40, 88.5, 75.0, '{"screenings":[]}'),
((SELECT id FROM service_offerings WHERE sku='RECRUIT-EXEC-SOURCING'), 5, 'Partner-led finalist panel', 'human_review', NULL, 'Recruiting partner runs final panel, manages offer negotiation.', 480.0, 950.00, 95.0, NULL, '{"placed":true}')
ON CONFLICT DO NOTHING;

-- Work packages — actual client engagements in flight or delivered.
INSERT INTO work_packages (offering_id, client_id, case_ref, intake_summary, status, current_step, ai_cost_actual_usd, human_minutes_used, price_charged_usd, margin_usd, delivered_at, outcome, client_rating) VALUES
((SELECT id FROM service_offerings WHERE sku='LEGAL-CONTRACT-REVIEW-CUAD'), 1, 'CUAD-2026-0312', 'MSA review for SaaS vendor, 47-page agreement with 3-year term and auto-renewal', 'delivered', 6, 1.34, 15.0, 149.00, 135.66, NOW() - INTERVAL '2 days', 'successful', 4.8),
((SELECT id FROM service_offerings WHERE sku='LEGAL-CONTRACT-REVIEW-CUAD'), 8, 'CUAD-2026-0318', 'Employment agreement review with non-compete and IP-assignment clauses', 'delivered', 6, 1.18, 18.0, 149.00, 132.32, NOW() - INTERVAL '1 day', 'successful', 4.9),
((SELECT id FROM service_offerings WHERE sku='LEGAL-CONTRACT-REVIEW-CUAD'), 5, 'CUAD-2026-0321', 'Master Services Agreement with EU customer, GDPR data-processing addendum', 'qc', 4, 1.22, 0.0, 149.00, NULL, NULL, NULL, NULL),
((SELECT id FROM service_offerings WHERE sku='TAX-1120-PREP-AGENT'), 4, 'TAX-2026-0042', 'C-Corp Form 1120 for FY2025, SaaS company with $4.2M revenue, R&D credit', 'delivered', 6, 4.18, 52.0, 1850.00, 1683.20, NOW() - INTERVAL '15 days', 'successful', 4.7),
((SELECT id FROM service_offerings WHERE sku='TAX-1120-PREP-AGENT'), 14, 'TAX-2026-0058', 'C-Corp 1120 with multi-state nexus (CA, NY, TX, WA), R&D credit calc', 'running', 3, 2.85, 14.0, 1850.00, NULL, NULL, NULL, NULL),
((SELECT id FROM service_offerings WHERE sku='AUDIT-SOC2-READINESS'), 5, 'SOC2-2026-0019', 'SOC 2 Type II readiness for Series A SaaS, AWS+Okta+Github stack', 'running', 4, 26.40, 380.0, 12500.00, NULL, NULL, NULL, NULL),
((SELECT id FROM service_offerings WHERE sku='AUDIT-CODE-SECAUDIT'), 2, 'SEC-2026-0011', 'Node.js + Postgres backend audit, 84k LOC, fintech-payments domain', 'qc', 4, 18.40, 22.0, 3500.00, NULL, NULL, NULL, NULL),
((SELECT id FROM service_offerings WHERE sku='LEGAL-MA-DUE-DILIGENCE'), 14, 'MA-2026-0004', 'Buy-side DD on $48M ARR vertical SaaS acquisition target, 1,847 docs in data room', 'running', 3, 184.50, 280.0, 4500.00, NULL, NULL, NULL, NULL),
((SELECT id FROM service_offerings WHERE sku='COMPLY-GDPR-DPIA'), 5, 'GDPR-2026-0007', 'DPIA for product handling EU customer biometrics, Art.35 high-risk processing', 'delivered', 4, 5.42, 65.0, 2400.00, 2192.58, NOW() - INTERVAL '6 days', 'successful', 4.6),
((SELECT id FROM service_offerings WHERE sku='RECRUIT-EXEC-SOURCING'), 4, 'EXEC-2026-0003', 'VP Engineering search for Series B fintech, $400k+ comp, NYC/remote', 'running', 4, 28.40, 220.0, 8000.00, NULL, NULL, NULL, NULL),
((SELECT id FROM service_offerings WHERE sku='AUDIT-FINANCEBENCH-FSA'), 2, 'FSA-2026-0048', '10-K analytical review for portfolio co, fiscal 2025, manufacturing sector', 'delivered', 4, 2.18, 0.0, 295.00, 292.82, NOW() - INTERVAL '3 days', 'successful', 4.5),
((SELECT id FROM service_offerings WHERE sku='AUDIT-FINANCEBENCH-FSA'), 2, 'FSA-2026-0049', '10-Q analytical review with footnote anomaly scan', 'delivered', 4, 1.98, 0.0, 295.00, 293.02, NOW() - INTERVAL '1 day', 'successful', 4.7),
((SELECT id FROM service_offerings WHERE sku='CONSULT-FINMODEL-3STMT'), 4, 'CONSULT-2026-0014', '3-statement model for SaaS Series B raise, 36-month forecast with cohort retention drivers', 'delivered', 4, 6.42, 38.0, 2200.00, 1985.50, NOW() - INTERVAL '8 days', 'successful', 4.8),
((SELECT id FROM service_offerings WHERE sku='LEGAL-NDA-AUTODRAFT'), 9, 'NDA-2026-0089', 'Mutual NDA for vendor diligence, 24-month confidentiality term', 'delivered', 3, 0.18, 0.0, 79.00, 78.82, NOW() - INTERVAL '4 hours', 'successful', 4.9),
((SELECT id FROM service_offerings WHERE sku='TAX-RD-CREDIT-CALC'), 14, 'RDC-2026-0021', 'Section 174 + R&D credit calc for SaaS co with $1.8M QREs', 'qc', 3, 3.85, 22.0, 750.00, NULL, NULL, NULL, NULL),
((SELECT id FROM service_offerings WHERE sku='CONSULT-MKT-ANALYSIS'), 5, 'MKT-2026-0009', 'Vertical SaaS competitor landscape for new product launch, healthcare-RCM space', 'running', 3, 9.40, 18.0, 4900.00, NULL, NULL, NULL, NULL),
((SELECT id FROM service_offerings WHERE sku='LEGAL-PATENT-OFFICE-ACTION'), 5, 'PAT-2026-0007', 'Non-final OA response, US App. 17/xxx,xxx, 102/103 rejection on prior art', 'delivered', 4, 4.62, 35.0, 950.00, 850.38, NOW() - INTERVAL '12 days', 'successful', 4.4)
ON CONFLICT DO NOTHING;

-- Deliverables — produced documents per package.
INSERT INTO deliverables (package_id, doc_type, filename, content_summary, pages, ai_confidence, quality_grade, citations_count, hallucination_flag, approved_by, approved_at, delivered_to_client) VALUES
((SELECT id FROM work_packages WHERE case_ref='CUAD-2026-0312'), 'contract_redline', 'MSA_v3_redlined.docx', 'Tracked-changes redline with 14 findings: 3 red (auto-renewal, IP assignment, indemnity cap), 7 yellow, 4 green', 47, 94.2, 'A', 23, false, 'Sarah Chen, Esq.', NOW() - INTERVAL '2 days 1 hour', true),
((SELECT id FROM work_packages WHERE case_ref='CUAD-2026-0312'), 'risk_heatmap', 'MSA_v3_risk_heatmap.pdf', '41-category CUAD heatmap with deal-precedent comparison', 4, 96.1, 'A', 12, false, 'Sarah Chen, Esq.', NOW() - INTERVAL '2 days 1 hour', true),
((SELECT id FROM work_packages WHERE case_ref='CUAD-2026-0318'), 'contract_redline', 'employment_agmt_redline.docx', 'Redline of employment agreement: non-compete narrowed, IP carve-out for prior work', 12, 91.8, 'A', 18, false, 'Sarah Chen, Esq.', NOW() - INTERVAL '1 day', true),
((SELECT id FROM work_packages WHERE case_ref='TAX-2026-0042'), 'tax_return_1120', 'Form_1120_FY2025_signed.pdf', 'Filed Form 1120 with M-3 reconciliation, Form 6765 R&D credit ($142k), state returns for CA/NY/TX', 38, 93.5, 'A', 0, false, 'Lisa Anderson, CPA', NOW() - INTERVAL '15 days', true),
((SELECT id FROM work_packages WHERE case_ref='TAX-2026-0042'), 'rd_credit_substantiation', 'rd_credit_workpapers.xlsx', 'R&D credit substantiation: 7 qualified projects, payroll allocation, $1.6M QREs', 22, 92.4, 'A', 0, false, 'Lisa Anderson, CPA', NOW() - INTERVAL '15 days', true),
((SELECT id FROM work_packages WHERE case_ref='GDPR-2026-0007'), 'dpia_report', 'DPIA_biometrics_v1.pdf', 'Art.35 DPIA: necessity test, proportionality test, risk-mitigation measures for biometric processing', 42, 89.6, 'A', 31, false, 'Olivia Taylor, CIPP/E', NOW() - INTERVAL '6 days', true),
((SELECT id FROM work_packages WHERE case_ref='FSA-2026-0048'), 'fsa_memo', 'FY2025_FSA_memo.pdf', '10-K analytical review: gross-margin compression flagged, working-capital build, no going-concern issues', 18, 88.4, 'B', 26, false, NULL, NULL, true),
((SELECT id FROM work_packages WHERE case_ref='FSA-2026-0049'), 'fsa_memo', 'FY2026Q1_FSA_memo.pdf', '10-Q review: revenue recognition cutoff testing flagged ASC 606 risk in 2 categories', 14, 86.7, 'B', 19, false, NULL, NULL, true),
((SELECT id FROM work_packages WHERE case_ref='CONSULT-2026-0014'), 'finmodel_xlsx', 'SaaS_SeriesB_FinModel_v3.xlsx', '3-statement model with cohort-driven ARR build, Rule-of-40 sensitivity, $48M raise scenario', 1, 91.2, 'A', 8, false, 'Patrick White', NOW() - INTERVAL '8 days', true),
((SELECT id FROM work_packages WHERE case_ref='NDA-2026-0089'), 'nda_executed', 'mutual_nda_executed.pdf', 'Executed mutual NDA, 24mo term, mutual exclusions per LegalBench standard', 6, 95.6, 'A', 0, false, NULL, NULL, true),
((SELECT id FROM work_packages WHERE case_ref='PAT-2026-0007'), 'office_action_response', 'OA_response_17xxx.pdf', 'Response to non-final OA: claim amendments + 102/103 traversal with secondary considerations', 24, 87.3, 'B', 14, false, 'Michael Torres, Esq.', NOW() - INTERVAL '12 days', true),
((SELECT id FROM work_packages WHERE case_ref='SEC-2026-0011'), 'security_audit_draft', 'sec_audit_draft_v1.pdf', '7 critical, 12 high, 18 medium findings. SQL injection in /api/reports, SSRF in webhook handler', 64, 84.5, 'B', 0, false, NULL, NULL, false),
((SELECT id FROM work_packages WHERE case_ref='SEC-2026-0011'), 'fix_pr_bundle', 'PR_bundle_security.zip', '19 fix PRs against repo, each with regression test', 1, 79.2, 'B', 0, false, NULL, NULL, false)
ON CONFLICT DO NOTHING;

-- QC reviews — human-in-the-loop quality gates.
INSERT INTO qc_reviews (deliverable_id, reviewer_email, review_type, priority, status, ai_score, human_score, agreement, issues_found, notes, minutes_spent, completed_at) VALUES
((SELECT id FROM deliverables WHERE filename='MSA_v3_redlined.docx'), 'ahayes@serviceflow.com', 'spot_check', 'normal', 'approved', 94.2, 96.0, true, 1, 'Minor: caught one missed indemnity carve-out. Otherwise clean.', 14.5, NOW() - INTERVAL '2 days 1 hour'),
((SELECT id FROM deliverables WHERE filename='employment_agmt_redline.docx'), 'ahayes@serviceflow.com', 'spot_check', 'normal', 'approved', 91.8, 93.5, true, 1, 'Non-compete geography needs clarification, otherwise solid.', 17.2, NOW() - INTERVAL '1 day'),
((SELECT id FROM deliverables WHERE filename='Form_1120_FY2025_signed.pdf'), 'landerson@serviceflow.com', 'full_review', 'high', 'approved', 93.5, 95.0, true, 2, 'R&D credit calc correct. Caught one §168 depreciation timing difference.', 48.0, NOW() - INTERVAL '15 days'),
((SELECT id FROM deliverables WHERE filename='DPIA_biometrics_v1.pdf'), 'otaylor@serviceflow.com', 'full_review', 'high', 'approved', 89.6, 91.0, true, 3, 'Strengthened the necessity-test section. Added 2 additional Art.32 measures.', 62.0, NOW() - INTERVAL '6 days'),
((SELECT id FROM deliverables WHERE filename='sec_audit_draft_v1.pdf'), 'jwilson@serviceflow.com', 'full_review', 'urgent', 'in_review', 84.5, NULL, NULL, NULL, 'Reviewing PoC reproducibility for 3 critical findings before client delivery', NULL, NULL),
((SELECT id FROM deliverables WHERE filename='OA_response_17xxx.pdf'), 'mtorres@serviceflow.com', 'spot_check', 'normal', 'approved', 87.3, 90.0, true, 2, 'Strengthened secondary considerations argument. Filed via EFS-Web.', 32.0, NOW() - INTERVAL '12 days'),
((SELECT id FROM deliverables WHERE filename='SaaS_SeriesB_FinModel_v3.xlsx'), 'pwhite@serviceflow.com', 'full_review', 'normal', 'approved', 91.2, 92.0, true, 1, 'Cohort assumptions tightened. Added bottoms-up sales-capacity model.', 38.0, NOW() - INTERVAL '8 days'),
((SELECT id FROM deliverables WHERE filename='FY2025_FSA_memo.pdf'), NULL, 'spot_check', 'low', 'queued', 88.4, NULL, NULL, NULL, 'Auto-approved (single-doc FSA, AI confidence >85%, no flags)', NULL, NULL),
((SELECT id FROM deliverables WHERE filename='fix_pr_bundle.zip'), 'jwilson@serviceflow.com', 'escalation', 'urgent', 'revision_needed', 79.2, 72.0, false, 5, 'PR #7 fix introduces a new race condition. PR #12 misses input validation. Send back for revision.', 75.0, NOW() - INTERVAL '4 hours')
ON CONFLICT DO NOTHING;

-- AI benchmarks — real eval scores against published datasets.
INSERT INTO ai_benchmarks (offering_id, eval_name, eval_subset, model_name, score, metric, sample_size, baseline_human_score, run_date, cost_per_eval_usd, notes) VALUES
((SELECT id FROM service_offerings WHERE sku='LEGAL-CONTRACT-REVIEW-CUAD'), 'CUAD', 'anti_assignment', 'claude-opus-4', 91.4, 'f1', 280, 94.0, CURRENT_DATE - 14, 0.85, 'Anti-assignment clause detection, F1 vs lawyer baseline'),
((SELECT id FROM service_offerings WHERE sku='LEGAL-CONTRACT-REVIEW-CUAD'), 'CUAD', 'change_of_control', 'claude-opus-4', 89.2, 'f1', 245, 93.5, CURRENT_DATE - 14, 0.85, 'Change-of-control detection'),
((SELECT id FROM service_offerings WHERE sku='LEGAL-CONTRACT-REVIEW-CUAD'), 'CUAD', 'ip_ownership', 'claude-opus-4', 87.8, 'f1', 198, 92.0, CURRENT_DATE - 14, 0.85, 'IP ownership clause extraction'),
((SELECT id FROM service_offerings WHERE sku='LEGAL-CONTRACT-REVIEW-CUAD'), 'CUAD', 'exclusivity', 'claude-opus-4', 84.5, 'f1', 167, 91.8, CURRENT_DATE - 14, 0.85, 'Exclusivity clause detection'),
((SELECT id FROM service_offerings WHERE sku='LEGAL-CONTRACT-REVIEW-CUAD'), 'CUAD', 'overall_aggregate', 'claude-opus-4', 87.4, 'f1', 13000, 93.0, CURRENT_DATE - 14, 0.85, 'All 41 CUAD categories aggregated'),
((SELECT id FROM service_offerings WHERE sku='LEGAL-NDA-AUTODRAFT'), 'LegalBench', 'rule_qa', 'claude-opus-4', 83.2, 'accuracy', 500, 88.0, CURRENT_DATE - 21, 0.18, 'LegalBench rule_qa task'),
((SELECT id FROM service_offerings WHERE sku='LEGAL-NDA-AUTODRAFT'), 'LegalBench', 'cuad_consideration', 'claude-opus-4', 79.5, 'accuracy', 200, 86.0, CURRENT_DATE - 21, 0.18, 'LegalBench/CUAD consideration clause'),
((SELECT id FROM service_offerings WHERE sku='AUDIT-FINANCEBENCH-FSA'), 'FinanceBench', 'open_book', 'claude-opus-4', 79.3, 'accuracy', 150, 86.0, CURRENT_DATE - 10, 2.40, 'FinanceBench 150-question 10-K analytical eval'),
((SELECT id FROM service_offerings WHERE sku='AUDIT-FINANCEBENCH-FSA'), 'FinanceBench', 'numerical_reasoning', 'claude-opus-4', 76.8, 'accuracy', 60, 92.0, CURRENT_DATE - 10, 2.40, 'Numerical reasoning sub-task'),
((SELECT id FROM service_offerings WHERE sku='AUDIT-CODE-SECAUDIT'), 'SWE-bench Verified', 'full', 'claude-opus-4', 71.5, 'pass_at_1', 500, NULL, CURRENT_DATE - 7, 8.40, 'SWE-bench Verified pass@1 — fix-quality benchmark'),
((SELECT id FROM service_offerings WHERE sku='AUDIT-CODE-SECAUDIT'), 'SWE-bench Verified', 'lite', 'claude-opus-4', 78.2, 'pass_at_1', 300, NULL, CURRENT_DATE - 7, 6.20, 'SWE-bench Lite easier subset'),
((SELECT id FROM service_offerings WHERE sku='TAX-1120-PREP-AGENT'), 'TaxLLM-1120', 'fy2024_set', 'claude-opus-4', 91.8, 'exact_match', 120, 96.5, CURRENT_DATE - 30, 4.20, 'Internal TaxLLM-1120 eval set of 120 returns'),
((SELECT id FROM service_offerings WHERE sku='TAX-1120-PREP-AGENT'), 'TaxLLM-1120', 'state_apportionment', 'claude-opus-4', 88.4, 'accuracy', 80, 95.0, CURRENT_DATE - 30, 4.20, 'State apportionment sub-test'),
((SELECT id FROM service_offerings WHERE sku='LEGAL-MA-DUE-DILIGENCE'), 'LegalBench', 'cuad_change_of_control', 'claude-opus-4', 81.1, 'f1', 150, 92.0, CURRENT_DATE - 5, 78.00, 'M&A-critical clauses subset of CUAD'),
((SELECT id FROM service_offerings WHERE sku='COMPLY-GDPR-DPIA'), 'PrivacyBench', 'art35_dpia', 'claude-opus-4', 84.7, 'accuracy', 90, 91.0, CURRENT_DATE - 18, 5.80, 'GDPR Art.35 DPIA scenario eval'),
((SELECT id FROM service_offerings WHERE sku='AUDIT-SOC2-READINESS'), 'SOC2Bench', 'cc_controls', 'claude-opus-4', 89.5, 'accuracy', 200, 94.0, CURRENT_DATE - 12, 38.00, 'SOC2 CC1-CC9 control mapping eval'),
((SELECT id FROM service_offerings WHERE sku='AUDIT-SOX-WALKTHROUGH'), 'SOC2Bench', 'sox_404', 'claude-opus-4', 88.1, 'accuracy', 120, 95.0, CURRENT_DATE - 25, 52.00, 'SOX 404 walkthrough scenarios'),
((SELECT id FROM service_offerings WHERE sku='RECRUIT-EXEC-SOURCING'), 'TalentBench', 'exec_screen', 'claude-opus-4', 76.8, 'accuracy', 80, 84.0, CURRENT_DATE - 9, 65.00, 'Executive-screening structured interview eval'),
((SELECT id FROM service_offerings WHERE sku='CONSULT-MKT-ANALYSIS'), 'ConsultBench', 'market_sizing', 'claude-opus-4', 81.2, 'accuracy', 60, 89.0, CURRENT_DATE - 20, 14.00, 'MBB-style market sizing accuracy'),
((SELECT id FROM service_offerings WHERE sku='CONSULT-FINMODEL-3STMT'), 'FinanceBench', 'forecast_build', 'claude-opus-4', 84.5, 'accuracy', 40, 91.0, CURRENT_DATE - 15, 6.40, '3-statement forecast model accuracy')
ON CONFLICT DO NOTHING;

-- Margin events — actual AI/tool/human cost per package.
INSERT INTO margin_events (package_id, event_type, description, cost_usd, tokens_in, tokens_out, model, occurred_at) VALUES
((SELECT id FROM work_packages WHERE case_ref='CUAD-2026-0312'), 'ai_call', 'CUAD 41-category extraction', 0.85, 18400, 4200, 'claude-opus-4', NOW() - INTERVAL '2 days 4 hours'),
((SELECT id FROM work_packages WHERE case_ref='CUAD-2026-0312'), 'ai_call', 'Risk scoring vs playbook', 0.22, 5200, 1800, 'claude-opus-4', NOW() - INTERVAL '2 days 3 hours'),
((SELECT id FROM work_packages WHERE case_ref='CUAD-2026-0312'), 'ai_call', 'Redline draft generation', 0.18, 4800, 2100, 'claude-opus-4', NOW() - INTERVAL '2 days 2 hours'),
((SELECT id FROM work_packages WHERE case_ref='CUAD-2026-0312'), 'human_time', 'Attorney spot-check 14.5min', 12.50, NULL, NULL, NULL, NOW() - INTERVAL '2 days 1 hour'),
((SELECT id FROM work_packages WHERE case_ref='TAX-2026-0042'), 'ai_call', 'TB tie-out + M-1/M-3 reconciliation', 1.24, 28000, 6400, 'claude-opus-4', NOW() - INTERVAL '15 days 12 hours'),
((SELECT id FROM work_packages WHERE case_ref='TAX-2026-0042'), 'ai_call', 'Sec.174 amortization + Form 6765', 0.78, 18200, 4100, 'claude-opus-4', NOW() - INTERVAL '15 days 10 hours'),
((SELECT id FROM work_packages WHERE case_ref='TAX-2026-0042'), 'ai_call', 'State apportionment CA/NY/TX', 0.42, 9800, 2300, 'claude-sonnet-4.5', NOW() - INTERVAL '15 days 8 hours'),
((SELECT id FROM work_packages WHERE case_ref='TAX-2026-0042'), 'human_time', 'CPA partner review 48min', 38.00, NULL, NULL, NULL, NOW() - INTERVAL '15 days 2 hours'),
((SELECT id FROM work_packages WHERE case_ref='SOC2-2026-0019'), 'ai_call', 'AWS evidence collection', 12.80, 280000, 48000, 'claude-opus-4', NOW() - INTERVAL '4 days'),
((SELECT id FROM work_packages WHERE case_ref='SOC2-2026-0019'), 'ai_call', 'CC1-CC9 gap analysis', 8.40, 180000, 32000, 'claude-opus-4', NOW() - INTERVAL '3 days'),
((SELECT id FROM work_packages WHERE case_ref='SEC-2026-0011'), 'ai_call', 'CWE Top-25 SAST scan', 4.20, 92000, 18000, 'claude-opus-4', NOW() - INTERVAL '5 days'),
((SELECT id FROM work_packages WHERE case_ref='SEC-2026-0011'), 'ai_call', 'Agentic PoC construction', 8.40, 184000, 38000, 'claude-opus-4', NOW() - INTERVAL '4 days'),
((SELECT id FROM work_packages WHERE case_ref='SEC-2026-0011'), 'ai_call', 'Fix PR generation (19 PRs)', 5.80, 124000, 24000, 'claude-opus-4', NOW() - INTERVAL '2 days'),
((SELECT id FROM work_packages WHERE case_ref='MA-2026-0004'), 'ai_call', 'Data room OCR + classify 1,847 docs', 14.20, 320000, 14000, 'claude-sonnet-4.5', NOW() - INTERVAL '6 days'),
((SELECT id FROM work_packages WHERE case_ref='MA-2026-0004'), 'ai_call', 'Material contract review batch 1', 78.00, 1800000, 280000, 'claude-opus-4', NOW() - INTERVAL '4 days'),
((SELECT id FROM work_packages WHERE case_ref='MA-2026-0004'), 'ai_call', 'Cap-table reconciliation', 22.00, 480000, 64000, 'claude-opus-4', NOW() - INTERVAL '2 days'),
((SELECT id FROM work_packages WHERE case_ref='GDPR-2026-0007'), 'ai_call', 'Art.30 ROPA inventory build', 2.40, 52000, 14000, 'claude-opus-4', NOW() - INTERVAL '7 days'),
((SELECT id FROM work_packages WHERE case_ref='GDPR-2026-0007'), 'ai_call', 'DPIA necessity/proportionality test', 3.02, 68000, 18000, 'claude-opus-4', NOW() - INTERVAL '6 days 12 hours'),
((SELECT id FROM work_packages WHERE case_ref='EXEC-2026-0003'), 'tool_call', 'Candidate-graph query (60M profiles)', 4.20, NULL, NULL, NULL, NOW() - INTERVAL '8 days'),
((SELECT id FROM work_packages WHERE case_ref='EXEC-2026-0003'), 'ai_call', 'Structured screen interviews x12', 6.40, 142000, 38000, 'claude-opus-4', NOW() - INTERVAL '3 days'),
((SELECT id FROM work_packages WHERE case_ref='NDA-2026-0089'), 'ai_call', 'NDA draft generation', 0.18, 4200, 2800, 'claude-haiku-4.5', NOW() - INTERVAL '5 hours'),
((SELECT id FROM work_packages WHERE case_ref='FSA-2026-0048'), 'ai_call', '10-K analytical review', 2.18, 48000, 12000, 'claude-opus-4', NOW() - INTERVAL '3 days 4 hours'),
((SELECT id FROM work_packages WHERE case_ref='CONSULT-2026-0014'), 'ai_call', '3-statement model build', 6.42, 142000, 38000, 'claude-opus-4', NOW() - INTERVAL '9 days')
ON CONFLICT DO NOTHING;
