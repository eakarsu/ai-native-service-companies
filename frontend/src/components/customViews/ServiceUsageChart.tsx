import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp } from 'lucide-react';

type Series = { name: string; color: string; data: number[] };
type Resp = {
  months: string[];
  series: Series[];
  totals: { month: string; total: number }[];
  summary: { totalEngagements: number; topService: string; growthRate: string; avgMonthly: number };
};

export default function ServiceUsageChart() {
  const [data, setData] = useState<Resp | null>(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token') || '';
    fetch('/api/custom-views/service-usage', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : Promise.reject(new Error('Failed to load')))
      .then(setData)
      .catch(e => setErr(e.message));
  }, []);

  if (err) return <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">{err}</div>;
  if (!data) return <div className="bg-white p-6 rounded-xl shadow text-slate-500">Loading service usage...</div>;

  const maxTotal = Math.max(...data.totals.map(t => t.total));

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Service Usage</h2>
          <p className="text-xs text-slate-500">Monthly engagement volume by service line</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="text-xs text-blue-700 font-medium">Total Engagements</div>
          <div className="text-xl font-bold text-blue-900">{data.summary.totalEngagements}</div>
        </div>
        <div className="bg-emerald-50 p-3 rounded-lg">
          <div className="text-xs text-emerald-700 font-medium">Avg / Month</div>
          <div className="text-xl font-bold text-emerald-900">{data.summary.avgMonthly}</div>
        </div>
        <div className="bg-violet-50 p-3 rounded-lg">
          <div className="text-xs text-violet-700 font-medium">Top Service</div>
          <div className="text-sm font-bold text-violet-900 truncate">{data.summary.topService}</div>
        </div>
        <div className="bg-amber-50 p-3 rounded-lg">
          <div className="text-xs text-amber-700 font-medium flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Growth
          </div>
          <div className="text-sm font-bold text-amber-900">{data.summary.growthRate}</div>
        </div>
      </div>

      <div className="border border-slate-200 rounded-lg p-4">
        <div className="flex items-end justify-between gap-2 h-48">
          {data.totals.map((t, i) => {
            const heightPct = (t.total / maxTotal) * 100;
            return (
              <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                <div className="w-full flex flex-col-reverse" style={{ height: `${heightPct}%` }}>
                  {data.series.map((s, si) => {
                    const segPct = (s.data[i] / t.total) * 100;
                    return (
                      <div
                        key={si}
                        style={{ height: `${segPct}%`, backgroundColor: s.color }}
                        className="w-full first:rounded-t"
                        title={`${s.name}: ${s.data[i]}`}
                      />
                    );
                  })}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">{t.month}</div>
              </div>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-slate-100">
          {data.series.map(s => (
            <div key={s.name} className="flex items-center gap-1.5 text-xs text-slate-700">
              <span className="w-3 h-3 rounded" style={{ backgroundColor: s.color }} />
              {s.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
