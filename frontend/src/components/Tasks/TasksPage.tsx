import { useState, useEffect } from 'react';
import { Plus, Search, ClipboardList } from 'lucide-react';
import { api } from '../../api';
import TaskDetail from './TaskDetail';
import TaskForm from './TaskForm';

export default function TasksPage() {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const load = async () => { try { setItems(await api.getTasks()); } catch (e) { console.error(e); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const filtered = items.filter(t => t.title?.toLowerCase().includes(search.toLowerCase()) || t.client_name?.toLowerCase().includes(search.toLowerCase()) || t.service_type?.toLowerCase().includes(search.toLowerCase()));

  const priorityColor = (p: string) => ({ critical: 'bg-red-100 text-red-800', high: 'bg-orange-100 text-orange-800', medium: 'bg-yellow-100 text-yellow-800', low: 'bg-green-100 text-green-800' }[p] || 'bg-gray-100');
  const statusColor = (s: string) => ({ open: 'bg-blue-100 text-blue-800', 'in-progress': 'bg-purple-100 text-purple-800', review: 'bg-yellow-100 text-yellow-800', completed: 'bg-green-100 text-green-800', cancelled: 'bg-gray-100 text-gray-500' }[s] || 'bg-gray-100');

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div><h2 className="text-2xl font-bold text-gray-900">Service Tasks</h2><p className="text-gray-500 text-sm mt-1">{items.length} tasks tracked</p></div>
        <button onClick={() => { setSelected(null); setShowForm(true); }} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm"><Plus className="w-4 h-4" /> New Task</button>
      </div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks..." className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? <div className="p-12 text-center text-gray-400">Loading...</div> : (
          <table className="w-full">
            <thead><tr className="bg-gray-50 border-b border-gray-200">{['Task','Client','Service Type','Priority','Status','Due Date','Hours'].map(h => <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(t => (
                <tr key={t.id} onClick={() => setSelected(t)} className="hover:bg-gray-50 cursor-pointer transition-colors">
                  <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center"><ClipboardList className="w-4 h-4 text-blue-600" /></div><div className="font-medium text-gray-900 text-sm">{t.title}</div></div></td>
                  <td className="px-6 py-4 text-sm text-gray-600">{t.client_name || '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 capitalize">{t.service_type}</td>
                  <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${priorityColor(t.priority)}`}>{t.priority}</span></td>
                  <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${statusColor(t.status)}`}>{t.status}</span></td>
                  <td className="px-6 py-4 text-sm text-gray-600">{t.due_date ? new Date(t.due_date).toLocaleDateString() : '—'}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">{t.estimated_hours}h</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {selected && !showForm && <TaskDetail task={selected} onClose={() => setSelected(null)} onRefresh={() => { load(); setSelected(null); }} onEdit={() => setShowForm(true)} />}
      {showForm && <TaskForm task={showForm && selected ? selected : null} onClose={() => setShowForm(false)} onSave={() => { setShowForm(false); setSelected(null); load(); }} />}
    </div>
  );
}
