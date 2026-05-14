import { useState } from 'react';
import { X, Edit, Trash2, LayoutTemplate } from 'lucide-react';
import { api } from '../../api';

export default function TemplateDetail({ template, onClose, onRefresh, onEdit }: { template: any; onClose: () => void; onRefresh: () => void; onEdit: () => void; }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Delete this template?')) return;
    setDeleting(true);
    try { await api.deleteTemplate(template.id); onRefresh(); } catch (e) { console.error(e); setDeleting(false); }
  };

  const tierColor = (t: string) => ({ enterprise: 'bg-purple-100 text-purple-800', premium: 'bg-blue-100 text-blue-800', standard: 'bg-gray-100 text-gray-600', basic: 'bg-green-100 text-green-700' }[t] || 'bg-gray-100');

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white w-full max-w-lg h-full overflow-y-auto shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-violet-600">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"><LayoutTemplate className="w-5 h-5 text-white" /></div>
            <div><div className="font-bold text-white">{template.name}</div><div className="text-blue-100 text-sm capitalize">{template.category}</div></div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onEdit} className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg"><Edit className="w-4 h-4" /></button>
            <button onClick={handleDelete} disabled={deleting} className="p-2 text-white/80 hover:text-red-200 hover:bg-white/10 rounded-lg"><Trash2 className="w-4 h-4" /></button>
            <button onClick={onClose} className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg"><X className="w-4 h-4" /></button>
          </div>
        </div>
        <div className="p-6 space-y-6 flex-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500 mb-1">Tier</div><span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${tierColor(template.tier)}`}>{template.tier}</span></div>
            <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500 mb-1">Estimated Hours</div><div className="text-sm font-semibold text-gray-900">{template.estimated_hours}h</div></div>
            {template.base_price && <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500 mb-1">Base Price</div><div className="text-sm font-semibold text-gray-900">${parseFloat(template.base_price).toLocaleString()}</div></div>}
            <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500 mb-1">Active</div><div className="text-sm font-medium">{template.is_active ? <span className="text-green-600">Yes</span> : <span className="text-gray-400">No</span>}</div></div>
          </div>
          {template.description && <div className="bg-gray-50 rounded-lg p-4"><div className="text-xs text-gray-500 mb-2">Description</div><p className="text-sm text-gray-700">{template.description}</p></div>}
          {template.deliverables && <div className="bg-gray-50 rounded-lg p-4"><div className="text-xs text-gray-500 mb-2">Deliverables</div><p className="text-sm text-gray-700 whitespace-pre-line">{template.deliverables}</p></div>}
          {template.checklist && <div className="bg-gray-50 rounded-lg p-4"><div className="text-xs text-gray-500 mb-2">Checklist</div><p className="text-sm text-gray-700 whitespace-pre-line">{template.checklist}</p></div>}
        </div>
      </div>
    </div>
  );
}
