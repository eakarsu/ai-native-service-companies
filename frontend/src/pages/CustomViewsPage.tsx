import TicketVolumeTimeline from '../components/CustomViews/TicketVolumeTimeline';
import AgentPerformanceHeatmap from '../components/CustomViews/AgentPerformanceHeatmap';
import SlaReportPdf from '../components/CustomViews/SlaReportPdf';
import ServiceWorkflowEditor from '../components/CustomViews/ServiceWorkflowEditor';
import { Layers } from 'lucide-react';

export default function CustomViewsPage() {
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-violet-500 rounded-xl flex items-center justify-center shadow">
            <Layers className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Service Views</h1>
            <p className="text-sm text-slate-500">Custom dashboards and tools for AI-native service business operations.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <TicketVolumeTimeline />
          <AgentPerformanceHeatmap />
          <SlaReportPdf />
          <ServiceWorkflowEditor />
        </div>
      </div>
    </div>
  );
}
