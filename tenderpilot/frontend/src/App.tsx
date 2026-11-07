import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { TendersPage } from './pages/tenders/TendersPage';
import { KnowledgeBasePage } from './pages/knowledge-base/KnowledgeBasePage';
import { ProposalsPage } from './pages/proposals/ProposalsPage';
import { PreferencesPage } from './pages/settings/PreferencesPage';
import { AuditLogPage } from './pages/audit/AuditLogPage';
import { LoginPage } from './pages/auth/LoginPage';

export const App: React.FC = () => {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Core App Shell */}
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/tenders" element={<TendersPage />} />
            <Route path="/tenders/:id" element={<TendersPage />} />
            <Route path="/knowledge-base" element={<KnowledgeBasePage />} />
            <Route path="/knowledge-base/:id" element={<KnowledgeBasePage />} />
            <Route path="/proposals" element={<ProposalsPage />} />
            <Route path="/proposals/:id" element={<ProposalsPage />} />
            <Route path="/settings/preferences" element={<PreferencesPage />} />
            <Route path="/audit" element={<AuditLogPage />} />
            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
};

export default App;
