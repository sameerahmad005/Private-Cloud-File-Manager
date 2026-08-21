import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  UserPlus,
  Key,
  FolderPlus,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Cloud,
  Folder,
  Lock,
  Server,
  AlertCircle,
  ExternalLink,
  Info,
  Check,
  BookOpen,
  Copy,
} from 'lucide-react';
import { setupApi } from '../services/api';

interface SetupPageProps {
  onSetupComplete: () => void;
  onOpenGuidePage?: () => void;
}

export const SetupPage: React.FC<SetupPageProps> = ({ onSetupComplete, onOpenGuidePage }) => {
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Status from Server
  const [hasOauthConfig, setHasOauthConfig] = useState<boolean>(false);
  const [hasRefreshToken, setHasRefreshToken] = useState<boolean>(false);
  const [isDriveConnected, setIsDriveConnected] = useState<boolean>(false);
  const [providerState, setProviderState] = useState<string>('NOT_CONFIGURED');
  const [redirectUri, setRedirectUri] = useState<string>('');

  const [copiedUri, setCopiedUri] = useState<boolean>(false);

  // Step 2: Admin Creation
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [adminCreated, setAdminCreated] = useState<boolean>(false);

  // Step 3: OAuth Client Credentials (Starts Empty)
  const [clientId, setClientId] = useState<string>('');
  const [clientSecret, setClientSecret] = useState<string>('');

  // Step 5: Storage Folder Selection
  const [folderMode, setFolderMode] = useState<'existing' | 'new'>('new');
  const [newFolderName, setNewFolderName] = useState<string>('Private Cloud');
  const [existingFolders, setExistingFolders] = useState<{ id: string; name: string }[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [selectedFolderName, setSelectedFolderName] = useState<string>('');
  const [folderConfirmed, setFolderConfirmed] = useState<boolean>(false);

  useEffect(() => {
    checkStatus();
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'GOOGLE_OAUTH_SUCCESS') {
        checkStatus();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const checkStatus = async () => {
    try {
      setLoading(true);
      const res = await setupApi.getStatus();
      if (res.success && res.data) {
        setHasOauthConfig(res.data.hasOauthConfig);
        setHasRefreshToken(res.data.hasRefreshToken);
        setIsDriveConnected(res.data.isDriveConnected);
        setProviderState(res.data.providerState);
        setRedirectUri(res.data.redirectUri || `${window.location.origin}/api/setup/oauth/callback`);
      }
    } catch {
      // Ignored
    } finally {
      setLoading(false);
    }
  };

  const handleCopyUri = () => {
    const target = redirectUri || `${window.location.origin}/api/setup/oauth/callback`;
    navigator.clipboard.writeText(target);
    setCopiedUri(true);
    setTimeout(() => setCopiedUri(false), 2500);
  };

  const handleOpenGuide = () => {
    if (onOpenGuidePage) {
      onOpenGuidePage();
    } else {
      window.open('/setup/google-oauth-guide', '_blank');
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);
      await setupApi.createAdmin(username, password);
      setAdminCreated(true);
      setStep(3);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create administrator user.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveOauthConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!clientId.trim()) {
      setErrorMsg('Please enter your Google OAuth Client ID.');
      return;
    }
    if (!clientSecret.trim()) {
      setErrorMsg('Please enter your Google OAuth Client Secret.');
      return;
    }
    if (!clientId.includes('.apps.googleusercontent.com')) {
      setErrorMsg('Malformed Client ID. It must end with .apps.googleusercontent.com');
      return;
    }

    try {
      setLoading(true);
      const res = await setupApi.saveOauthConfig(clientId.trim(), clientSecret.trim());

      if (res.success) {
        // Clear secret from React component memory state immediately after submission
        setClientSecret('');
        await checkStatus();
        setStep(4); // Move to Step 4: Connect Google Account
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save OAuth Client credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartOAuth = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await setupApi.getOAuthUrl();
      if (res.success && res.data?.url) {
        const popup = window.open(res.data.url, 'google_oauth_popup', 'width=600,height=700');

        if (!popup) {
          setErrorMsg('OAuth popup window was blocked by the browser. Please allow popups for this domain and try again.');
          setLoading(false);
          return;
        }

        const interval = setInterval(async () => {
          if (popup.closed) {
            clearInterval(interval);
            setLoading(false);
            const statusRes = await setupApi.getStatus();
            if (statusRes.data?.isDriveConnected || statusRes.data?.hasRefreshToken) {
              await checkStatus();
            } else {
              setErrorMsg('Google authorization window was closed before completing sign-in.');
            }
            return;
          }

          const statusRes = await setupApi.getStatus();
          if (statusRes.data?.isDriveConnected || statusRes.data?.hasRefreshToken) {
            clearInterval(interval);
            if (!popup.closed) popup.close();
            await checkStatus();
            setLoading(false);
          }
        }, 1500);

        setTimeout(() => {
          clearInterval(interval);
          setLoading(false);
        }, 120000);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to initialize Google OAuth authorization URL.');
      setLoading(false);
    }
  };

  const loadFolders = async () => {
    try {
      setLoading(true);
      const res = await setupApi.listDriveFolders();
      if (res.success && res.data) {
        setExistingFolders(res.data);
        if (res.data.length > 0) {
          setSelectedFolderId(res.data[0].id);
          setSelectedFolderName(res.data[0].name);
        }
      }
    } catch {
      // Ignored
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmStorageFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setErrorMsg(null);
      let payload: { folderId?: string; folderName?: string; createNew?: boolean } = {};

      if (folderMode === 'new') {
        if (!newFolderName.trim()) {
          setErrorMsg('Please specify a folder name.');
          return;
        }
        payload = { folderName: newFolderName.trim(), createNew: true };
      } else {
        if (!selectedFolderId) {
          setErrorMsg('Please select an existing Google Drive folder.');
          return;
        }
        payload = { folderId: selectedFolderId, folderName: selectedFolderName, createNew: false };
      }

      const res = await setupApi.selectStorageFolder(payload);
      if (res.success && res.data) {
        setSelectedFolderId(res.data.folderId);
        setSelectedFolderName(res.data.folderName);
        setFolderConfirmed(true);
        setStep(6);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to configure storage root folder.');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalizeSetup = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      await setupApi.completeSetup();
      onSetupComplete();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to complete first-run setup.');
    } finally {
      setLoading(false);
    }
  };

  const stepsHeader = [
    { num: 1, label: 'Welcome' },
    { num: 2, label: 'Admin' },
    { num: 3, label: 'OAuth Client Credentials' },
    { num: 4, label: 'Connect Account' },
    { num: 5, label: 'Storage Folder' },
    { num: 6, label: 'Complete' },
  ];

  return (
    <div className="min-h-screen w-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-8 font-sans selection:bg-brand-500 selection:text-white">
      {/* Brand Header */}
      <div className="flex items-center justify-between max-w-4xl mx-auto w-full pt-2 pb-6 border-b border-slate-800/80">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-500/20">
            <Cloud className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-base sm:text-lg text-slate-100 leading-tight">Private Cloud File Manager</h1>
            <p className="text-xs text-slate-400">Self-Hosted Installation & Security Setup Wizard</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center space-x-2 text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400">
          <Server className="w-4 h-4 text-brand-400" />
          <span>Step {step} of 6</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="my-auto py-6 max-w-4xl mx-auto w-full">
        {/* Step Stepper Progress Bar */}
        <div className="mb-8 overflow-x-auto scrollbar-none">
          <div className="flex items-center justify-between min-w-[560px] max-w-3xl mx-auto px-4">
            {stepsHeader.map((s, idx) => (
              <React.Fragment key={s.num}>
                <div className="flex flex-col items-center space-y-1.5">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                      step === s.num
                        ? 'bg-brand-600 text-white ring-4 ring-brand-500/20 shadow-md shadow-brand-500/30'
                        : step > s.num
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-900 border border-slate-800 text-slate-500'
                    }`}
                  >
                    {step > s.num ? <Check className="w-4 h-4" /> : s.num}
                  </div>
                  <span
                    className={`text-[11px] font-medium ${
                      step === s.num
                        ? 'text-brand-400 font-semibold'
                        : step > s.num
                        ? 'text-slate-300'
                        : 'text-slate-500'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {idx < stepsHeader.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 rounded-full transition-all ${
                      step > s.num ? 'bg-emerald-600' : 'bg-slate-800'
                    }`}
                  ></div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Global Error Notice */}
        {errorMsg && (
          <div className="max-w-lg mx-auto mb-6 p-4 bg-rose-950/40 border border-rose-800/60 rounded-2xl flex items-center space-x-3 text-rose-300 text-xs animate-in fade-in duration-150">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Wizard Steps Card Container */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl transition-all">
          {/* STEP 1: WELCOME */}
          {step === 1 && (
            <div className="space-y-6 max-w-lg mx-auto text-center">
              <div className="mx-auto w-16 h-16 rounded-3xl bg-brand-950/60 border border-brand-800/40 flex items-center justify-center text-brand-400 shadow-xl mb-4">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-100">Welcome to Private Cloud</h2>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Transform your Google Drive into a private, secure, self-hosted cloud storage engine with full root folder isolation.
                </p>
              </div>

              <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 text-left text-xs space-y-2 text-slate-300">
                <p className="font-semibold text-slate-200">Prerequisites Check:</p>
                <div className="flex items-center space-x-2 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>100% Self-Hosted & User-Controlled OAuth Architecture</span>
                </div>
                <div className="flex items-center space-x-2 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Strict Server-Side Root Boundary Isolation Enforced</span>
                </div>
                <div className="flex items-center space-x-2 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Zero-Leak OAuth Secret Security Engine Active</span>
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                className="w-full py-3.5 bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm rounded-2xl shadow-lg shadow-brand-600/25 transition-all flex items-center justify-center space-x-2"
              >
                <span>Get Started & Begin Setup</span>
                <ChevronRight className="w-4.5 h-4.5" />
              </button>
            </div>
          )}

          {/* STEP 2: ADMINISTRATOR CREATION */}
          {step === 2 && (
            <div className="space-y-6 max-w-lg mx-auto">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
                  <UserPlus className="w-5 h-5 text-brand-400" />
                  <span>Create Administrator Account</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Set up the primary administrator account for logging into your cloud file manager.
                </p>
              </div>

              <form onSubmit={handleCreateAdmin} className="space-y-4 text-xs sm:text-sm">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Admin Username</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="admin"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Admin Password (Min 8 chars)</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Confirm Admin Password</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>

                <div className="pt-4 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex items-center space-x-1.5 px-4 py-2 text-slate-400 hover:text-slate-200 text-xs sm:text-sm"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center space-x-2 px-6 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-medium text-xs sm:text-sm rounded-xl shadow-sm transition-all"
                  >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>Save & Continue</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* STEP 3: OAUTH CLIENT CREDENTIALS */}
          {step === 3 && (
            <div className="space-y-6 max-w-lg mx-auto">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h2 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
                    <Key className="w-5 h-5 text-brand-400" />
                    <span>OAuth Client Credentials</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Connect your own Google Cloud OAuth application to this self-hosted installation.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleOpenGuide}
                  className="px-3 py-1.5 bg-brand-950/60 border border-brand-800/60 hover:bg-brand-900 text-brand-300 font-medium text-xs rounded-xl flex items-center space-x-1.5 shrink-0 transition-all shadow-sm"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Open Setup Guide ↗</span>
                </button>
              </div>

              {/* Redirect URI Notice Banner */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-300 font-medium">
                  <span className="flex items-center space-x-1.5">
                    <Info className="w-4 h-4 text-brand-400 shrink-0" />
                    <span>Installation Authorized Redirect URI:</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyUri}
                    className="text-brand-400 hover:text-brand-300 text-[11px] font-semibold flex items-center space-x-1"
                  >
                    {copiedUri ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedUri ? 'Copied!' : 'Copy URI'}</span>
                  </button>
                </div>
                <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 text-emerald-400 font-mono text-xs select-all break-all">
                  {redirectUri || `${window.location.origin}/api/setup/oauth/callback`}
                </div>
              </div>

              <form onSubmit={handleSaveOauthConfig} className="space-y-4 text-xs sm:text-sm">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Google OAuth Client ID</label>
                  <input
                    type="text"
                    required
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    placeholder="xxxxxx-xxxxxx.apps.googleusercontent.com"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:ring-2 focus:ring-brand-500 focus:outline-none font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Google OAuth Client Secret</label>
                  <input
                    type="password"
                    required
                    value={clientSecret}
                    onChange={(e) => setClientSecret(e.target.value)}
                    placeholder="GOCSPX-••••••••••••••••••••••••••••"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:ring-2 focus:ring-brand-500 focus:outline-none font-mono text-xs"
                  />
                </div>

                <div className="pt-4 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="flex items-center space-x-1.5 px-4 py-2 text-slate-400 hover:text-slate-200 text-xs sm:text-sm"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center space-x-2 px-6 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-medium text-xs sm:text-sm rounded-xl shadow-sm transition-all"
                  >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>Save & Continue</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* STEP 4: CONNECT GOOGLE ACCOUNT */}
          {step === 4 && (
            <div className="space-y-6 max-w-lg mx-auto">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
                  <Cloud className="w-5 h-5 text-brand-400" />
                  <span>Connect Google Account</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Authorize this application to access your Google Drive storage.
                </p>
              </div>

              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-slate-400 font-medium">OAuth Client Credentials:</span>
                  <span className="font-semibold text-emerald-400 flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>✓ Configured</span>
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Google Drive Access Status:</span>
                  <span className={`font-semibold ${isDriveConnected ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {isDriveConnected ? '✓ Connected' : 'Awaiting Authorization'}
                  </span>
                </div>
              </div>

              {!isDriveConnected ? (
                <div className="space-y-4">
                  <button
                    onClick={handleStartOAuth}
                    disabled={loading}
                    className="w-full flex items-center justify-center space-x-2 py-3.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm rounded-2xl shadow-lg shadow-brand-600/25 transition-all"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                    <span>Connect Google Account / Authorize Drive</span>
                  </button>
                  <p className="text-[11px] text-slate-500 text-center">
                    A secure Google OAuth sign-in window will open. Complete sign-in to grant Drive permissions.
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-emerald-950/40 border border-emerald-800/50 rounded-2xl space-y-2 text-xs text-emerald-300">
                  <div className="flex items-center space-x-2 text-emerald-400 font-semibold text-sm">
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    <span>✓ Google Account Connected</span>
                  </div>
                  <p className="text-slate-300">
                    Google Drive access has been successfully authorized and verified.
                  </p>
                </div>
              )}

              <div className="pt-4 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="flex items-center space-x-1.5 px-4 py-2 text-slate-400 hover:text-slate-200 text-xs sm:text-sm"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  disabled={!isDriveConnected && providerState !== 'GOOGLE_DRIVE_CONNECTED'}
                  onClick={() => {
                    loadFolders();
                    setStep(5);
                  }}
                  className="flex items-center space-x-2 px-6 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white font-medium text-xs sm:text-sm rounded-xl shadow-sm transition-all"
                >
                  <span>Continue to Storage Selection</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: STORAGE FOLDER SELECTION */}
          {step === 5 && (
            <div className="space-y-6 max-w-lg mx-auto">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
                  <FolderPlus className="w-5 h-5 text-brand-400" />
                  <span>Choose Storage Folder</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Select or create the dedicated root folder on Google Drive for files managed by Private Cloud.
                </p>
              </div>

              <form onSubmit={handleConfirmStorageFolder} className="space-y-4 text-xs sm:text-sm">
                <div className="space-y-3">
                  {/* Option A: Create New Folder */}
                  <div
                    onClick={() => setFolderMode('new')}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      folderMode === 'new'
                        ? 'bg-brand-950/40 border-brand-500/80 text-slate-100 shadow-md ring-1 ring-brand-500/30'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <input
                        type="radio"
                        name="folderMode"
                        checked={folderMode === 'new'}
                        onChange={() => setFolderMode('new')}
                        className="mt-1 text-brand-600 focus:ring-brand-500"
                      />
                      <div className="space-y-1">
                        <span className="font-semibold text-slate-100 text-sm">Create New Google Drive Folder</span>
                        <p className="text-xs text-slate-400">
                          Automatically create a clean dedicated storage folder inside your Google Drive.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Option B: Use Existing Folder */}
                  <div
                    onClick={() => {
                      setFolderMode('existing');
                      if (existingFolders.length === 0) loadFolders();
                    }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      folderMode === 'existing'
                        ? 'bg-brand-950/40 border-brand-500/80 text-slate-100 shadow-md ring-1 ring-brand-500/30'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <input
                        type="radio"
                        name="folderMode"
                        checked={folderMode === 'existing'}
                        onChange={() => {
                          setFolderMode('existing');
                          if (existingFolders.length === 0) loadFolders();
                        }}
                        className="mt-1 text-brand-600 focus:ring-brand-500"
                      />
                      <div className="space-y-1">
                        <span className="font-semibold text-slate-100 text-sm">Use Existing Google Drive Folder</span>
                        <p className="text-xs text-slate-400">
                          Select an existing folder on your Google Drive as the root boundary.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sub-inputs */}
                {folderMode === 'new' ? (
                  <div className="pt-2">
                    <label className="block text-slate-300 font-medium mb-1">New Folder Name</label>
                    <input
                      type="text"
                      required
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      placeholder="Private Cloud"
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                  </div>
                ) : (
                  <div className="pt-2 space-y-2">
                    <label className="block text-slate-300 font-medium mb-1">Select Existing Folder</label>
                    {loading ? (
                      <div className="p-4 text-center text-xs text-slate-400">Loading Drive Folders...</div>
                    ) : existingFolders.length === 0 ? (
                      <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-400">
                        No folders found in Google Drive root. Switch to Create New Folder above.
                      </div>
                    ) : (
                      <select
                        value={selectedFolderId}
                        onChange={(e) => {
                          setSelectedFolderId(e.target.value);
                          const match = existingFolders.find((f) => f.id === e.target.value);
                          if (match) setSelectedFolderName(match.name);
                        }}
                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:ring-2 focus:ring-brand-500 focus:outline-none text-xs"
                      >
                        {existingFolders.map((f) => (
                          <option key={f.id} value={f.id}>
                            📁 {f.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}

                <div className="pt-4 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => setStep(4)}
                    className="flex items-center space-x-1.5 px-4 py-2 text-slate-400 hover:text-slate-200 text-xs sm:text-sm"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center space-x-2 px-6 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-medium text-xs sm:text-sm rounded-xl shadow-sm transition-all"
                  >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>Confirm Storage Folder</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* STEP 6: REVIEW & COMPLETE */}
          {step === 6 && (
            <div className="space-y-6 max-w-lg mx-auto">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>Review & Complete Setup</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Verify your configuration summary before completing setup and launching the application.
                </p>
              </div>

              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-slate-400 font-medium">Administrator:</span>
                  <span className="font-semibold text-slate-200">{username || 'admin'}</span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-slate-400 font-medium">OAuth Application:</span>
                  <span className="font-semibold text-emerald-400">✓ User Self-Hosted OAuth</span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-slate-400 font-medium">Google Drive Connection:</span>
                  <span className="font-semibold text-emerald-400">✓ Connected</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Root Storage Folder:</span>
                  <span className="font-semibold text-brand-400">
                    {selectedFolderName || newFolderName || 'Private Cloud'}
                  </span>
                </div>
              </div>

              <div className="pt-4 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setStep(5)}
                  className="flex items-center space-x-1.5 px-4 py-2 text-slate-400 hover:text-slate-200 text-xs sm:text-sm"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  onClick={handleFinalizeSetup}
                  disabled={loading}
                  className="flex items-center space-x-2 px-8 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm rounded-2xl shadow-lg shadow-emerald-600/25 transition-all"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Complete Setup & Launch Dashboard</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Notice */}
      <div className="text-center py-4 text-slate-500 text-[11px]">
        Private Cloud File Manager &bull; 100% Self-Hosted & User-Configured OAuth &bull; Zero-Leak Security Architecture
      </div>
    </div>
  );
};
