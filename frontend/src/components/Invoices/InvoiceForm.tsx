import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { api } from '../../api';

export default function InvoiceForm({ invoice, onClose, onSave }: { invoice: any; onClose: () => void; onSave: () => void; }) {
  const [form, setForm] = useState({ invoice_number: invoice?.invoice_number || `INV-${Date.now().toString().slice(-6)}`, client_id: invoice?.client_id || '', amount: invoice?.amount || '', tax_rate: invoice?.tax_rate || 0, status: invoice?.status || 'draft', issue_date: invoice?.issue_date ? invoice.issue_date.slice(0,10) : new Date().toISOString().slice(0,10), due_date: invoice?.due_date ? invoice.due_date.slice(0,10) : '', description: invoice?.description || '', notes: invoice?.notes || '' });
  const [clients, setClients] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => { api.getClients().then(setClients).catch(() => {}); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const payload = { ...form, client_id: form.client_id || null, due_date: form.due_date || null };
      if (invoice) await api.updateInvoice(invoice.id, payload); else await api.createInvoice(payload);
      onSave();
    } catch (err: any) { setError(err.message); setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{invoice ? 'Edit Invoice' : 'New Invoice'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">{error}</div>}
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Invoice Number *</label><input required value={form.invoice_number} onChange={e => set('invoice_number', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label><input required type="number" min="0" step="0.01" value={form.amount} onChange={e => set('amount', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" /></div>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
            <select value={form.client_id} onChange={e => set('client_id', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="">No client</option>{clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Tax Rate (%)</label><input type="number" min="0" max="100" step="0.5" value={form.tax_rate} onChange={e => set('tax_rate', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="draft">Draft</option><option value="sent">Sent</option><option value="paid">Paid</option><option value="overdue">Overdue</option><option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Issue Date</label><input type="date" value={form.issue_date} onChange={e => set('issue_date', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label><input type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" /></div>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Notes</label><textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" /></div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-60">{saving ? 'Saving...' : invoice ? 'Save Changes' : 'Create Invoice'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
