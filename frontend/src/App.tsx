import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Layout from './components/Layout';
import ClientsPage from './components/Clients/ClientsPage';
import TasksPage from './components/Tasks/TasksPage';
import StaffPage from './components/Staff/StaffPage';
import InvoicesPage from './components/Invoices/InvoicesPage';
import SLAsPage from './components/SLAs/SLAsPage';
import TemplatesPage from './components/Templates/TemplatesPage';
import AICenter from './components/AICenter';
import CSVExport from './components/CSVExport';
import SearchPage from './components/SearchPage';
import AuditLogPage from './components/AuditLogPage';
import SampleDataPage from './pages/SampleDataPage';
import ServiceCatalog from './pages/ServiceCatalog';
import Dashboard from './components/Dashboard';
import CustomViewsPage from './pages/CustomViewsPage';
import RetainerBurnMonitor from './pages/RetainerBurnMonitor';

import CodexCustomVizFeature from './pages/CodexCustomVizFeature';
import CodexOperationsFeature from './pages/CodexOperationsFeature';

import GapTemplateRecommendation from './pages/GapTemplateRecommendation';
import GapPricingOptimizer from './pages/GapPricingOptimizer';
import GapCapacityForecast from './pages/GapCapacityForecast';
import GapDeliverableGenerator from './pages/GapDeliverableGenerator';
import GapClientChurnPredictor from './pages/GapClientChurnPredictor';
import GapTimeTracking from './pages/GapTimeTracking';
import GapClientPortal from './pages/GapClientPortal';
import GapDeliverableStorage from './pages/GapDeliverableStorage';
import GapPaymentGateway from './pages/GapPaymentGateway';
import GapNotificationLayer from './pages/GapNotificationLayer';
import CfAgentFleet from './pages/CfAgentFleet';
import CfOutcomePricing from './pages/CfOutcomePricing';
import CfSlackChannelAuto from './pages/CfSlackChannelAuto';
import CfMarginAnalyzer from './pages/CfMarginAnalyzer';
import CfServiceProductize from './pages/CfServiceProductize';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  return localStorage.getItem('token') ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/codex/custom-viz" element={<CodexCustomVizFeature />} />
        <Route path="/codex/operations" element={<CodexOperationsFeature />} />

        <Route path="/login" element={<Login />} />
        <Route path="/*" element={
          <PrivateRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/clients" element={<ClientsPage />} />
                <Route path="/tasks" element={<TasksPage />} />
                <Route path="/staff" element={<StaffPage />} />
                <Route path="/invoices" element={<InvoicesPage />} />
                <Route path="/slas" element={<SLAsPage />} />
                <Route path="/templates" element={<TemplatesPage />} />
                <Route path="/ai-center" element={<AICenter />} />
                <Route path="/ai-lab" element={<Navigate to="/ai-center" replace />} />
                <Route path="/export" element={<CSVExport />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/audit-log" element={<AuditLogPage />} />
                <Route path="/sample-data" element={<SampleDataPage />} />
                <Route path="/service-catalog" element={<ServiceCatalog />} />
                <Route path="/custom-views" element={<CustomViewsPage />} />
                <Route path="/retainer-burn-monitor" element={<RetainerBurnMonitor />} />
                <Route path="/gap/template-recommendation" element={<GapTemplateRecommendation />} />
                <Route path="/gap/pricing-optimizer" element={<GapPricingOptimizer />} />
                <Route path="/gap/capacity-forecast" element={<GapCapacityForecast />} />
                <Route path="/gap/deliverable-generator" element={<GapDeliverableGenerator />} />
                <Route path="/gap/client-churn-predictor" element={<GapClientChurnPredictor />} />
                <Route path="/gap/time-tracking" element={<GapTimeTracking />} />
                <Route path="/gap/client-portal" element={<GapClientPortal />} />
                <Route path="/gap/deliverable-storage" element={<GapDeliverableStorage />} />
                <Route path="/gap/payment-gateway" element={<GapPaymentGateway />} />
                <Route path="/gap/notification-layer" element={<GapNotificationLayer />} />
                <Route path="/cf/agent-fleet" element={<CfAgentFleet />} />
                <Route path="/cf/outcome-pricing" element={<CfOutcomePricing />} />
                <Route path="/cf/slack-channel-auto" element={<CfSlackChannelAuto />} />
                <Route path="/cf/margin-analyzer" element={<CfMarginAnalyzer />} />
                <Route path="/cf/service-productize" element={<CfServiceProductize />} />
              </Routes>
            </Layout>
          </PrivateRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}
