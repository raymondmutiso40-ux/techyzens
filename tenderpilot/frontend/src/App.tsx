import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AppLayout } from './components/layout/AppLayout';
import { PreferencesPage } from './pages/settings/PreferencesPage';
import { TendersPage } from './pages/tenders/TendersPage';
import { KnowledgeBasePage } from './pages/knowledge-base/KnowledgeBasePage';
import { ProposalsPage } from './pages/proposals/ProposalsPage';
import { LoginPage } from './pages/auth/LoginPage';

export const App: React.FC = () => {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Authenticated / Core App Layout */}
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/tenders" replace />} />
            <Route path="/tenders" element={<TendersPage />} />
            <Route path="/tenders/:id" element={<TendersPage />} />
            <Route path="/knowledge-base" element={<KnowledgeBasePage />} />
            <Route path="/knowledge-base/:id" element={<KnowledgeBasePage />} />
            <Route path="/proposals" element={<ProposalsPage />} />
            <Route path="/proposals/new" element={<ProposalsPage />} />
            <Route path="/proposals/:id" element={<ProposalsPage />} />
            <Route path="/settings/preferences" element={<PreferencesPage />} />
            {/* Catch-all fallback */}
            <Route path="*" element={<Navigate to="/tenders" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
};

export default App;
