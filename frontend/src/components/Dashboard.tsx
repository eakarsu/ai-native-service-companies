import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, Users, ClipboardList, Calendar, AlertTriangle, UserCheck, RefreshCw, Brain, Search, Database, Download, History } from 'lucide-react';

type Kpis = {
  clients: { total: number; active: number };
  open_tasks: { total: number };
  scheduled_jobs: { total: number };
  overdue_invoices: { total: number; unpaid: number };
  technicians: { total: number; available: number };
};
type AuditItem = { id: number; user_email: string; action: string; entity: string | null; details: any; created_at: string };

export default function Dashboard() {
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [activity, setActivity] = useState<AuditItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true); setError('');
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch('/api/dashboard/stats', { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Failed to load stats');
      const data = await res.json();
      setKpis(data.kpis);
      setActivity(data.recent_activity || []);
    } catch (e: any) {
      setError(e?.message || 'Load failed');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const fmtDetails = (d: any) => {
    if (!d) return '';
    if (typeof d === 'string') return d;
    try { return JSON.stringify(d); } catch { return String(d); }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="w-7 h-7 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
            <p className="text-gray-500 text-sm">Operations overview for ServiceFlow.</p>
          </div>
        </div>
        <button onClick={load} className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <KpiCard icon={Users} color="blue" label="Clients" primary={kpis?.clients.total ?? 0} sub={`${kpis?.clients.active ?? 0} active`} loading={loading} to="/clients" />
        <KpiCard icon={ClipboardList} color="violet" label="Open Tasks" primary={kpis?.open_tasks.total ?? 0} sub="pending + in progress" loading={loading} to="/tasks" />
        <KpiCard icon={Calendar} color="emerald" label="Scheduled Jobs" primary={kpis?.scheduled_jobs.total ?? 0} sub="upcoming due dates" loading={loading} to="/tasks" />
        <KpiCard icon={AlertTriangle} color="rose" label="Overdue Invoices" primary={kpis?.overdue_invoices.total ?? 0} sub={`${kpis?.overdue_invoices.unpaid ?? 0} unpaid total`} loading={loading} to="/invoices" />
        <KpiCard icon={UserCheck} color="amber" label="Technicians" primary={kpis?.technicians.total ?? 0} sub={`${kpis?.technicians.available ?? 0} available`} loading={loading} to="/staff" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-gray-500" />
              <h3 className="text-sm font-semibold text-gray-700">Recent Activity</h3>
            </div>
            <Link to="/audit-log" className="text-xs text-blue-600 hover:text-blue-700 font-medium">View all</Link>
          </div>
          {loading ? (
            <div className="p-12 text-center text-gray-400 text-sm">Loading…</div>
          ) : activity.length === 0 ? (
            <div className="p-12 text-center text-gray-400 text-sm">No audit entries yet. Run an AI tool, search, or export to populate.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {['When', 'User', 'Action', 'Entity', 'Details'].map(h => (
                    <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {activity.map((it) => (
                  <tr key={it.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-gray-700 whitespace-nowrap">{new Date(it.created_at).toLocaleString()}</td>
                    <td className="px-4 py-2 text-gray-700">{it.user_email}</td>
                    <td className="px-4 py-2"><span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-medium">{it.action}</span></td>
                    <td className="px-4 py-2 text-gray-600">{it.entity || '-'}</td>
                    <td className="px-4 py-2 text-gray-500 text-xs font-mono truncate max-w-xs">{fmtDetails(it.details)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700">Quick Actions</h3>
          </div>
          <div className="p-3 grid grid-cols-1 gap-2">
            <QuickAction to="/ai-center" icon={Brain} label="AI Center" hint="Routing, churn, dispatch, sentiment" color="violet" />
            <QuickAction to="/search" icon={Search} label="Search & Filter" hint="Find clients, tasks, invoices" color="blue" />
            <QuickAction to="/sample-data" icon={Database} label="Sample Data" hint="Seed demo records" color="emerald" />
            <QuickAction to="/export" icon={Download} label="Export CSV" hint="Download tables" color="amber" />
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ icon: Icon, color, label, primary, sub, loading, to }: { icon: any; color: 'blue' | 'violet' | 'emerald' | 'rose' | 'amber'; label: string; primary: number | string; sub?: string; loading?: boolean; to: string }) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    violet: 'bg-violet-50 text-violet-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    rose: 'bg-rose-50 text-rose-600',
    amber: 'bg-amber-50 text-amber-600'
  };
  return (
    <Link to={to} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm hover:border-gray-300 transition-all block">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colorMap[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</div>
      <div className="text-2xl font-bold text-gray-900 mt-1">{loading ? '…' : primary}</div>
      {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
    </Link>
  );
}

function QuickAction({ to, icon: Icon, label, hint, color }: { to: string; icon: any; label: string; hint: string; color: 'blue' | 'violet' | 'emerald' | 'amber' }) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600 group-hover:bg-blue-100',
    violet: 'bg-violet-50 text-violet-600 group-hover:bg-violet-100',
    emerald: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100',
    amber: 'bg-amber-50 text-amber-600 group-hover:bg-amber-100'
  };
  return (
    <Link to={to} className="group flex items-center gap-3 px-3 py-2.5 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-colors">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${colorMap[color]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900">{label}</div>
        <div className="text-xs text-gray-500 truncate">{hint}</div>
      </div>
    </Link>
  );
}
