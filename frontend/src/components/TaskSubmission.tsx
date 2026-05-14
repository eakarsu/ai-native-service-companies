import { useState } from 'react'

const serviceTypes = [
  'Insurance Brokerage',
  'Accounting & Tax',
  'Compliance Review',
  'Healthcare Admin',
]

export default function TaskSubmission() {
  const [form, setForm] = useState({
    serviceType: '',
    description: '',
    clientName: '',
    priority: 'Medium',
  })
  const [submitted, setSubmitted] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [files, setFiles] = useState<string[]>([])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 3000)
  }

  return (
    <div className="max-w-2xl">
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Submit a New Task</h2>
        <p className="text-sm text-gray-500 mb-6">AI will process and route your task to the appropriate service pipeline.</p>

        {submitted && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800 font-medium">
            Task submitted successfully! You'll receive a confirmation email shortly.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Service Type <span className="text-red-500">*</span></label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              value={form.serviceType}
              onChange={(e) => setForm({ ...form, serviceType: e.target.value })}
              required
            >
              <option value="">Select a service type...</option>
              {serviceTypes.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Client Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter client name or company"
              value={form.clientName}
              onChange={(e) => setForm({ ...form, clientName: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Task Description <span className="text-red-500">*</span></label>
            <textarea
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={4}
              placeholder="Describe what needs to be done in detail..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Priority</label>
            <div className="flex gap-3">
              {['Low', 'Medium', 'High', 'Urgent'].map((p) => {
                const colors: Record<string, string> = {
                  Low: 'border-green-300 bg-green-50 text-green-700',
                  Medium: 'border-blue-300 bg-blue-50 text-blue-700',
                  High: 'border-amber-300 bg-amber-50 text-amber-700',
                  Urgent: 'border-red-300 bg-red-50 text-red-700',
                }
                const active = form.priority === p
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setForm({ ...form, priority: p })}
                    className={`flex-1 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                      active ? colors[p] : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    {p}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Attachments</label>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault()
                setDragOver(false)
                const newFiles = Array.from(e.dataTransfer.files).map((f) => f.name)
                setFiles((prev) => [...prev, ...newFiles])
              }}
            >
              <div className="text-2xl mb-2">📎</div>
              <p className="text-sm text-gray-500">Drag & drop files here, or <span className="text-blue-600 cursor-pointer hover:underline">browse</span></p>
              <p className="text-xs text-gray-400 mt-1">PDF, DOCX, XLSX up to 25MB</p>
              {files.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2 justify-center">
                  {files.map((f) => (
                    <span key={f} className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">{f}</span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition-colors"
          >
            Submit Task
          </button>
        </form>
      </div>
    </div>
  )
}
