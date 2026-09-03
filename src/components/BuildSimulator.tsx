import React, { useState, useEffect, useMemo } from 'react';
import { Terminal, Play, RefreshCw, CheckCircle2, AlertCircle, Layers, Sparkles, HardDrive, Cpu } from 'lucide-react';
import { PackageItem, IsoConfig } from '../types';
import { initialPackages, initialIsoConfig } from '../data/defaultFiles';
import { IsoSizeDashboard } from './IsoSizeDashboard';

interface BuildSimulatorProps {
  packages?: PackageItem[];
  config?: IsoConfig;
  setPackages?: React.Dispatch<React.SetStateAction<PackageItem[]>>;
}

export const BuildSimulator: React.FC<BuildSimulatorProps> = ({
  packages = initialPackages,
  config = initialIsoConfig,
  setPackages,
}) => {
  const [isBuilding, setIsBuilding] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [buildComplete, setBuildComplete] = useState(false);
  const [targetSizeMB, setTargetSizeMB] = useState<number>(config.targetSizeMB || 2048);

  const enabledPackages = useMemo(() => packages.filter(p => p.enabled), [packages]);
  const totalUncompressedMB = useMemo(
    () => enabledPackages.reduce((sum, p) => sum + (p.sizeMB || 30), 0),
    [enabledPackages]
  );
  const compressionRatio = config.compression === 'xz' ? 0.33 : config.compression === 'gzip' ? 0.45 : 0.38;
  const compressedSquashFsMB = Math.round(totalUncompressedMB * compressionRatio);
  const totalIsoEstMB = compressedSquashFsMB + 65;

  const handleTogglePackage = (packageName: string) => {
    if (setPackages) {
      setPackages(prev =>
        prev.map(p => (p.name === packageName ? { ...p, enabled: !p.enabled } : p))
      );
    }
  };

  const startBuild = () => {
    setIsBuilding(true);
    setLogs([
      'Initializing mkarchiso build environment...',
      `Target ISO Name: ${config.isoName}.iso (Label: ${config.isoLabel})`,
      `Target Media Budget: ${targetSizeMB} MB`,
    ]);
    setProgress(5);
    setBuildComplete(false);
  };

  useEffect(() => {
    if (!isBuilding) return;

    const samplePackageNames = enabledPackages.slice(0, 5).map(p => p.name).join(', ') +
      (enabledPackages.length > 5 ? ` +${enabledPackages.length - 5} more` : '');

    const steps = [
      { text: `Setting up clean working directory ./.build_work/${config.installDir} with auto-cleanup trap...`, progress: 15 },
      { text: `Parsing pacman.conf & setting up multilib repository...`, progress: 30 },
      {
        text: `Installing ${enabledPackages.length} packages (${samplePackageNames}) [Installed size: ${totalUncompressedMB} MB]...`,
        progress: 55,
      },
      {
        text: 'Injecting airootfs security & update maintenance scripts (UFW firewall + ClamAV + update_system.sh + update_drivers.sh)...',
        progress: 75,
      },
      {
        text: `Generating SquashFS image using ${config.compression} (${config.blockSize} block size)... Compressed payload: ${compressedSquashFsMB} MB (~${Math.round(compressionRatio * 100)}% ratio).`,
        progress: 90,
      },
      {
        text: `Building hybrid ISO (UEFI + BIOS MBR). Final ISO Size: ${totalIsoEstMB} MB (${((totalIsoEstMB / targetSizeMB) * 100).toFixed(1)}% of ${targetSizeMB} MB target).`,
        progress: 96,
      },
      {
        text: `Fertig! ISO successfully built and saved to ./out/${config.isoName}.iso`,
        progress: 100,
      },
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        const step = steps[currentStep];
        setLogs(prev => [...prev, step.text]);
        setProgress(step.progress);
        currentStep++;
      } else {
        clearInterval(interval);
        setIsBuilding(false);
        setBuildComplete(true);
      }
    }, 1100);

    return () => clearInterval(interval);
  }, [isBuilding, config, enabledPackages, totalUncompressedMB, compressedSquashFsMB, totalIsoEstMB, targetSizeMB, compressionRatio]);

  return (
    <div className="space-y-8">
      {/* 1. Recharts-based Size Distribution & ISO Capacity Dashboard */}
      <IsoSizeDashboard
        packages={packages}
        config={config}
        onTogglePackage={setPackages ? handleTogglePackage : undefined}
        targetSizeMB={targetSizeMB}
        onTargetSizeChange={setTargetSizeMB}
      />

      {/* 2. Interactive Terminal Build Simulation */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <Terminal className="w-5 h-5 text-indigo-400" />
              <span>Interactive mkarchiso Build Engine Simulator</span>
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Test and simulate executing <code className="text-slate-300 font-mono bg-slate-950 px-1.5 py-0.5 rounded text-xs">./build_iso.sh</code> (Zero-Tempfile Execution with automatic workspace cleanup).
            </p>
          </div>

          <button
            onClick={startBuild}
            disabled={isBuilding}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-lg cursor-pointer ${
              isBuilding
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
            }`}
          >
            {isBuilding ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            <span>{isBuilding ? 'Compiling ISO...' : 'Run Build Simulation'}</span>
          </button>
        </div>

        {/* Progress Bar */}
        {(isBuilding || buildComplete || logs.length > 0) && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-400 font-mono">
              <span className="flex items-center space-x-1.5">
                <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                <span>Build Execution Progress</span>
              </span>
              <span className="font-bold text-white">{progress}%</span>
            </div>
            <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
              <div
                className={`h-full transition-all duration-500 ${
                  buildComplete ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : 'bg-indigo-600'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Terminal Output */}
        <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 font-mono text-xs sm:text-sm text-slate-300 h-80 overflow-y-auto space-y-2 shadow-inner">
          <div className="text-slate-500 flex items-center space-x-2">
            <span>$</span>
            <span>./build_iso.sh</span>
          </div>
          {logs.map((log, index) => (
            <div key={index} className="flex items-start space-x-2">
              <span className="text-indigo-400 select-none">&gt;</span>
              <span
                className={
                  log.includes('Fertig!')
                    ? 'text-emerald-400 font-bold'
                    : log.includes('SquashFS')
                    ? 'text-indigo-300 font-semibold'
                    : 'text-slate-200'
                }
              >
                {log}
              </span>
            </div>
          ))}
          {isBuilding && (
            <div className="flex items-center space-x-2 text-slate-500 animate-pulse">
              <span>_</span>
            </div>
          )}
        </div>

        {buildComplete && (
          <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-emerald-300">
            <div className="flex items-center space-x-3">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
              <div className="text-sm">
                <span className="font-semibold">ISO Build Completed!</span> Output image size: <span className="font-mono font-bold text-white">{totalIsoEstMB} MB</span> ready in <code className="bg-slate-900 px-1.5 py-0.5 rounded text-xs font-mono">./out/{config.isoName}.iso</code>.
              </div>
            </div>
            <span className="text-xs bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-2.5 py-1 rounded-full font-mono font-semibold">
              Fit: {((totalIsoEstMB / targetSizeMB) * 100).toFixed(1)}% of {targetSizeMB} MB
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
