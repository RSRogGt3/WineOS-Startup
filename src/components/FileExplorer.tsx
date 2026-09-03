import React, { useState } from 'react';
import { ProjectFiles } from '../types';
import { FileText, Copy, Check, Terminal, Shield, Package, Cpu, RefreshCw, Wrench, Clock, Cog } from 'lucide-react';

interface FileExplorerProps {
  files: ProjectFiles;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({ files }) => {
  const [selectedFile, setSelectedFile] = useState<keyof ProjectFiles>('buildIsoSh');
  const [copiedFile, setCopiedFile] = useState<string | null>(null);

  const fileList: { id: keyof ProjectFiles; name: string; path: string; icon: React.ElementType; desc: string }[] = [
    { id: 'buildIsoSh', name: 'build_iso.sh', path: './build_iso.sh', icon: Terminal, desc: 'Main ISO compilation script using mkarchiso' },
    { id: 'profiledefSh', name: 'profiledef.sh', path: 'arch_wine_os/profiledef.sh', icon: Cpu, desc: 'Archiso profile metadata and bootmode configurations' },
    { id: 'packages', name: 'packages.x86_64', path: 'arch_wine_os/packages.x86_64', icon: Package, desc: 'Package manifest list installed in the live/installed system' },
    { id: 'pacmanConf', name: 'pacman.conf', path: 'arch_wine_os/pacman.conf', icon: Shield, desc: 'Pacman repository and mirror settings (core, extra, multilib)' },
    { id: 'securitySetupSh', name: 'security_setup.sh', path: 'arch_wine_os/airootfs/root/security_setup.sh', icon: Shield, desc: 'Post-install security script for UFW firewall & ClamAV' },
    { id: 'updateSystemSh', name: 'update_system.sh', path: 'arch_wine_os/airootfs/usr/local/bin/update_system.sh', icon: RefreshCw, desc: 'Complete System, AUR, DKMS & Security Audit Updater' },
    { id: 'updateDriversSh', name: 'update_drivers.sh', path: 'arch_wine_os/airootfs/usr/local/bin/update_drivers.sh', icon: Wrench, desc: 'Hardware & GPU Driver Diagnostics and Stack Updater' },
    { id: 'systemUpdateService', name: 'system-update.service', path: 'arch_wine_os/airootfs/etc/systemd/system/system-update.service', icon: Cog, desc: 'systemd service unit executing automated system updates' },
    { id: 'systemUpdateTimer', name: 'system-update.timer', path: 'arch_wine_os/airootfs/etc/systemd/system/system-update.timer', icon: Clock, desc: 'systemd timer schedule (Automatic vs. Manual mode trigger)' },
    { id: 'setupPs1', name: 'setup.ps1', path: './setup.ps1', icon: FileText, desc: 'PowerShell automation script to generate the entire workspace' },
  ];

  const currentContent = files[selectedFile];

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedFile(id);
    setTimeout(() => setCopiedFile(null), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* File Sidebar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2 lg:col-span-1">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-3 mb-3">Project Files</h2>
        {fileList.map((file) => {
          const Icon = file.icon;
          const isSelected = selectedFile === file.id;
          return (
            <button
              key={file.id}
              onClick={() => setSelectedFile(file.id)}
              className={`w-full flex items-start space-x-3 p-3 rounded-lg text-left transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30'
                  : 'hover:bg-slate-800 text-slate-300 border border-transparent'
              }`}
            >
              <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${isSelected ? 'text-indigo-400' : 'text-slate-400'}`} />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate">{file.name}</div>
                <div className="text-xs text-slate-500 truncate">{file.path}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Code Editor View */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl flex flex-col lg:col-span-3 overflow-hidden shadow-xl">
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-semibold text-white">
                {fileList.find(f => f.id === selectedFile)?.name}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                ({fileList.find(f => f.id === selectedFile)?.path})
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {fileList.find(f => f.id === selectedFile)?.desc}
            </p>
          </div>
          <button
            onClick={() => handleCopy(currentContent, selectedFile)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors border border-slate-700 cursor-pointer"
          >
            {copiedFile === selectedFile ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-indigo-400" />
                <span>Copy Code</span>
              </>
            )}
          </button>
        </div>

        <div className="p-6 bg-slate-950/80 font-mono text-xs sm:text-sm overflow-x-auto text-slate-200 leading-relaxed flex-1">
          <pre className="whitespace-pre">{currentContent}</pre>
        </div>
      </div>
    </div>
  );
};
