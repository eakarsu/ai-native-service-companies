import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Briefcase, Users, ClipboardList, UserCheck, FileText, Shield, BookTemplate, Sparkles, LogOut, User, Download, Search, History, Database, LayoutDashboard, Layers } from 'lucide-react';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/clients', label: 'Clients', icon: Users },
  { path: '/tasks', label: 'Service Tasks', icon: ClipboardList },
  { path: '/staff', label: 'Staff', icon: UserCheck },
  { path: '/invoices', label: 'Invoices', icon: FileText },
  { path: '/slas', label: 'SLA Agreements', icon: Shield },
  { path: '/templates', label: 'Service Templates', icon: BookTemplate },
  { path: '/custom-views', label: 'Service Views', icon: Layers },
];
const aiItems = [
  { path: '/ai-center', label: 'AI Center', icon: Sparkles },
];
const utilItems = [
  { path: '/search', label: 'Search & Filter', icon: Search },
  { path: '/export', label: 'CSV Export', icon: Download },
  { path: '/audit-log', label: 'Audit Log', icon: History },
  { path: '/sample-data', label: 'Sample Data', icon: Database },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const logout = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/login'); };
  const pageTitle = [...navItems, ...aiItems, ...utilItems].find(i => location.pathname.startsWith(i.path))?.label || 'ServiceFlow';

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 bg-gray-900 flex flex-col">
        <div className="px-6 py-5 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center"><Briefcase className="w-5 h-5 text-white" /></div>
            <div><div className="font-bold text-white text-sm">ServiceFlow</div><div className="text-gray-400 text-xs">AI Service Platform</div></div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2">Features</div>
          {navItems.map(({ path, label, icon: Icon }) => (
            <Link key={path} to={path} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium mb-1 transition-colors ${location.pathname.startsWith(path) ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
              <Icon className="w-4 h-4 flex-shrink-0" />{label}
            </Link>
          ))}
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2 mt-4">AI Tools</div>
          {aiItems.map(({ path, label, icon: Icon }) => (
            <Link key={path} to={path} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium mb-1 transition-colors ${location.pathname.startsWith(path) ? 'bg-violet-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
              <Icon className="w-4 h-4 flex-shrink-0" />{label}
            </Link>
          ))}
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2 mt-4">Utilities</div>
          {utilItems.map(({ path, label, icon: Icon }) => (
            <Link key={path} to={path} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium mb-1 transition-colors ${location.pathname.startsWith(path) ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
              <Icon className="w-4 h-4 flex-shrink-0" />{label}
            </Link>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-gray-800">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center"><User className="w-4 h-4 text-gray-300" /></div>
            <div className="flex-1 min-w-0"><div className="text-sm font-medium text-white truncate">{user.name || 'User'}</div><div className="text-xs text-gray-500 truncate">{user.email}</div></div>
            <button onClick={logout} className="text-gray-500 hover:text-red-400"><LogOut className="w-4 h-4" /></button>
          </div>
        </div>
      </aside>
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">{pageTitle}</h1>
          <div className="flex items-center gap-3"><span className="text-sm text-gray-500">{user.name}</span><button onClick={logout} className="text-sm text-gray-500 hover:text-red-600 flex items-center gap-1"><LogOut className="w-4 h-4" />Logout</button></div>
        </header>
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
