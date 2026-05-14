import { useState, useEffect } from 'react';
import { Plus, Search, LayoutTemplate } from 'lucide-react';
import { api } from '../../api';
import TemplateDetail from './TemplateDetail';
import TemplateForm from './TemplateForm';

export default function TemplatesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const load = async () => { try { setItems(await api.getTemplates()); } catch (e) { console.error(e); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const filtered = items.filter(t => t.name?.toLowerCase().includes(search.toLowerCase()) || t.category?.toLowerCase().includes(search.toLowerCase()));

  const tierColor = (t: string) => ({ enterprise: 'bg-purple-100 text-purple-800', premium: 'bg-blue-100 text-blue-800', standard: 'bg-gray-100 text-gray-600', basic: 'bg-green-100 text-green-700' }[t] || 'bg-gray-100');

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div><h2 className="text-2xl font-bold text-gray-900">Service Templates</h2><p className="text-gray-500 text-sm mt-1">{items.length} templates available</p></div>
        <button onClick={() => { setSelected(null); setShowForm(true); }} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm"><Plus className="w-4 h-4" /> New Template</button>
      </div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search templates..." className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? <div className="col-span-3 p-12 text-center text-gray-400">Loading...</div> : filtered.map(t => (
          <div key={t.id} onClick={() => setSelected(t)} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md cursor-pointer transition-all hover:border-blue-200">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center"><LayoutTemplate className="w-5 h-5 text-blue-600" /></div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${tierColor(t.tier)}`}>{t.tier}</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">{t.name}</h3>
            <p className="text-xs text-gray-500 mb-3 line-clamp-2">{t.description}</p>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span className="capitalize">{t.category}</span>
              <div className="flex items-center gap-3">
                <span>{t.estimated_hours}h est.</span>
                {t.base_price && <span className="font-semibold text-gray-900">${parseFloat(t.base_price).toLocaleString()}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
      {selected && !showForm && <TemplateDetail template={selected} onClose={() => setSelected(null)} onRefresh={() => { load(); setSelected(null); }} onEdit={() => setShowForm(true)} />}
      {showForm && <TemplateForm template={showForm && selected ? selected : null} onClose={() => setShowForm(false)} onSave={() => { setShowForm(false); setSelected(null); load(); }} />}
    </div>
  );
}
