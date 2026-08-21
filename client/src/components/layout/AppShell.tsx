import React, { useState, useEffect, useRef } from 'react';
import {
  HardDrive,
  Star,
  Clock,
  StickyNote,
  Settings as SettingsIcon,
  LogOut,
  Moon,
  Sun,
  Search,
  Menu,
  X,
  User as UserIcon,
  Cloud,
  FileText,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { metadataApi, searchApi } from '../../services/api';
import { FileItem, StorageQuota } from '../../types';
import { FileIcon } from '../explorer/FileIcon';
import { AccountDropdown } from './AccountDropdown';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';

interface AppShellProps {
  children: React.ReactNode;
  activeNav: 'drive' | 'favorites' | 'recent' | 'notes' | 'settings';
  onNavigateNav: (page: 'drive' | 'favorites' | 'recent' | 'notes' | 'settings') => void;
  onSelectSearchFile?: (file: FileItem) => void;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  activeNav,
  onNavigateNav,
  onSelectSearchFile,
}) => {
  const { user, logout } = useAuth();
  const { theme, setTheme, isDark } = useTheme();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [storage, setStorage] = useState<StorageQuota | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FileItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);
  const shortcutHint = isMac ? '⌘K' : 'Ctrl+K';

  useKeyboardShortcuts({
    onSearchFocus: () => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
        searchInputRef.current.select();
      }
    },
    onEscape: () => {
      setSearchOpen(false);
    },
  });

  useEffect(() => {
    fetchStorage();
  }, []);

  const fetchStorage = async () => {
    try {
      const res = await metadataApi.getStorageInfo();
      if (res.success && res.data) {
        setStorage(res.data);
      }
    } catch {
      // Ignored
    }
  };

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearchOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setSearching(true);
        const res = await searchApi.searchFiles(searchQuery.trim());
        if (res.success && res.data) {
          setSearchResults(res.data);
          setSearchOpen(true);
        }
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const navItems = [
    { id: 'drive', label: 'My Drive', icon: HardDrive },
    { id: 'favorites', label: 'Favorites', icon: Star },
    { id: 'recent', label: 'Recent', icon: Clock },
    { id: 'notes', label: 'Notes', icon: StickyNote },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shrink-0">
        {/* Brand */}
        <div className="flex items-center space-x-3 p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="p-2 rounded-xl bg-brand-600 text-white shadow-md shadow-brand-500/20">
            <Cloud className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-sm leading-tight text-slate-900 dark:text-slate-100">Private Cloud</h1>
            <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Backed by Google Drive</p>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigateNav(item.id as any)}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                  isActive
                    ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Storage Widget */}
        {storage && (
          <div className="p-4 m-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              <span>Storage</span>
              <span className="text-brand-600 dark:text-brand-400">{storage.percentage}%</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
              <div
                className="bg-brand-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, storage.percentage)}%` }}
              ></div>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
              {storage.formattedUsed} of {storage.formattedLimit} used
            </p>
          </div>
        )}
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Topbar Header */}
        <header className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shrink-0 z-30">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Global Search Bar */}
            <div className="relative w-48 sm:w-80 md:w-96">
              <div className="relative flex items-center">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchResults.length > 0 && setSearchOpen(true)}
                  placeholder={`Search files, folders, notes... (${shortcutHint})`}
                  className="w-full pl-9 pr-4 py-2 bg-slate-100/80 dark:bg-slate-800/60 border border-transparent focus:border-brand-500 focus:bg-white dark:focus:bg-slate-900 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSearchResults([]);
                    }}
                    className="absolute right-3 p-0.5 rounded-full text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Instant Search Results Popup */}
              {searchOpen && (
                <div className="absolute left-0 right-0 mt-2 max-h-72 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                  {searching ? (
                    <div className="p-4 text-center text-xs text-slate-500">Searching...</div>
                  ) : searchResults.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-500">No matching files found.</div>
                  ) : (
                    searchResults.map((file) => (
                      <button
                        key={file.id}
                        onClick={() => {
                          setSearchOpen(false);
                          setSearchQuery('');
                          if (onSelectSearchFile) onSelectSearchFile(file);
                        }}
                        className="w-full flex items-center space-x-3 px-4 py-2.5 text-left hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
                      >
                        <FileIcon file={file} className="w-4 h-4 shrink-0" />
                        <div className="truncate">
                          <p className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate">
                            {file.name}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {file.isFolder ? 'Folder' : file.mimeType}
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center space-x-2">
            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Toggle Theme"
            >
              {isDark ? <Sun className="w-4.5 h-4.5 text-amber-400" /> : <Moon className="w-4.5 h-4.5 text-slate-600" />}
            </button>

            {/* Profile Dropdown */}
            <AccountDropdown onNavigateSettings={() => onNavigateNav('settings')} />
          </div>
        </header>

        {/* Page Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col justify-between">
          <div>{children}</div>
          <footer className="mt-8 pt-4 border-t border-slate-200/60 dark:border-slate-800/60 text-center text-xs text-slate-400 dark:text-slate-500">
            Private Cloud File Manager &middot; Made by Sameer &middot;{' '}
            <a
              href="https://github.com/sameerahmad005/Private-Cloud-File-Manager"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 underline transition-colors"
            >
              GitHub
            </a>
          </footer>
        </main>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs"
            onClick={() => setMobileDrawerOpen(false)}
          ></div>
          <div className="relative w-64 bg-white dark:bg-slate-900 h-full p-4 flex flex-col z-10 animate-in slide-in-from-left duration-200 border-r border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <Cloud className="w-5 h-5 text-brand-600" />
                <span className="font-bold text-sm">Private Cloud</span>
              </div>
              <button
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1 rounded-lg text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 py-4 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeNav === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onNavigateNav(item.id as any);
                      setMobileDrawerOpen(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-medium text-sm ${
                      isActive
                        ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Icon className="w-4.5 h-4.5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
};
