import React, { useState, useEffect, useRef } from 'react';
import { IsoConfig, PackageItem } from '../types';
import {
  Sliders,
  Disc,
  ShieldCheck,
  Save,
  RotateCcw,
  Clock,
  CheckCircle2,
  AlertCircle,
  HardDrive,
  History,
  Trash2,
  Download,
  Upload,
  Check,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

interface IsoConfiguratorProps {
  config: IsoConfig;
  setConfig: React.Dispatch<React.SetStateAction<IsoConfig>>;
  packages?: PackageItem[];
  setPackages?: React.Dispatch<React.SetStateAction<PackageItem[]>>;
  securityScript?: string;
  setSecurityScript?: React.Dispatch<React.SetStateAction<string>>;
}

interface BackupSnapshot {
  id: string;
  timestamp: string;
  isoName: string;
  isoVersion: string;
  packageCount: number;
  config: IsoConfig;
  packages?: PackageItem[];
  securityScript?: string;
  sizeBytes: number;
}

export const IsoConfigurator: React.FC<IsoConfiguratorProps> = ({
  config,
  setConfig,
  packages = [],
  setPackages,
  securityScript = '',
  setSecurityScript,
}) => {
  const [justSaved, setJustSaved] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [snapshots, setSnapshots] = useState<BackupSnapshot[]>([]);
  const [lastSavedTime, setLastSavedTime] = useState<string>(
    config.lastBackupTimestamp || new Date().toLocaleTimeString()
  );
  const [saveCount, setSaveCount] = useState(0);
  const [storageEstimateKB, setStorageEstimateKB] = useState<number>(0);

  // References to keep latest values in periodic interval without stale closures
  const configRef = useRef(config);
  const packagesRef = useRef(packages);
  const securityScriptRef = useRef(securityScript);

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  useEffect(() => {
    packagesRef.current = packages;
  }, [packages]);

  useEffect(() => {
    securityScriptRef.current = securityScript;
  }, [securityScript]);

  const isAutoBackupEnabled = config.autoBackup !== false;
  const backupIntervalSec = config.autoBackupIntervalSec || 30;

  // Load existing snapshots from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('arch_wine_os_auto_snapshots');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setSnapshots(parsed);
        }
      }
    } catch (err) {
      console.warn('Failed to load auto snapshots from localStorage:', err);
    }
  }, []);

  // Compute storage size
  useEffect(() => {
    try {
      const raw = localStorage.getItem('arch_wine_os_auto_backup') || '';
      const snapshotsRaw = localStorage.getItem('arch_wine_os_auto_snapshots') || '';
      const totalBytes = new Blob([raw, snapshotsRaw]).size;
      setStorageEstimateKB(Math.round(totalBytes / 1024 * 10) / 10);
    } catch (e) {
      // ignore
    }
  }, [saveCount, snapshots]);

  // Core save function
  const executeBackup = (isManual = false) => {
    try {
      const currentConfig = configRef.current;
      const currentPackages = packagesRef.current;
      const currentSecurity = securityScriptRef.current;

      const now = new Date();
      const timeString = now.toLocaleTimeString();
      const dateString = now.toLocaleDateString();

      const backupPayload = {
        config: currentConfig,
        packages: currentPackages,
        securityScript: currentSecurity,
        timestamp: `${dateString} ${timeString}`,
      };

      const serialized = JSON.stringify(backupPayload);
      localStorage.setItem('arch_wine_os_auto_backup', serialized);

      // Create snapshot entry
      const newSnapshot: BackupSnapshot = {
        id: `snap-${Date.now()}`,
        timestamp: `${dateString} ${timeString}`,
        isoName: currentConfig.isoName,
        isoVersion: currentConfig.isoVersion,
        packageCount: currentPackages.filter(p => p.enabled).length,
        config: currentConfig,
        packages: currentPackages,
        securityScript: currentSecurity,
        sizeBytes: new Blob([serialized]).size,
      };

      setSnapshots(prev => {
        // Keep up to 10 most recent snapshots
        const updated = [newSnapshot, ...prev.filter(s => s.id !== newSnapshot.id)].slice(0, 10);
        try {
          localStorage.setItem('arch_wine_os_auto_snapshots', JSON.stringify(updated));
        } catch (e) {
          console.warn('LocalStorage limit reached for snapshots:', e);
        }
        return updated;
      });

      setLastSavedTime(timeString);
      setSaveCount(c => c + 1);

      if (isManual) {
        setJustSaved(true);
        setTimeout(() => setJustSaved(false), 2000);
      }

      // Update config's last backup timestamp
      setConfig(prev => ({
        ...prev,
        lastBackupTimestamp: `${dateString} ${timeString}`,
      }));
    } catch (err) {
      console.error('Auto-backup execution failed:', err);
    }
  };

  // Periodic Auto-Backup Interval Effect
  useEffect(() => {
    if (!isAutoBackupEnabled) return;

    const intervalMs = Math.max(10, backupIntervalSec) * 1000;
    const intervalId = setInterval(() => {
      executeBackup(false);
    }, intervalMs);

    return () => clearInterval(intervalId);
  }, [isAutoBackupEnabled, backupIntervalSec]);

  const handleChange = (field: keyof IsoConfig, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleToggleAutoBackup = () => {
    const nextVal = !isAutoBackupEnabled;
    handleChange('autoBackup', nextVal);
    if (nextVal) {
      // Trigger instant save on enable
      setTimeout(() => executeBackup(true), 100);
    }
  };

  const handleRestoreSnapshot = (snapshot: BackupSnapshot) => {
    if (window.confirm(`Möchten Sie den Snapshot vom ${snapshot.timestamp} wiederherstellen? Aktuelle ungespeicherte Änderungen werden überschrieben.`)) {
      setConfig(snapshot.config);
      if (setPackages && snapshot.packages) {
        setPackages(snapshot.packages);
      }
      if (setSecurityScript && snapshot.securityScript) {
        setSecurityScript(snapshot.securityScript);
      }
      setShowHistoryModal(false);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2500);
    }
  };

  const handleClearSnapshots = () => {
    if (window.confirm('Möchten Sie alle gespeicherten Snapshots aus dem Browser-Speicher löschen?')) {
      localStorage.removeItem('arch_wine_os_auto_snapshots');
      localStorage.removeItem('arch_wine_os_auto_backup');
      setSnapshots([]);
      setStorageEstimateKB(0);
    }
  };

  const availableBootmodes = [
    { id: 'bios.syslinux.mbr', label: 'BIOS MBR (Syslinux)' },
    { id: 'bios.syslinux.eltorito', label: 'BIOS El Torito (Syslinux)' },
    { id: 'uefi-x64.systemd-boot.esp', label: 'UEFI x64 (systemd-boot ESP)' },
    { id: 'uefi-x64.systemd-boot.eltorito', label: 'UEFI x64 El Torito (systemd-boot)' },
  ];

  const toggleBootmode = (mode: string) => {
    if (config.bootmodes.includes(mode)) {
      if (config.bootmodes.length === 1) return; // Keep at least one
      handleChange(
        'bootmodes',
        config.bootmodes.filter(m => m !== mode)
      );
    } else {
      handleChange('bootmodes', [...config.bootmodes, mode]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Auto-Backup Banner / Control Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div
              className={`p-2.5 rounded-xl border transition-colors shrink-0 mt-0.5 ${
                isAutoBackupEnabled
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-slate-800/80 border-slate-700 text-slate-500'
              }`}
            >
              <Save className="w-5 h-5" />
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h3 className="text-sm font-bold text-white">
                  Automatisches Browser-Backup (Local Storage)
                </h3>
                {isAutoBackupEnabled ? (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-0.5" />
                    <span>Aktiv (alle {backupIntervalSec}s)</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                    <span>Deaktiviert</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
                Sichert Ihre ISO-Konfiguration, aktivierte Pakete und Sicherheits-Skripte periodisch im Browser-Speicher (<code className="text-indigo-300 font-mono text-[11px]">localStorage</code>), um versehentlichen Datenverlust beim Neuladen zu verhindern.
              </p>
            </div>
          </div>

          {/* Controls: Toggle, Interval, Manual Backup & Snapshots */}
          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-center">
            {/* Auto-Backup Toggle Button */}
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-1">
              <button
                type="button"
                onClick={handleToggleAutoBackup}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  isAutoBackupEnabled
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    isAutoBackupEnabled ? 'bg-white' : 'bg-slate-600'
                  }`}
                />
                <span>{isAutoBackupEnabled ? 'Auto-Backup AN' : 'Auto-Backup AUS'}</span>
              </button>
            </div>

            {/* Interval Selector */}
            {isAutoBackupEnabled && (
              <div className="flex items-center space-x-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-slate-400 text-[11px]">Intervall:</span>
                <select
                  value={backupIntervalSec}
                  onChange={e => handleChange('autoBackupIntervalSec', Number(e.target.value))}
                  className="bg-transparent text-xs text-indigo-400 font-semibold focus:outline-none cursor-pointer"
                >
                  <option value={15} className="bg-slate-900 text-white">15s</option>
                  <option value={30} className="bg-slate-900 text-white">30s</option>
                  <option value={60} className="bg-slate-900 text-white">60s</option>
                  <option value={120} className="bg-slate-900 text-white">2 Min</option>
                  <option value={300} className="bg-slate-900 text-white">5 Min</option>
                </select>
              </div>
            )}

            {/* Manual Save Now Button */}
            <button
              type="button"
              onClick={() => executeBackup(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-sm shadow-indigo-600/20"
            >
              {justSaved ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                  <span className="text-emerald-300">Gespeichert!</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Jetzt sichern</span>
                </>
              )}
            </button>

            {/* Snapshot History Button */}
            <button
              type="button"
              onClick={() => setShowHistoryModal(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors border border-slate-700 cursor-pointer"
            >
              <History className="w-3.5 h-3.5 text-indigo-400" />
              <span>Snapshots ({snapshots.length})</span>
            </button>
          </div>
        </div>

        {/* Footer info strip */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 mt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
          <div className="flex items-center space-x-3">
            <span className="flex items-center space-x-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>Letzter Speicherpunkt: <strong className="text-slate-200 font-mono">{lastSavedTime}</strong></span>
            </span>
            <span>•</span>
            <span>Gespeicherte Snapshots: <strong className="text-slate-200 font-mono">{snapshots.length}</strong></span>
          </div>
          <div className="flex items-center space-x-2 text-slate-500">
            <HardDrive className="w-3 h-3" />
            <span>Geschätzter Speicherverbrauch: <strong className="text-slate-400 font-mono">{storageEstimateKB} KB</strong></span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form Settings */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 lg:col-span-2 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <Sliders className="w-5 h-5 text-indigo-400" />
              <span>ISO Profile Definition (profiledef.sh)</span>
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Configure the Archiso profile properties, labels, and output formatting.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                ISO Name
              </label>
              <input
                type="text"
                value={config.isoName}
                onChange={e => handleChange('isoName', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                ISO Label
              </label>
              <input
                type="text"
                value={config.isoLabel}
                onChange={e => handleChange('isoLabel', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                ISO Publisher
              </label>
              <input
                type="text"
                value={config.isoPublisher}
                onChange={e => handleChange('isoPublisher', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Application Name
              </label>
              <input
                type="text"
                value={config.isoApplication}
                onChange={e => handleChange('isoApplication', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Version
              </label>
              <input
                type="text"
                value={config.isoVersion}
                onChange={e => handleChange('isoVersion', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Architecture
              </label>
              <select
                value={config.arch}
                onChange={e => handleChange('arch', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
              >
                <option value="x86_64">x86_64</option>
                <option value="aarch64">aarch64</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Compression Algorithm
              </label>
              <select
                value={config.compression}
                onChange={e => handleChange('compression', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
              >
                <option value="zstd">zstd (Fast & High Ratio)</option>
                <option value="gzip">gzip (Standard)</option>
                <option value="xz">xz (Maximum Compression)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                SquashFS Block Size
              </label>
              <select
                value={config.blockSize}
                onChange={e => handleChange('blockSize', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
              >
                <option value="1M">1M (Recommended for Live ISO)</option>
                <option value="512K">512K</option>
                <option value="256K">256K</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bootmodes Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Disc className="w-4 h-4 text-indigo-400" />
            <span>Bootmodes</span>
          </h3>
          <p className="text-xs text-slate-400">
            Select legacy BIOS and UEFI bootloaders to include in the ISO image.
          </p>

          <div className="space-y-3 pt-2">
            {availableBootmodes.map(mode => {
              const isSelected = config.bootmodes.includes(mode.id);
              return (
                <div
                  key={mode.id}
                  onClick={() => toggleBootmode(mode.id)}
                  className={`p-3 rounded-lg border text-xs cursor-pointer transition-all flex items-start justify-between ${
                    isSelected
                      ? 'border-indigo-500/50 bg-indigo-950/20 text-white font-medium'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="font-mono">{mode.label}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{mode.id}</div>
                  </div>
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 ${
                      isSelected ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-slate-700'
                    }`}
                  >
                    {isSelected && <span className="text-[10px] font-bold">✓</span>}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 mt-4">
            <div className="flex items-center space-x-2 text-emerald-400 text-xs font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>Ready for mkarchiso</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              All configured parameters instantly populate `profiledef.sh` and `build_iso.sh`.
            </p>
          </div>
        </div>
      </div>

      {/* Snapshots / Backup History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-xl w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-indigo-500/10 border border-indigo-500/30 rounded-lg text-indigo-400">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Gespeicherte Browser-Snapshots</h3>
                  <p className="text-xs text-slate-400">Wiederherstellung vorheriger Konfigurationen</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="text-slate-400 hover:text-white text-xs font-semibold p-1"
              >
                Schließen
              </button>
            </div>

            {snapshots.length === 0 ? (
              <div className="p-8 text-center bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <HardDrive className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400">Bisher sind keine Snapshots vorhanden.</p>
                <button
                  type="button"
                  onClick={() => {
                    executeBackup(true);
                  }}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
                >
                  Ersten Snapshot jetzt erstellen
                </button>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {snapshots.map(snap => (
                  <div
                    key={snap.id}
                    className="p-3.5 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                  >
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-white font-mono">{snap.isoName} v{snap.isoVersion}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/60 font-mono">
                          {snap.packageCount} Pakete
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>{snap.timestamp}</span>
                        <span>•</span>
                        <span className="font-mono text-slate-500">{Math.round(snap.sizeBytes / 1024 * 10) / 10} KB</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRestoreSnapshot(snap)}
                      className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 shadow-sm"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Wiederherstellen</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
              <button
                type="button"
                onClick={handleClearSnapshots}
                className="flex items-center space-x-1 text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Alle Snapshots löschen</span>
              </button>

              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium transition-colors"
              >
                Fertig
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
