import React, { useState } from 'react';
import JSZip from 'jszip';
import { initialIsoConfig, initialPackages, generateProjectFiles } from './data/defaultFiles';
import { IsoConfig, PackageItem } from './types';
import { Navbar } from './components/Navbar';
import { FileExplorer } from './components/FileExplorer';
import { PackageManager } from './components/PackageManager';
import { IsoConfigurator } from './components/IsoConfigurator';
import { SecurityWineConfig } from './components/SecurityWineConfig';
import { BuildSimulator } from './components/BuildSimulator';
import { AiAssistant } from './components/AiAssistant';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('files');
  const [config, setConfig] = useState<IsoConfig>(initialIsoConfig);
  const [packages, setPackages] = useState<PackageItem[]>(initialPackages);
  const [securityScript, setSecurityScript] = useState<string>(
    `#!/bin/bash\nufw default deny incoming\nufw default allow outgoing\nufw enable\nfreshclam\necho "Sicherheitssysteme aktiv."`
  );
  const [copiedPs1, setCopiedPs1] = useState(false);

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

  const handleDownloadZip = async () => {
    const zip = new JSZip();

    zip.file('build_iso.sh', files.buildIsoSh);
    zip.file('setup.ps1', files.setupPs1);

    const wineOsFolder = zip.folder(`${config.installDir}_wine_os`);
    if (wineOsFolder) {
      wineOsFolder.file('profiledef.sh', files.profiledefSh);
      wineOsFolder.file('packages.x86_64', files.packages);
      wineOsFolder.file('pacman.conf', files.pacmanConf);

      const airootfsRoot = wineOsFolder.folder('airootfs/root');
      if (airootfsRoot) {
        airootfsRoot.file('security_setup.sh', files.securitySetupSh);
      }
    }

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = `arch-${config.isoName}-kit.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onDownloadZip={handleDownloadZip}
        copied={copiedPs1}
        onCopyPs1={handleCopyPs1}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'files' && <FileExplorer files={files} />}
        {activeTab === 'packages' && <PackageManager packages={packages} setPackages={setPackages} />}
        {activeTab === 'config' && <IsoConfigurator config={config} setConfig={setConfig} />}
        {activeTab === 'security' && (
          <SecurityWineConfig
            securityScript={securityScript}
            setSecurityScript={setSecurityScript}
          />
        )}
        {activeTab === 'simulator' && <BuildSimulator />}
        {activeTab === 'ai' && <AiAssistant />}
      </main>
    </div>
  );
}
