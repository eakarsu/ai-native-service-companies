import { useEffect, useState } from 'react';
import { History, RefreshCw } from 'lucide-react';
import { api } from '../api';

export default function AuditLogPage() {
  const [items, setItems] = useState<any[]>([]);
  const [action, setAction] = useState('');
  const [entity, setEntity] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true); setError('');
    try {
      setItems(await api.getAuditLog({ action: action || undefined, entity: entity || undefined, limit: 200 }));
    } catch (e: any) {
      setError(e?.message || 'Load failed');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const fmtDetails = (d: any) => {
    if (!d) return '';
    if (typeof d === 'string') return d;
    try { return JSON.stringify(d); } catch { return String(d); }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <History className="w-7 h-7 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Audit Log</h2>
            <p className="text-gray-500 text-sm">Recent system actions performed by users.</p>
          </div>
        </div>
        <button onClick={load} className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-3 mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <input value={action} onChange={e => setAction(e.target.value)} placeholder="Filter by action (e.g. ai., search, export)" className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
        <input value={entity} onChange={e => setEntity(e.target.value)} placeholder="Filter by entity (e.g. client, invoice)" className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
        <button onClick={load} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-2 rounded-lg">Apply Filters</button>
      </div>

      {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading ? <div className="p-12 text-center text-gray-400">Loading…</div> : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {['When', 'User', 'Action', 'Entity', 'Details'].map(h => (
                  <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No audit entries yet. Run an AI tool, search, or export to populate.</td></tr>}
              {items.map((it: any) => (
                <tr key={it.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-gray-700 whitespace-nowrap">{new Date(it.created_at).toLocaleString()}</td>
                  <td className="px-4 py-2 text-gray-700">{it.user_email}</td>
                  <td className="px-4 py-2"><span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-medium">{it.action}</span></td>
                  <td className="px-4 py-2 text-gray-600">{it.entity || '-'}</td>
                  <td className="px-4 py-2 text-gray-500 text-xs font-mono truncate max-w-md">{fmtDetails(it.details)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
