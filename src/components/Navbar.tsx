import React from 'react';
import {
  Terminal,
  Download,
  FileCode,
  Package,
  Sliders,
  Shield,
  Bot,
  Check,
  CheckSquare,
  Sun,
  Moon,
  RefreshCw,
  Cloud,
  FolderOpen,
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onDownloadZip: () => void;
  onUploadDrive?: () => void;
  onOpenPicker?: () => void;
  copied: boolean;
  onCopyPs1: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onDownloadZip,
  onUploadDrive,
  onOpenPicker,
  copied,
  onCopyPs1,
  theme,
  onToggleTheme,
}) => {
  const tabs = [
    { id: 'files', label: 'Script Files', icon: FileCode },
    { id: 'packages', label: 'Package Manager', icon: Package },
    { id: 'updates', label: 'Updates & Treiber', icon: RefreshCw },
    { id: 'config', label: 'ISO Profile', icon: Sliders },
    { id: 'security', label: 'Security & Wine', icon: Shield },
    { id: 'picker', label: 'Google Picker', icon: FolderOpen },
    { id: 'tasks', label: 'Google Tasks', icon: CheckSquare },
    { id: 'simulator', label: 'Build Simulator', icon: Terminal },
    { id: 'ai', label: 'Arch AI Expert', icon: Bot },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Terminal className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold text-white tracking-tight">Arch Wine OS Studio</h1>
                <span className="px-2 py-0.5 text-xs font-semibold bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-500/30">v0.1 Alpha</span>
              </div>
              <p className="text-xs text-slate-400">Custom Archiso Builder & Wine Gaming Workstation</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition-all border border-slate-700 cursor-pointer shadow-xs"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="hidden md:inline text-xs font-semibold text-slate-300">Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-indigo-600" />
                  <span className="hidden md:inline text-xs font-semibold text-slate-700">Dark</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onCopyPs1}
              className="flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition-colors border border-slate-700 cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Terminal className="w-4 h-4 text-indigo-400" />}
              <span className="hidden sm:inline">{copied ? 'PowerShell Copied!' : 'Copy PowerShell Setup'}</span>
              <span className="sm:hidden">{copied ? 'Copied' : 'Setup.ps1'}</span>
            </button>

            {onOpenPicker && (
              <button
                type="button"
                onClick={onOpenPicker}
                className="flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 hover:text-indigo-200 text-sm font-medium transition-colors border border-indigo-500/30 cursor-pointer"
                title="Google Picker Dialog öffnen"
              >
                <FolderOpen className="w-4 h-4 text-indigo-400" />
                <span className="hidden md:inline">Google Picker</span>
                <span className="md:hidden">Picker</span>
              </button>
            )}

            {onUploadDrive && (
              <button
                type="button"
                onClick={onUploadDrive}
                className="flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 hover:text-blue-200 text-sm font-medium transition-colors border border-blue-500/30 cursor-pointer"
                title="ISO-Kit direkt nach Google Drive hochladen"
              >
                <Cloud className="w-4 h-4 text-blue-400" />
                <span className="hidden md:inline">Save to Google Drive</span>
                <span className="md:hidden">Drive</span>
              </button>
            )}

            <button
              type="button"
              onClick={onDownloadZip}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all shadow-lg shadow-indigo-600/20 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Download ISO Kit (.zip)</span>
              <span className="sm:hidden">Download</span>
            </button>
          </div>
        </div>

        <div className="flex space-x-1 overflow-x-auto pb-2 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/30 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};

