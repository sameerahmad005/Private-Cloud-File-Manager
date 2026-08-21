import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { SetupPage } from './pages/SetupPage';
import { GoogleOauthGuidePage } from './pages/GoogleOauthGuidePage';
import { AppShell } from './components/layout/AppShell';
import { DrivePage } from './pages/DrivePage';
import { FavoritesPage } from './pages/FavoritesPage';
import { RecentPage } from './pages/RecentPage';
import { NotesPage } from './pages/NotesPage';
import { SettingsPage } from './pages/SettingsPage';
import { Loader2 } from 'lucide-react';

export const App: React.FC = () => {
  const { authenticated, isInitialized, loading, checkSession } = useAuth();
  const [activeNav, setActiveNav] = useState<'drive' | 'favorites' | 'recent' | 'notes' | 'settings'>('drive');
  const [editingNote, setEditingNote] = useState<any | null>(null);
  const [viewGuidePage, setViewGuidePage] = useState<boolean>(
    window.location.pathname === '/setup/google-oauth-guide'
  );
  const isSetupPath = window.location.pathname.startsWith('/setup');

  if (!isInitialized && (viewGuidePage || window.location.pathname === '/setup/google-oauth-guide')) {
    return (
      <GoogleOauthGuidePage
        onBackToSetup={() => {
          setViewGuidePage(false);
          window.history.pushState({}, '', '/setup');
        }}
      />
    );
  }

  if (isInitialized && isSetupPath) {
    if (viewGuidePage) setViewGuidePage(false);
    window.history.replaceState({}, '', '/');
  }

  if (loading) {
    return (
      <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-slate-950 text-slate-100">
        <Loader2 className="w-10 h-10 text-brand-500 animate-spin mb-3" />
        <p className="text-sm font-medium text-slate-400">Loading Private Cloud File Manager...</p>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <SetupPage
        onSetupComplete={checkSession}
        onOpenGuidePage={() => {
          setViewGuidePage(true);
          window.history.pushState({}, '', '/setup/google-oauth-guide');
        }}
      />
    );
  }

  if (!authenticated) {
    return <LoginPage />;
  }

  const handleOpenNoteEditor = (note: any) => {
    setEditingNote(note);
    setActiveNav('notes');
  };

  return (
    <AppShell
      activeNav={activeNav}
      onNavigateNav={(page) => {
        if (page !== 'notes') setEditingNote(null);
        setActiveNav(page);
      }}
      onSelectSearchFile={(file) => {
        if (file.isNote || file.name.endsWith('.md')) {
          handleOpenNoteEditor(file);
        } else {
          setActiveNav('drive');
        }
      }}
    >
      {activeNav === 'drive' && <DrivePage onOpenNoteEditor={handleOpenNoteEditor} />}
      {activeNav === 'favorites' && <FavoritesPage />}
      {activeNav === 'recent' && <RecentPage />}
      {activeNav === 'notes' && <NotesPage initialEditNote={editingNote} />}
      {activeNav === 'settings' && <SettingsPage />}
    </AppShell>
  );
};
