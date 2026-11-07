import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Compass,
  Database,
  FileText,
  Sliders,
  LogOut,
  Menu,
  X,
  LayoutDashboard,
  ClipboardList,
  Search,
  Bell,
  Maximize2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { LogoMark } from '../ui/Logo';

interface NavItem {
  name: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: 'Main menu',
    items: [
      { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
      { name: 'Tenders', to: '/tenders', icon: Compass },
      { name: 'Proposals', to: '/proposals', icon: FileText },
    ],
  },
  {
    label: 'Workspace',
    items: [{ name: 'Knowledge Base', to: '/knowledge-base', icon: Database }],
  },
  {
    label: 'Administration',
    items: [
      { name: 'Preferences', to: '/settings/preferences', icon: Sliders },
      { name: 'Audit Log', to: '/audit', icon: ClipboardList },
    ],
  },
];

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('') || 'TP';

export const AppLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [query, setQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const { user, logout, tenders } = useApp();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Ctrl/⌘ + K focuses the search box
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim().toLowerCase();
    if (!q) return;
    const hit = tenders.find(
      (t) => t.title.toLowerCase().includes(q) || t.referenceNumber.toLowerCase().includes(q)
    );
    navigate(hit ? `/tenders/${hit.id}` : '/tenders');
    setQuery('');
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) void document.documentElement.requestFullscreen?.();
    else void document.exitFullscreen?.();
  };

  const pendingDecisions = tenders.filter(
    (t) => !t.decision && ['found', 'scored', 'matched'].includes(t.stage)
  ).length;

  return (
    <div className="min-h-screen bg-canvas text-slate-900 font-sans antialiased">
      {/* Mobile Top Bar */}
      <header className="md:hidden bg-white border-b border-slate-200 px-4 py-2.5 flex items-center justify-between sticky top-0 z-40">
        <Link to="/dashboard" className="flex items-center gap-2">
          <LogoMark size="sm" theme="light" />
          <span className="font-bold text-sm text-slate-900 tracking-tight">TenderPilot</span>
        </Link>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation"
          aria-expanded={mobileMenuOpen}
          className="p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Sidebar - fixed, separate from page scroll */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-60 h-screen bg-white border-r border-slate-200 flex flex-col transition-transform duration-150 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand */}
        <div className="h-16 px-5 flex items-center border-b border-slate-100 shrink-0">
          <Link to="/dashboard" className="flex items-center gap-2.5" onClick={() => setMobileMenuOpen(false)}>
            <LogoMark size="md" theme="light" />
            <span className="leading-none">
              <span className="block font-bold text-[17px] tracking-tight text-slate-900">
                Tender<span className="text-accent-500">Pilot</span>
              </span>
              <span className="block text-[10px] text-slate-500 mt-1">Find. Score. Draft. Win.</span>
            </span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {navGroups.map((group) => (
            <div key={group.label}>
              <div className="px-3 pb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-[0.08em]">
                {group.label}
              </div>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors duration-150 ${
                          isActive
                            ? 'bg-accent-50 text-accent-600 before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-[3px] before:rounded-r before:bg-accent-500'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-accent-500' : 'text-slate-400'}`} />
                          <span>{item.name}</span>
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* AI usage */}
        <div className="mx-3 mb-3 p-3 rounded-lg bg-canvas border border-slate-200 text-[11px] text-slate-600 space-y-1.5 shrink-0">
          <div className="flex items-center justify-between font-medium text-slate-700">
            <span>Daily AI cap</span>
            <span className="tabular-nums">40%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
            <div className="bg-accent-500 h-1.5 rounded-full w-[40%]" />
          </div>
          <p className="text-[10px] text-slate-400">AI usage today: 40% of cap</p>
        </div>

        {/* User */}
        <div className="p-3 border-t border-slate-200 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="h-8 w-8 rounded-full bg-deep-700 text-white text-[11px] font-semibold flex items-center justify-center shrink-0">
              {initials(user.name || user.firmName || 'TP')}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-slate-900 truncate">
                {user.firmName || 'Apex Advisors'}
              </div>
              <div className="text-[11px] text-slate-500 truncate">{user.phone || '+254 712 345 678'}</div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              title="Sign out"
              aria-label="Sign out"
              className="text-slate-400 hover:text-accent-600 p-1.5 rounded-md hover:bg-slate-100 transition-colors"
            >
              <LogOut className="w-4 h-4" />
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

      {/* Main column */}
      <div className="md:pl-60 flex flex-col min-h-screen">
        {/* Desktop top bar */}
        <div className="hidden md:flex sticky top-0 z-20 h-16 items-center gap-3 px-6 bg-white border-b border-slate-200">
          <form onSubmit={onSearch} className="relative w-full max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tenders"
              aria-label="Search tenders"
              className="w-full h-9 pl-9 pr-16 rounded-lg border border-slate-200 bg-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-accent-100 focus:border-accent-500"
            />
            <kbd className="absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded border border-slate-200 bg-slate-50 text-[10px] font-medium text-slate-500">
              CTRL + K
            </kbd>
          </form>
          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              onClick={toggleFullscreen}
              aria-label="Toggle full screen"
              className="h-9 w-9 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 flex items-center justify-center"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              aria-label={`Notifications: ${pendingDecisions} decisions pending`}
              title={`${pendingDecisions} bid decisions pending`}
              className="relative h-9 w-9 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 flex items-center justify-center"
            >
              <Bell className="w-4 h-4" />
              {pendingDecisions > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-accent-500 ring-2 ring-white" />
              )}
            </button>
            <span
              className="ml-2 h-9 w-9 rounded-full bg-deep-700 text-white text-xs font-semibold flex items-center justify-center"
              title={user.name}
            >
              {initials(user.name || user.firmName || 'TP')}
            </span>
          </div>
        </div>

        <main className="flex-1 p-4 sm:p-6 max-w-[1400px] w-full mx-auto space-y-6">
          <Outlet />
        </main>

        <footer className="px-6 py-4 border-t border-slate-200 bg-white text-xs text-slate-500 flex flex-wrap justify-between gap-2">
          <span>© {new Date().getFullYear()} TenderPilot</span>
          <span>People make every bid decision.</span>
        </footer>
      </div>
    </div>
  );
};
