import { useState } from 'react';
import { Database, Sparkles, Users, ClipboardList, UserCheck, FileText, Shield, BookTemplate } from 'lucide-react';
import { api } from '../api';

type EntityKey = 'clients' | 'staff' | 'tasks' | 'invoices' | 'slas' | 'templates';

const ENTITIES: { key: EntityKey; label: string; icon: any; hint: string }[] = [
  { key: 'clients',   label: 'Clients',          icon: Users,         hint: 'Acme Plumbing, Bluewave HVAC, GreenLeaf Landscaping...' },
  { key: 'staff',     label: 'Staff',            icon: UserCheck,     hint: 'Master electricians, dispatchers, field plumbers' },
  { key: 'tasks',     label: 'Service Tasks',    icon: ClipboardList, hint: 'Realistic tickets - leak triage, panel upgrades, RTU service' },
  { key: 'invoices',  label: 'Invoices',         icon: FileText,      hint: 'Mixed paid / sent / overdue invoices linked to tasks' },
  { key: 'slas',      label: 'SLA Agreements',   icon: Shield,        hint: 'Per-service-type response targets and breach counts' },
  { key: 'templates', label: 'Service Templates', icon: BookTemplate, hint: 'Reusable playbooks for each service type' }
];

export default function SampleDataPage() {
  const [busy, setBusy] = useState<EntityKey | ''>('');
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [counts, setCounts] = useState<Record<string, number>>({});

  const handleSeed = async (entity: EntityKey) => {
    setBusy(entity); setError(''); setToast('');
    try {
      const r = await api.seedSampleData(entity);
      setCounts(prev => ({ ...prev, [entity]: (prev[entity] || 0) + (r.inserted || 0) }));
      setToast(`Inserted ${r.inserted} ${entity} rows`);
      setTimeout(() => setToast(''), 3500);
    } catch (e: any) {
      setError(e?.message || 'Seed failed');
    } finally { setBusy(''); }
  };

  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <Database className="w-7 h-7 text-blue-600" />
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Sample Data</h2>
          <p className="text-gray-500 text-sm">Populate each entity with realistic service-business rows. Safe to run multiple times.</p>
        </div>
      </div>

      {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>}
      {toast && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 text-sm flex items-center gap-2">
          <Sparkles className="w-4 h-4" /> {toast}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 flex items-center justify-between">
        <div className="text-sm text-gray-600">Total rows inserted this session</div>
        <div className="text-lg font-semibold text-gray-900">{total}</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {ENTITIES.map(({ key, label, icon: Icon, hint }) => (
          <div key={key} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0"><Icon className="w-5 h-5 text-blue-600" /></div>
              <div className="min-w-0">
                <div className="font-medium text-gray-900 text-sm">{label}</div>
                <div className="text-xs text-gray-500 truncate">{hint}</div>
                {counts[key] ? <div className="text-xs text-green-700 mt-0.5">+{counts[key]} added</div> : null}
              </div>
            </div>
            <button
              onClick={() => handleSeed(key)}
              disabled={!!busy}
              className="bg-blue-600 disabled:bg-blue-400 hover:bg-blue-700 text-white text-sm font-medium px-3 py-1.5 rounded-lg flex items-center gap-1 flex-shrink-0"
            >
              {busy === key ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>Seed</span>
            </button>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400 mt-6">
        Tip: seed Clients first - Tasks, Invoices, and SLAs reference an existing client.
      </p>
    </div>
  );
}
