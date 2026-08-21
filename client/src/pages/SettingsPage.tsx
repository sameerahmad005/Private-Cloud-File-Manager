import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  User,
  Lock,
  Cloud,
  Shield,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Info,
  ExternalLink,
  Github,
} from 'lucide-react';
import { metadataApi, authApi } from '../services/api';
import { AppSettings, AuditLog } from '../types';

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'account' | 'drive' | 'security' | 'audit' | 'about'>('account');
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Password Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchSettings();
    fetchLogs();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await metadataApi.getSettings();
      if (res.success && res.data) setSettings(res.data);
    } catch {
      // Ignored
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await metadataApi.getAuditLogs();
      if (res.success && res.data) setAuditLogs(res.data);
    } catch {
      // Ignored
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    try {
      setPasswordLoading(true);
      setPasswordMsg(null);
      await authApi.changePassword(currentPassword, newPassword);
      setPasswordMsg({ type: 'success', text: 'Password changed successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordMsg({ type: 'error', text: err.message || 'Failed to change password.' });
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center space-x-3 border-b border-slate-200/60 dark:border-slate-800/60 pb-3">
        <SettingsIcon className="w-6 h-6 text-brand-500" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Application Settings</h2>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-medium space-x-4 overflow-x-auto scrollbar-none">
        {[
          { id: 'account', label: 'Account', icon: User },
          { id: 'drive', label: 'Google Drive Status', icon: Cloud },
          { id: 'security', label: 'Security & Limits', icon: Shield },
          { id: 'audit', label: 'Security Audit Logs', icon: FileSpreadsheet },
          { id: 'about', label: 'About', icon: Info },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center space-x-2 py-2.5 border-b-2 transition-colors whitespace-nowrap ${
                isActive
                  ? 'border-brand-600 text-brand-600 dark:text-brand-400 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Account Tab */}
      {activeTab === 'account' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 space-y-6 max-w-lg shadow-sm">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Change Password</h3>

          {passwordMsg && (
            <div
              className={`p-3 rounded-xl text-xs ${
                passwordMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200'
              }`}
            >
              {passwordMsg.text}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4 text-xs sm:text-sm">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 mb-1">Current Password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 mb-1">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={passwordLoading}
              className="flex items-center space-x-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-medium rounded-xl shadow-sm transition-all"
            >
              {passwordLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Update Password</span>
            </button>
          </form>
        </div>
      )}

      {/* Google Drive Status Tab */}
      {activeTab === 'drive' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 space-y-6 max-w-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Cloud className="w-8 h-8 text-brand-500" />
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Google Drive Status</h3>
                <p className="text-xs text-slate-500">Google Drive API v3 Backend Client</p>
              </div>
            </div>

            {settings?.googleDriveConnected ? (
              <span className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 font-semibold text-xs rounded-full border border-emerald-200 dark:border-emerald-900">
                <CheckCircle2 className="w-4 h-4" />
                <span>Connected</span>
              </span>
            ) : (
              <span className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 font-semibold text-xs rounded-full border border-amber-200 dark:border-amber-900">
                <AlertTriangle className="w-4 h-4" />
                <span>Virtual Drive Fallback</span>
              </span>
            )}
          </div>

          <div className="space-y-3 text-xs sm:text-sm divide-y divide-slate-100 dark:divide-slate-800 pt-2">
            <div className="flex justify-between py-2">
              <span className="text-slate-500">Virtual Root Folder ID</span>
              <span className="font-mono text-slate-800 dark:text-slate-200">{settings?.rootFolderId}</span>
            </div>

            <div className="flex justify-between py-2">
              <span className="text-slate-500">Drive Integration Mode</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {settings?.googleDriveConnected ? 'OAuth / Service Account API v3' : 'Virtual Fallback Provider'}
              </span>
            </div>

            <div className="flex justify-between py-2">
              <span className="text-slate-500">Root Hierarchy Boundary Check</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">Strict Server-side Enforcement</span>
            </div>
          </div>
        </div>
      )}

      {/* Security & Limits Tab */}
      {activeTab === 'security' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 space-y-4 max-w-2xl shadow-sm text-xs sm:text-sm">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-4">Security Policy & Configuration</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
              <p className="text-slate-500 text-xs">Max Upload Size</p>
              <p className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">
                {settings ? Math.round(settings.maxUploadSize / (1024 * 1024)) : 50} MB
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
              <p className="text-slate-500 text-xs">Session Inactivity Timeout</p>
              <p className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">
                {settings?.sessionTimeout || 60} Minutes
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
              <p className="text-slate-500 text-xs">Login Rate Limiting</p>
              <p className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">
                5 Attempts / 10 Min
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
              <p className="text-slate-500 text-xs">Password Hashing Algorithm</p>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                Argon2id / bcrypt
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Security Audit Logs Tab */}
      {activeTab === 'audit' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
            <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">Audit Logs (Latest 100)</h3>
            <button
              onClick={fetchLogs}
              className="text-xs text-brand-600 hover:text-brand-700 font-medium"
            >
              Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-semibold text-slate-500">
                  <th className="py-2.5 px-4">Timestamp</th>
                  <th className="py-2.5 px-4">Event</th>
                  <th className="py-2.5 px-4">User</th>
                  <th className="py-2.5 px-4">Details</th>
                  <th className="py-2.5 px-4">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No security audit events logged yet.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                      <td className="py-2.5 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 font-mono font-semibold text-brand-600 dark:text-brand-400">
                        {log.event}
                      </td>
                      <td className="py-2.5 px-4 font-medium text-slate-800 dark:text-slate-200">{log.username}</td>
                      <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400">{log.details}</td>
                      <td className="py-2.5 px-4 font-mono text-slate-500">{log.ip}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* About Tab */}
      {activeTab === 'about' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 space-y-6 max-w-xl shadow-sm">
          <div className="flex items-center space-x-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="p-3 rounded-2xl bg-brand-600 text-white shadow-md shadow-brand-500/20">
              <Cloud className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Private Cloud File Manager
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                A self-hosted cloud file manager backed by Google Drive.
              </p>
            </div>
          </div>

          <div className="space-y-3 text-xs sm:text-sm divide-y divide-slate-100 dark:divide-slate-800">
            <div className="flex justify-between py-2.5">
              <span className="text-slate-500">Version</span>
              <span className="font-mono font-medium text-slate-800 dark:text-slate-200">v1.0.0</span>
            </div>

            <div className="flex justify-between py-2.5">
              <span className="text-slate-500">License</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">Open Source (MIT)</span>
            </div>

            <div className="flex justify-between py-2.5">
              <span className="text-slate-500">Made by</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">Sameer</span>
            </div>

            <div className="flex justify-between py-2.5 items-center">
              <span className="text-slate-500">GitHub Repository</span>
              <a
                href="https://github.com/sameerahmad005/Private-Cloud-File-Manager"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1.5 font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 underline transition-colors"
              >
                <span>GitHub</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Keyboard Shortcuts Documentation */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <h4 className="font-semibold text-xs text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Keyboard Shortcuts
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-600 dark:text-slate-400">Global Search</span>
                <kbd className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[11px] font-mono text-slate-700 dark:text-slate-300">
                  Ctrl / ⌘ + K
                </kbd>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-600 dark:text-slate-400">Select All Files</span>
                <kbd className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[11px] font-mono text-slate-700 dark:text-slate-300">
                  Ctrl / ⌘ + A
                </kbd>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-600 dark:text-slate-400">Deselect All Files</span>
                <kbd className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[11px] font-mono text-slate-700 dark:text-slate-300">
                  Ctrl / ⌘ + Shift + A
                </kbd>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-600 dark:text-slate-400">Delete Selected Items</span>
                <kbd className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[11px] font-mono text-slate-700 dark:text-slate-300">
                  Delete
                </kbd>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-600 dark:text-slate-400">Open Selected Item</span>
                <kbd className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[11px] font-mono text-slate-700 dark:text-slate-300">
                  Enter
                </kbd>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-600 dark:text-slate-400">Close Menus / Overlays</span>
                <kbd className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[11px] font-mono text-slate-700 dark:text-slate-300">
                  Escape
                </kbd>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
