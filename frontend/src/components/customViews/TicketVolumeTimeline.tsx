import { useEffect, useState } from 'react';
import { LineChart, AlertCircle } from 'lucide-react';

type Category = { key: string; label: string; color: string };
type Point = { date: string; total: number; [k: string]: any };
type Resp = {
  range: { days: number; start: string; end: string };
  categories: Category[];
  points: Point[];
  summary: {
    totalTickets: number;
    avgDaily: number;
    peakDay: string;
    peakVolume: number;
    mostCommonCategory: string;
  };
};

export default function TicketVolumeTimeline() {
  const [data, setData] = useState<Resp | null>(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token') || '';
    fetch('/api/custom-views/ticket-volume', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : Promise.reject(new Error('Failed to load ticket volume')))
      .then(setData)
      .catch(e => setErr(e.message));
  }, []);

  if (err) return <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center gap-2"><AlertCircle className="w-4 h-4" />{err}</div>;
  if (!data) return <div className="bg-white p-6 rounded-xl shadow text-slate-500">Loading ticket volume timeline...</div>;

  const maxTotal = Math.max(...data.points.map(p => p.total), 1);

  return (
    <div className="bg-white rounded-xl shadow p-6" data-testid="ticket-volume-card">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center">
          <LineChart className="w-5 h-5 text-rose-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Ticket Volume Timeline</h2>
          <p className="text-xs text-slate-500">Last {data.range.days} days, by category</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="bg-rose-50 p-3 rounded-lg">
          <div className="text-xs text-rose-700 font-medium">Total Tickets</div>
          <div className="text-xl font-bold text-rose-900">{data.summary.totalTickets}</div>
        </div>
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="text-xs text-blue-700 font-medium">Avg / Day</div>
          <div className="text-xl font-bold text-blue-900">{data.summary.avgDaily}</div>
        </div>
        <div className="bg-amber-50 p-3 rounded-lg">
          <div className="text-xs text-amber-700 font-medium">Peak Day</div>
          <div className="text-sm font-bold text-amber-900">{data.summary.peakDay}</div>
          <div className="text-[10px] text-amber-700">{data.summary.peakVolume} tickets</div>
        </div>
        <div className="bg-emerald-50 p-3 rounded-lg">
          <div className="text-xs text-emerald-700 font-medium">Top Type</div>
          <div className="text-sm font-bold text-emerald-900 truncate">{data.summary.mostCommonCategory}</div>
        </div>
      </div>

      <div className="border border-slate-200 rounded-lg p-4">
        <div className="flex items-end justify-between gap-[2px] h-48">
          {data.points.map((p, i) => {
            const heightPct = (p.total / maxTotal) * 100;
            return (
              <div key={i} className="flex-1 flex flex-col items-center justify-end h-full" title={`${p.date}: ${p.total}`}>
                <div className="w-full flex flex-col-reverse" style={{ height: `${heightPct}%` }}>
                  {data.categories.map((c, ci) => {
                    const v = p[c.key] || 0;
                    const segPct = (v / p.total) * 100;
                    return (
                      <div
                        key={ci}
                        style={{ height: `${segPct}%`, backgroundColor: c.color }}
                        className="w-full first:rounded-t"
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-2 text-[10px] text-slate-500">
          <span>{data.range.start}</span>
          <span>{data.range.end}</span>
        </div>
        <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-slate-100">
          {data.categories.map(c => (
            <div key={c.key} className="flex items-center gap-1.5 text-xs text-slate-700">
              <span className="w-3 h-3 rounded" style={{ backgroundColor: c.color }} />
              {c.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
