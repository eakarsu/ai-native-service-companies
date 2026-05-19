import { useEffect, useState } from 'react';
import { Grid3x3 } from 'lucide-react';

type Resp = {
  cohorts: string[];
  periods: string[];
  rows: { cohort: string; cohortSize: number; data: (number | null)[] }[];
  summary: { avgRetentionM1: number; avgRetentionM6: number; bestCohort: string; totalCustomers: number };
};

function color(v: number | null): string {
  if (v == null) return '#f1f5f9';
  if (v >= 90) return '#065f46';
  if (v >= 80) return '#0e7c66';
  if (v >= 70) return '#10b981';
  if (v >= 60) return '#34d399';
  if (v >= 50) return '#fbbf24';
  if (v >= 40) return '#f97316';
  return '#ef4444';
}

export default function CustomerCohortHeatmap() {
  const [data, setData] = useState<Resp | null>(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token') || '';
    fetch('/api/custom-views/cohort-heatmap', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : Promise.reject(new Error('Failed to load')))
      .then(setData)
      .catch(e => setErr(e.message));
  }, []);

  if (err) return <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">{err}</div>;
  if (!data) return <div className="bg-white p-6 rounded-xl shadow text-slate-500">Loading cohort data...</div>;

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
          <Grid3x3 className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Customer Cohort Retention</h2>
          <p className="text-xs text-slate-500">% of customers still active by quarter of acquisition</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="bg-emerald-50 p-3 rounded-lg">
          <div className="text-xs text-emerald-700 font-medium">M1 Retention</div>
          <div className="text-xl font-bold text-emerald-900">{data.summary.avgRetentionM1}%</div>
        </div>
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="text-xs text-blue-700 font-medium">M6 Retention</div>
          <div className="text-xl font-bold text-blue-900">{data.summary.avgRetentionM6}%</div>
        </div>
        <div className="bg-violet-50 p-3 rounded-lg">
          <div className="text-xs text-violet-700 font-medium">Best Cohort</div>
          <div className="text-sm font-bold text-violet-900">{data.summary.bestCohort}</div>
        </div>
        <div className="bg-amber-50 p-3 rounded-lg">
          <div className="text-xs text-amber-700 font-medium">Total Customers</div>
          <div className="text-xl font-bold text-amber-900">{data.summary.totalCustomers}</div>
        </div>
      </div>

      <div className="overflow-x-auto border border-slate-200 rounded-lg p-3">
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="text-left text-slate-600 font-semibold px-2 py-2">Cohort</th>
              <th className="text-left text-slate-600 font-semibold px-2 py-2">Size</th>
              {data.periods.map(p => (
                <th key={p} className="text-center text-slate-600 font-semibold px-2 py-2">{p}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map(row => (
              <tr key={row.cohort}>
                <td className="text-slate-800 font-medium px-2 py-1">{row.cohort}</td>
                <td className="text-slate-600 px-2 py-1">{row.cohortSize}</td>
                {row.data.map((v, i) => (
                  <td key={i} className="px-1 py-1">
                    <div
                      className="rounded text-center text-white text-[11px] font-semibold py-1.5"
                      style={{ backgroundColor: color(v), color: v == null ? '#94a3b8' : '#fff' }}
                    >
                      {v == null ? '—' : `${v}%`}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex items-center gap-2 mt-4 text-xs text-slate-600">
          <span>Low</span>
          {[40, 55, 65, 75, 85, 95].map(v => (
            <div key={v} className="w-6 h-3 rounded" style={{ backgroundColor: color(v) }} />
          ))}
          <span>High</span>
        </div>
      </div>
    </div>
  );
}
