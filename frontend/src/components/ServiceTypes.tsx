const services = [
  {
    icon: '🛡️',
    name: 'Insurance Brokerage',
    description: 'AI-driven policy comparison, carrier negotiation, renewal management, and claims support across commercial, liability, and specialty lines.',
    avgTime: '18 hrs',
    tasksThisMonth: 47,
    successRate: '98.2%',
    capabilities: ['Policy comparison', 'Carrier negotiation', 'Claims support', 'Renewal management'],
  },
  {
    icon: '📊',
    name: 'Accounting & Tax',
    description: 'Automated bookkeeping reconciliation, tax return preparation, R&D credit analysis, multi-entity consolidations, and audit-ready financial statements.',
    avgTime: '24 hrs',
    tasksThisMonth: 89,
    successRate: '99.1%',
    capabilities: ['Tax returns', 'Bookkeeping', 'R&D credits', 'Financial consolidation'],
  },
  {
    icon: '⚖️',
    name: 'Compliance Review',
    description: 'Regulatory gap analysis, policy drafting, HIPAA/SOC2/GDPR assessments, audit readiness, and continuous compliance monitoring.',
    avgTime: '36 hrs',
    tasksThisMonth: 31,
    successRate: '97.4%',
    capabilities: ['HIPAA audits', 'SOC 2 readiness', 'GDPR compliance', 'Policy drafting'],
  },
  {
    icon: '🏥',
    name: 'Healthcare Admin',
    description: 'Prior authorization processing, claims resubmission, coding review, patient eligibility verification, and revenue cycle optimization.',
    avgTime: '12 hrs',
    tasksThisMonth: 124,
    successRate: '96.8%',
    capabilities: ['Prior auth', 'Claims processing', 'Medical coding', 'Revenue cycle'],
  },
]

export default function ServiceTypes() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Available Service Types</h2>
        <p className="text-sm text-gray-500 mt-0.5">AI-powered automation for professional services</p>
      </div>
      <div className="grid grid-cols-2 gap-5">
        {services.map((s) => (
          <div key={s.name} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-2xl shrink-0">{s.icon}</div>
              <div>
                <h3 className="font-bold text-gray-900">{s.name}</h3>
                <p className="text-sm text-gray-500 mt-1 leading-relaxed">{s.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-blue-600">{s.avgTime}</div>
                <div className="text-xs text-gray-400 mt-0.5">Avg. Time</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-gray-800">{s.tasksThisMonth}</div>
                <div className="text-xs text-gray-400 mt-0.5">Tasks/Month</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-green-600">{s.successRate}</div>
                <div className="text-xs text-gray-400 mt-0.5">Success Rate</div>
              </div>
            </div>

            <div className="mb-4">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Capabilities</div>
              <div className="flex flex-wrap gap-2">
                {s.capabilities.map((c) => (
                  <span key={c} className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs rounded-lg">{c}</span>
                ))}
              </div>
            </div>

            <button className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors">
              Submit Task
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
