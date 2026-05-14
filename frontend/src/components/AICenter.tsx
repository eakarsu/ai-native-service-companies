import { useState, useEffect } from 'react';
import { Sparkles, Route, ClipboardCheck, Users, ShieldAlert, Brain, TrendingDown, Clock, MessageSquareWarning, Receipt, Send } from 'lucide-react';
import { api } from '../api';
import AIResponse from './AIResponse';

const operationsTools = [
  { key: 'route', icon: Route, label: 'Task Routing', desc: 'AI recommends optimal staff assignment for a task', color: 'from-blue-500 to-blue-600' },
  { key: 'quality', icon: ClipboardCheck, label: 'Quality Review', desc: 'Analyze staff performance and suggest improvements', color: 'from-violet-500 to-purple-600' },
  { key: 'insights', icon: Users, label: 'Client Insights', desc: 'Deep analysis of client relationship and opportunities', color: 'from-emerald-500 to-green-600' },
  { key: 'sla', icon: ShieldAlert, label: 'SLA Risk', desc: 'Identify SLA compliance risks before they escalate', color: 'from-orange-500 to-red-500' },
];

const labTools = [
  { key: 'churn', icon: TrendingDown, label: 'Churn Predictor', desc: 'Predict client churn risk and recommend retention plays', color: 'from-rose-500 to-red-600' },
  { key: 'time', icon: Clock, label: 'Service-Time Estimator', desc: 'Estimate effort for a service task', color: 'from-amber-500 to-orange-600' },
  { key: 'sentiment', icon: MessageSquareWarning, label: 'Sentiment Classifier', desc: 'Classify complaint sentiment, urgency and intent', color: 'from-fuchsia-500 to-pink-600' },
  { key: 'invoice', icon: Receipt, label: 'Invoice Anomaly Detector', desc: 'Spot suspicious or anomalous invoices', color: 'from-teal-500 to-emerald-600' },
  { key: 'dispatch', icon: Send, label: 'Smart Dispatch', desc: 'Pick the optimal staff member for a task', color: 'from-indigo-500 to-blue-700' },
];

type CenterSample = {
  label: string;
  values: {
    taskHint?: string;
    staffHint?: string;
    clientHint?: string;
    slaHint?: string;
  };
};

const operationsSamples: CenterSample[] = [
  {
    label: 'Acme plumbing case',
    values: {
      taskHint: 'plumbing',
      staffHint: 'plumber',
      clientHint: 'Acme',
      slaHint: 'plumbing',
    },
  },
  {
    label: 'Bluewave HVAC case',
    values: {
      taskHint: 'hvac',
      staffHint: 'hvac',
      clientHint: 'Bluewave',
      slaHint: 'hvac',
    },
  },
  {
    label: 'Sparkline electrical',
    values: {
      taskHint: 'electrical',
      staffHint: 'electrician',
      clientHint: 'Sparkline',
      slaHint: 'electrical',
    },
  },
];

type LabSample = {
  label: string;
  values: {
    taskType?: string;
    taskDesc?: string;
    complaintText?: string;
    priority?: string;
    clientHint?: string;
    invoiceHint?: string;
    taskHint?: string;
  };
};

const labSamples: LabSample[] = [
  {
    label: 'HVAC panel upgrade',
    values: {
      taskType: 'hvac',
      taskDesc: '200A panel upgrade with new breakers at Bluewave HVAC main office; replace aging service mast and meter base, schedule utility cut for Tuesday.',
      complaintText: 'We agreed last week the technician would arrive Monday at 8am for the 200A upgrade. He showed up at 1pm with no warning. Our shop was offline for 4 hours. Very unhappy.',
      priority: 'high',
      clientHint: 'Bluewave',
      taskHint: 'panel',
      invoiceHint: 'overdue',
    },
  },
  {
    label: 'Plumbing emergency',
    values: {
      taskType: 'plumbing',
      taskDesc: 'Broken disposal in kitchen at Acme Plumbing Co warehouse breakroom; replace 3/4hp unit, reseal flange, test for leaks. Emergency callout.',
      complaintText: 'Called in a kitchen disposal emergency at 7am. Nobody dispatched until 3pm and the tech did not have a 3/4hp unit on the truck. Lost a full day of food prep.',
      priority: 'urgent',
      clientHint: 'Acme',
      taskHint: 'disposal',
      invoiceHint: 'sent',
    },
  },
  {
    label: 'Electrical retrofit',
    values: {
      taskType: 'electrical',
      taskDesc: 'Sparkline Electrical LLC needs LED retrofit across 14 office fixtures + new GFCI outlets in conference room. Quote includes permit + load calc.',
      complaintText: 'The retrofit quote came in 38% above the verbal estimate. We expected ~$4,200 and got billed $5,790. Need an itemized breakdown today.',
      priority: 'medium',
      clientHint: 'Sparkline',
      taskHint: 'retrofit',
      invoiceHint: 'paid',
    },
  },
];

export default function AICenter() {
  const [tab, setTab] = useState<'operations' | 'lab'>('operations');
  const [active, setActive] = useState<string | null>(null);
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [clients, setClients] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [slas, setSlas] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [selected, setSelected] = useState<Record<string, any>>({});
  const [complaintText, setComplaintText] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskType, setTaskType] = useState('');

  useEffect(() => {
    api.getClients().then(setClients).catch(() => {});
    api.getStaff().then(setStaff).catch(() => {});
    api.getTasks().then(setTasks).catch(() => {});
    api.getSLAs().then(setSlas).catch(() => {});
    api.getInvoices().then(setInvoices).catch(() => {});
  }, []);

  const findMatch = (rows: any[], hint: string, fields: string[]) => {
    const h = hint.toLowerCase();
    return rows.find(r =>
      fields.some(f => String(r[f] || '').toLowerCase().includes(h))
    );
  };

  const applyOperationsSample = (s: CenterSample) => {
    const next: Record<string, any> = { ...selected };
    if (s.values.taskHint) {
      const m = findMatch(tasks, s.values.taskHint, ['title', 'service_type', 'description']);
      if (m) next.task = String(m.id);
    }
    if (s.values.staffHint) {
      const m = findMatch(staff, s.values.staffHint, ['name', 'role', 'specialization']);
      if (m) next.staff = String(m.id);
    }
    if (s.values.clientHint) {
      const m = findMatch(clients, s.values.clientHint, ['name', 'company', 'industry']);
      if (m) next.client = String(m.id);
    }
    if (s.values.slaHint) {
      const m = findMatch(slas, s.values.slaHint, ['name', 'service_level', 'client_name']);
      if (m) next.sla = String(m.id);
    }
    setSelected(next);
    setResult('');
    setError('');
  };

  const applyLabSample = (s: LabSample) => {
    const v = s.values;
    if (v.taskType !== undefined) setTaskType(v.taskType);
    if (v.taskDesc !== undefined) setTaskDesc(v.taskDesc);
    if (v.complaintText !== undefined) setComplaintText(v.complaintText);
    const next: Record<string, any> = { ...selected };
    if (v.priority) next.priority = v.priority;
    if (v.clientHint) {
      const m = clients.find(c =>
        (c.name || '').toLowerCase().includes(v.clientHint!.toLowerCase()) ||
        (c.company || '').toLowerCase().includes(v.clientHint!.toLowerCase())
      );
      if (m) next.client = String(m.id);
    }
    if (v.taskHint) {
      const m = tasks.find(t =>
        (t.description || '').toLowerCase().includes(v.taskHint!.toLowerCase()) ||
        (t.service_type || '').toLowerCase().includes(v.taskHint!.toLowerCase())
      );
      if (m) next.task = String(m.id);
    }
    if (v.invoiceHint) {
      const m = invoices.find(i =>
        (i.status || '').toLowerCase().includes(v.invoiceHint!.toLowerCase())
      );
      if (m) next.invoice = String(m.id);
    }
    setSelected(next);
    setError('');
    setResult('');
  };

  const run = async (key: string) => {
    if (loading) return;
    setActive(key); setLoading(true); setResult(''); setError('');
    try {
      let r: any;
      if (key === 'route') {
        const task = tasks.find(t => t.id === parseInt(selected.task)) || tasks[0];
        r = await api.routeTask({ taskId: task?.id, title: task?.title, serviceType: task?.service_type, priority: task?.priority, estimatedHours: task?.estimated_hours });
      } else if (key === 'quality') {
        const s = staff.find(m => m.id === parseInt(selected.staff)) || staff[0];
        r = await api.qualityReview({ staffId: s?.id, name: s?.name, role: s?.role, activeTasks: s?.active_tasks, utilizationRate: s?.utilization_rate, performanceRating: s?.performance_rating });
      } else if (key === 'insights') {
        const c = clients.find(cl => cl.id === parseInt(selected.client)) || clients[0];
        r = await api.clientInsights({ clientId: c?.id, clientName: c?.name, company: c?.company, industry: c?.industry, tier: c?.tier, totalTasks: c?.total_tasks, satisfaction: c?.satisfaction_score });
      } else if (key === 'sla') {
        const sla = slas.find(s => s.id === parseInt(selected.sla)) || slas[0];
        r = await api.slaRisk({ slaId: sla?.id, name: sla?.name, serviceLevel: sla?.service_level, responseTime: sla?.response_time_hours, resolutionTime: sla?.resolution_time_hours, endDate: sla?.end_date, clientName: sla?.client_name });
      } else if (key === 'churn') {
        r = await api.churnPredictor({ client_id: selected.client ? parseInt(selected.client) : undefined });
      } else if (key === 'time') {
        r = await api.timeEstimator({ service_type: taskType || undefined, description: taskDesc || undefined, priority: selected.priority || 'medium' });
      } else if (key === 'sentiment') {
        if (!complaintText.trim()) { setError('Enter a customer message to classify.'); setLoading(false); return; }
        r = await api.sentimentClassifier({ text: complaintText, client_id: selected.client ? parseInt(selected.client) : undefined });
      } else if (key === 'invoice') {
        r = await api.invoiceAnomaly({ invoice_id: selected.invoice ? parseInt(selected.invoice) : undefined });
      } else if (key === 'dispatch') {
        r = await api.smartDispatch({ task_id: selected.task ? parseInt(selected.task) : undefined, service_type: taskType || undefined, description: taskDesc || undefined, priority: selected.priority || 'medium' });
      }
      setResult(r?.result || 'No response received.');
    } catch (e: any) {
      const msg = e?.message || 'Request failed';
      if (/503|not configured|unavailable/i.test(msg)) {
        setError('AI service is not configured (503). Set OPENROUTER_API_KEY in .env to enable live AI responses.');
      } else {
        setError(msg);
      }
    } finally { setLoading(false); }
  };

  const switchTab = (next: 'operations' | 'lab') => {
    setTab(next);
    setActive(null);
    setResult('');
    setError('');
  };

  const allTools = [...operationsTools, ...labTools];
  const activeTitle = allTools.find(t => t.key === active)?.label || 'AI Analysis';

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2"><Sparkles className="w-7 h-7 text-violet-600" /><h2 className="text-2xl font-bold text-gray-900">AI Center</h2></div>
        <p className="text-gray-500">AI-powered tools to optimize service operations, client relationships, and revenue.</p>
      </div>

      <div className="mb-6 border-b border-gray-200 flex gap-1">
        <button
          type="button"
          onClick={() => switchTab('operations')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === 'operations' ? 'border-violet-600 text-violet-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          <Sparkles className="w-4 h-4" />Operations
        </button>
        <button
          type="button"
          onClick={() => switchTab('lab')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === 'lab' ? 'border-violet-600 text-violet-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          <Brain className="w-4 h-4" />Lab
        </button>
      </div>

      {tab === 'operations' && (
        <>
          <div className="grid grid-cols-2 gap-4 mb-8">
            {operationsTools.map(tool => (
              <button key={tool.key} onClick={() => run(tool.key)} className={`relative overflow-hidden rounded-xl p-5 text-left bg-gradient-to-br ${tool.color} text-white shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5`}>
                <tool.icon className="w-7 h-7 mb-3 opacity-90" />
                <div className="font-semibold text-base mb-1">{tool.label}</div>
                <div className="text-sm opacity-80">{tool.desc}</div>
                {active === tool.key && loading && <div className="absolute inset-0 bg-black/20 flex items-center justify-center"><div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" /></div>}
              </button>
            ))}
          </div>

          <div className="mb-4 bg-violet-50 border border-violet-200 rounded-xl p-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-700 mr-1"><Sparkles className="w-3.5 h-3.5" />Prefill sample:</span>
            {operationsSamples.map(s => (
              <button
                key={s.label}
                type="button"
                onClick={() => applyOperationsSample(s)}
                className="px-3 py-1.5 text-xs font-medium rounded-md bg-white border border-violet-300 text-violet-700 hover:bg-violet-100 hover:border-violet-400 transition"
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Task</label>
              <select value={selected.task || ''} onChange={e => setSelected(p => ({ ...p, task: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="">— Random task —</option>{tasks.slice(0,10).map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Staff Member</label>
              <select value={selected.staff || ''} onChange={e => setSelected(p => ({ ...p, staff: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="">— Random staff —</option>{staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Client</label>
              <select value={selected.client || ''} onChange={e => setSelected(p => ({ ...p, client: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="">— Random client —</option>{clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select SLA</label>
              <select value={selected.sla || ''} onChange={e => setSelected(p => ({ ...p, sla: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="">— Random SLA —</option>{slas.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
        </>
      )}

      {tab === 'lab' && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {labTools.map(tool => (
              <button key={tool.key} onClick={() => run(tool.key)} className={`relative overflow-hidden rounded-xl p-5 text-left bg-gradient-to-br ${tool.color} text-white shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5`}>
                <tool.icon className="w-7 h-7 mb-3 opacity-90" />
                <div className="font-semibold text-base mb-1">{tool.label}</div>
                <div className="text-sm opacity-80">{tool.desc}</div>
                {active === tool.key && loading && <div className="absolute inset-0 bg-black/20 flex items-center justify-center"><div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" /></div>}
              </button>
            ))}
          </div>

          <div className="mb-4 bg-violet-50 border border-violet-200 rounded-xl p-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-700 mr-1"><Sparkles className="w-3.5 h-3.5" />Prefill sample:</span>
            {labSamples.map(s => (
              <button
                key={s.label}
                type="button"
                onClick={() => applyLabSample(s)}
                className="px-3 py-1.5 text-xs font-medium rounded-md bg-white border border-violet-300 text-violet-700 hover:bg-violet-100 hover:border-violet-400 transition"
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client (for Churn / Sentiment)</label>
              <select value={selected.client || ''} onChange={e => setSelected(p => ({ ...p, client: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="">— Auto-pick —</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name} ({c.company})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Task (for Dispatch)</label>
              <select value={selected.task || ''} onChange={e => setSelected(p => ({ ...p, task: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="">— Use the form below —</option>
                {tasks.slice(0, 50).map(t => <option key={t.id} value={t.id}>#{t.id} {t.service_type} - {(t.description || '').slice(0, 40)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Invoice (for Anomaly)</label>
              <select value={selected.invoice || ''} onChange={e => setSelected(p => ({ ...p, invoice: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="">— Scan recent —</option>
                {invoices.slice(0, 50).map(i => <option key={i.id} value={i.id}>#{i.id} ${i.amount_usd} ({i.status})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority (for Time / Dispatch)</label>
              <select value={selected.priority || 'medium'} onChange={e => setSelected(p => ({ ...p, priority: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="low">low</option><option value="medium">medium</option><option value="high">high</option><option value="urgent">urgent</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Service Type (for Time / Dispatch)</label>
              <input value={taskType} onChange={e => setTaskType(e.target.value)} placeholder="e.g. accounting, insurance_brokerage, healthcare_admin" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Task Description (for Time / Dispatch)</label>
              <textarea value={taskDesc} onChange={e => setTaskDesc(e.target.value)} rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Describe the work…" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Message (for Sentiment)</label>
              <textarea value={complaintText} onChange={e => setComplaintText(e.target.value)} rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Paste a complaint, email or chat message…" />
            </div>
          </div>
        </>
      )}

      {error && <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-3 text-sm">{error}</div>}

      {(loading || result) && (
        <AIResponse
          content={result}
          title={activeTitle}
          isLoading={loading}
          onRegenerate={() => active && run(active)}
        />
      )}
    </div>
  );
}
