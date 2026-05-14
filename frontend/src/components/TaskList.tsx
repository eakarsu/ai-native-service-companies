import { useState } from 'react'

type TaskStatus = 'pending' | 'processing' | 'completed'

interface Task {
  id: string
  serviceType: string
  client: string
  description: string
  status: TaskStatus
  createdDate: string
  result: string
}

const tasks: Task[] = [
  { id: 'TSK-1041', serviceType: 'Accounting & Tax', client: 'Northgate LLC', description: 'Prepare Q1 2026 tax return with depreciation schedules and R&D credit calculation', status: 'completed', createdDate: '2026-05-01', result: 'Q1 return complete. $42,300 refund identified. R&D credit: $8,200.' },
  { id: 'TSK-1042', serviceType: 'Compliance Review', client: 'Meridian Health', description: 'HIPAA compliance audit for new patient data platform, identify gaps and remediation steps', status: 'processing', createdDate: '2026-05-02', result: 'In progress — 3 of 7 control domains reviewed.' },
  { id: 'TSK-1043', serviceType: 'Insurance Brokerage', client: 'Apex Logistics', description: 'Commercial fleet insurance renewal — 47 vehicles, compare 5 carrier quotes', status: 'processing', createdDate: '2026-05-03', result: 'Collecting quotes from 5 carriers. Expected delivery: 48 hrs.' },
  { id: 'TSK-1044', serviceType: 'Healthcare Admin', client: 'Dr. Patel Practice', description: 'Prior authorization processing for 12 pending MRI procedures', status: 'completed', createdDate: '2026-05-02', result: '11/12 authorizations approved. 1 appeal filed for denied case.' },
  { id: 'TSK-1045', serviceType: 'Accounting & Tax', client: 'BlueSky Ventures', description: 'Multi-entity consolidation — 4 subsidiaries, FY2025 financials', status: 'pending', createdDate: '2026-05-04', result: 'Queued for processing.' },
  { id: 'TSK-1046', serviceType: 'Compliance Review', client: 'TechStart Inc.', description: 'SOC 2 Type II readiness assessment — gap analysis against trust service criteria', status: 'pending', createdDate: '2026-05-04', result: 'Awaiting document upload confirmation.' },
  { id: 'TSK-1047', serviceType: 'Insurance Brokerage', client: 'Harbor Realty', description: 'E&O liability policy renewal, $5M coverage, add cyber endorsement', status: 'completed', createdDate: '2026-04-30', result: 'Policy renewed with Chubb. Cyber endorsement added. 4% premium reduction.' },
  { id: 'TSK-1048', serviceType: 'Healthcare Admin', client: 'Summit Orthopedics', description: 'Claims resubmission — 34 denied claims from Q4 2025, coding review', status: 'processing', createdDate: '2026-05-03', result: '18 claims resubmitted. $94,200 in recoverable revenue identified.' },
]

const statusConfig: Record<TaskStatus, { label: string; classes: string }> = {
  pending: { label: 'Pending', classes: 'bg-yellow-100 text-yellow-800' },
  processing: { label: 'Processing', classes: 'bg-blue-100 text-blue-800' },
  completed: { label: 'Completed', classes: 'bg-green-100 text-green-800' },
}

export default function TaskList() {
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="font-bold text-gray-900">My Tasks</h2>
          <p className="text-xs text-gray-400 mt-0.5">Click a row to view details and results</p>
        </div>
        <div className="flex gap-2">
          <span className="text-xs px-2.5 py-1 bg-yellow-100 text-yellow-800 rounded-full font-medium">2 Pending</span>
          <span className="text-xs px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">3 Processing</span>
          <span className="text-xs px-2.5 py-1 bg-green-100 text-green-800 rounded-full font-medium">3 Completed</span>
        </div>
      </div>

      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
          <tr>
            <th className="text-left px-5 py-3">ID</th>
            <th className="text-left px-5 py-3">Service Type</th>
            <th className="text-left px-5 py-3">Client</th>
            <th className="text-left px-5 py-3">Description</th>
            <th className="text-left px-5 py-3">Status</th>
            <th className="text-left px-5 py-3">Created</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {tasks.map((task) => (
            <>
              <tr
                key={task.id}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => setExpanded(expanded === task.id ? null : task.id)}
              >
                <td className="px-5 py-3.5 font-mono text-xs text-blue-600 font-semibold">{task.id}</td>
                <td className="px-5 py-3.5 text-gray-700">{task.serviceType}</td>
                <td className="px-5 py-3.5 font-medium text-gray-800">{task.client}</td>
                <td className="px-5 py-3.5 text-gray-500 max-w-xs">
                  <span className="line-clamp-1">{task.description}</span>
                </td>
                <td className="px-5 py-3.5">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig[task.status].classes}`}>
                    {statusConfig[task.status].label}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-gray-400 text-xs">{task.createdDate}</td>
              </tr>
              {expanded === task.id && (
                <tr key={`${task.id}-expanded`} className="bg-blue-50">
                  <td colSpan={6} className="px-5 py-4">
                    <div className="space-y-3">
                      <div>
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Full Description</div>
                        <p className="text-sm text-gray-700">{task.description}</p>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Result Preview</div>
                        <p className="text-sm text-gray-800 bg-white border border-blue-200 rounded-lg px-3 py-2.5">{task.result}</p>
                      </div>
                      <div className="flex gap-2">
                        <button className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 font-medium">View Full Report</button>
                        <button className="px-3 py-1.5 border border-gray-300 text-gray-600 text-xs rounded-lg hover:bg-gray-50">Download PDF</button>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  )
}
