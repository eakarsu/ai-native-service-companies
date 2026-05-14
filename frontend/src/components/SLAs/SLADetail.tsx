import { useState } from 'react';
import { X, Edit, Trash2, ShieldCheck, Sparkles } from 'lucide-react';
import { api } from '../../api';
import AIResponse from '../AIResponse';

export default function SLADetail({ sla, onClose, onRefresh, onEdit }: { sla: any; onClose: () => void; onRefresh: () => void; onEdit: () => void; }) {
  const [aiResult, setAiResult] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Delete this SLA?')) return;
    setDeleting(true);
    try { await api.deleteSLA(sla.id); onRefresh(); } catch (e) { console.error(e); setDeleting(false); }
  };

  const runAI = async () => {
    setAiLoading(true); setAiResult('');
    try { const r = await api.slaRisk({ slaId: sla.id, name: sla.name, serviceLevel: sla.service_level, responseTime: sla.response_time_hours, resolutionTime: sla.resolution_time_hours, endDate: sla.end_date, clientName: sla.client_name }); setAiResult(r.result); }
    catch (e) { setAiResult('AI analysis failed.'); } finally { setAiLoading(false); }
  };

  const statusColor = (s: string) => ({ active: 'bg-green-100 text-green-800', expired: 'bg-gray-100 text-gray-500', draft: 'bg-blue-100 text-blue-800', terminated: 'bg-red-100 text-red-800' }[s] || 'bg-gray-100');
  const levelColor = (l: string) => ({ platinum: 'bg-purple-100 text-purple-800', gold: 'bg-yellow-100 text-yellow-800', silver: 'bg-gray-100 text-gray-700', bronze: 'bg-orange-100 text-orange-800' }[l] || 'bg-gray-100');

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white w-full max-w-lg h-full overflow-y-auto shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-cyan-600">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"><ShieldCheck className="w-5 h-5 text-white" /></div>
            <div><div className="font-bold text-white">{sla.name}</div><div className="text-blue-100 text-sm">{sla.client_name || 'No client'}</div></div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onEdit} className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg"><Edit className="w-4 h-4" /></button>
            <button onClick={handleDelete} disabled={deleting} className="p-2 text-white/80 hover:text-red-200 hover:bg-white/10 rounded-lg"><Trash2 className="w-4 h-4" /></button>
            <button onClick={onClose} className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg"><X className="w-4 h-4" /></button>
          </div>
        </div>
        <div className="p-6 space-y-6 flex-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500 mb-1">Service Level</div><span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${levelColor(sla.service_level)}`}>{sla.service_level}</span></div>
            <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500 mb-1">Status</div><span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusColor(sla.status)}`}>{sla.status}</span></div>
            <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500 mb-1">Response Time</div><div className="text-sm font-semibold text-gray-900">{sla.response_time_hours}h</div></div>
            <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500 mb-1">Resolution Time</div><div className="text-sm font-semibold text-gray-900">{sla.resolution_time_hours}h</div></div>
            {sla.uptime_guarantee && <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500 mb-1">Uptime Guarantee</div><div className="text-sm font-semibold text-gray-900">{sla.uptime_guarantee}%</div></div>}
            {sla.monthly_value && <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500 mb-1">Monthly Value</div><div className="text-sm font-semibold text-gray-900">${parseFloat(sla.monthly_value).toLocaleString()}</div></div>}
          </div>
          {(sla.start_date || sla.end_date) && (
            <div className="grid grid-cols-2 gap-4">
              {sla.start_date && <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500 mb-1">Start Date</div><div className="text-sm text-gray-900">{new Date(sla.start_date).toLocaleDateString()}</div></div>}
              {sla.end_date && <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500 mb-1">End Date</div><div className="text-sm text-gray-900">{new Date(sla.end_date).toLocaleDateString()}</div></div>}
            </div>
          )}
          {sla.terms && <div className="bg-gray-50 rounded-lg p-4"><div className="text-xs text-gray-500 mb-2">Terms</div><p className="text-sm text-gray-700">{sla.terms}</p></div>}
          <div>
            <button onClick={runAI} disabled={aiLoading} className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white py-2.5 rounded-lg font-medium text-sm disabled:opacity-60">
              <Sparkles className="w-4 h-4" />{aiLoading ? 'Analyzing...' : 'AI SLA Risk Assessment'}
            </button>
          </div>
          {(aiLoading || aiResult) && <AIResponse content={aiResult} title="SLA Risk Assessment" isLoading={aiLoading} onRegenerate={runAI} />}
        </div>
      </div>
    </div>
  );
}
