import { useState } from 'react';
import { X, Edit, Trash2, Building2, Briefcase, Star, CheckSquare, Sparkles } from 'lucide-react';
import { api } from '../../api';
import AIResponse from '../AIResponse';

export default function ClientDetail({ client, onClose, onRefresh, onEdit }: { client: any; onClose: () => void; onRefresh: () => void; onEdit: () => void; }) {
  const [aiResult, setAiResult] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Delete this client?')) return;
    setDeleting(true);
    try { await api.deleteClient(client.id); onRefresh(); } catch (e) { console.error(e); setDeleting(false); }
  };

  const runAI = async () => {
    setAiLoading(true); setAiResult('');
    try { const r = await api.clientInsights({ clientId: client.id, clientName: client.name, company: client.company, industry: client.industry, tier: client.tier, totalTasks: client.total_tasks, satisfaction: client.satisfaction_score }); setAiResult(r.result); }
    catch (e) { setAiResult('AI analysis failed.'); } finally { setAiLoading(false); }
  };

  const tierColor = (t: string) => ({ enterprise: 'bg-purple-100 text-purple-800', premium: 'bg-blue-100 text-blue-800', standard: 'bg-gray-100 text-gray-600' }[t] || 'bg-gray-100');
  const statusColor = (s: string) => ({ active: 'bg-green-100 text-green-800', inactive: 'bg-gray-100 text-gray-500' }[s] || 'bg-gray-100');

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white w-full max-w-lg h-full overflow-y-auto shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"><Building2 className="w-5 h-5 text-white" /></div>
            <div><div className="font-bold text-white">{client.name}</div><div className="text-blue-100 text-sm">{client.company}</div></div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onEdit} className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg"><Edit className="w-4 h-4" /></button>
            <button onClick={handleDelete} disabled={deleting} className="p-2 text-white/80 hover:text-red-200 hover:bg-white/10 rounded-lg"><Trash2 className="w-4 h-4" /></button>
            <button onClick={onClose} className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg"><X className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="p-6 space-y-6 flex-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500 mb-1">Industry</div><div className="font-medium text-gray-900 capitalize flex items-center gap-1"><Briefcase className="w-3.5 h-3.5 text-gray-400" />{client.industry}</div></div>
            <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500 mb-1">Tier</div><span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${tierColor(client.tier)}`}>{client.tier}</span></div>
            <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500 mb-1">Status</div><span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusColor(client.status)}`}>{client.status}</span></div>
            <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500 mb-1">Total Tasks</div><div className="font-semibold text-gray-900 flex items-center gap-1"><CheckSquare className="w-3.5 h-3.5 text-gray-400" />{client.total_tasks}</div></div>
          </div>

          {client.satisfaction_score && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3">
              <Star className="w-5 h-5 text-yellow-500" />
              <div><div className="text-xs text-yellow-700 font-medium">Satisfaction Score</div><div className="text-xl font-bold text-yellow-800">{client.satisfaction_score}/5.0</div></div>
            </div>
          )}

          {client.email && <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500 mb-1">Email</div><div className="text-sm text-gray-900">{client.email}</div></div>}
          {client.phone && <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500 mb-1">Phone</div><div className="text-sm text-gray-900">{client.phone}</div></div>}
          {client.notes && <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500 mb-1">Notes</div><div className="text-sm text-gray-700">{client.notes}</div></div>}

          <div>
            <button onClick={runAI} disabled={aiLoading} className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white py-2.5 rounded-lg font-medium text-sm disabled:opacity-60">
              <Sparkles className="w-4 h-4" />{aiLoading ? 'Analyzing...' : 'AI Client Insights'}
            </button>
          </div>
          {(aiLoading || aiResult) && <AIResponse content={aiResult} title="Client Insights" isLoading={aiLoading} onRegenerate={runAI} />}
        </div>
      </div>
    </div>
  );
}
