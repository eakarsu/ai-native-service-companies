import { useEffect, useState } from 'react';
import { Workflow, Plus, Trash2, Save, AlertCircle, Bot, User } from 'lucide-react';

type Step = { id: number; title: string; owner: string; durationHours: number; automated: boolean };
type Wf = { id: string; name: string; description: string; steps: Step[] };

export default function ServiceWorkflowEditor() {
  const [workflows, setWorkflows] = useState<Wf[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Wf | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const token = () => localStorage.getItem('token') || '';
  const auth = () => ({ Authorization: `Bearer ${token()}` });

  async function load() {
    setErr('');
    try {
      const r = await fetch('/api/custom-views/service-workflows', { headers: auth() });
      if (!r.ok) throw new Error('Failed to load workflows');
      const json = await r.json();
      setWorkflows(json.workflows);
      if (!selectedId && json.workflows.length > 0) {
        setSelectedId(json.workflows[0].id);
        setDraft(JSON.parse(JSON.stringify(json.workflows[0])));
      }
    } catch (e: any) { setErr(e.message); }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  function pick(id: string) {
    setSelectedId(id);
    const wf = workflows.find(w => w.id === id);
    if (wf) setDraft(JSON.parse(JSON.stringify(wf)));
  }

  function addStep() {
    if (!draft) return;
    const nextId = draft.steps.length > 0 ? Math.max(...draft.steps.map(s => s.id)) + 1 : 1;
    setDraft({ ...draft, steps: [...draft.steps, { id: nextId, title: 'New Step', owner: 'Unassigned', durationHours: 1, automated: false }] });
  }

  function updateStep(idx: number, patch: Partial<Step>) {
    if (!draft) return;
    const steps = draft.steps.map((s, i) => i === idx ? { ...s, ...patch } : s);
    setDraft({ ...draft, steps });
  }

  function removeStep(idx: number) {
    if (!draft) return;
    setDraft({ ...draft, steps: draft.steps.filter((_, i) => i !== idx) });
  }

  async function save() {
    if (!draft) return;
    setBusy(true); setErr('');
    try {
      const r = await fetch(`/api/custom-views/service-workflows/${draft.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...auth() },
        body: JSON.stringify(draft),
      });
      if (!r.ok) throw new Error('Failed to save');
      await load();
    } catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  }

  async function createNew() {
    setBusy(true); setErr('');
    try {
      const r = await fetch('/api/custom-views/service-workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...auth() },
        body: JSON.stringify({ name: 'New Workflow', description: '', steps: [{ title: 'Step 1', owner: 'Unassigned', durationHours: 1, automated: false }] }),
      });
      if (!r.ok) throw new Error('Failed to create');
      const json = await r.json();
      await load();
      setSelectedId(json.workflow.id);
      setDraft(json.workflow);
    } catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  }

  async function removeWorkflow() {
    if (!draft) return;
    if (!confirm(`Delete workflow "${draft.name}"?`)) return;
    setBusy(true); setErr('');
    try {
      const r = await fetch(`/api/custom-views/service-workflows/${draft.id}`, { method: 'DELETE', headers: auth() });
      if (!r.ok) throw new Error('Failed to delete');
      setSelectedId(null);
      setDraft(null);
      await load();
    } catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  }

  return (
    <div className="bg-white rounded-xl shadow p-6" data-testid="workflow-editor-card">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
          <Workflow className="w-5 h-5 text-violet-600" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-slate-900">Service Workflow Editor</h2>
          <p className="text-xs text-slate-500">Create and edit reusable service playbooks (CRUD)</p>
        </div>
        <button onClick={createNew} disabled={busy} className="px-2.5 py-1.5 text-xs bg-violet-600 text-white rounded hover:bg-violet-700 disabled:opacity-50 flex items-center gap-1">
          <Plus className="w-3 h-3" /> New
        </button>
      </div>

      {err && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded text-sm flex items-center gap-2 mb-3"><AlertCircle className="w-4 h-4" />{err}</div>}

      <div className="flex flex-wrap gap-2 mb-4">
        {workflows.map(w => (
          <button
            key={w.id}
            onClick={() => pick(w.id)}
            className={`px-2.5 py-1 text-xs rounded border ${selectedId === w.id ? 'border-violet-500 bg-violet-50 text-violet-800' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}
          >
            {w.name} <span className="text-slate-400">({w.steps.length})</span>
          </button>
        ))}
      </div>

      {draft && (
        <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
          <div className="grid grid-cols-1 gap-2 mb-3">
            <label className="text-xs">
              <div className="text-slate-600 mb-1">Workflow Name</div>
              <input className="w-full border border-slate-200 rounded px-2 py-1.5 text-sm bg-white" value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} />
            </label>
            <label className="text-xs">
              <div className="text-slate-600 mb-1">Description</div>
              <textarea className="w-full border border-slate-200 rounded px-2 py-1.5 text-sm bg-white" rows={2} value={draft.description} onChange={e => setDraft({ ...draft, description: e.target.value })} />
            </label>
          </div>

          <div className="space-y-2 mb-3">
            {draft.steps.map((s, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded p-2 grid grid-cols-12 gap-2 items-center">
                <div className="col-span-1 text-center text-xs font-bold text-slate-500">#{i + 1}</div>
                <input className="col-span-4 border border-slate-200 rounded px-2 py-1 text-xs" value={s.title} onChange={e => updateStep(i, { title: e.target.value })} placeholder="Title" />
                <input className="col-span-3 border border-slate-200 rounded px-2 py-1 text-xs" value={s.owner} onChange={e => updateStep(i, { owner: e.target.value })} placeholder="Owner" />
                <input type="number" min={0} step={0.25} className="col-span-2 border border-slate-200 rounded px-2 py-1 text-xs" value={s.durationHours} onChange={e => updateStep(i, { durationHours: Number(e.target.value) })} />
                <label className="col-span-1 text-[10px] flex items-center gap-1 text-slate-600">
                  <input type="checkbox" checked={s.automated} onChange={e => updateStep(i, { automated: e.target.checked })} />
                  {s.automated ? <Bot className="w-3 h-3 text-violet-600" /> : <User className="w-3 h-3 text-slate-500" />}
                </label>
                <button onClick={() => removeStep(i)} className="col-span-1 text-rose-600 hover:text-rose-800 flex justify-center">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button onClick={addStep} className="px-2.5 py-1.5 text-xs bg-slate-100 text-slate-700 rounded hover:bg-slate-200 flex items-center gap-1">
              <Plus className="w-3 h-3" /> Add Step
            </button>
            <button onClick={save} disabled={busy} className="px-2.5 py-1.5 text-xs bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1">
              <Save className="w-3 h-3" /> {busy ? 'Saving...' : 'Save'}
            </button>
            <button onClick={removeWorkflow} disabled={busy} className="px-2.5 py-1.5 text-xs bg-rose-100 text-rose-700 rounded hover:bg-rose-200 disabled:opacity-50 flex items-center gap-1">
              <Trash2 className="w-3 h-3" /> Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
