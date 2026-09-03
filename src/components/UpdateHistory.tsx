import React, { useState, useMemo } from 'react';
import {
  History,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RotateCcw,
  Terminal,
  Download,
  Copy,
  Check,
  Search,
  Filter,
  Trash2,
  Play,
  ChevronDown,
  ChevronUp,
  Shield,
  Cpu,
  HardDrive,
  Clock,
  Sparkles,
  Package,
  RefreshCw,
  SlidersHorizontal,
  ArrowRight,
  Info,
  Layers,
  FileCode,
} from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { UpdateFrequencyChart } from './UpdateFrequencyChart';

export interface UpdatePackageChange {
  name: string;
  oldVersion: string;
  newVersion: string;
  type: 'core' | 'driver' | 'aur' | 'security' | 'kernel';
}

export interface UpdateLogEntry {
  id: string;
  timestamp: string;
  title: string;
  type: 'full-system' | 'driver' | 'security' | 'kernel' | 'manual';
  status: 'success' | 'warning' | 'failed' | 'rollback';
  durationSec: number;
  packagesUpdated: number;
  kernelBefore: string;
  kernelAfter: string;
  snapshotCreated: boolean;
  snapshotId?: string;
  summary: string;
  logOutput: string;
  packageChanges: UpdatePackageChange[];
  executedBy: string;
}

export const initialUpdateHistory: UpdateLogEntry[] = [
  {
    id: 'upd-20260826-01',
    timestamp: '2026-08-26 18:30:15',
    title: 'Vollständiges System-, Wine- & Kernel-Upgrade',
    type: 'full-system',
    status: 'success',
    durationSec: 84,
    packagesUpdated: 28,
    kernelBefore: '6.10.8-arch1-1',
    kernelAfter: '6.10.9-arch1-1',
    snapshotCreated: true,
    snapshotId: '@pre-upd-20260826-183000',
    executedBy: 'root (sudo pacman / update_system.sh)',
    summary: 'Erfolgreiches Kernel-Upgrade auf 6.10.9, Wine-Staging 9.16 & DXVK 2.4.1. Timeshift-Snapshot gesichert.',
    packageChanges: [
      { name: 'linux', oldVersion: '6.10.8.arch1-1', newVersion: '6.10.9.arch1-1', type: 'kernel' },
      { name: 'linux-headers', oldVersion: '6.10.8.arch1-1', newVersion: '6.10.9.arch1-1', type: 'kernel' },
      { name: 'wine-staging', oldVersion: '9.15-1', newVersion: '9.16-1', type: 'core' },
      { name: 'wine-gecko', oldVersion: '2.47.4-1', newVersion: '2.47.4-2', type: 'core' },
      { name: 'wine-mono', oldVersion: '9.2.0-1', newVersion: '9.3.0-1', type: 'core' },
      { name: 'dxvk-bin', oldVersion: '2.4-1', newVersion: '2.4.1-1', type: 'aur' },
      { name: 'mesa', oldVersion: '24.1.6-1', newVersion: '24.2.0-1', type: 'driver' },
      { name: 'lib32-mesa', oldVersion: '24.1.6-1', newVersion: '24.2.0-1', type: 'driver' },
      { name: 'archlinux-keyring', oldVersion: '20260715-1', newVersion: '20260820-1', type: 'security' },
    ],
    logOutput: `[2026-08-26 18:30:15] === SCHRITT 1: Vorabprüfungen & Snapshot ===
[2026-08-26 18:30:16] [✓] Internetverbindung aktiv.
[2026-08-26 18:30:18] [*] Timeshift Snapshot '@pre-upd-20260826-183000' erfolgreich erstellt (Btrfs subvolume).
[2026-08-26 18:30:20] === SCHRITT 2: Arch Keyring & Spiegelserver ===
[2026-08-26 18:30:24] [*] archlinux-keyring aktualisiert (GPG keys validiert).
[2026-08-26 18:30:31] [*] Reflector: Die 10 schnellsten HTTPS Mirrorlists nach /etc/pacman.d/mirrorlist geschrieben.
[2026-08-26 18:30:35] === SCHRITT 3: Pacman & AUR Upgrade ===
[2026-08-26 18:31:02] [✓] 28 Pakete aktualisiert: linux (6.10.9), wine-staging (9.16), mesa (24.2.0), dxvk (2.4.1).
[2026-08-26 18:31:18] === SCHRITT 4: DKMS Module & Initramfs ===
[2026-08-26 18:31:25] [*] dkms autoinstall: Alle Kernel-Module erfolgreich für 6.10.9-arch1-1 gebaut.
[2026-08-26 18:31:34] [*] mkinitcpio -P: Initial Ramdisk für alle installierten Kernel generiert.
[2026-08-26 18:31:39] === SCHRITT 5: Sicherheits-Audit & Bereinigung ===
[2026-08-26 18:31:40] [✓] arch-audit: 0 bekannte Sicherheitslücken gefunden.
[2026-08-26 18:31:42] [*] paccache: 38 alte Archivdateien gelöscht (1.4 GB freigegeben).
[2026-08-26 18:31:45] [ERFOLG] Update-Prozess in 84s ohne Fehler beendet.`,
  },
  {
    id: 'upd-20260820-02',
    timestamp: '2026-08-20 14:15:02',
    title: 'NVIDIA DKMS & Vulkan Grafiktreiber-Stack Update',
    type: 'driver',
    status: 'success',
    durationSec: 52,
    packagesUpdated: 6,
    kernelBefore: '6.10.8-arch1-1',
    kernelAfter: '6.10.8-arch1-1',
    snapshotCreated: true,
    snapshotId: '@driver-upd-20260820',
    executedBy: 'root (update_drivers.sh)',
    summary: 'Proprietärer NVIDIA 560.35.03 Treiberstack für 64-Bit & 32-Bit (Multilib) kompiliert und verifiziert.',
    packageChanges: [
      { name: 'nvidia-dkms', oldVersion: '555.58.02-1', newVersion: '560.35.03-1', type: 'driver' },
      { name: 'nvidia-utils', oldVersion: '555.58.02-1', newVersion: '560.35.03-1', type: 'driver' },
      { name: 'lib32-nvidia-utils', oldVersion: '555.58.02-1', newVersion: '560.35.03-1', type: 'driver' },
      { name: 'opencl-nvidia', oldVersion: '555.58.02-1', newVersion: '560.35.03-1', type: 'driver' },
      { name: 'lib32-opencl-nvidia', oldVersion: '555.58.02-1', newVersion: '560.35.03-1', type: 'driver' },
      { name: 'nvidia-settings', oldVersion: '555.58.02-1', newVersion: '560.35.03-1', type: 'driver' },
    ],
    logOutput: `[2026-08-20 14:15:02] === Arch Wine OS Hardware & Driver Diagnostics ===
[2026-08-20 14:15:04] [+] NVIDIA GPU erkannt: NVIDIA GeForce RTX 4070 Ti SUPER
[2026-08-20 14:15:06] [*] Aktualisiere NVIDIA DKMS & 32-Bit Multilib Runtimes...
[2026-08-20 14:15:28] [*] Kompiliere nvidia-dkms Modul für Kernel 6.10.8-arch1-1...
[2026-08-20 14:15:42] [*] Generiere Initramfs mit mkinitcpio...
[2026-08-20 14:15:54] [✓] nvidia-smi Test: Treiber Version 560.35.03 geladen. CUDA 12.6 aktiv.`,
  },
  {
    id: 'upd-20260814-03',
    timestamp: '2026-08-14 04:00:10',
    title: 'Wöchentlicher Sicherheits-Patch & ClamAV Definitionen',
    type: 'security',
    status: 'success',
    durationSec: 38,
    packagesUpdated: 4,
    kernelBefore: '6.10.8-arch1-1',
    kernelAfter: '6.10.8-arch1-1',
    snapshotCreated: false,
    executedBy: 'systemd-timer (system-update.timer)',
    summary: 'Automatisierter Sicherheitslauf: OpenSSL & OpenSSH Sicherheits-Patches eingespielt, ClamAV DB aktualisiert.',
    packageChanges: [
      { name: 'openssl', oldVersion: '3.3.1-1', newVersion: '3.3.1-2', type: 'security' },
      { name: 'openssh', oldVersion: '9.8p1-1', newVersion: '9.8p1-2', type: 'security' },
      { name: 'curl', oldVersion: '8.9.0-1', newVersion: '8.9.1-1', type: 'security' },
      { name: 'clamav', oldVersion: '1.3.1-1', newVersion: '1.3.1-2', type: 'security' },
    ],
    logOutput: `[2026-08-14 04:00:10] === Systemd Scheduled Security Maintenance ===
[2026-08-14 04:00:12] [*] arch-audit: 2 Sicherheits-Patches in openssl & curl erkannt.
[2026-08-14 04:00:22] [*] Sicherheits-Updates installiert (pacman -Sy openssl openssh curl clamav).
[2026-08-14 04:00:35] [*] freshclam: ClamAV Antivirus Signatur-Datenbank daily.cvd aktualisiert.
[2026-08-14 04:00:48] [✓] Firewall UFW Status: Aktiv (Gaming & SSH Regeln intakt).`,
  },
  {
    id: 'upd-20260805-04',
    timestamp: '2026-08-05 11:22:45',
    title: 'Automatischer Rollback nach unvollständigem Drittanbieter-AUR-Build',
    type: 'manual',
    status: 'rollback',
    durationSec: 110,
    packagesUpdated: 0,
    kernelBefore: '6.10.7-arch1-1',
    kernelAfter: '6.10.7-arch1-1',
    snapshotCreated: true,
    snapshotId: '@rollback-20260805',
    executedBy: 'root (timeshift --restore)',
    summary: 'AUR-Build schlug fehl; System wurde dank Pre-Update Snapshot fehlerfrei auf den vorherigen Stand zurückgesetzt.',
    packageChanges: [],
    logOutput: `[2026-08-05 11:22:45] [*] Pre-Update Snapshot '@pre-upd-20260805' angelegt.
[2026-08-05 11:23:15] [!] Fehler beim Kompilieren eines experimentellen AUR-Treibers.
[2026-08-05 11:23:30] [!] Rollback eingeleitet via timeshift --restore...
[2026-08-05 11:24:35] [✓] System erfolgreich auf Snapshot '@pre-upd-20260805' zurückgesetzt.`,
  },
];

export const UpdateHistory: React.FC = () => {
  const [history, setHistory] = useLocalStorage<UpdateLogEntry[]>(
    'arch_wine_os_update_history',
    initialUpdateHistory
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'full-system' | 'driver' | 'security' | 'kernel'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'warning' | 'failed' | 'rollback'>('all');
  const [expandedId, setExpandedId] = useState<string | null>('upd-20260826-01');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal / Simulation State
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationProgress, setSimulationProgress] = useState(0);
  const [simulationLogs, setSimulationLogs] = useState<string[]>([]);
  const [showSimModal, setShowSimModal] = useState(false);
  const [simType, setSimType] = useState<'full-system' | 'driver' | 'security'>('full-system');

  // Stats Calculations
  const stats = useMemo(() => {
    const total = history.length;
    const successful = history.filter((h) => h.status === 'success').length;
    const successRate = total > 0 ? Math.round((successful / total) * 100) : 100;
    const totalPackages = history.reduce((acc, curr) => acc + curr.packagesUpdated, 0);
    const latestSnapshot = history.find((h) => h.snapshotCreated && h.snapshotId)?.snapshotId || 'Keiner';
    return { total, successful, successRate, totalPackages, latestSnapshot };
  }, [history]);

  // Filtered History
  const filteredHistory = useMemo(() => {
    return history.filter((entry) => {
      const matchesSearch =
        entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.packageChanges.some((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesType = typeFilter === 'all' || entry.type === typeFilter;
      const matchesStatus = statusFilter === 'all' || entry.status === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [history, searchQuery, typeFilter, statusFilter]);

  const handleToggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleCopyLog = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadLog = (entry: UpdateLogEntry) => {
    const content = `================================================================================
ARCH WINE OS - UPDATE PROTOKOLL
ID: ${entry.id}
Datum: ${entry.timestamp}
Titel: ${entry.title}
Typ: ${entry.type} | Status: ${entry.status}
Ausgeführt von: ${entry.executedBy}
Dauer: ${entry.durationSec}s | Aktualisierte Pakete: ${entry.packagesUpdated}
Kernel: ${entry.kernelBefore} -> ${entry.kernelAfter}
Snapshot: ${entry.snapshotCreated ? entry.snapshotId : 'Nein'}
================================================================================
ZUSAMMENFASSUNG:
${entry.summary}

================================================================================
PAKET-ÄNDERUNGEN:
${
  entry.packageChanges.length > 0
    ? entry.packageChanges
        .map((p) => `* [${p.type.toUpperCase()}] ${p.name}: ${p.oldVersion} -> ${p.newVersion}`)
        .join('\n')
    : 'Keine Pakete geändert.'
}

================================================================================
TERMINAL-LOGS:
${entry.logOutput}
`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${entry.id}-${entry.type}.log`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportAll = () => {
    const blob = new Blob([JSON.stringify(history, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `arch-wine-os-update-history-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDeleteEntry = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory((prev) => prev.filter((item) => item.id !== id));
  };

  const handleResetDefaults = () => {
    setHistory(initialUpdateHistory);
  };

  const handleClearHistory = () => {
    if (window.confirm('Möchten Sie den gesamten Update-Verlauf wirklich löschen?')) {
      setHistory([]);
    }
  };

  // Run a live simulated update
  const handleStartSimulation = () => {
    setIsSimulating(true);
    setSimulationProgress(5);
    setSimulationLogs(['[00:01] Starte automatischen Wartungs- und Update-Prozess...']);

    const steps = [
      { progress: 20, log: '[00:03] Prüfe Netzwerkverbindung & erstelle Timeshift Snapshot @pre-upd-live...' },
      { progress: 40, log: '[00:07] archlinux-keyring synchronisiert, schnellste Mirrors geladen...' },
      { progress: 65, log: '[00:12] pacman -Syu: Herunterladen & Installieren von Kernel, Wine- & Grafik-Paketen...' },
      { progress: 85, log: '[00:18] dkms autoinstall: Kernel-Module kompiliert, mkinitcpio Ramdisk erstellt...' },
      { progress: 95, log: '[00:22] arch-audit & freshclam: Sicherheitsprüfungen abgeschlossen, Cache bereinigt...' },
      { progress: 100, log: '[00:24] [ERFOLG] Update erfolgreich abgeschlossen! System bereit.' },
    ];

    steps.forEach((step, idx) => {
      setTimeout(() => {
        setSimulationProgress(step.progress);
        setSimulationLogs((prev) => [...prev, step.log]);

        if (idx === steps.length - 1) {
          setTimeout(() => {
            const now = new Date();
            const dateStr = now.toISOString().replace('T', ' ').slice(0, 19);
            const idStr = `upd-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
              now.getDate()
            ).padStart(2, '0')}-${String(Math.floor(Math.random() * 900 + 100))}`;

            const newEntry: UpdateLogEntry = {
              id: idStr,
              timestamp: dateStr,
              title:
                simType === 'full-system'
                  ? 'Vollständiges System- & Wine-Stack Update (Live Ausführung)'
                  : simType === 'driver'
                  ? 'GPU- & Hardware-Treiber Aktualisierung (Live Ausführung)'
                  : 'Sicherheits-Audit & CVE-Patching (Live Ausführung)',
              type: simType,
              status: 'success',
              durationSec: 24,
              packagesUpdated: simType === 'full-system' ? 14 : simType === 'driver' ? 5 : 3,
              kernelBefore: '6.10.9-arch1-1',
              kernelAfter: '6.10.9-arch1-1',
              snapshotCreated: true,
              snapshotId: `@snap-${idStr}`,
              executedBy: 'Studio Interaktiver Launcher (update_system.sh)',
              summary: 'Manuell ausgelöstes Update erfolgreich beendet. Alle Paket-Hashes und Kernel-Module verifiziert.',
              packageChanges:
                simType === 'full-system'
                  ? [
                      { name: 'wine-staging', oldVersion: '9.16-1', newVersion: '9.17-1', type: 'core' },
                      { name: 'mesa', oldVersion: '24.2.0-1', newVersion: '24.2.1-1', type: 'driver' },
                      { name: 'archlinux-keyring', oldVersion: '20260820-1', newVersion: '20260826-1', type: 'security' },
                    ]
                  : simType === 'driver'
                  ? [
                      { name: 'nvidia-dkms', oldVersion: '560.35.03-1', newVersion: '560.35.03-2', type: 'driver' },
                      { name: 'vulkan-radeon', oldVersion: '24.2.0-1', newVersion: '24.2.1-1', type: 'driver' },
                    ]
                  : [
                      { name: 'archlinux-keyring', oldVersion: '20260820-1', newVersion: '20260826-1', type: 'security' },
                      { name: 'openssl', oldVersion: '3.3.1-2', newVersion: '3.3.2-1', type: 'security' },
                    ],
              logOutput: steps.map((s) => s.log).join('\n'),
            };

            setHistory((prev) => [newEntry, ...prev]);
            setIsSimulating(false);
            setShowSimModal(false);
            setExpandedId(newEntry.id);
          }, 800);
        }
      }, (idx + 1) * 600);
    });
  };

  const getStatusBadge = (status: UpdateLogEntry['status']) => {
    switch (status) {
      case 'success':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" />
            <span>Erfolgreich</span>
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-3 h-3" />
            <span>Warnung</span>
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3 h-3" />
            <span>Fehlgeschlagen</span>
          </span>
        );
      case 'rollback':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <RotateCcw className="w-3 h-3" />
            <span>Rollback</span>
          </span>
        );
    }
  };

  const getTypeBadge = (type: UpdateLogEntry['type']) => {
    switch (type) {
      case 'full-system':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Layers className="w-3 h-3" />
            <span>System & Wine</span>
          </span>
        );
      case 'driver':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium bg-violet-500/10 text-violet-400 border border-violet-500/20">
            <Cpu className="w-3 h-3" />
            <span>Treiber (GPU/DKMS)</span>
          </span>
        );
      case 'security':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Shield className="w-3 h-3" />
            <span>Sicherheits-Patch</span>
          </span>
        );
      case 'kernel':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Sparkles className="w-3 h-3" />
            <span>Kernel</span>
          </span>
        );
      case 'manual':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-700/50 text-slate-300 border border-slate-700">
            <Terminal className="w-3 h-3" />
            <span>Manuell</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Aufgezeichnete Updates</span>
            <History className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{stats.total}</div>
          <p className="text-[11px] text-slate-500">In lokaler Historie gespeichert</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Erfolgsquote</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">{stats.successRate}%</div>
          <p className="text-[11px] text-slate-500">{stats.successful} von {stats.total} Läufen ohne Fehler</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Aktualisierte Pakete</span>
            <Package className="w-4 h-4 text-violet-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{stats.totalPackages}</div>
          <p className="text-[11px] text-slate-500">Gesamt über alle Versionen</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Letzter Snapshot</span>
            <HardDrive className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-xs font-bold text-blue-400 font-mono truncate">{stats.latestSnapshot}</div>
          <p className="text-[11px] text-slate-500">Timeshift Rollback-Punkt</p>
        </div>
      </div>

      {/* 30-Day Update Frequency Bar Chart */}
      <UpdateFrequencyChart history={history} />

      {/* Controls & Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Verlauf durchsuchen (z.B. linux, wine, nvidia, ID)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setShowSimModal(true)}
              className="flex items-center space-x-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-lg shadow-indigo-600/20 whitespace-nowrap"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Update ausführen (Live-Test)</span>
            </button>

            <button
              type="button"
              onClick={handleExportAll}
              title="Gesamten Verlauf als JSON exportieren"
              className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors border border-slate-700 cursor-pointer whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Exportieren</span>
            </button>

            <button
              type="button"
              onClick={handleResetDefaults}
              title="Standard-Beispieldaten wiederherstellen"
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors border border-slate-700 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            {history.length > 0 && (
              <button
                type="button"
                onClick={handleClearHistory}
                title="Verlauf leeren"
                className="p-2 bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 rounded-lg transition-colors border border-slate-700 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80 text-xs">
          <span className="text-slate-500 text-[11px] font-medium flex items-center space-x-1">
            <Filter className="w-3 h-3" />
            <span>Kategorie:</span>
          </span>

          <button
            type="button"
            onClick={() => setTypeFilter('all')}
            className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
              typeFilter === 'all'
                ? 'bg-indigo-600 text-white font-semibold'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            Alle ({history.length})
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter('full-system')}
            className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
              typeFilter === 'full-system'
                ? 'bg-indigo-600 text-white font-semibold'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            System & Wine
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter('driver')}
            className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
              typeFilter === 'driver'
                ? 'bg-indigo-600 text-white font-semibold'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            Treiber (GPU)
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter('security')}
            className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
              typeFilter === 'security'
                ? 'bg-indigo-600 text-white font-semibold'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            Sicherheit
          </button>

          <span className="text-slate-600 mx-1">|</span>

          <span className="text-slate-500 text-[11px] font-medium">Status:</span>
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-2 py-0.5 rounded text-[11px] transition-colors cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-slate-700 text-white font-semibold'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            Alle Status
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('success')}
            className={`px-2 py-0.5 rounded text-[11px] transition-colors cursor-pointer ${
              statusFilter === 'success'
                ? 'bg-emerald-700 text-white font-semibold'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            Erfolgreich
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('rollback')}
            className={`px-2 py-0.5 rounded text-[11px] transition-colors cursor-pointer ${
              statusFilter === 'rollback'
                ? 'bg-blue-700 text-white font-semibold'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            Rollbacks
          </button>
        </div>
      </div>

      {/* Log Entries List */}
      <div className="space-y-3">
        {filteredHistory.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center space-y-3">
            <div className="p-3 bg-slate-800/80 rounded-full w-12 h-12 mx-auto flex items-center justify-center text-slate-400">
              <History className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-white">Keine Update-Einträge gefunden</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchQuery || typeFilter !== 'all' || statusFilter !== 'all'
                ? 'Keine Protokolle entsprechen den ausgewählten Such- und Filterkriterien.'
                : 'Bisher wurden keine Update-Läufe protokolliert.'}
            </p>
            <button
              type="button"
              onClick={handleResetDefaults}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              Beispieldaten laden
            </button>
          </div>
        ) : (
          filteredHistory.map((entry) => {
            const isExpanded = expandedId === entry.id;

            return (
              <div
                key={entry.id}
                className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden transition-all duration-200 hover:border-slate-700 shadow-sm"
              >
                {/* Header Row (Clickable) */}
                <div
                  onClick={() => handleToggleExpand(entry.id)}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none bg-slate-900 hover:bg-slate-850 transition-colors"
                >
                  <div className="flex items-start sm:items-center space-x-3">
                    <div className="p-2 bg-slate-950 border border-slate-800 rounded-lg shrink-0 mt-0.5 sm:mt-0">
                      {entry.type === 'driver' ? (
                        <Cpu className="w-4 h-4 text-violet-400" />
                      ) : entry.type === 'security' ? (
                        <Shield className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Layers className="w-4 h-4 text-indigo-400" />
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-bold text-white hover:text-indigo-300 transition-colors">
                          {entry.title}
                        </h4>
                        {getStatusBadge(entry.status)}
                        {getTypeBadge(entry.type)}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 font-mono">
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>{entry.timestamp}</span>
                        </span>
                        <span>•</span>
                        <span>Dauer: {entry.durationSec}s</span>
                        <span>•</span>
                        <span>{entry.packagesUpdated} Pakete aktualisiert</span>
                        {entry.snapshotCreated && (
                          <>
                            <span>•</span>
                            <span className="text-blue-400">Snapshot: {entry.snapshotId}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadLog(entry);
                      }}
                      title="Protokoll herunterladen (.log)"
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors border border-slate-700 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleDeleteEntry(entry.id, e)}
                      title="Eintrag löschen"
                      className="p-1.5 bg-slate-800 hover:bg-rose-950/50 text-slate-400 hover:text-rose-400 rounded-lg transition-colors border border-slate-700 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <div className="p-1.5 text-slate-400">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Details Body */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 pt-0 border-t border-slate-800/80 bg-slate-950/40 space-y-4">
                    {/* Summary Info Box */}
                    <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800/80 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-medium">Zusammenfassung:</span>
                        <span className="text-slate-500 font-mono text-[11px]">Ausführer: {entry.executedBy}</span>
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed">{entry.summary}</p>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-xs">
                        <div>
                          <span className="text-slate-500 block text-[10px]">Kernel vorher:</span>
                          <span className="font-mono text-slate-300 font-semibold">{entry.kernelBefore}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">Kernel nachher:</span>
                          <span className="font-mono text-emerald-400 font-semibold">{entry.kernelAfter}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">Timeshift Snapshot:</span>
                          <span className="font-mono text-blue-400 font-semibold">
                            {entry.snapshotCreated ? entry.snapshotId : 'Deaktiviert'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Updated Packages Table */}
                    {entry.packageChanges && entry.packageChanges.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-semibold text-white">
                          <span className="flex items-center space-x-1.5">
                            <Package className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Geänderte & aktualisierte Pakete ({entry.packageChanges.length})</span>
                          </span>
                        </div>

                        <div className="bg-slate-950 border border-slate-800 rounded-lg overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800 text-[11px]">
                              <tr>
                                <th className="py-2 px-3 font-semibold">Paketname</th>
                                <th className="py-2 px-3 font-semibold">Typ</th>
                                <th className="py-2 px-3 font-semibold">Vorherige Version</th>
                                <th className="py-2 px-3 font-semibold">Neue Version</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-850 font-mono text-[11px]">
                              {entry.packageChanges.map((pkg, pIdx) => (
                                <tr key={pIdx} className="hover:bg-slate-900/50">
                                  <td className="py-2 px-3 text-white font-semibold">{pkg.name}</td>
                                  <td className="py-2 px-3">
                                    <span
                                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${
                                        pkg.type === 'driver'
                                          ? 'bg-violet-500/10 text-violet-400'
                                          : pkg.type === 'security'
                                          ? 'bg-emerald-500/10 text-emerald-400'
                                          : pkg.type === 'kernel'
                                          ? 'bg-amber-500/10 text-amber-400'
                                          : pkg.type === 'aur'
                                          ? 'bg-blue-500/10 text-blue-400'
                                          : 'bg-slate-800 text-slate-300'
                                      }`}
                                    >
                                      {pkg.type}
                                    </span>
                                  </td>
                                  <td className="py-2 px-3 text-slate-400">{pkg.oldVersion}</td>
                                  <td className="py-2 px-3 text-emerald-400 font-bold flex items-center space-x-1.5">
                                    <ArrowRight className="w-3 h-3 text-slate-600" />
                                    <span>{pkg.newVersion}</span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Console Output Box */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-white flex items-center space-x-1.5">
                          <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Vollständige Terminal-Ausgabe:</span>
                        </span>

                        <button
                          type="button"
                          onClick={() => handleCopyLog(entry.logOutput, entry.id)}
                          className="flex items-center space-x-1 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                        >
                          {copiedId === entry.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400 font-semibold">Kopiert</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Log kopieren</span>
                            </>
                          )}
                        </button>
                      </div>

                      <pre className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                        {entry.logOutput}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Simulation / Live-Run Modal */}
      {showSimModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-indigo-500/10 border border-indigo-500/30 rounded-lg text-indigo-400">
                  <Play className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Live-Update Ausführung starten</h3>
                  <p className="text-xs text-slate-400">Protokolliert das Ergebnis direkt in die Update-Historie</p>
                </div>
              </div>

              {!isSimulating && (
                <button
                  type="button"
                  onClick={() => setShowSimModal(false)}
                  className="text-slate-400 hover:text-white text-xs font-semibold p-1"
                >
                  Schließen
                </button>
              )}
            </div>

            {/* Config before run */}
            {!isSimulating ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300">Wählen Sie das Update-Profil:</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setSimType('full-system')}
                      className={`p-3 rounded-lg border text-left text-xs space-y-1 transition-all cursor-pointer ${
                        simType === 'full-system'
                          ? 'bg-indigo-600/10 border-indigo-500 text-indigo-300 font-semibold'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <Layers className="w-4 h-4 text-indigo-400" />
                      <div className="font-bold text-white text-[11px]">System & Wine</div>
                      <div className="text-[10px] text-slate-500">Pacman, AUR & Core</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSimType('driver')}
                      className={`p-3 rounded-lg border text-left text-xs space-y-1 transition-all cursor-pointer ${
                        simType === 'driver'
                          ? 'bg-violet-600/10 border-violet-500 text-violet-300 font-semibold'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <Cpu className="w-4 h-4 text-violet-400" />
                      <div className="font-bold text-white text-[11px]">Grafik & Treiber</div>
                      <div className="text-[10px] text-slate-500">NVIDIA / AMD DKMS</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSimType('security')}
                      className={`p-3 rounded-lg border text-left text-xs space-y-1 transition-all cursor-pointer ${
                        simType === 'security'
                          ? 'bg-emerald-600/10 border-emerald-500 text-emerald-300 font-semibold'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <Shield className="w-4 h-4 text-emerald-400" />
                      <div className="font-bold text-white text-[11px]">Sicherheit</div>
                      <div className="text-[10px] text-slate-500">CVE Audit & ClamAV</div>
                    </button>
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs text-slate-400 space-y-1.5">
                  <div className="text-slate-300 font-semibold flex items-center space-x-1.5">
                    <Info className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Automatisierte Prüfungen:</span>
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                    <li>Automatischer Pre-Update Timeshift Snapshot</li>
                    <li>Archlinux-Keyring & Spiegelserver Synchronisation</li>
                    <li>DKMS Modulkompilierung & Initramfs Rebuild</li>
                  </ul>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowSimModal(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="button"
                    onClick={handleStartSimulation}
                    className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-lg shadow-indigo-600/20"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Lauf starten</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Live Progress Output */
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-white">
                    <span>Ausführung läuft...</span>
                    <span className="font-mono text-indigo-400">{simulationProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="bg-indigo-600 h-full transition-all duration-300 ease-out rounded-full"
                      style={{ width: `${simulationProgress}%` }}
                    />
                  </div>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 font-mono text-xs text-emerald-400 space-y-1 max-h-48 overflow-y-auto">
                  {simulationLogs.map((log, idx) => (
                    <div key={idx} className="leading-relaxed">
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
