import { useState } from 'react';
import { X } from 'lucide-react';
import { api } from '../../api';

export default function TemplateForm({ template, onClose, onSave }: { template: any; onClose: () => void; onSave: () => void; }) {
  const [form, setForm] = useState({ name: template?.name || '', description: template?.description || '', category: template?.category || 'consulting', tier: template?.tier || 'standard', estimated_hours: template?.estimated_hours || 8, base_price: template?.base_price || '', deliverables: template?.deliverables || '', checklist: template?.checklist || '', is_active: template?.is_active !== false });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const payload = { ...form, base_price: form.base_price || null };
      if (template) await api.updateTemplate(template.id, payload); else await api.createTemplate(payload);
      onSave();
    } catch (err: any) { setError(err.message); setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{template ? 'Edit Template' : 'New Template'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">{error}</div>}
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Template Name *</label><input required value={form.name} onChange={e => set('name', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select value={form.category} onChange={e => set('category', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                {['consulting','development','design','support','training','audit','integration','migration'].map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
              </select>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Tier</label>
              <select value={form.tier} onChange={e => set('tier', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="basic">Basic</option><option value="standard">Standard</option><option value="premium">Premium</option><option value="enterprise">Enterprise</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Est. Hours</label><input type="number" min="1" value={form.estimated_hours} onChange={e => set('estimated_hours', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Base Price ($)</label><input type="number" min="0" step="0.01" value={form.base_price} onChange={e => set('base_price', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" /></div>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Deliverables</label><textarea value={form.deliverables} onChange={e => set('deliverables', e.target.value)} rows={3} placeholder="List the deliverables..." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Checklist</label><textarea value={form.checklist} onChange={e => set('checklist', e.target.value)} rows={3} placeholder="Step-by-step checklist..." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" /></div>
          <div className="flex items-center gap-2"><input type="checkbox" id="is_active" checked={form.is_active} onChange={e => set('is_active', e.target.checked)} className="rounded" /><label htmlFor="is_active" className="text-sm font-medium text-gray-700">Active template</label></div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-60">{saving ? 'Saving...' : template ? 'Save Changes' : 'Create Template'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
