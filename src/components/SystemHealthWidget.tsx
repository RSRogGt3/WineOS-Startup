import React, { useState, useEffect, useMemo } from 'react';
import {
  HardDrive,
  Cpu,
  Activity,
  Gauge,
  Layers,
  Zap,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Server,
  Sparkles,
} from 'lucide-react';
import { IsoConfig, PackageItem } from '../types';

interface SystemHealthWidgetProps {
  config: IsoConfig;
  packages: PackageItem[];
}

export type SimulatedWorkload = 'idle' | 'wine_gaming' | 'mkarchiso_build' | 'stress_test';

export const SystemHealthWidget: React.FC<SystemHealthWidgetProps> = ({
  config,
  packages,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [workload, setWorkload] = useState<SimulatedWorkload>('idle');
  const [simulatedJitter, setSimulatedJitter] = useState(0);

  // Periodic subtle jitter to make simulated live metrics feel responsive and authentic
  useEffect(() => {
    const interval = setInterval(() => {
      setSimulatedJitter(Math.sin(Date.now() / 1500) * 1.5);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  // Compute Disk Usage based on selected Arch Wine packages and base OS
  const diskMetrics = useMemo(() => {
    const enabledPackages = packages.filter((p) => p.enabled);
    const packagesDownloadMB = enabledPackages.reduce((acc, p) => acc + (p.sizeMB || 0), 0);
    // Uncompressed installation ratio ~2.4x on Arch Linux
    const packagesInstalledMB = Math.round(packagesDownloadMB * 2.4);

    const baseArchMB = 850; // Minimal Arch Linux base
    const winePrefixesMB = 720; // Default WINEPREFIX + Proton + DXVK cache
    const systemdLogsMB = 120; // Logs & system runtime state
    const kernelModulesMB = 240; // Linux Zen/LTS + Headers

    const totalUsedMB = baseArchMB + packagesInstalledMB + winePrefixesMB + systemdLogsMB + kernelModulesMB;
    const totalUsedGB = +(totalUsedMB / 1024).toFixed(2);
    
    // Virtual Target Root Drive Size (32.0 GB target partition / USB)
    const totalCapacityGB = 32.0;
    const freeGB = +(totalCapacityGB - totalUsedGB).toFixed(2);
    const diskUsagePercent = Math.min(Math.round((totalUsedGB / totalCapacityGB) * 100), 100);

    // Compressed ISO SquashFS size estimation (approx ~35% of total uncompressed rootfs)
    const estimatedIsoMB = Math.round(totalUsedMB * 0.38);
    const estimatedIsoGB = +(estimatedIsoMB / 1024).toFixed(2);

    return {
      enabledCount: enabledPackages.length,
      packagesDownloadMB,
      packagesInstalledMB,
      totalUsedMB,
      totalUsedGB,
      freeGB,
      totalCapacityGB,
      diskUsagePercent,
      estimatedIsoMB,
      estimatedIsoGB,
    };
  }, [packages]);

  // Compute Simulated Memory Load (RAM: 16.0 GB total system budget)
  const memoryMetrics = useMemo(() => {
    const totalRamGB = 16.0;
    let baseRamGB = 1.1; // Base Arch Wine OS idle
    let zramCompressedGB = 0.2;
    let cpuLoadPercent = 3;

    if (workload === 'idle') {
      baseRamGB = 1.2 + (simulatedJitter * 0.05);
      cpuLoadPercent = Math.max(2, Math.round(4 + simulatedJitter));
    } else if (workload === 'wine_gaming') {
      baseRamGB = 5.8 + (simulatedJitter * 0.2);
      zramCompressedGB = 1.1;
      cpuLoadPercent = Math.max(25, Math.round(52 + simulatedJitter * 3));
    } else if (workload === 'mkarchiso_build') {
      baseRamGB = 8.4 + (simulatedJitter * 0.35);
      zramCompressedGB = 2.4;
      cpuLoadPercent = Math.max(60, Math.round(84 + simulatedJitter * 4));
    } else if (workload === 'stress_test') {
      baseRamGB = 13.2 + (simulatedJitter * 0.2);
      zramCompressedGB = 3.8;
      cpuLoadPercent = Math.max(85, Math.round(96 + simulatedJitter * 2));
    }

    const usedRamGB = +Math.max(0.5, Math.min(totalRamGB, baseRamGB)).toFixed(2);
    const freeRamGB = +(totalRamGB - usedRamGB).toFixed(2);
    const ramUsagePercent = Math.min(Math.round((usedRamGB / totalRamGB) * 100), 100);

    return {
      totalRamGB,
      usedRamGB,
      freeRamGB,
      ramUsagePercent,
      zramCompressedGB,
      cpuLoadPercent: Math.min(100, Math.max(1, cpuLoadPercent)),
    };
  }, [workload, simulatedJitter]);

  // Helper for status colors
  const getProgressColor = (percent: number) => {
    if (percent > 85) return 'bg-rose-500 text-rose-400';
    if (percent > 65) return 'bg-amber-500 text-amber-400';
    return 'bg-emerald-500 text-emerald-400';
  };

  return (
    <div className="mb-6 bg-slate-900/95 border border-slate-800 rounded-2xl shadow-xl overflow-hidden transition-all duration-200">
      {/* Header Banner */}
      <div className="px-5 py-3.5 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-slate-900 via-slate-900/90 to-indigo-950/30">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shadow-md shadow-indigo-500/10">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-bold text-white tracking-tight flex items-center space-x-2">
                <span>System Health &amp; Resource Monitor</span>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                  Arch Live
                </span>
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              Echtzeit-Analyse von Festplattenbelegung, SquashFS-Größe und simulierter Speicherauslastung
            </p>
          </div>
        </div>

        {/* Quick controls: Workload selector & collapse */}
        <div className="flex items-center space-x-2.5">
          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2 hidden sm:inline">
              Workload:
            </span>
            <button
              type="button"
              onClick={() => setWorkload('idle')}
              className={`px-2.5 py-1 rounded-lg font-semibold text-xs transition-all cursor-pointer ${
                workload === 'idle'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              Idle
            </button>
            <button
              type="button"
              onClick={() => setWorkload('wine_gaming')}
              className={`px-2.5 py-1 rounded-lg font-semibold text-xs transition-all cursor-pointer ${
                workload === 'wine_gaming'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              Wine / DXVK
            </button>
            <button
              type="button"
              onClick={() => setWorkload('mkarchiso_build')}
              className={`px-2.5 py-1 rounded-lg font-semibold text-xs transition-all cursor-pointer ${
                workload === 'mkarchiso_build'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              mkarchiso
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer border border-slate-800"
            title={isCollapsed ? 'Widget aufklappen' : 'Widget minimieren'}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Resource Progress Bars */}
      {!isCollapsed && (
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-150">
          {/* Card 1: Disk Usage (Rootfs + Wine + Packages) */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-3 relative overflow-hidden group hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-bold text-white">
                <HardDrive className="w-4 h-4 text-blue-400" />
                <span>Disk-Belegung (Rootfs)</span>
              </div>
              <span className="text-xs font-mono font-bold text-blue-400">
                {diskMetrics.diskUsagePercent}%
              </span>
            </div>

            {/* Disk Progress Bar */}
            <div className="space-y-1.5">
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    diskMetrics.diskUsagePercent > 80 ? 'bg-rose-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${diskMetrics.diskUsagePercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>{diskMetrics.totalUsedGB} GB belegt</span>
                <span>{diskMetrics.freeGB} GB frei</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[10px] text-slate-400">
              <span>Zielpartition: {diskMetrics.totalCapacityGB} GB</span>
              <span className="text-indigo-300 font-semibold">{diskMetrics.enabledCount} Pakete aktiv</span>
            </div>
          </div>

          {/* Card 2: Simulated RAM / Memory Load */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-3 relative overflow-hidden group hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-bold text-white">
                <Gauge className="w-4 h-4 text-indigo-400" />
                <span>RAM-Auslastung (Simuliert)</span>
              </div>
              <span className="text-xs font-mono font-bold text-indigo-400">
                {memoryMetrics.ramUsagePercent}%
              </span>
            </div>

            {/* RAM Progress Bar */}
            <div className="space-y-1.5">
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    memoryMetrics.ramUsagePercent > 80
                      ? 'bg-rose-500'
                      : memoryMetrics.ramUsagePercent > 50
                      ? 'bg-amber-500'
                      : 'bg-indigo-500'
                  }`}
                  style={{ width: `${memoryMetrics.ramUsagePercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>{memoryMetrics.usedRamGB} GB genutzt</span>
                <span>{memoryMetrics.freeRamGB} GB frei</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[10px] text-slate-400">
              <span>ZRAM Swap: {memoryMetrics.zramCompressedGB} GB</span>
              <span className="text-indigo-300 font-semibold">16.0 GB System-RAM</span>
            </div>
          </div>

          {/* Card 3: CPU Load & Core Utilization */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-3 relative overflow-hidden group hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-bold text-white">
                <Cpu className="w-4 h-4 text-emerald-400" />
                <span>CPU &amp; Scheduler Load</span>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400">
                {memoryMetrics.cpuLoadPercent}%
              </span>
            </div>

            {/* CPU Progress Bar */}
            <div className="space-y-1.5">
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    memoryMetrics.cpuLoadPercent > 80
                      ? 'bg-rose-500'
                      : memoryMetrics.cpuLoadPercent > 50
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${memoryMetrics.cpuLoadPercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>Governor: performance</span>
                <span>Kernel: Linux Zen</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[10px] text-slate-400">
              <span>Wine Esync / Fsync: Aktiv</span>
              <span className="text-emerald-400 font-semibold">Ready</span>
            </div>
          </div>

          {/* Card 4: SquashFS ISO Compressed Target */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-3 relative overflow-hidden group hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-bold text-white">
                <Layers className="w-4 h-4 text-amber-400" />
                <span>ISO SquashFS Schätzung</span>
              </div>
              <span className="text-xs font-mono font-bold text-amber-400">
                {diskMetrics.estimatedIsoGB} GB
              </span>
            </div>

            {/* ISO Target Bar (relative to 4.7 GB single-layer DVD / USB limit) */}
            <div className="space-y-1.5">
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
                <div
                  className="h-full rounded-full bg-amber-500 transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.round((diskMetrics.estimatedIsoMB / 4700) * 100))}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>~{diskMetrics.estimatedIsoMB} MB komprimiert</span>
                <span>USB/DVD Limit: 4.7 GB</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[10px] text-slate-400">
              <span>Format: XZ/ZSTD SquashFS</span>
              <span className="text-amber-400 font-semibold font-mono">Zero-Tempfiles</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
