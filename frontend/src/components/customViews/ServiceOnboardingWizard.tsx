import { useEffect, useState } from 'react';
import { ListChecks, ChevronRight, ChevronLeft, CheckCircle } from 'lucide-react';

type Field = { name: string; label: string; type: string; options?: string[]; required?: boolean };
type Step = { id: number; key: string; title: string; description: string; estimatedMinutes: number; fields: Field[] };
type Flow = { steps: Step[]; totalSteps: number; estimatedTotalMinutes: number; welcomeMessage: string };

export default function ServiceOnboardingWizard() {
  const [flow, setFlow] = useState<Flow | null>(null);
  const [err, setErr] = useState('');
  const [stepIdx, setStepIdx] = useState(0);
  const [form, setForm] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('token') || '';
    fetch('/api/custom-views/onboarding-flow', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : Promise.reject(new Error('Failed to load')))
      .then(setFlow)
      .catch(e => setErr(e.message));
  }, []);

  if (err) return <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">{err}</div>;
  if (!flow) return <div className="bg-white p-6 rounded-xl shadow text-slate-500">Loading wizard...</div>;

  const step = flow.steps[stepIdx];
  const progress = ((stepIdx + 1) / flow.totalSteps) * 100;

  async function submit() {
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch('/api/custom-views/onboarding-flow/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      setResult(data);
    } catch (e: any) { setErr(e.message); }
    finally { setSubmitting(false); }
  }

  function setField(name: string, val: any) {
    setForm(f => ({ ...f, [name]: val }));
  }

  if (result) {
    return (
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Onboarding Complete</h2>
            <p className="text-xs text-slate-500">Submission ID: {result.submissionId}</p>
          </div>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <div className="text-sm font-semibold text-emerald-900 mb-2">Next Steps</div>
          <ul className="space-y-1">
            {result.nextActions?.map((a: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm text-emerald-800">
                <CheckCircle className="w-4 h-4 mt-0.5" /> {a}
              </li>
            ))}
          </ul>
        </div>
        <button
          onClick={() => { setResult(null); setStepIdx(0); setForm({}); }}
          className="mt-4 text-sm text-blue-600 hover:underline"
        >
          Start another onboarding
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
          <ListChecks className="w-5 h-5 text-amber-600" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-slate-900">Service Onboarding Wizard</h2>
          <p className="text-xs text-slate-500">{flow.welcomeMessage}</p>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
          <span>Step {stepIdx + 1} of {flow.totalSteps}</span>
          <span>~{flow.estimatedTotalMinutes} min total</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2">
          <div className="bg-amber-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="border border-slate-200 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-base font-semibold text-slate-900">{step.title}</h3>
          <span className="text-xs text-slate-500">~{step.estimatedMinutes} min</span>
        </div>
        <p className="text-xs text-slate-600 mb-4">{step.description}</p>
        <div className="space-y-3">
          {step.fields.map(f => (
            <div key={f.name}>
              <label className="block text-xs text-slate-700 font-medium mb-1">
                {f.label} {f.required && <span className="text-red-500">*</span>}
              </label>
              {f.type === 'textarea' ? (
                <textarea value={form[f.name] || ''} onChange={e => setField(f.name, e.target.value)} rows={2} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              ) : f.type === 'select' ? (
                <select value={form[f.name] || ''} onChange={e => setField(f.name, e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                  <option value="">Select...</option>
                  {f.options?.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input
                  type={f.type}
                  value={form[f.name] || ''}
                  onChange={e => setField(f.name, e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button
          disabled={stepIdx === 0}
          onClick={() => setStepIdx(i => Math.max(0, i - 1))}
          className="flex items-center gap-1 text-sm text-slate-600 disabled:opacity-40 px-3 py-2"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        {stepIdx < flow.totalSteps - 1 ? (
          <button
            onClick={() => setStepIdx(i => Math.min(flow.totalSteps - 1, i + 1))}
            className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium px-4 py-2 rounded-lg"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            disabled={submitting}
            onClick={submit}
            className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg"
          >
            {submitting ? 'Submitting...' : 'Submit & Schedule Kickoff'}
          </button>
        )}
      </div>
    </div>
  );
}
