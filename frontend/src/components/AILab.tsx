import { useState, useEffect } from 'react';
import { Brain, TrendingDown, Clock, MessageSquareWarning, Receipt, Send, Sparkles } from 'lucide-react';
import { api } from '../api';
import AIResponse from './AIResponse';

const tools = [
  { key: 'churn', icon: TrendingDown, label: 'Churn Predictor', desc: 'Predict client churn risk and recommend retention plays', color: 'from-rose-500 to-red-600' },
  { key: 'time', icon: Clock, label: 'Service-Time Estimator', desc: 'Estimate effort for a service task', color: 'from-amber-500 to-orange-600' },
  { key: 'sentiment', icon: MessageSquareWarning, label: 'Sentiment Classifier', desc: 'Classify complaint sentiment, urgency and intent', color: 'from-fuchsia-500 to-pink-600' },
  { key: 'invoice', icon: Receipt, label: 'Invoice Anomaly Detector', desc: 'Spot suspicious or anomalous invoices', color: 'from-teal-500 to-emerald-600' },
  { key: 'dispatch', icon: Send, label: 'Smart Dispatch', desc: 'Pick the optimal staff member for a task', color: 'from-indigo-500 to-blue-700' },
];

type LabSample = {
  label: string;
  values: {
    taskType?: string;
    taskDesc?: string;
    complaintText?: string;
    priority?: string;
    clientHint?: string; // substring to match in client name/company
    invoiceHint?: string; // substring to match in invoice (status etc.)
    taskHint?: string; // substring to match in task description/service_type
  };
};

const samples: LabSample[] = [
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

export default function AILab() {
  const [active, setActive] = useState<string | null>(null);
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [clients, setClients] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [selected, setSelected] = useState<Record<string, any>>({});
  const [complaintText, setComplaintText] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskType, setTaskType] = useState('');

  useEffect(() => {
    api.getClients().then(setClients).catch(() => {});
    api.getTasks().then(setTasks).catch(() => {});
    api.getInvoices().then(setInvoices).catch(() => {});
  }, []);

  const applySample = (s: LabSample) => {
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
      if (key === 'churn') {
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

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2"><Brain className="w-7 h-7 text-violet-600" /><h2 className="text-2xl font-bold text-gray-900">AI Lab</h2></div>
        <p className="text-gray-500">Five additional AI tools: churn risk, time estimation, sentiment, invoice anomaly, and smart dispatch.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {tools.map(tool => (
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
        {samples.map(s => (
          <button
            key={s.label}
            type="button"
            onClick={() => applySample(s)}
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

      {error && <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-3 text-sm">{error}</div>}

      {(loading || result) && (
        <AIResponse
          content={result}
          title={tools.find(t => t.key === active)?.label || 'AI Analysis'}
          isLoading={loading}
          onRegenerate={() => active && run(active)}
        />
      )}
    </div>
  );
}
