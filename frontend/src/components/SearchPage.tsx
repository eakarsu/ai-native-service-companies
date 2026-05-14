import { useState } from 'react';
import { Search, Filter } from 'lucide-react';
import { api } from '../api';

export default function SearchPage() {
  const [q, setQ] = useState('');
  const [entity, setEntity] = useState('all');
  const [status, setStatus] = useState('');
  const [tier, setTier] = useState('');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const run = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true); setError('');
    try {
      const r = await api.search({ q, entity, status, tier });
      setResults(r);
    } catch (e: any) {
      setError(e?.message || 'Search failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <Search className="w-7 h-7 text-blue-600" />
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Search & Filter</h2>
          <p className="text-gray-500 text-sm">Search across clients, tasks, invoices and staff.</p>
        </div>
      </div>

      <form onSubmit={run} className="bg-white border border-gray-200 rounded-xl p-4 mb-5 grid grid-cols-1 md:grid-cols-5 gap-3">
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">Query</label>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search…" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Entity</label>
          <select value={entity} onChange={e => setEntity(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
            <option value="all">All</option>
            <option value="clients">Clients</option>
            <option value="tasks">Tasks</option>
            <option value="invoices">Invoices</option>
            <option value="staff">Staff</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
          <input value={status} onChange={e => setStatus(e.target.value)} placeholder="active / pending / paid…" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Tier</label>
          <input value={tier} onChange={e => setTier(e.target.value)} placeholder="enterprise / premium…" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
        <div className="md:col-span-5 flex justify-end">
          <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2">
            <Filter className="w-4 h-4" />{loading ? 'Searching…' : 'Search'}
          </button>
        </div>
      </form>

      {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>}

      {results && (
        <div className="space-y-5">
          <div className="text-sm text-gray-600">{results.total} result{results.total === 1 ? '' : 's'} found.</div>

          {results.clients?.length > 0 && (
            <Section title={`Clients (${results.clients.length})`} columns={['id', 'name', 'company', 'industry', 'tier', 'status']} rows={results.clients} />
          )}
          {results.tasks?.length > 0 && (
            <Section title={`Tasks (${results.tasks.length})`} columns={['id', 'service_type', 'priority', 'status', 'assigned_to', 'description']} rows={results.tasks} />
          )}
          {results.invoices?.length > 0 && (
            <Section title={`Invoices (${results.invoices.length})`} columns={['id', 'client_id', 'amount_usd', 'status', 'issued_date']} rows={results.invoices} />
          )}
          {results.staff?.length > 0 && (
            <Section title={`Staff (${results.staff.length})`} columns={['id', 'name', 'role', 'specialization', 'availability']} rows={results.staff} />
          )}
          {results.total === 0 && <div className="text-gray-500 text-sm">No matches.</div>}
        </div>
      )}
    </div>
  );
}

function Section({ title, columns, rows }: { title: string; columns: string[]; rows: any[] }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 text-sm font-semibold text-gray-700">{title}</div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-50">{columns.map(c => <th key={c} className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{c}</th>)}</tr></thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((r, i) => (
              <tr key={i} className="hover:bg-gray-50">
                {columns.map(c => <td key={c} className="px-4 py-2 text-gray-700">{String(r[c] ?? '')}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
