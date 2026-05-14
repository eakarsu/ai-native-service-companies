const statCards = [
  { label: 'Tasks Completed', value: '291', change: '+23% vs last month', bg: 'bg-blue-50 border-blue-200', val: 'text-blue-700' },
  { label: 'Avg Completion Time', value: '22.5 hrs', change: '-18% improvement', bg: 'bg-green-50 border-green-200', val: 'text-green-700' },
  { label: 'Client Satisfaction', value: '4.8/5', change: 'Based on 124 reviews', bg: 'bg-purple-50 border-purple-200', val: 'text-purple-700' },
  { label: 'Revenue Processed', value: '$2.4M', change: '+31% vs last month', bg: 'bg-amber-50 border-amber-200', val: 'text-amber-700' },
]

const tasksByType = [
  { type: 'Healthcare Admin', count: 124, pct: 100, color: 'bg-blue-500' },
  { type: 'Accounting & Tax', count: 89, pct: 72, color: 'bg-green-500' },
  { type: 'Insurance Brokerage', count: 47, pct: 38, color: 'bg-purple-500' },
  { type: 'Compliance Review', count: 31, pct: 25, color: 'bg-amber-500' },
]

const completionTrend = [
  { month: 'Dec', hrs: 31 },
  { month: 'Jan', hrs: 28 },
  { month: 'Feb', hrs: 26 },
  { month: 'Mar', hrs: 25 },
  { month: 'Apr', hrs: 23 },
  { month: 'May', hrs: 22 },
]

const maxHrs = Math.max(...completionTrend.map((d) => d.hrs))

export default function Analytics() {
  return (
    <div className="space-y-8">
      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className={`rounded-xl border p-5 ${s.bg}`}>
            <div className="text-xs text-gray-500 font-medium mb-1">{s.label}</div>
            <div className={`text-2xl font-bold ${s.val}`}>{s.value}</div>
            <div className="text-xs text-gray-400 mt-1">{s.change}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Tasks by service type bar chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 text-sm mb-4">Tasks by Service Type (This Month)</h3>
          <div className="space-y-4">
            {tasksByType.map((d) => (
              <div key={d.type}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-gray-600">{d.type}</span>
                  <span className="font-semibold text-gray-800">{d.count}</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${d.color}`}
                    style={{ width: `${d.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Completion time trend */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 text-sm mb-4">Avg Completion Time Trend (hrs)</h3>
          <div className="flex items-end gap-4 h-36">
            {completionTrend.map((d) => (
              <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs text-gray-500">{d.hrs}</span>
                <div
                  className="w-full bg-blue-500 rounded-t-sm"
                  style={{ height: `${(d.hrs / maxHrs) * 100}%` }}
                />
                <span className="text-xs text-gray-400">{d.month}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-green-600 font-medium mt-3">↓ 29% reduction over 6 months</p>
        </div>
      </div>

      {/* Bottom metrics */}
      <div className="grid grid-cols-3 gap-5">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">SLA Compliance</h3>
          <div className="space-y-2">
            {[
              { label: 'On-time delivery', val: '97.2%' },
              { label: 'Within SLA window', val: '99.1%' },
              { label: 'Client escalations', val: '0.8%' },
            ].map((m) => (
              <div key={m.label} className="flex justify-between text-sm">
                <span className="text-gray-500">{m.label}</span>
                <span className="font-semibold text-gray-800">{m.val}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">AI Automation Rate</h3>
          <div className="flex items-center justify-center h-20">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600">84%</div>
              <div className="text-xs text-gray-400 mt-1">Fully automated</div>
            </div>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: '84%' }} />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Cost Savings vs Manual</h3>
          <div className="space-y-2">
            {[
              { label: 'Labor hours saved', val: '1,240 hrs' },
              { label: 'Cost reduction', val: '67%' },
              { label: 'ROI this quarter', val: '4.2x' },
            ].map((m) => (
              <div key={m.label} className="flex justify-between text-sm">
                <span className="text-gray-500">{m.label}</span>
                <span className="font-semibold text-green-700">{m.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
