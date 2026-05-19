import { useState } from 'react';
import { FileText, Download } from 'lucide-react';

type Doc = {
  contractId: string;
  issuedDate: string;
  parties: { provider: string; client: string };
  serviceType: string;
  durationMonths: number;
  monthlyFee: number;
  totalValue: number;
  sections: { title: string; body: string }[];
  signatures: { role: string; name: string }[];
};

export default function ContractPdfGenerator() {
  const [clientName, setClientName] = useState('Northwind Analytics');
  const [serviceType, setServiceType] = useState('AI Strategy Consulting');
  const [durationMonths, setDurationMonths] = useState(12);
  const [monthlyFee, setMonthlyFee] = useState(8500);
  const [loading, setLoading] = useState(false);
  const [doc, setDoc] = useState<Doc | null>(null);
  const [err, setErr] = useState('');

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setErr(''); setDoc(null);
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch('/api/custom-views/contract-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ clientName, serviceType, durationMonths, monthlyFee }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setDoc(data.document);
    } catch (e: any) { setErr(e.message); }
    finally { setLoading(false); }
  }

  function downloadAsText() {
    if (!doc) return;
    const text = `CONTRACT ${doc.contractId}\nIssued: ${doc.issuedDate}\n\nProvider: ${doc.parties.provider}\nClient: ${doc.parties.client}\n\n${doc.sections.map(s => `${s.title}\n${s.body}`).join('\n\n')}\n\nSignatures:\n${doc.signatures.map(s => `  ${s.role}: ${s.name}`).join('\n')}`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `contract_${doc.contractId}.txt`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
          <FileText className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Contract PDF Generator</h2>
          <p className="text-xs text-slate-500">Generate a service engagement contract</p>
        </div>
      </div>

      <form onSubmit={generate} className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-xs text-slate-600 mb-1">Client Name</label>
          <input value={clientName} onChange={e => setClientName(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-slate-600 mb-1">Service Type</label>
          <input value={serviceType} onChange={e => setServiceType(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-slate-600 mb-1">Duration (months)</label>
          <input type="number" value={durationMonths} onChange={e => setDurationMonths(Number(e.target.value))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-slate-600 mb-1">Monthly Fee (USD)</label>
          <input type="number" value={monthlyFee} onChange={e => setMonthlyFee(Number(e.target.value))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div className="col-span-2">
          <button disabled={loading} type="submit" className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-lg text-sm">
            {loading ? 'Generating...' : 'Generate Contract'}
          </button>
        </div>
      </form>

      {err && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm mb-3">{err}</div>}

      {doc && (
        <div className="border border-slate-200 rounded-lg p-5 bg-slate-50">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-xs text-slate-500">Contract ID</div>
              <div className="text-lg font-bold text-slate-900">{doc.contractId}</div>
            </div>
            <button onClick={downloadAsText} className="flex items-center gap-1 bg-white border border-slate-300 hover:border-slate-400 text-slate-700 px-3 py-1.5 rounded-lg text-xs">
              <Download className="w-3.5 h-3.5" /> Download
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs mb-4 bg-white p-3 rounded">
            <div><span className="text-slate-500">Issued:</span> <b>{doc.issuedDate}</b></div>
            <div><span className="text-slate-500">Term:</span> <b>{doc.durationMonths} mo</b></div>
            <div><span className="text-slate-500">Total Value:</span> <b>${doc.totalValue.toLocaleString()}</b></div>
            <div className="col-span-3"><span className="text-slate-500">Parties:</span> <b>{doc.parties.provider}</b> &harr; <b>{doc.parties.client}</b></div>
          </div>
          <div className="space-y-3 max-h-72 overflow-auto">
            {doc.sections.map(s => (
              <div key={s.title}>
                <div className="text-sm font-semibold text-slate-800">{s.title}</div>
                <div className="text-xs text-slate-600 mt-0.5">{s.body}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-200 grid grid-cols-2 gap-3 text-xs">
            {doc.signatures.map(s => (
              <div key={s.role}>
                <div className="text-slate-500">{s.role}</div>
                <div className="text-slate-800 font-medium border-b border-slate-400 pb-1">{s.name}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
