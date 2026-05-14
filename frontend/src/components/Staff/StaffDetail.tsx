import { useState } from 'react';
import { X, Edit, Trash2, UserCircle, Sparkles } from 'lucide-react';
import { api } from '../../api';
import AIResponse from '../AIResponse';

export default function StaffDetail({ staff, onClose, onRefresh, onEdit }: { staff: any; onClose: () => void; onRefresh: () => void; onEdit: () => void; }) {
  const [aiResult, setAiResult] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Delete this staff member?')) return;
    setDeleting(true);
    try { await api.deleteStaff(staff.id); onRefresh(); } catch (e) { console.error(e); setDeleting(false); }
  };

  const runAI = async () => {
    setAiLoading(true); setAiResult('');
    try { const r = await api.qualityReview({ staffId: staff.id, name: staff.name, role: staff.role, specialization: staff.specialization, activeTasks: staff.active_tasks, utilizationRate: staff.utilization_rate, performanceRating: staff.performance_rating }); setAiResult(r.result); }
    catch (e) { setAiResult('AI analysis failed.'); } finally { setAiLoading(false); }
  };

  const statusColor = (s: string) => ({ active: 'bg-green-100 text-green-800', inactive: 'bg-gray-100 text-gray-500', 'on-leave': 'bg-yellow-100 text-yellow-800' }[s] || 'bg-gray-100');

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white w-full max-w-lg h-full overflow-y-auto shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-600 to-blue-600">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"><UserCircle className="w-5 h-5 text-white" /></div>
            <div><div className="font-bold text-white">{staff.name}</div><div className="text-indigo-100 text-sm capitalize">{staff.role}</div></div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onEdit} className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg"><Edit className="w-4 h-4" /></button>
            <button onClick={handleDelete} disabled={deleting} className="p-2 text-white/80 hover:text-red-200 hover:bg-white/10 rounded-lg"><Trash2 className="w-4 h-4" /></button>
            <button onClick={onClose} className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg"><X className="w-4 h-4" /></button>
          </div>
        </div>
        <div className="p-6 space-y-6 flex-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500 mb-1">Specialization</div><div className="text-sm font-medium text-gray-900 capitalize">{staff.specialization}</div></div>
            <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500 mb-1">Status</div><span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusColor(staff.status)}`}>{staff.status}</span></div>
            <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500 mb-1">Active Tasks</div><div className="text-sm font-semibold text-gray-900">{staff.active_tasks || 0}</div></div>
            <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500 mb-1">Utilization</div><div className="text-sm font-semibold text-gray-900">{staff.utilization_rate || 0}%</div></div>
          </div>
          {staff.performance_rating && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="text-xs text-yellow-700 font-medium mb-1">Performance Rating</div>
              <div className="text-2xl font-bold text-yellow-800">{staff.performance_rating}/5.0</div>
            </div>
          )}
          {staff.email && <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500 mb-1">Email</div><div className="text-sm text-gray-900">{staff.email}</div></div>}
          {staff.phone && <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500 mb-1">Phone</div><div className="text-sm text-gray-900">{staff.phone}</div></div>}
          {staff.hourly_rate && <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500 mb-1">Hourly Rate</div><div className="text-sm font-semibold text-gray-900">${staff.hourly_rate}/hr</div></div>}
          {staff.skills && <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500 mb-1">Skills</div><div className="text-sm text-gray-700">{staff.skills}</div></div>}
          <div>
            <button onClick={runAI} disabled={aiLoading} className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white py-2.5 rounded-lg font-medium text-sm disabled:opacity-60">
              <Sparkles className="w-4 h-4" />{aiLoading ? 'Analyzing...' : 'AI Performance Review'}
            </button>
          </div>
          {(aiLoading || aiResult) && <AIResponse content={aiResult} title="Quality Review" isLoading={aiLoading} onRegenerate={runAI} />}
        </div>
      </div>
    </div>
  );
}
