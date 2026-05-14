import { useState, useEffect } from 'react';
import { Plus, Search, FileText } from 'lucide-react';
import { api } from '../../api';
import InvoiceDetail from './InvoiceDetail';
import InvoiceForm from './InvoiceForm';

export default function InvoicesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const load = async () => { try { setItems(await api.getInvoices()); } catch (e) { console.error(e); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const filtered = items.filter(i => i.invoice_number?.toLowerCase().includes(search.toLowerCase()) || i.client_name?.toLowerCase().includes(search.toLowerCase()));

  const statusColor = (s: string) => ({ draft: 'bg-gray-100 text-gray-600', sent: 'bg-blue-100 text-blue-800', paid: 'bg-green-100 text-green-800', overdue: 'bg-red-100 text-red-800', cancelled: 'bg-gray-100 text-gray-500' }[s] || 'bg-gray-100');

  const totalRevenue = items.filter(i => i.status === 'paid').reduce((sum, i) => sum + parseFloat(i.amount || 0), 0);
  const outstanding = items.filter(i => ['sent','overdue'].includes(i.status)).reduce((sum, i) => sum + parseFloat(i.amount || 0), 0);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div><h2 className="text-2xl font-bold text-gray-900">Invoices</h2><p className="text-gray-500 text-sm mt-1">{items.length} invoices total</p></div>
        <button onClick={() => { setSelected(null); setShowForm(true); }} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm"><Plus className="w-4 h-4" /> New Invoice</button>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4"><div className="text-xs text-gray-500 mb-1">Total Revenue</div><div className="text-2xl font-bold text-green-600">${totalRevenue.toLocaleString()}</div></div>
        <div className="bg-white rounded-xl border border-gray-200 p-4"><div className="text-xs text-gray-500 mb-1">Outstanding</div><div className="text-2xl font-bold text-orange-500">${outstanding.toLocaleString()}</div></div>
        <div className="bg-white rounded-xl border border-gray-200 p-4"><div className="text-xs text-gray-500 mb-1">Overdue</div><div className="text-2xl font-bold text-red-600">{items.filter(i => i.status === 'overdue').length}</div></div>
      </div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search invoices..." className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? <div className="p-12 text-center text-gray-400">Loading...</div> : (
          <table className="w-full">
            <thead><tr className="bg-gray-50 border-b border-gray-200">{['Invoice','Client','Amount','Status','Issue Date','Due Date'].map(h => <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(inv => (
                <tr key={inv.id} onClick={() => setSelected(inv)} className="hover:bg-gray-50 cursor-pointer transition-colors">
                  <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center"><FileText className="w-4 h-4 text-green-600" /></div><div className="font-medium text-gray-900 text-sm">{inv.invoice_number}</div></div></td>
                  <td className="px-6 py-4 text-sm text-gray-600">{inv.client_name || '—'}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">${parseFloat(inv.amount || 0).toLocaleString()}</td>
                  <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${statusColor(inv.status)}`}>{inv.status}</span></td>
                  <td className="px-6 py-4 text-sm text-gray-600">{inv.issue_date ? new Date(inv.issue_date).toLocaleDateString() : '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {selected && !showForm && <InvoiceDetail invoice={selected} onClose={() => setSelected(null)} onRefresh={() => { load(); setSelected(null); }} onEdit={() => setShowForm(true)} />}
      {showForm && <InvoiceForm invoice={showForm && selected ? selected : null} onClose={() => setShowForm(false)} onSave={() => { setShowForm(false); setSelected(null); load(); }} />}
    </div>
  );
}
