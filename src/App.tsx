import React, { useState, useEffect } from 'react';
import JSZip from 'jszip';
import { initialIsoConfig, initialPackages, generateProjectFiles } from './data/defaultFiles';
import { IsoConfig, PackageItem } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import { Navbar } from './components/Navbar';
import { FileExplorer } from './components/FileExplorer';
import { PackageManager } from './components/PackageManager';
import { IsoConfigurator } from './components/IsoConfigurator';
import { SecurityWineConfig } from './components/SecurityWineConfig';
import { BuildSimulator } from './components/BuildSimulator';
import { AiAssistant } from './components/AiAssistant';
import { GoogleTasksManager } from './components/GoogleTasksManager';
import { UpdateManager } from './components/UpdateManager';
import { DriveUploadModal } from './components/DriveUploadModal';
import { SystemHealthWidget } from './components/SystemHealthWidget';
import { uploadZipToDrive, DriveUploadResponse } from './services/driveApi';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('files');
  const [theme, setTheme] = useLocalStorage<'dark' | 'light'>('arch_wine_os_theme', 'dark');
  const [config, setConfig] = useLocalStorage<IsoConfig>('arch_wine_os_config', initialIsoConfig);
  const [packages, setPackages] = useLocalStorage<PackageItem[]>('arch_wine_os_packages', initialPackages);
  const [securityScript, setSecurityScript] = useLocalStorage<string>(
    'arch_wine_os_security_script',
    `#!/bin/bash\nufw default deny incoming\nufw default allow outgoing\nufw enable\nfreshclam\necho "Sicherheitssysteme aktiv."`
  );
  const [copiedPs1, setCopiedPs1] = useState(false);

  // Google Drive Upload State
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [isUploadingDrive, setIsUploadingDrive] = useState(false);
  const [driveUploadResult, setDriveUploadResult] = useState<DriveUploadResponse | null>(null);
  const [driveError, setDriveError] = useState<string | null>(null);

  // Sync theme with document root classes and attributes for optimal accessibility & styling
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Generate project files dynamically based on state
  const generatedFiles = generateProjectFiles(config, packages);
  const files = {
    ...generatedFiles,
    securitySetupSh: securityScript,
  };

  const handleCopyPs1 = () => {
    navigator.clipboard.writeText(files.setupPs1);
    setCopiedPs1(true);
    setTimeout(() => setCopiedPs1(false), 2500);
  };

  const buildZipBlob = async (): Promise<Blob> => {
    const zip = new JSZip();

    zip.file('build_iso.sh', files.buildIsoSh);
    zip.file('setup.ps1', files.setupPs1);
    zip.file('update_system.sh', files.updateSystemSh);
    zip.file('update_drivers.sh', files.updateDriversSh);

    const wineOsFolder = zip.folder(`${config.installDir}_wine_os`);
    if (wineOsFolder) {
      wineOsFolder.file('profiledef.sh', files.profiledefSh);
      wineOsFolder.file('packages.x86_64', files.packages);
      wineOsFolder.file('pacman.conf', files.pacmanConf);

      const airootfsRoot = wineOsFolder.folder('airootfs/root');
      if (airootfsRoot) {
        airootfsRoot.file('security_setup.sh', files.securitySetupSh);
      }

      const airootfsBin = wineOsFolder.folder('airootfs/usr/local/bin');
      if (airootfsBin) {
        airootfsBin.file('update_system.sh', files.updateSystemSh);
        airootfsBin.file('update_drivers.sh', files.updateDriversSh);
      }

      const airootfsSystemd = wineOsFolder.folder('airootfs/etc/systemd/system');
      if (airootfsSystemd) {
        airootfsSystemd.file('system-update.service', files.systemUpdateService);
        airootfsSystemd.file('system-update.timer', files.systemUpdateTimer);
      }
    }

    return zip.generateAsync({ type: 'blob' });
  };

  const handleDownloadZip = async () => {
    const content = await buildZipBlob();
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = `arch-${config.isoName}-kit.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleOpenDriveModal = () => {
    setDriveError(null);
    setIsDriveModalOpen(true);
  };

  const handleUploadZipToDrive = async (): Promise<DriveUploadResponse> => {
    setIsUploadingDrive(true);
    setDriveError(null);
    try {
      const blob = await buildZipBlob();
      const fileName = `arch-${config.isoName}-kit.zip`;
      const result = await uploadZipToDrive(
        blob,
        fileName,
        `Arch Wine OS ISO Configuration Kit for ${config.isoName} (${packages.length} packages)`
      );
      setDriveUploadResult(result);
      return result;
    } catch (err: any) {
      const msg = err.message || 'Upload to Google Drive failed.';
      setDriveError(msg);
      throw err;
    } finally {
      setIsUploadingDrive(false);
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 selection:bg-indigo-600 selection:text-white ${
        theme === 'light' ? 'bg-slate-50 text-slate-900 light' : 'bg-slate-950 text-slate-100 dark'
      }`}
    >
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onDownloadZip={handleDownloadZip}
        onUploadDrive={handleOpenDriveModal}
        copied={copiedPs1}
        onCopyPs1={handleCopyPs1}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SystemHealthWidget config={config} packages={packages} />

        {activeTab === 'files' && <FileExplorer files={files} />}
        {activeTab === 'packages' && <PackageManager packages={packages} setPackages={setPackages} />}
        {activeTab === 'updates' && <UpdateManager config={config} setConfig={setConfig} />}
        {activeTab === 'config' && (
          <IsoConfigurator
            config={config}
            setConfig={setConfig}
            packages={packages}
            setPackages={setPackages}
            securityScript={securityScript}
            setSecurityScript={setSecurityScript}
          />
        )}
        {activeTab === 'security' && (
          <SecurityWineConfig
            securityScript={securityScript}
            setSecurityScript={setSecurityScript}
          />
        )}
        {activeTab === 'tasks' && <GoogleTasksManager />}
        {activeTab === 'simulator' && (
          <BuildSimulator
            packages={packages}
            config={config}
            setPackages={setPackages}
          />
        )}
        {activeTab === 'ai' && <AiAssistant />}
      </main>

      <DriveUploadModal
        isOpen={isDriveModalOpen}
        onClose={() => setIsDriveModalOpen(false)}
        onUpload={handleUploadZipToDrive}
        fileName={`arch-${config.isoName}-kit.zip`}
        isUploading={isUploadingDrive}
        uploadResult={driveUploadResult}
        error={driveError}
      />
    </div>
  );
}

