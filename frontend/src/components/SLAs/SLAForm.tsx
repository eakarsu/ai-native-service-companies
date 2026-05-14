import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { api } from '../../api';

export default function SLAForm({ sla, onClose, onSave }: { sla: any; onClose: () => void; onSave: () => void; }) {
  const [form, setForm] = useState({ name: sla?.name || '', client_id: sla?.client_id || '', service_level: sla?.service_level || 'silver', response_time_hours: sla?.response_time_hours || 4, resolution_time_hours: sla?.resolution_time_hours || 24, uptime_guarantee: sla?.uptime_guarantee || 99.9, monthly_value: sla?.monthly_value || '', status: sla?.status || 'draft', start_date: sla?.start_date ? sla.start_date.slice(0,10) : '', end_date: sla?.end_date ? sla.end_date.slice(0,10) : '', terms: sla?.terms || '' });
  const [clients, setClients] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => { api.getClients().then(setClients).catch(() => {}); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const payload = { ...form, client_id: form.client_id || null, monthly_value: form.monthly_value || null, start_date: form.start_date || null, end_date: form.end_date || null };
      if (sla) await api.updateSLA(sla.id, payload); else await api.createSLA(payload);
      onSave();
    } catch (err: any) { setError(err.message); setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{sla ? 'Edit SLA' : 'New SLA Agreement'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">{error}</div>}
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Agreement Name *</label><input required value={form.name} onChange={e => set('name', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
            <select value={form.client_id} onChange={e => set('client_id', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="">No client</option>{clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Service Level</label>
              <select value={form.service_level} onChange={e => set('service_level', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="bronze">Bronze</option><option value="silver">Silver</option><option value="gold">Gold</option><option value="platinum">Platinum</option>
              </select>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="draft">Draft</option><option value="active">Active</option><option value="expired">Expired</option><option value="terminated">Terminated</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Response (hrs)</label><input type="number" min="1" value={form.response_time_hours} onChange={e => set('response_time_hours', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Resolution (hrs)</label><input type="number" min="1" value={form.resolution_time_hours} onChange={e => set('resolution_time_hours', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Uptime %</label><input type="number" min="0" max="100" step="0.1" value={form.uptime_guarantee} onChange={e => set('uptime_guarantee', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" /></div>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Monthly Value ($)</label><input type="number" min="0" step="0.01" value={form.monthly_value} onChange={e => set('monthly_value', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label><input type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">End Date</label><input type="date" value={form.end_date} onChange={e => set('end_date', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" /></div>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Terms</label><textarea value={form.terms} onChange={e => set('terms', e.target.value)} rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" /></div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-60">{saving ? 'Saving...' : sla ? 'Save Changes' : 'Create SLA'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
