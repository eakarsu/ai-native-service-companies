import { useState } from 'react';
import { FileText, Download, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';

type SlaRow = { metric: string; target: string; actual: string; compliant: boolean; percent: number };
type Breach = { date: string; metric: string; detail: string; severity: string };
type Section = { title: string; body?: string; table?: any[] };
type Doc = {
  reportId: string;
  issuedDate: string;
  period: string;
  client: string;
  summary: { overallCompliance: number; metricsTracked: number; metricsCompliant: number; breachesLogged: number };
  sections: Section[];
  signedBy: { name: string; title: string };
};

export default function SlaReportPdf() {
  const [period, setPeriod] = useState('Q1 2026');
  const [clientName, setClientName] = useState('Acme Corp');
  const [includeBreaches, setIncludeBreaches] = useState(true);
  const [doc, setDoc] = useState<Doc | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function generate() {
    setBusy(true); setErr('');
    try {
      const token = localStorage.getItem('token') || '';
      const r = await fetch('/api/custom-views/sla-report-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ period, clientName, includeBreaches }),
      });
      if (!r.ok) throw new Error('Failed to generate report');
      const json = await r.json();
      setDoc(json.document);
    } catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  }

  function downloadText() {
    if (!doc) return;
    const lines = [
      `SLA COMPLIANCE REPORT`,
      `Report ID: ${doc.reportId}`,
      `Client: ${doc.client}`,
      `Period: ${doc.period}`,
      `Issued: ${doc.issuedDate}`,
      ``,
      `Overall compliance: ${doc.summary.overallCompliance}%`,
      `Metrics compliant: ${doc.summary.metricsCompliant}/${doc.summary.metricsTracked}`,
      `Breaches logged: ${doc.summary.breachesLogged}`,
      ``,
    ];
    doc.sections.forEach(s => {
      lines.push(s.title);
      if (s.body) lines.push(s.body);
      if (s.table) s.table.forEach(row => lines.push(JSON.stringify(row)));
      lines.push('');
    });
    lines.push(`Signed by: ${doc.signedBy.name}, ${doc.signedBy.title}`);
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${doc.reportId}.txt`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="bg-white rounded-xl shadow p-6" data-testid="sla-pdf-card">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <FileText className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">SLA Report PDF</h2>
          <p className="text-xs text-slate-500">Generate a formatted SLA compliance document</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <label className="text-xs">
          <div className="text-slate-600 mb-1">Period</div>
          <input className="w-full border border-slate-200 rounded px-2 py-1.5 text-sm" value={period} onChange={e => setPeriod(e.target.value)} />
        </label>
        <label className="text-xs">
          <div className="text-slate-600 mb-1">Client Name</div>
          <input className="w-full border border-slate-200 rounded px-2 py-1.5 text-sm" value={clientName} onChange={e => setClientName(e.target.value)} />
        </label>
      </div>
      <label className="flex items-center gap-2 text-xs text-slate-700 mb-3">
        <input type="checkbox" checked={includeBreaches} onChange={e => setIncludeBreaches(e.target.checked)} />
        Include breach log
      </label>

      <div className="flex gap-2 mb-4">
        <button
          onClick={generate}
          disabled={busy}
          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {busy ? 'Generating...' : 'Generate Report'}
        </button>
        {doc && (
          <button onClick={downloadText} className="px-3 py-1.5 text-sm bg-slate-100 text-slate-700 rounded hover:bg-slate-200 flex items-center gap-1">
            <Download className="w-3 h-3" /> Download
          </button>
        )}
      </div>

      {err && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" />{err}</div>}

      {doc && (
        <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-xs text-slate-500">Report</div>
              <div className="font-bold text-slate-900">{doc.reportId}</div>
            </div>
            <div className="text-right text-xs text-slate-500">
              <div>{doc.client}</div>
              <div>{doc.period} | {doc.issuedDate}</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="bg-white p-2 rounded">
              <div className="text-[10px] text-slate-500">Overall</div>
              <div className="font-bold text-slate-900">{doc.summary.overallCompliance}%</div>
            </div>
            <div className="bg-white p-2 rounded">
              <div className="text-[10px] text-slate-500">Compliant</div>
              <div className="font-bold text-emerald-700">{doc.summary.metricsCompliant}/{doc.summary.metricsTracked}</div>
            </div>
            <div className="bg-white p-2 rounded">
              <div className="text-[10px] text-slate-500">Breaches</div>
              <div className="font-bold text-rose-700">{doc.summary.breachesLogged}</div>
            </div>
          </div>
          {doc.sections.map((s, i) => (
            <div key={i} className="mb-3">
              <div className="text-sm font-semibold text-slate-800 mb-1">{s.title}</div>
              {s.body && <div className="text-xs text-slate-600">{s.body}</div>}
              {s.table && s.table.length > 0 && (
                <div className="mt-2 space-y-1">
                  {s.table.map((row: any, ri: number) => (
                    <div key={ri} className="bg-white px-2 py-1 rounded text-[11px] text-slate-700 flex items-center gap-2">
                      {'compliant' in row && (row.compliant
                        ? <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        : <XCircle className="w-3 h-3 text-rose-600" />)}
                      <span className="flex-1">
                        {row.metric && <span className="font-medium">{row.metric}: </span>}
                        {row.target && <span>target {row.target} · </span>}
                        {row.actual && <span>actual {row.actual}</span>}
                        {row.date && <span>{row.date} — {row.metric}: {row.detail} ({row.severity})</span>}
                      </span>
                      {'percent' in row && <span className="font-mono">{row.percent}%</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          <div className="text-xs text-slate-500 mt-4 pt-3 border-t border-slate-200">
            Signed by {doc.signedBy.name}, {doc.signedBy.title}
          </div>
        </div>
      )}
    </div>
  );
}
