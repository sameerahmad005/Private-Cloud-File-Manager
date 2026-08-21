import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  ChevronRight,
  ExternalLink,
  Copy,
  Check,
  ArrowLeft,
  ShieldCheck,
  Key,
  FolderPlus,
  Cloud,
  CheckCircle2,
  Info,
  AlertTriangle,
  Server,
  Lock,
  Search,
} from 'lucide-react';
import { setupApi } from '../services/api';

interface GoogleOauthGuidePageProps {
  onBackToSetup?: () => void;
}

export const GoogleOauthGuidePage: React.FC<GoogleOauthGuidePageProps> = ({ onBackToSetup }) => {
  const [activeSection, setActiveSection] = useState<string>('sec-1');
  const [redirectUri, setRedirectUri] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    fetchRedirectUri();
  }, []);

  const fetchRedirectUri = async () => {
    try {
      const res = await setupApi.getStatus();
      if (res.data?.redirectUri) {
        setRedirectUri(res.data.redirectUri);
      } else {
        setRedirectUri(`${window.location.origin}/api/setup/oauth/callback`);
      }
    } catch {
      setRedirectUri(`${window.location.origin}/api/setup/oauth/callback`);
    }
  };

  const handleCopyUri = () => {
    const target = redirectUri || `${window.location.origin}/api/setup/oauth/callback`;
    navigator.clipboard.writeText(target);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleBack = () => {
    if (onBackToSetup) {
      onBackToSetup();
    } else if (window.opener) {
      window.close();
    } else {
      window.location.href = '/setup';
    }
  };

  const navItems = [
    { id: 'sec-1', title: '1. Create Google Cloud Project' },
    { id: 'sec-2', title: '2. Enable Google Drive API' },
    { id: 'sec-3', title: '3. Configure Auth Platform' },
    { id: 'sec-4', title: '4. Audience & Test Users' },
    { id: 'sec-5', title: '5. Data Access & Scopes' },
    { id: 'sec-6', title: '6. Create Web OAuth Client' },
    { id: 'sec-7', title: '7. Authorized Redirect URI' },
    { id: 'sec-8', title: '8. Register Redirect URI' },
    { id: 'sec-9', title: '9. Copy Client Credentials' },
    { id: 'sec-10', title: '10. Return & Save Credentials' },
  ];

  return (
    <div className="min-h-screen w-screen bg-slate-950 text-slate-100 font-sans flex flex-col selection:bg-brand-500 selection:text-white">
      {/* Top Professional Documentation Navbar */}
      <header className="sticky top-0 z-40 bg-slate-900/90 border-b border-slate-800 backdrop-blur-xl px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-brand-600 text-white shadow-md shadow-brand-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-sm text-slate-100">Private Cloud Docs</span>
              <span className="hidden sm:inline-block ml-2 text-xs text-slate-400 border-l border-slate-700 pl-2">
                Google OAuth Configuration Guide
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleBack}
            className="flex items-center space-x-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs sm:text-sm font-semibold rounded-xl transition-all shadow-md shadow-brand-600/20"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Setup Wizard</span>
          </button>
        </div>
      </header>

      {/* Main Documentation Portal Layout */}
      <div className="flex-1 max-w-7xl mx-auto w-full flex">
        {/* Left Sticky Documentation Navigation Sidebar */}
        <aside className="hidden lg:block w-72 shrink-0 border-r border-slate-800/80 p-6 sticky top-[61px] h-[calc(100vh-61px)] overflow-y-auto space-y-6">
          <div>
            <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Setup Guide Navigation</h5>
            <nav className="space-y-1">
              {navItems.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={() => setActiveSection(item.id)}
                  className={`block px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    activeSection === item.id
                      ? 'bg-brand-950/60 border border-brand-800/60 text-brand-400 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  {item.title}
                </a>
              ))}
            </nav>
          </div>

          <div className="pt-4 border-t border-slate-800/60 space-y-3">
            <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Google Console Shortcuts</h5>
            <div className="space-y-2 text-xs">
              <a
                href="https://console.cloud.google.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between text-slate-300 hover:text-brand-400 p-2 rounded-xl bg-slate-900/40 border border-slate-800 transition-all"
              >
                <span>Cloud Console</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              </a>
              <a
                href="https://console.cloud.google.com/apis/library/drive.googleapis.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between text-slate-300 hover:text-brand-400 p-2 rounded-xl bg-slate-900/40 border border-slate-800 transition-all"
              >
                <span>Drive API Library</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              </a>
              <a
                href="https://console.cloud.google.com/auth/overview"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between text-slate-300 hover:text-brand-400 p-2 rounded-xl bg-slate-900/40 border border-slate-800 transition-all"
              >
                <span>Auth Platform</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              </a>
            </div>
          </div>
        </aside>

        {/* Center Article Content Area */}
        <main className="flex-1 p-6 sm:p-10 max-w-4xl overflow-y-auto space-y-12">
          {/* Document Header */}
          <div className="space-y-4 pb-8 border-b border-slate-800">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-950/60 border border-brand-800/40 text-brand-400 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Official Self-Hosting Guide</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-100 tracking-tight leading-tight">
              Create & Configure Your Google OAuth Client
            </h1>
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-3xl">
              This step-by-step documentation guides you through creating a dedicated Google Cloud project and obtaining your OAuth Client credentials so your Private Cloud installation can interact directly with your Google Drive storage.
            </p>
          </div>

          {/* Quick Copy Callout Card */}
          <div className="p-6 bg-slate-900/90 rounded-3xl border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-slate-200 font-bold text-sm">
                <Info className="w-4 h-4 text-brand-400" />
                <span>Your Installation Authorized Redirect URI</span>
              </div>
              <button
                onClick={handleCopyUri}
                className="px-3.5 py-1.5 bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs rounded-xl flex items-center space-x-1.5 transition-all shadow-sm"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy URI'}</span>
              </button>
            </div>
            <p className="text-xs text-slate-400">
              You must register this exact URI inside your Google Cloud Console OAuth Client settings in Step 8 below:
            </p>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-emerald-400 select-all break-all">
              {redirectUri || `${window.location.origin}/api/setup/oauth/callback`}
            </div>
          </div>

          {/* SECTION 1 */}
          <section id="sec-1" className="space-y-4 scroll-mt-20">
            <h2 className="text-xl font-bold text-slate-100 flex items-center space-x-2.5 pb-2 border-b border-slate-800/80">
              <span className="w-7 h-7 rounded-xl bg-brand-600 text-white text-xs font-bold flex items-center justify-center">1</span>
              <span>Create a Google Cloud Project</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Google Cloud uses projects to organize credentials, APIs, and access policies. You must create or select a Google Cloud project to own the OAuth application credentials for this file manager.
            </p>
            <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 space-y-3 text-xs text-slate-300">
              <ol className="list-decimal list-inside space-y-2 leading-relaxed">
                <li>Sign in to the Google Cloud Console using your Google account.</li>
                <li>Click the Project Selector dropdown located at the top-left navigation header.</li>
                <li>In the project selection window, click <strong>New Project</strong> in the top-right corner.</li>
                <li>Enter a recognizable project name (e.g., <code className="text-brand-300 font-mono">Private Cloud Storage</code>).</li>
                <li>Click <strong>Create</strong> and wait a few seconds for Google Cloud to provision your project.</li>
                <li>Select the newly created project from the project selector header.</li>
              </ol>
            </div>
            <div className="pt-1">
              <a
                href="https://console.cloud.google.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-semibold rounded-xl transition-all"
              >
                <span>Open Google Cloud Console</span>
                <ExternalLink className="w-3.5 h-3.5 text-brand-400" />
              </a>
            </div>
          </section>

          {/* SECTION 2 */}
          <section id="sec-2" className="space-y-4 scroll-mt-20">
            <h2 className="text-xl font-bold text-slate-100 flex items-center space-x-2.5 pb-2 border-b border-slate-800/80">
              <span className="w-7 h-7 rounded-xl bg-brand-600 text-white text-xs font-bold flex items-center justify-center">2</span>
              <span>Enable Google Drive API</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Before your application can interact with Google Drive, the Google Drive API must be explicitly enabled for your project.
            </p>
            <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 space-y-3 text-xs text-slate-300">
              <ol className="list-decimal list-inside space-y-2 leading-relaxed">
                <li>Make sure your newly created project is active in the top bar.</li>
                <li>Open the Google Drive API library page directly via the link below.</li>
                <li>Click the blue <strong>Enable</strong> button.</li>
                <li>Wait until API enablement finishes. You will see an API Overview status page once ready.</li>
              </ol>
            </div>
            <div className="flex flex-wrap gap-3 pt-1">
              <a
                href="https://console.cloud.google.com/apis/library/drive.googleapis.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-xl transition-all shadow-sm"
              >
                <span>Open Google Drive API Library</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <a
                href="https://developers.google.com/workspace/guides/auth-overview"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold rounded-xl transition-all"
              >
                <span>Official Documentation</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </section>

          {/* SECTION 3 */}
          <section id="sec-3" className="space-y-4 scroll-mt-20">
            <h2 className="text-xl font-bold text-slate-100 flex items-center space-x-2.5 pb-2 border-b border-slate-800/80">
              <span className="w-7 h-7 rounded-xl bg-brand-600 text-white text-xs font-bold flex items-center justify-center">3</span>
              <span>Configure Google Auth Platform / OAuth Consent Screen</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              The OAuth consent screen informs users who is requesting access to their data and provides support contact details.
            </p>
            <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 space-y-3 text-xs text-slate-300">
              <ol className="list-decimal list-inside space-y-2 leading-relaxed">
                <li>Open Google Auth Platform / Overview.</li>
                <li>If prompted to configure your app consent screen, click <strong>Get Started</strong> or <strong>Configure Consent Screen</strong>.</li>
                <li>Enter an Application Name (e.g., <code className="text-brand-300 font-mono">Private Cloud Storage</code>).</li>
                <li>Provide your Support Email address and Developer Contact Email.</li>
                <li>Save and continue.</li>
              </ol>
            </div>
            <div className="flex flex-wrap gap-3 pt-1">
              <a
                href="https://console.cloud.google.com/auth/overview"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-xl transition-all shadow-sm"
              >
                <span>Open Google Auth Platform</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <a
                href="https://developers.google.com/workspace/guides/configure-oauth-consent"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold rounded-xl transition-all"
              >
                <span>Official OAuth Consent Guide</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </section>

          {/* SECTION 4 */}
          <section id="sec-4" className="space-y-4 scroll-mt-20">
            <h2 className="text-xl font-bold text-slate-100 flex items-center space-x-2.5 pb-2 border-b border-slate-800/80">
              <span className="w-7 h-7 rounded-xl bg-brand-600 text-white text-xs font-bold flex items-center justify-center">4</span>
              <span>Configure Audience & Test Users</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Google Cloud categorizes OAuth consent screens into Internal and External audiences.
            </p>
            <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 space-y-3 text-xs text-slate-300">
              <ul className="space-y-2 leading-relaxed">
                <li><strong className="text-slate-100">Internal:</strong> Available only to Google Workspace accounts within your organization.</li>
                <li><strong className="text-slate-100">External:</strong> Required if using personal <code className="text-brand-300 font-mono">@gmail.com</code> accounts.</li>
              </ul>
              <div className="p-3 bg-amber-950/40 border border-amber-800/50 rounded-xl text-amber-300 text-xs space-y-1 mt-2">
                <p className="font-semibold flex items-center space-x-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Important for External Audience Mode:</span>
                </p>
                <p>
                  While your app is in "Testing" status, you must add your Google email under <strong>Test Users</strong> in the Google Auth Platform settings. Otherwise, Google will block sign-in with error <code className="font-mono">400: access_denied</code>.
                </p>
              </div>
            </div>
          </section>

          {/* SECTION 5 */}
          <section id="sec-5" className="space-y-4 scroll-mt-20">
            <h2 className="text-xl font-bold text-slate-100 flex items-center space-x-2.5 pb-2 border-b border-slate-800/80">
              <span className="w-7 h-7 rounded-xl bg-brand-600 text-white text-xs font-bold flex items-center justify-center">5</span>
              <span>Configure Data Access & OAuth Scopes</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Scopes define the specific permissions your application asks users to grant.
            </p>
            <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 space-y-3 text-xs text-slate-300">
              <p className="font-semibold text-slate-200">Requested OAuth Scope:</p>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-brand-300 select-all break-all">
                https://www.googleapis.com/auth/drive
              </div>
              <p className="leading-relaxed text-slate-400">
                <strong>Why this scope is required:</strong> Allows Private Cloud File Manager to create, list, upload, download, stream, rename, move, and delete files inside your dedicated Google Drive root folder. All operations are strictly bounded to the designated root folder ID.
              </p>
            </div>
          </section>

          {/* SECTION 6 */}
          <section id="sec-6" className="space-y-4 scroll-mt-20">
            <h2 className="text-xl font-bold text-slate-100 flex items-center space-x-2.5 pb-2 border-b border-slate-800/80">
              <span className="w-7 h-7 rounded-xl bg-brand-600 text-white text-xs font-bold flex items-center justify-center">6</span>
              <span>Create Web Application OAuth Client</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Now create the Web Application OAuth client credentials that will be entered into your Private Cloud installation.
            </p>
            <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 space-y-3 text-xs text-slate-300">
              <ol className="list-decimal list-inside space-y-2 leading-relaxed">
                <li>Open Google Auth Platform / Clients section (or API Credentials page).</li>
                <li>Click <strong>+ Create Credentials</strong> at the top bar.</li>
                <li>Select <strong>OAuth client ID</strong>.</li>
                <li>Application type: Choose <strong>Web application</strong>.</li>
                <li>Name: Enter a client name (e.g., <code className="text-brand-300 font-mono">Private Cloud Web App</code>).</li>
              </ol>
            </div>
            <div className="flex flex-wrap gap-3 pt-1">
              <a
                href="https://console.cloud.google.com/auth/clients"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-xl transition-all shadow-sm"
              >
                <span>Open Auth Clients Section</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <a
                href="https://console.cloud.google.com/apis/credentials"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold rounded-xl transition-all"
              >
                <span>Credentials Fallback</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </section>

          {/* SECTION 7 & 8 */}
          <section id="sec-7" className="space-y-4 scroll-mt-20">
            <h2 className="text-xl font-bold text-slate-100 flex items-center space-x-2.5 pb-2 border-b border-slate-800/80">
              <span className="w-7 h-7 rounded-xl bg-brand-600 text-white text-xs font-bold flex items-center justify-center">7</span>
              <span>Register Installation Authorized Redirect URI</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Google OAuth security mandates that the callback URL sent during login must match an Authorized Redirect URI registered in the client settings.
            </p>
            <div className="p-5 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200">Copy Exact Installation Redirect URI:</span>
                <button
                  onClick={handleCopyUri}
                  className="px-3.5 py-1.5 bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs rounded-xl flex items-center space-x-1.5 transition-all shadow-sm"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy URI'}</span>
                </button>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-emerald-400 select-all break-all">
                {redirectUri || `${window.location.origin}/api/setup/oauth/callback`}
              </div>

              <div className="pt-2 space-y-2 text-slate-300 border-t border-slate-800">
                <p className="font-semibold text-slate-200">How to add in Google Cloud:</p>
                <ol className="list-decimal list-inside space-y-1.5 leading-relaxed text-slate-400">
                  <li>In your OAuth Client creation form, find <strong>Authorized redirect URIs</strong>.</li>
                  <li>Click <strong>+ ADD URI</strong>.</li>
                  <li>Paste the exact URI copied above.</li>
                  <li>Click <strong>Create</strong> or <strong>Save</strong>.</li>
                </ol>
              </div>
            </div>
          </section>

          {/* SECTION 9 */}
          <section id="sec-9" className="space-y-4 scroll-mt-20">
            <h2 className="text-xl font-bold text-slate-100 flex items-center space-x-2.5 pb-2 border-b border-slate-800/80">
              <span className="w-7 h-7 rounded-xl bg-brand-600 text-white text-xs font-bold flex items-center justify-center">9</span>
              <span>Copy Client ID & Client Secret</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Once created, Google displays a modal containing your new OAuth Client ID and Client Secret.
            </p>
            <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 space-y-3 text-xs text-slate-300">
              <ol className="list-decimal list-inside space-y-2 leading-relaxed">
                <li>Copy the <strong>Client ID</strong> (format: <code className="text-brand-300 font-mono">xxxxxx.apps.googleusercontent.com</code>).</li>
                <li>Copy the <strong>Client Secret</strong> (format: <code className="text-brand-300 font-mono">GOCSPX-xxxxxx</code>).</li>
              </ol>
              <div className="p-3 bg-rose-950/40 border border-rose-800/50 rounded-xl text-rose-300 text-xs space-y-1 mt-2">
                <p className="font-semibold flex items-center space-x-1.5">
                  <Lock className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Security Advisory:</span>
                </p>
                <p>
                  Never post your Client Secret to public forums, GitHub repositories, or frontend code. Private Cloud stores your secret safely on the backend server.
                </p>
              </div>
            </div>
          </section>

          {/* SECTION 10 */}
          <section id="sec-10" className="space-y-4 scroll-mt-20">
            <h2 className="text-xl font-bold text-slate-100 flex items-center space-x-2.5 pb-2 border-b border-slate-800/80">
              <span className="w-7 h-7 rounded-xl bg-brand-600 text-white text-xs font-bold flex items-center justify-center">10</span>
              <span>Return & Save Credentials in Setup Wizard</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Now return to your Private Cloud Setup Wizard and complete credentials submission.
            </p>
            <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 space-y-3 text-xs text-slate-300">
              <ol className="list-decimal list-inside space-y-2 leading-relaxed">
                <li>Click <strong>Return to Setup Wizard</strong> at the top right of this document page.</li>
                <li>Paste your Client ID into the Google OAuth Client ID field.</li>
                <li>Paste your Client Secret into the Google OAuth Client Secret field.</li>
                <li>Click <strong>Confirm OAuth Client & Continue</strong> to proceed to Google Account Authorization.</li>
              </ol>
            </div>
            <div className="pt-4">
              <button
                onClick={handleBack}
                className="flex items-center space-x-2 px-6 py-3 bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs sm:text-sm rounded-2xl shadow-lg shadow-brand-600/25 transition-all"
              >
                <ArrowLeft className="w-4.5 h-4.5" />
                <span>Return to Setup Wizard Now</span>
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};
