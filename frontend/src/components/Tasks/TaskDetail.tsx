import { useState } from 'react';
import { X, Edit, Trash2, ClipboardList, Sparkles } from 'lucide-react';
import { api } from '../../api';
import AIResponse from '../AIResponse';

export default function TaskDetail({ task, onClose, onRefresh, onEdit }: { task: any; onClose: () => void; onRefresh: () => void; onEdit: () => void; }) {
  const [aiResult, setAiResult] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Delete this task?')) return;
    setDeleting(true);
    try { await api.deleteTask(task.id); onRefresh(); } catch (e) { console.error(e); setDeleting(false); }
  };

  const runAI = async () => {
    setAiLoading(true); setAiResult('');
    try { const r = await api.routeTask({ taskId: task.id, title: task.title, serviceType: task.service_type, priority: task.priority, estimatedHours: task.estimated_hours, description: task.description }); setAiResult(r.result); }
    catch (e) { setAiResult('AI analysis failed.'); } finally { setAiLoading(false); }
  };

  const priorityColor = (p: string) => ({ critical: 'bg-red-100 text-red-800', high: 'bg-orange-100 text-orange-800', medium: 'bg-yellow-100 text-yellow-800', low: 'bg-green-100 text-green-800' }[p] || 'bg-gray-100');
  const statusColor = (s: string) => ({ open: 'bg-blue-100 text-blue-800', 'in-progress': 'bg-purple-100 text-purple-800', review: 'bg-yellow-100 text-yellow-800', completed: 'bg-green-100 text-green-800', cancelled: 'bg-gray-100 text-gray-500' }[s] || 'bg-gray-100');

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white w-full max-w-lg h-full overflow-y-auto shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"><ClipboardList className="w-5 h-5 text-white" /></div>
            <div><div className="font-bold text-white text-sm">{task.title}</div><div className="text-blue-100 text-xs capitalize">{task.service_type}</div></div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onEdit} className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg"><Edit className="w-4 h-4" /></button>
            <button onClick={handleDelete} disabled={deleting} className="p-2 text-white/80 hover:text-red-200 hover:bg-white/10 rounded-lg"><Trash2 className="w-4 h-4" /></button>
            <button onClick={onClose} className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg"><X className="w-4 h-4" /></button>
          </div>
        </div>
        <div className="p-6 space-y-6 flex-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500 mb-1">Priority</div><span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${priorityColor(task.priority)}`}>{task.priority}</span></div>
            <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500 mb-1">Status</div><span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusColor(task.status)}`}>{task.status}</span></div>
            <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500 mb-1">Client</div><div className="text-sm font-medium text-gray-900">{task.client_name || '—'}</div></div>
            <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500 mb-1">Estimated Hours</div><div className="text-sm font-semibold text-gray-900">{task.estimated_hours}h</div></div>
            {task.actual_hours && <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500 mb-1">Actual Hours</div><div className="text-sm font-semibold text-gray-900">{task.actual_hours}h</div></div>}
            {task.due_date && <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500 mb-1">Due Date</div><div className="text-sm text-gray-900">{new Date(task.due_date).toLocaleDateString()}</div></div>}
          </div>
          {task.description && <div className="bg-gray-50 rounded-lg p-4"><div className="text-xs text-gray-500 mb-2">Description</div><p className="text-sm text-gray-700">{task.description}</p></div>}
          {task.assigned_to_name && <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500 mb-1">Assigned To</div><div className="text-sm font-medium text-gray-900">{task.assigned_to_name}</div></div>}
          <div>
            <button onClick={runAI} disabled={aiLoading} className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white py-2.5 rounded-lg font-medium text-sm disabled:opacity-60">
              <Sparkles className="w-4 h-4" />{aiLoading ? 'Analyzing...' : 'AI Task Routing'}
            </button>
          </div>
          {(aiLoading || aiResult) && <AIResponse content={aiResult} title="Task Routing Recommendation" isLoading={aiLoading} onRegenerate={runAI} />}
        </div>
      </div>
    </div>
  );
}
