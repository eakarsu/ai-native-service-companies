# ServiceFlow Audit Notes

## Feature add (8 features)

Added 5 AI features and 3 utility features. All endpoints follow the existing
JWT-bearer pattern (`middleware/auth.js`) and return `503` when
`OPENROUTER_API_KEY` is missing/placeholder. No existing routes or pages were
modified except for additive registration.

### Backend
- **Route file:** `backend/routes/features.js` (new)
- **Mounted at:** `app.use('/api', require('./routes/features'))` in
  `backend/server.js`
- **Schema:** `backend/db/schema.sql` extended with `audit_log` table + 2
  indexes (idempotent `IF NOT EXISTS`). Table was created live in
  `services_db`.

### AI features (5)
| # | Endpoint | Purpose |
|---|----------|---------|
| 1 | `POST /api/ai/churn-predictor` | Client churn probability + retention plays |
| 2 | `POST /api/ai/time-estimator` | Best/likely/worst-case service-time estimate using templates + historical actuals |
| 3 | `POST /api/ai/sentiment-classifier` | Complaint sentiment, urgency, intent (text required) |
| 4 | `POST /api/ai/invoice-anomaly` | Invoice anomaly detection vs peer history |
| 5 | `POST /api/ai/smart-dispatch` | Pick optimal staff member for a task |

### Utility features (3)
| # | Endpoint(s) | Purpose |
|---|-------------|---------|
| 1 | `GET /api/export/:entity` (clients/tasks/invoices/staff/slas/templates) | CSV export, up to 5,000 rows |
| 2 | `GET /api/search?q=&entity=&status=&tier=` | Cross-entity search + filter |
| 3 | `GET/POST /api/audit-log` | Append/read audit trail (auto-written by AI/search/export endpoints) |

### Frontend
- New API methods added to `frontend/src/api.ts` (no removals).
- New pages:
  - `components/AILab.tsx` -> `/ai-lab` (5 AI tools)
  - `components/CSVExport.tsx` -> `/export`
  - `components/SearchPage.tsx` -> `/search`
  - `components/AuditLogPage.tsx` -> `/audit-log`
- Routes wired in `App.tsx`.
- Sidebar updated in `components/Layout.tsx` with new "AI Lab" entry under
  AI Tools and a new "Utilities" section.

### Smoke test (port 3003, admin@demo.com / demo123)
- `POST /api/auth/login` -> token OK
- `GET /api/audit-log` -> initial empty array, then populated after activity
- `GET /api/search?q=morrison` -> 1 client match (James Morrison)
- `GET /api/export/clients` -> CSV with 15 rows + header
- All 5 AI endpoints respond `503 {"error":"AI service not configured..."}`
  when `OPENROUTER_API_KEY` is the placeholder (expected, graceful)
- `POST /api/ai/sentiment-classifier` with empty body -> `400 text is required`
- Unauthenticated request -> `401`
- Backend `node --check` and frontend `tsc --noEmit` both pass clean

### Constraints honoured
- No `npm install` performed
- No existing route, page or table altered
- All new writes syntax-checked
- AI key absence handled with 503 (no crash, no leaked stack)

## Sample Data feature (2026-05-07)

Added a Sample Data admin page with one button per main entity. Each button
calls a JWT-protected backend endpoint that inserts 5-10 domain-realistic
service-business rows.

### Backend
- **Route file:** `backend/routes/sample_data.js` (new)
- **Mounted at:** `app.use('/api/admin', require('./routes/sample_data'))`
- **Endpoint:** `POST /api/admin/sample-data/:entity` (JWT-protected)
- **Allowed entities:** `clients`, `staff`, `tasks`, `invoices`, `slas`,
  `templates` (skips `users` and `audit_log` per spec)
- **Returns:** `{ inserted, entity }`
- **Realism:** Acme Plumbing Co, Bluewave HVAC, Sparkline Electrical LLC,
  field plumbers / master electricians / dispatch coordinators, real ticket
  descriptions, mixed-status invoices, per-service-type SLAs and templates.
- Tasks / invoices / SLAs return `409` with a clear message if no clients
  exist yet (prevents FK violations, gives the UI a hint).
- Emits an `audit_log` entry (`sample_data.seed`) per seed run.

### Frontend
- New page `frontend/src/pages/SampleDataPage.tsx` with 6 buttons (one per
  entity), JWT bearer via shared `api.ts` helper, toast + per-entity counter
  + session total.
- `frontend/src/api.ts`: added `seedSampleData(entity)` helper.
- `frontend/src/App.tsx`: route `/sample-data` registered.
- `frontend/src/components/Layout.tsx`: sidebar entry under "Utilities" with
  `Database` icon.

### Smoke test (port 3003, admin@demo.com / demo123)
- Login -> token OK.
- `POST /api/admin/sample-data/clients` (no token) -> `401`.
- `POST /api/admin/sample-data/clients` -> `200 {"inserted":8,"entity":"clients"}`.
- `POST /api/admin/sample-data/users` -> `400` "Unsupported entity".
- Cleanup: deleted the 8 sample clients by their unique demo emails;
  baseline restored.

### Constraints honoured
- No `npm install` performed
- 128 existing features untouched (only additive lines in `server.js`,
  `App.tsx`, `Layout.tsx`, `api.ts`)
- `node --check` clean for backend; `tsc --noEmit` clean for frontend

## Sample-prefill buttons on AI pages (2026-05-07)

Added 3 sample-prefill buttons at the top of each AI feature page so demo
users can populate the forms in one click.

- **`frontend/src/components/AILab.tsx`** (5 AI tools - churn, time,
  sentiment, invoice anomaly, smart dispatch) - 3 samples:
  - "HVAC panel upgrade" (Bluewave HVAC, 200A panel upgrade, high)
  - "Plumbing emergency" (Acme Plumbing Co, broken disposal, urgent)
  - "Electrical retrofit" (Sparkline Electrical LLC, LED + GFCI, medium)
  Each sample sets `taskType`, `taskDesc`, `complaintText`, `priority`
  and best-effort matches loaded `client`/`task`/`invoice` dropdowns.
- **`frontend/src/components/AICenter.tsx`** (4 AI tools - routing,
  quality, insights, sla risk) - 3 samples ("Acme plumbing case",
  "Bluewave HVAC case", "Sparkline electrical") that select matching
  rows in the task/staff/client/sla dropdowns.

No existing run logic, request payloads, AI endpoints, or other pages
modified. `npx tsc --noEmit` clean; `npx vite build` succeeds (1501
modules, 307 kB bundle); login on port 3003 with admin@demo.com /
demo123 returns a JWT. Detailed log:
`_AUDIT/apply3_logs/samples_ai-native-service-companies.md`.

## Dashboard page (2026-05-07)

Added a domain-appropriate Dashboard as the first sidebar entry and
post-login landing route.

### Backend
- **New file:** `backend/routes/dashboard.js`
- **Mounted at:** `app.use('/api/dashboard', require('./routes/dashboard'))`
  (one additive line in `server.js`).
- **Endpoint:** `GET /api/dashboard/stats` (JWT-protected). Returns
  KPI counts (clients, open tasks, scheduled jobs, overdue invoices,
  technicians) plus the 10 newest `audit_log` rows. Each query is
  individually try/caught so a missing table never 500s.

### Frontend
- **New file:** `frontend/src/components/Dashboard.tsx` - 5 KPI cards,
  Recent Activity table, Quick Actions panel (AI Lab, Search, Sample
  Data, Export CSV).
- `components/Layout.tsx`: prepended Dashboard to `navItems` with the
  `LayoutDashboard` icon (first sidebar entry).
- `App.tsx`: registered `/dashboard` route and changed the default
  landing from `/clients` to `/dashboard`.

### Smoke test (port 3003, admin@demo.com / demo123)
- Login -> JWT OK.
- `GET /api/dashboard/stats` with bearer -> **200** with full KPI
  payload (15 clients / 3 open / 10 scheduled / 1 overdue / 15 staff)
  plus 3 recent audit entries.
- `GET /api/dashboard/stats` (no token / bad token) -> **401**.
- Backend killed, port freed.

### Constraints honoured
- No `npm install` performed.
- No existing route, page, schema, or DB row altered.
- `node --check` clean for new + edited backend files; `npx tsc --noEmit`
  clean for frontend.
- Detailed log:
  `_AUDIT/apply3_logs/dashboard_ai-native-service-companies.md`.

## AI sidebar merge (2026-05-07)

Consolidated the two parallel AI sidebar entries (`/ai-center` and
`/ai-lab`) into a single "AI Center" entry with two in-page tabs. The
sidebar now shows only one AI item, removing the user confusion of
two near-identical AI links.

### Changes
- **`frontend/src/components/AICenter.tsx`** — rewritten with a tabbed
  layout:
  - "Operations" tab: original 4 tools (Task Routing, Quality Review,
    Client Insights, SLA Risk) plus the 3 operations samples.
  - "Lab" tab: 5 tools migrated from AILab (Churn Predictor,
    Service-Time Estimator, Sentiment Classifier, Invoice Anomaly
    Detector, Smart Dispatch) plus the 3 lab samples. UI form
    structure, labels, placeholders, prefill behaviour, and API
    call wiring preserved verbatim.
- **`frontend/src/components/Layout.tsx`** — removed the `/ai-lab`
  entry from `aiItems`; dropped the now-unused `Brain` icon import.
- **`frontend/src/App.tsx`** — dropped `import AILab`; the `/ai-lab`
  route now resolves to `<Navigate to="/ai-center" replace />` so
  bookmarks/links keep working.
- **`frontend/src/components/Dashboard.tsx`** — Quick Actions tile
  that pointed at `/ai-lab` now points at `/ai-center` (label
  refreshed accordingly).
- `AILab.tsx` left on disk but no longer imported (safe-delete
  candidate for a follow-up).

### Smoke test (port 3003, admin@demo.com / demo123)
- `pkill -9` cleanup → ports freed.
- `./start.sh` boots backend on 3003 and Vite on 5174.
- `POST /api/auth/login` → **200** with JWT.
- `npx tsc --noEmit` clean; `npx vite build` clean (1501 modules,
  315 kB JS bundle).
- Cleanup `pkill -9` → ports freed.

### Constraints honoured
- No `npm install`.
- All existing AI endpoints, sample-prefill buttons and auth flow
  preserved.
- Styling matches existing Tailwind patterns.
- Detailed log:
  `_AUDIT/apply3_logs/merge_ai_ai-native-service-companies.md`.
