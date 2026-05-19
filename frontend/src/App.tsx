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

function PrivateRoute({ children }: { children: React.ReactNode }) {
  return localStorage.getItem('token') ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
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
              </Routes>
            </Layout>
          </PrivateRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}
