import { useState } from 'react';
import { Download, FileText } from 'lucide-react';
import { api } from '../api';

const ENTITIES = [
  { key: 'clients', label: 'Clients' },
  { key: 'tasks', label: 'Service Tasks' },
  { key: 'invoices', label: 'Invoices' },
  { key: 'staff', label: 'Staff' },
  { key: 'slas', label: 'SLA Agreements' },
  { key: 'templates', label: 'Service Templates' },
];

export default function CSVExport() {
  const [busy, setBusy] = useState<string>('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleExport = async (entity: string) => {
    setBusy(entity); setError(''); setSuccess('');
    try {
      await api.exportCsv(entity);
      setSuccess(`Downloaded ${entity}.csv`);
    } catch (e: any) {
      setError(e?.message || 'Export failed');
    } finally { setBusy(''); }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <Download className="w-7 h-7 text-blue-600" />
        <div>
          <h2 className="text-2xl font-bold text-gray-900">CSV Export</h2>
          <p className="text-gray-500 text-sm">Download any entity as CSV (up to 5,000 rows).</p>
        </div>
      </div>

      {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>}
      {success && <div className="mb-4 bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 text-sm">{success}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {ENTITIES.map(e => (
          <div key={e.key} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center"><FileText className="w-5 h-5 text-blue-600" /></div>
              <div>
                <div className="font-medium text-gray-900 text-sm">{e.label}</div>
                <div className="text-xs text-gray-500">/api/export/{e.key}</div>
              </div>
            </div>
            <button onClick={() => handleExport(e.key)} disabled={!!busy} className="bg-blue-600 disabled:bg-blue-400 hover:bg-blue-700 text-white text-sm font-medium px-3 py-1.5 rounded-lg flex items-center gap-1">
              {busy === e.key ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Download className="w-4 h-4" />}
              <span>Export</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
