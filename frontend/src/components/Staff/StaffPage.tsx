import { useState, useEffect } from 'react';
import { Plus, Search, UserCircle } from 'lucide-react';
import { api } from '../../api';
import StaffDetail from './StaffDetail';
import StaffForm from './StaffForm';

export default function StaffPage() {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const load = async () => { try { setItems(await api.getStaff()); } catch (e) { console.error(e); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const filtered = items.filter(s => s.name?.toLowerCase().includes(search.toLowerCase()) || s.role?.toLowerCase().includes(search.toLowerCase()) || s.specialization?.toLowerCase().includes(search.toLowerCase()));

  const statusColor = (s: string) => ({ active: 'bg-green-100 text-green-800', inactive: 'bg-gray-100 text-gray-500', 'on-leave': 'bg-yellow-100 text-yellow-800' }[s] || 'bg-gray-100');

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div><h2 className="text-2xl font-bold text-gray-900">Staff</h2><p className="text-gray-500 text-sm mt-1">{items.length} staff members</p></div>
        <button onClick={() => { setSelected(null); setShowForm(true); }} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm"><Plus className="w-4 h-4" /> Add Staff</button>
      </div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search staff..." className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? <div className="p-12 text-center text-gray-400">Loading...</div> : (
          <table className="w-full">
            <thead><tr className="bg-gray-50 border-b border-gray-200">{['Staff Member','Role','Specialization','Status','Active Tasks','Utilization','Rating'].map(h => <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(s => (
                <tr key={s.id} onClick={() => setSelected(s)} className="hover:bg-gray-50 cursor-pointer transition-colors">
                  <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center"><UserCircle className="w-4 h-4 text-indigo-600" /></div><div><div className="font-medium text-gray-900 text-sm">{s.name}</div><div className="text-xs text-gray-500">{s.email}</div></div></div></td>
                  <td className="px-6 py-4 text-sm text-gray-600 capitalize">{s.role}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 capitalize">{s.specialization}</td>
                  <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${statusColor(s.status)}`}>{s.status}</span></td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">{s.active_tasks || 0}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-1.5"><div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${Math.min(s.utilization_rate || 0, 100)}%` }} /></div>
                      <span className="text-xs text-gray-600">{s.utilization_rate || 0}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4"><span className="text-sm font-semibold text-yellow-600">{s.performance_rating ? `${s.performance_rating}/5.0` : '—'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {selected && !showForm && <StaffDetail staff={selected} onClose={() => setSelected(null)} onRefresh={() => { load(); setSelected(null); }} onEdit={() => setShowForm(true)} />}
      {showForm && <StaffForm staff={showForm && selected ? selected : null} onClose={() => setShowForm(false)} onSave={() => { setShowForm(false); setSelected(null); load(); }} />}
    </div>
  );
}
