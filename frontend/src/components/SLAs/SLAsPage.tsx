import { useState, useEffect } from 'react';
import { Plus, Search, ShieldCheck } from 'lucide-react';
import { api } from '../../api';
import SLADetail from './SLADetail';
import SLAForm from './SLAForm';

export default function SLAsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const load = async () => { try { setItems(await api.getSLAs()); } catch (e) { console.error(e); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const filtered = items.filter(s => s.name?.toLowerCase().includes(search.toLowerCase()) || s.client_name?.toLowerCase().includes(search.toLowerCase()) || s.service_level?.toLowerCase().includes(search.toLowerCase()));

  const statusColor = (s: string) => ({ active: 'bg-green-100 text-green-800', expired: 'bg-gray-100 text-gray-500', draft: 'bg-blue-100 text-blue-800', terminated: 'bg-red-100 text-red-800' }[s] || 'bg-gray-100');
  const levelColor = (l: string) => ({ platinum: 'bg-purple-100 text-purple-800', gold: 'bg-yellow-100 text-yellow-800', silver: 'bg-gray-100 text-gray-700', bronze: 'bg-orange-100 text-orange-800' }[l] || 'bg-gray-100');

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div><h2 className="text-2xl font-bold text-gray-900">SLA Agreements</h2><p className="text-gray-500 text-sm mt-1">{items.length} agreements</p></div>
        <button onClick={() => { setSelected(null); setShowForm(true); }} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm"><Plus className="w-4 h-4" /> New SLA</button>
      </div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search SLAs..." className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? <div className="p-12 text-center text-gray-400">Loading...</div> : (
          <table className="w-full">
            <thead><tr className="bg-gray-50 border-b border-gray-200">{['Agreement','Client','Level','Response Time','Status','Start','End'].map(h => <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(s => (
                <tr key={s.id} onClick={() => setSelected(s)} className="hover:bg-gray-50 cursor-pointer transition-colors">
                  <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center"><ShieldCheck className="w-4 h-4 text-blue-600" /></div><div className="font-medium text-gray-900 text-sm">{s.name}</div></div></td>
                  <td className="px-6 py-4 text-sm text-gray-600">{s.client_name || '—'}</td>
                  <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${levelColor(s.service_level)}`}>{s.service_level}</span></td>
                  <td className="px-6 py-4 text-sm text-gray-600">{s.response_time_hours}h</td>
                  <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${statusColor(s.status)}`}>{s.status}</span></td>
                  <td className="px-6 py-4 text-sm text-gray-600">{s.start_date ? new Date(s.start_date).toLocaleDateString() : '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{s.end_date ? new Date(s.end_date).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {selected && !showForm && <SLADetail sla={selected} onClose={() => setSelected(null)} onRefresh={() => { load(); setSelected(null); }} onEdit={() => setShowForm(true)} />}
      {showForm && <SLAForm sla={showForm && selected ? selected : null} onClose={() => setShowForm(false)} onSave={() => { setShowForm(false); setSelected(null); load(); }} />}
    </div>
  );
}
