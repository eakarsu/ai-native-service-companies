import { useState, useEffect } from 'react';
import { Plus, Search, Users } from 'lucide-react';
import { api } from '../../api';
import ClientDetail from './ClientDetail';
import ClientForm from './ClientForm';

export default function ClientsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const load = async () => { try { setItems(await api.getClients()); } catch (e) { console.error(e); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const filtered = items.filter(c => c.name?.toLowerCase().includes(search.toLowerCase()) || c.company?.toLowerCase().includes(search.toLowerCase()) || c.industry?.toLowerCase().includes(search.toLowerCase()));
  const tierColor = (t: string) => ({ enterprise: 'bg-purple-100 text-purple-800', premium: 'bg-blue-100 text-blue-800', standard: 'bg-gray-100 text-gray-600' }[t] || 'bg-gray-100');
  const statusColor = (s: string) => ({ active: 'bg-green-100 text-green-800', inactive: 'bg-gray-100 text-gray-500' }[s] || 'bg-gray-100');

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div><h2 className="text-2xl font-bold text-gray-900">Clients</h2><p className="text-gray-500 text-sm mt-1">{items.length} clients managed</p></div>
        <button onClick={() => { setSelected(null); setShowForm(true); }} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm"><Plus className="w-4 h-4" /> New Client</button>
      </div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search clients..." className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? <div className="p-12 text-center text-gray-400">Loading...</div> : (
          <table className="w-full">
            <thead><tr className="bg-gray-50 border-b border-gray-200">{['Client','Industry','Tier','Status','Tasks','Satisfaction'].map(h => <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(c => (
                <tr key={c.id} onClick={() => setSelected(c)} className="hover:bg-gray-50 cursor-pointer transition-colors">
                  <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center"><Users className="w-4 h-4 text-blue-600" /></div><div><div className="font-medium text-gray-900 text-sm">{c.name}</div><div className="text-xs text-gray-500">{c.company}</div></div></div></td>
                  <td className="px-6 py-4 text-sm text-gray-600 capitalize">{c.industry}</td>
                  <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${tierColor(c.tier)}`}>{c.tier}</span></td>
                  <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${statusColor(c.status)}`}>{c.status}</span></td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">{c.total_tasks}</td>
                  <td className="px-6 py-4"><span className="text-sm font-semibold text-yellow-600">{c.satisfaction_score ? `${c.satisfaction_score}/5.0` : '—'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {selected && !showForm && <ClientDetail client={selected} onClose={() => setSelected(null)} onRefresh={() => { load(); setSelected(null); }} onEdit={() => setShowForm(true)} />}
      {showForm && <ClientForm client={showForm && selected ? selected : null} onClose={() => setShowForm(false)} onSave={() => { setShowForm(false); setSelected(null); load(); }} />}
    </div>
  );
}
