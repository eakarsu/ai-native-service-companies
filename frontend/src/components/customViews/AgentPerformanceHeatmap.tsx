import { useEffect, useState } from 'react';
import { Grid3x3, AlertCircle } from 'lucide-react';

type Cell = { hour: string; ticketsResolved: number; csat: number };
type Row = { agent: string; totalResolved: number; avgCsat: number; cells: Cell[] };
type Resp = {
  agents: string[];
  hours: string[];
  rows: Row[];
  scale: { min: number; max: number };
  summary: { topAgent: string; topAgentResolved: number; teamAvgCsat: number; busiestHour: string };
};

function color(v: number, min: number, max: number) {
  const t = max === min ? 0.5 : (v - min) / (max - min);
  // teal scale
  const hue = 200 - t * 60; // shift from blue toward green
  const light = 90 - t * 50;
  return `hsl(${hue}, 75%, ${light}%)`;
}

export default function AgentPerformanceHeatmap() {
  const [data, setData] = useState<Resp | null>(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token') || '';
    fetch('/api/custom-views/agent-heatmap', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : Promise.reject(new Error('Failed to load agent heatmap')))
      .then(setData)
      .catch(e => setErr(e.message));
  }, []);

  if (err) return <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center gap-2"><AlertCircle className="w-4 h-4" />{err}</div>;
  if (!data) return <div className="bg-white p-6 rounded-xl shadow text-slate-500">Loading agent heatmap...</div>;

  return (
    <div className="bg-white rounded-xl shadow p-6" data-testid="agent-heatmap-card">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
          <Grid3x3 className="w-5 h-5 text-teal-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Agent Performance Heatmap</h2>
          <p className="text-xs text-slate-500">Tickets resolved per agent per hour</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-teal-50 p-3 rounded-lg">
          <div className="text-xs text-teal-700 font-medium">Top Agent</div>
          <div className="text-sm font-bold text-teal-900 truncate">{data.summary.topAgent}</div>
          <div className="text-[10px] text-teal-700">{data.summary.topAgentResolved} resolved</div>
        </div>
        <div className="bg-violet-50 p-3 rounded-lg">
          <div className="text-xs text-violet-700 font-medium">Team CSAT</div>
          <div className="text-xl font-bold text-violet-900">{data.summary.teamAvgCsat}</div>
        </div>
        <div className="bg-amber-50 p-3 rounded-lg">
          <div className="text-xs text-amber-700 font-medium">Busiest Hour</div>
          <div className="text-xl font-bold text-amber-900">{data.summary.busiestHour}</div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="text-xs border-collapse w-full">
          <thead>
            <tr>
              <th className="text-left text-slate-500 font-medium pr-3 pb-2">Agent</th>
              {data.hours.map(h => (
                <th key={h} className="text-center text-slate-500 font-medium px-1 pb-2">{h}</th>
              ))}
              <th className="text-right text-slate-500 font-medium pl-3 pb-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map(r => (
              <tr key={r.agent}>
                <td className="text-slate-700 pr-3 py-1 whitespace-nowrap">{r.agent}</td>
                {r.cells.map((c, ci) => (
                  <td key={ci} className="p-[2px]">
                    <div
                      className="w-full h-7 rounded flex items-center justify-center text-[10px] font-medium text-slate-800"
                      style={{ background: color(c.ticketsResolved, data.scale.min, data.scale.max) }}
                      title={`${r.agent} @ ${c.hour}: ${c.ticketsResolved} tickets, CSAT ${c.csat}`}
                    >
                      {c.ticketsResolved}
                    </div>
                  </td>
                ))}
                <td className="text-right pl-3 py-1 font-semibold text-slate-800">{r.totalResolved}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-2 mt-4 text-[10px] text-slate-500">
        <span>low</span>
        <div className="flex h-3 rounded overflow-hidden flex-1">
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i} className="flex-1" style={{ background: color(i, 0, 9) }} />
          ))}
        </div>
        <span>high</span>
      </div>
    </div>
  );
}
