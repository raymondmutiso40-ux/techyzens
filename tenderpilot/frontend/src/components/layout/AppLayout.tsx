import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Compass,
  Database,
  FileText,
  Sliders,
  LogOut,
  Menu,
  X,
  LayoutDashboard,
  ClipboardList
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface NavItem {
  name: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', to: '/', icon: LayoutDashboard },
  { name: 'Tenders', to: '/tenders', icon: Compass },
  { name: 'Knowledge Base', to: '/knowledge-base', icon: Database },
  { name: 'Proposals', to: '/proposals', icon: FileText },
  { name: 'Preferences', to: '/settings/preferences', icon: Sliders },
  { name: 'Audit Log', to: '/audit', icon: ClipboardList },
];

export const AppLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useApp();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-900 font-sans antialiased">
      {/* Mobile Top Bar */}
      <header className="md:hidden bg-white border-b border-slate-200 px-4 py-2.5 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded bg-slate-900 text-white text-xs font-semibold flex items-center justify-center">
            TP
          </div>
          <span className="font-semibold text-sm text-slate-900 tracking-tight">TenderPilot</span>
        </div>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation"
          aria-expanded={mobileMenuOpen}
          className="p-1.5 rounded text-slate-600 hover:text-slate-900 hover:bg-slate-100"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-60 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-150 md:translate-x-0 md:static md:h-screen ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Brand Header */}
          <div className="px-4 py-3.5 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-6 w-6 rounded bg-slate-900 text-white text-xs font-semibold flex items-center justify-center">
                TP
              </div>
              <div>
                <div className="font-semibold text-sm text-slate-900 leading-none">TenderPilot</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Bid Desk Pipeline</div>
              </div>
            </div>
          </div>

          {/* Nav List */}
          <nav className="p-3 space-y-0.5">
            <div className="px-2 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Navigation
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors duration-150 ${
                      isActive
                        ? 'bg-slate-100 text-slate-900 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0 text-slate-500" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* AI Usage Indicator (Part B #8) */}
          <div className="mx-3 mt-auto mb-2 p-2.5 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-600 space-y-1">
            <div className="flex items-center justify-between text-slate-700 font-medium">
              <span>Daily AI Cap</span>
              <span>40%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1 overflow-hidden">
              <div className="bg-slate-600 h-1 rounded-full w-[40%]" />
            </div>
            <p className="text-[10px] text-slate-400">AI usage today: 40% of cap</p>
          </div>
        </div>

        {/* User Footer */}
        <div className="p-3 border-t border-slate-200 bg-white">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium text-slate-900 truncate">
                {user.firmName || 'Apex Advisors'}
              </div>
              <div className="text-[11px] text-slate-500 truncate">
                {user.phone || '+254 712 345 678'}
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              title="Sign out"
              aria-label="Sign out"
              className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-100 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/20 z-20 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto min-w-0">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
