import { useState } from 'react';
import { X, Edit, Trash2, FileText } from 'lucide-react';
import { api } from '../../api';

export default function InvoiceDetail({ invoice, onClose, onRefresh, onEdit }: { invoice: any; onClose: () => void; onRefresh: () => void; onEdit: () => void; }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Delete this invoice?')) return;
    setDeleting(true);
    try { await api.deleteInvoice(invoice.id); onRefresh(); } catch (e) { console.error(e); setDeleting(false); }
  };

  const statusColor = (s: string) => ({ draft: 'bg-gray-100 text-gray-600', sent: 'bg-blue-100 text-blue-800', paid: 'bg-green-100 text-green-800', overdue: 'bg-red-100 text-red-800', cancelled: 'bg-gray-100 text-gray-500' }[s] || 'bg-gray-100');

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white w-full max-w-lg h-full overflow-y-auto shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-green-600 to-emerald-600">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"><FileText className="w-5 h-5 text-white" /></div>
            <div><div className="font-bold text-white">{invoice.invoice_number}</div><div className="text-green-100 text-sm">{invoice.client_name}</div></div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onEdit} className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg"><Edit className="w-4 h-4" /></button>
            <button onClick={handleDelete} disabled={deleting} className="p-2 text-white/80 hover:text-red-200 hover:bg-white/10 rounded-lg"><Trash2 className="w-4 h-4" /></button>
            <button onClick={onClose} className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg"><X className="w-4 h-4" /></button>
          </div>
        </div>
        <div className="p-6 space-y-6 flex-1">
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
            <div className="text-xs text-green-700 font-medium mb-1">Amount</div>
            <div className="text-4xl font-bold text-green-800">${parseFloat(invoice.amount || 0).toLocaleString()}</div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500 mb-1">Status</div><span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusColor(invoice.status)}`}>{invoice.status}</span></div>
            <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500 mb-1">Tax Rate</div><div className="text-sm font-medium text-gray-900">{invoice.tax_rate || 0}%</div></div>
            {invoice.issue_date && <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500 mb-1">Issue Date</div><div className="text-sm text-gray-900">{new Date(invoice.issue_date).toLocaleDateString()}</div></div>}
            {invoice.due_date && <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500 mb-1">Due Date</div><div className="text-sm text-gray-900">{new Date(invoice.due_date).toLocaleDateString()}</div></div>}
            {invoice.paid_date && <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500 mb-1">Paid Date</div><div className="text-sm text-gray-900">{new Date(invoice.paid_date).toLocaleDateString()}</div></div>}
          </div>
          {invoice.description && <div className="bg-gray-50 rounded-lg p-4"><div className="text-xs text-gray-500 mb-2">Description</div><p className="text-sm text-gray-700">{invoice.description}</p></div>}
          {invoice.notes && <div className="bg-gray-50 rounded-lg p-4"><div className="text-xs text-gray-500 mb-2">Notes</div><p className="text-sm text-gray-700">{invoice.notes}</p></div>}
        </div>
      </div>
    </div>
  );
}
