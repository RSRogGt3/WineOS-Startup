import React, { useState, useMemo } from 'react';
import { IsoConfig } from '../types';
import {
  RefreshCw,
  Shield,
  Cpu,
  Terminal,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Download,
  Sliders,
  Play,
  RotateCcw,
  Sparkles,
  ArrowRight,
  HardDrive,
  FileCode,
  Clock,
  Zap,
  Info,
  CheckSquare,
  History,
  Calendar,
  ToggleLeft,
  ToggleRight,
  ShieldCheck,
  SlidersHorizontal,
  Bell,
  Power,
  ChevronRight,
  FileCheck,
} from 'lucide-react';
import { UpdateHistory, initialUpdateHistory, UpdateLogEntry } from './UpdateHistory';
import { UpdateFrequencyChart } from './UpdateFrequencyChart';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface UpdateManagerProps {
  config?: IsoConfig;
  setConfig?: React.Dispatch<React.SetStateAction<IsoConfig>>;
}

export const UpdateManager: React.FC<UpdateManagerProps> = ({ config, setConfig }) => {
  const [activeSubTab, setActiveSubTab] = useState<'workflow' | 'history' | 'generator' | 'systemd' | 'cheatsheet'>('systemd');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Read stored update history for 30-day chart overview
  const [history] = useLocalStorage<UpdateLogEntry[]>(
    'arch_wine_os_update_history',
    initialUpdateHistory
  );

  // Fallback local state if config props are not supplied
  const [localMode, setLocalMode] = useState<'automatic' | 'manual'>('automatic');
  const [localFrequency, setLocalFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'boot' | 'custom'>('weekly');
  const [localOnCalendar, setLocalOnCalendar] = useState('Mon *-*-* 04:00:00');
  const [localPersistent, setLocalPersistent] = useState(true);
  const [localDelaySec, setLocalDelaySec] = useState(1800);
  const [localBootSec, setLocalBootSec] = useState(900);

  // Active settings derived from config or local fallback
  const updateMode = config?.updateMode ?? localMode;
  const updateFrequency = config?.updateFrequency ?? localFrequency;
  const updateOnCalendar = config?.updateOnCalendar ?? localOnCalendar;
  const updatePersistent = config?.updatePersistent ?? localPersistent;
  const updateRandomizedDelaySec = config?.updateRandomizedDelaySec ?? localDelaySec;
  const updateOnBootSec = config?.updateOnBootSec ?? localBootSec;

  const isAutoMode = updateMode === 'automatic';

  // Helper to mutate configuration
  const handleUpdateSetting = (field: keyof IsoConfig, value: any) => {
    if (setConfig) {
      setConfig(prev => ({ ...prev, [field]: value }));
    } else {
      if (field === 'updateMode') setLocalMode(value);
      if (field === 'updateFrequency') setLocalFrequency(value);
      if (field === 'updateOnCalendar') setLocalOnCalendar(value);
      if (field === 'updatePersistent') setLocalPersistent(value);
      if (field === 'updateRandomizedDelaySec') setLocalDelaySec(value);
      if (field === 'updateOnBootSec') setLocalBootSec(value);
    }
  };

  // Schedule Presets
  const handleSelectFrequency = (freq: 'daily' | 'weekly' | 'monthly' | 'boot' | 'custom') => {
    let calendarExpression = updateOnCalendar;
    if (freq === 'daily') calendarExpression = '*-*-* 03:30:00';
    if (freq === 'weekly') calendarExpression = 'Mon *-*-* 04:00:00';
    if (freq === 'monthly') calendarExpression = '*-*-01 04:00:00';
    if (freq === 'boot') calendarExpression = '';

    if (setConfig) {
      setConfig(prev => ({
        ...prev,
        updateFrequency: freq,
        updateOnCalendar: calendarExpression,
      }));
    } else {
      setLocalFrequency(freq);
      setLocalOnCalendar(calendarExpression);
    }
  };

  // Script Generator Options
  const [includeTimeshift, setIncludeTimeshift] = useState(true);
  const [includeKeyring, setIncludeKeyring] = useState(true);
  const [includeReflector, setIncludeReflector] = useState(true);
  const [includePacman, setIncludePacman] = useState(true);
  const [includeAur, setIncludeAur] = useState(true);
  const [includeFlatpak, setIncludeFlatpak] = useState(true);
  const [includeDkms, setIncludeDkms] = useState(true);
  const [includeArchAudit, setIncludeArchAudit] = useState(true);
  const [includeClamav, setIncludeClamav] = useState(true);
  const [includeUfw, setIncludeUfw] = useState(true);
  const [includeCacheClean, setIncludeCacheClean] = useState(true);
  const [includeOrphans, setIncludeOrphans] = useState(true);
  const [selectedGpu, setSelectedGpu] = useState<'auto' | 'nvidia' | 'amd' | 'intel'>('auto');

  // Copy helper
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Generate dynamic customized update script
  const generatedScript = useMemo(() => {
    const lines: string[] = [
      '#!/usr/bin/env bash',
      '# ==============================================================================',
      '# Arch Wine OS - Automatischer Wartungs- & Update-Prozess',
      '# Erstellt via Arch Wine OS Studio',
      '# ==============================================================================',
      'set -euo pipefail',
      '',
      'LOG_FILE="/var/log/arch-wine-os/update-$(date +\'%Y%m%d-%H%M%S\').log"',
      'mkdir -p "/var/log/arch-wine-os"',
      '',
      'echo "=== [1/5] Vorabprüfungen & Sicherheit ===" | tee -a "$LOG_FILE"',
      'if [[ $EUID -ne 0 ]]; then',
      '  echo "Fehler: Dieses Skript benötigt Root-Rechte (sudo)." >&2',
      '  exit 1',
      'fi',
      '',
      '# Pacman Lock prüfen',
      'if [[ -f /var/lib/pacman/db.lck ]]; then',
      '  if pgrep -x "pacman" >/dev/null; then',
      '    echo "Fehler: Pacman läuft bereits in einem anderen Prozess." >&2',
      '    exit 1',
      '  else',
      '    rm -f /var/lib/pacman/db.lck',
      '  fi',
      'fi',
    ];

    if (includeTimeshift) {
      lines.push(
        '',
        '# Pre-Update Snapshot (Rollback-Schutz)',
        'if command -v timeshift &>/dev/null; then',
        '  echo "[*] Erstelle Timeshift Sicherheits-Snapshot..." | tee -a "$LOG_FILE"',
        '  timeshift --create --comments "Pre-Update $(date +\'%Y-%m-%d %H:%M\')" --tags D || true',
        'fi'
      );
    }

    if (includeKeyring) {
      lines.push(
        '',
        'echo "=== [2/5] Schlüsselbunde & Spiegelserver ===" | tee -a "$LOG_FILE"',
        'echo "[*] Aktualisiere archlinux-keyring gegen veraltete GPG-Schlüssel..." | tee -a "$LOG_FILE"',
        'pacman -Sy --noconfirm archlinux-keyring'
      );
    }

    if (includeReflector) {
      lines.push(
        'if command -v reflector &>/dev/null; then',
        '  echo "[*] Optimiere Mirrorlist (schnellste 10 HTTPS Mirrors)..." | tee -a "$LOG_FILE"',
        '  reflector --latest 10 --protocol https --sort rate --save /etc/pacman.d/mirrorlist || true',
        'fi'
      );
    }

    if (includePacman) {
      lines.push(
        '',
        'echo "=== [3/5] System- & Programm-Updates ===" | tee -a "$LOG_FILE"',
        'echo "[*] Führe vollständiges System-Upgrade aus (pacman -Syu)..." | tee -a "$LOG_FILE"',
        'pacman -Syu --noconfirm'
      );
    }

    if (includeAur) {
      lines.push(
        '',
        '# AUR Updates für den ausführenden Benutzer',
        'SUDO_USER_NAME=${SUDO_USER:-}',
        'if [[ -n "$SUDO_USER_NAME" && "$SUDO_USER_NAME" != "root" ]]; then',
        '  if command -v paru &>/dev/null; then',
        '    echo "[*] Aktualisiere AUR-Pakete mit paru..." | tee -a "$LOG_FILE"',
        '    su - "$SUDO_USER_NAME" -c "paru -Sua --noconfirm" || true',
        '  elif command -v yay &>/dev/null; then',
        '    echo "[*] Aktualisiere AUR-Pakete mit yay..." | tee -a "$LOG_FILE"',
        '    su - "$SUDO_USER_NAME" -c "yay -Sua --noconfirm" || true',
        '  fi',
        'fi'
      );
    }

    if (includeFlatpak) {
      lines.push(
        'if command -v flatpak &>/dev/null; then',
        '  echo "[*] Aktualisiere Flatpak-Runtimes..." | tee -a "$LOG_FILE"',
        '  flatpak update -y || true',
        'fi'
      );
    }

    lines.push('', 'echo "=== [4/5] Hardware-Treiber & Kernel-Module ===" | tee -a "$LOG_FILE"');

    if (selectedGpu === 'nvidia') {
      lines.push(
        'echo "[*] Installiere/Aktualisiere NVIDIA 64-Bit & 32-Bit Treiber..." | tee -a "$LOG_FILE"',
        'pacman -S --needed --noconfirm nvidia-dkms nvidia-utils lib32-nvidia-utils opencl-nvidia lib32-opencl-nvidia'
      );
    } else if (selectedGpu === 'amd') {
      lines.push(
        'echo "[*] Installiere/Aktualisiere AMD Mesa & RADV Vulkan Stack..." | tee -a "$LOG_FILE"',
        'pacman -S --needed --noconfirm mesa lib32-mesa vulkan-radeon lib32-vulkan-radeon xf86-video-amdgpu'
      );
    } else if (selectedGpu === 'intel') {
      lines.push(
        'echo "[*] Installiere/Aktualisiere Intel Vulkan & Mesa Stack..." | tee -a "$LOG_FILE"',
        'pacman -S --needed --noconfirm mesa lib32-mesa vulkan-intel lib32-vulkan-intel'
      );
    } else {
      lines.push(
        '# GPU-Erkennung',
        'if lspci | grep -iE "vga|3d|display" | grep -i nvidia >/dev/null; then',
        '  echo "[+] NVIDIA GPU erkannt. Aktualisiere NVIDIA DKMS Stack..." | tee -a "$LOG_FILE"',
        '  pacman -S --needed --noconfirm nvidia-dkms nvidia-utils lib32-nvidia-utils opencl-nvidia lib32-opencl-nvidia || true',
        'elif lspci | grep -iE "vga|3d|display" | grep -i amd >/dev/null; then',
        '  echo "[+] AMD GPU erkannt. Aktualisiere Mesa & Vulkan-Radeon Stack..." | tee -a "$LOG_FILE"',
        '  pacman -S --needed --noconfirm mesa lib32-mesa vulkan-radeon lib32-vulkan-radeon || true',
        'elif lspci | grep -iE "vga|3d|display" | grep -i intel >/dev/null; then',
        '  echo "[+] Intel GPU erkannt. Aktualisiere Mesa & Vulkan-Intel Stack..." | tee -a "$LOG_FILE"',
        '  pacman -S --needed --noconfirm mesa lib32-mesa vulkan-intel lib32-vulkan-intel || true',
        'fi'
      );
    }

    if (includeDkms) {
      lines.push(
        'if command -v dkms &>/dev/null; then',
        '  echo "[*] Kompiliere DKMS-Treibermodule neu..." | tee -a "$LOG_FILE"',
        '  dkms autoinstall || true',
        'fi',
        'echo "[*] Erstelle Initramfs-Images neu..." | tee -a "$LOG_FILE"',
        'mkinitcpio -P'
      );
    }

    lines.push('', 'echo "=== [5/5] Sicherheits-Audits & Bereinigung ===" | tee -a "$LOG_FILE"');

    if (includeArchAudit) {
      lines.push(
        'if command -v arch-audit &>/dev/null; then',
        '  echo "[*] Führe CVE-Sicherheits-Audit der installierten Pakete durch..." | tee -a "$LOG_FILE"',
        '  arch-audit | tee -a "$LOG_FILE" || true',
        'fi'
      );
    }

    if (includeClamav) {
      lines.push(
        'if command -v freshclam &>/dev/null; then',
        '  echo "[*] Aktualisiere ClamAV Antivirus-Signaturen..." | tee -a "$LOG_FILE"',
        '  freshclam || true',
        'fi'
      );
    }

    if (includeUfw) {
      lines.push(
        'if command -v ufw &>/dev/null; then',
        '  echo "[*] Status der UFW-Firewall:" | tee -a "$LOG_FILE"',
        '  ufw status | tee -a "$LOG_FILE"',
        'fi'
      );
    }

    if (includeCacheClean) {
      lines.push(
        'if command -v paccache &>/dev/null; then',
        '  echo "[*] Bereinige alte Pacman-Caches (behalte letzte 2 Versionen)..." | tee -a "$LOG_FILE"',
        '  paccache -r -k 2 || true',
        'else',
        '  pacman -Sc --noconfirm || true',
        'fi'
      );
    }

    if (includeOrphans) {
      lines.push(
        'ORPHANS=$(pacman -Qtdq 2>/dev/null || true)',
        'if [[ -n "$ORPHANS" ]]; then',
        '  echo "[*] Entferne ungenutzte verwaiste Abhängigkeiten..." | tee -a "$LOG_FILE"',
        '  pacman -Rns --noconfirm $ORPHANS || true',
        'fi'
      );
    }

    lines.push(
      '',
      'echo ""',
      'echo "[✓] Wartung & Updates erfolgreich abgeschlossen! Protokoll: $LOG_FILE" | tee -a "$LOG_FILE"',
      '',
      '# Kernel-Reboot-Hinweis',
      'RUNNING_KERNEL=$(uname -r)',
      'INSTALLED_KERNEL=$(pacman -Q linux 2>/dev/null | awk \'{print $2}\' || echo "")',
      'if [[ -n "$INSTALLED_KERNEL" && "$RUNNING_KERNEL" != *"$INSTALLED_KERNEL"* ]]; then',
      '  echo ">>> [WICHTIG] Der Linux-Kernel wurde aktualisiert! Bitte System neustarten: sudo reboot <<<"',
      'fi'
    );

    return lines.join('\n');
  }, [
    includeTimeshift,
    includeKeyring,
    includeReflector,
    includePacman,
    includeAur,
    includeFlatpak,
    includeDkms,
    includeArchAudit,
    includeClamav,
    includeUfw,
    includeCacheClean,
    includeOrphans,
    selectedGpu,
  ]);

  const handleDownloadScript = () => {
    const blob = new Blob([generatedScript], { type: 'text/x-shellscript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'update_system.sh';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Dynamic system-update.service content
  const systemdService = `[Unit]
Description=Automated Arch Wine OS System & Security Update Service
Documentation=man:pacman(8)
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
ExecStart=/usr/local/bin/update_system.sh
StandardOutput=journal
StandardError=journal
Nice=19
IOSchedulingClass=2
IOSchedulingPriority=7

[Install]
WantedBy=multi-user.target`;

  // Dynamic system-update.timer content based on selected mode
  const systemdTimer = useMemo(() => {
    if (isAutoMode) {
      let timerScheduleLines = '';
      if (updateFrequency === 'boot') {
        timerScheduleLines = `OnBootSec=${updateOnBootSec}s\nOnUnitActiveSec=24h`;
      } else {
        timerScheduleLines = `OnCalendar=${updateOnCalendar}\nPersistent=${updatePersistent ? 'true' : 'false'}\nRandomizedDelaySec=${updateRandomizedDelaySec}\nOnBootSec=${updateOnBootSec}s`;
      }

      return `[Unit]
Description=Arch Wine OS Scheduled System & Security Update Timer
Documentation=man:systemd.timer(5)
Requires=system-update.service

[Timer]
# Mode: AUTOMATIC (${updateFrequency.toUpperCase()})
${timerScheduleLines}

[Install]
WantedBy=timers.target`;
    }

    return `[Unit]
Description=Arch Wine OS System & Security Update Timer (MANUAL MODE - INACTIVE)
Documentation=man:systemd.timer(5)
# Mode: MANUAL - Automated background updates are disabled by administrator.
# Run updates on demand using: sudo /usr/local/bin/update_system.sh

[Timer]
# Automatic schedule is disabled in manual mode.
# To activate, switch to Automatic in Wine OS Studio or uncomment below:
# OnCalendar=${updateOnCalendar}
# Persistent=${updatePersistent ? 'true' : 'false'}
# RandomizedDelaySec=${updateRandomizedDelaySec}

# [Install] section omitted to prevent automatic startup on boot.
# Trigger manually at any time with: sudo systemctl start system-update.service`;
  }, [isAutoMode, updateFrequency, updateOnCalendar, updatePersistent, updateRandomizedDelaySec, updateOnBootSec]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400">
                <RefreshCw className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Update- & Wartungs-Architektur (Treiber, Programme & Sicherheit)
              </h2>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl">
              Strukturierter 4-Stufen-Prozess für risikofreie System-Aktualisierungen in Arch Linux:
              Pre-Update Rollback-Snapshots, Kernel-/GPU-Treiber DKMS-Kompilierung, AUR-Pakete und CVE-Sicherheitsaudits.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadScript}
              className="flex items-center space-x-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-lg shadow-emerald-600/20"
            >
              <Download className="w-4 h-4" />
              <span>update_system.sh herunterladen</span>
            </button>
          </div>
        </div>

        {/* 4 Pillars Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-6">
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Stufe 1</span>
              <RotateCcw className="w-4 h-4 text-blue-400" />
            </div>
            <h4 className="text-sm font-bold text-white">Sicherheits-Snapshot</h4>
            <p className="text-xs text-slate-400">
              Automatisches Btrfs/Timeshift Backup vor jedem Schreibzugriff für sofortigen Rollback bei Fehlern.
            </p>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Stufe 2</span>
              <Terminal className="w-4 h-4 text-indigo-400" />
            </div>
            <h4 className="text-sm font-bold text-white">System & Software</h4>
            <p className="text-xs text-slate-400">
              Keyring-Aktualisierung, <code className="text-indigo-300 font-mono">pacman -Syu</code>, AUR-Helper (paru/yay) und Wine-Runtimes.
            </p>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-violet-400">Stufe 3</span>
              <Cpu className="w-4 h-4 text-violet-400" />
            </div>
            <h4 className="text-sm font-bold text-white">Treiber & DKMS</h4>
            <p className="text-xs text-slate-400">
              NVIDIA / AMD Mesa 32-/64-Bit Treiber, CPU-Microcode & automatischer Rebuild via <code className="text-violet-300 font-mono">mkinitcpio</code>.
            </p>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Stufe 4</span>
              <Shield className="w-4 h-4 text-emerald-400" />
            </div>
            <h4 className="text-sm font-bold text-white">Sicherheits-Audit</h4>
            <p className="text-xs text-slate-400">
              Schwachstellenprüfung mit <code className="text-emerald-300 font-mono">arch-audit</code>, Viren-Definitionen (ClamAV) und Cache-Pruning.
            </p>
          </div>
        </div>
      </div>

      {/* TOP-LEVEL UPDATE MODE TOGGLE CARD (Automatic vs. Manual) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-start space-x-3.5">
            <div
              className={`p-3 rounded-xl border transition-all shrink-0 mt-0.5 ${
                isAutoMode
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
              }`}
            >
              {isAutoMode ? <Clock className="w-6 h-6 animate-spin-slow" /> : <Power className="w-6 h-6" />}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h3 className="text-base font-bold text-white">
                  Update-Modus: {isAutoMode ? 'Automatisch (Systemd Timer)' : 'Manuell (On-Demand)'}
                </h3>
                {isAutoMode ? (
                  <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Aktiv ({updateFrequency === 'boot' ? 'Beim Booten' : updateFrequency})</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span>Manuell (Keine Hintergrund-Updates)</span>
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
                {isAutoMode ? (
                  <>
                    Der <code className="text-indigo-300 font-mono text-[11px]">system-update.timer</code> wird in den ISO-Dateien (
                    <code className="text-indigo-300 font-mono text-[11px]">airootfs/etc/systemd/system/system-update.timer</code>) scharfgeschaltet und führt wöchentlich/geplant den gesamten Update-Stack ohne Benutzerinteraktion im Hintergrund aus.
                  </>
                ) : (
                  <>
                    Hintergrund-Timer sind <strong className="text-amber-300">deaktiviert</strong>. Ideal für Gaming-Setups und Streamer, um unerwartete CPU/GPU-Last oder Kernel-Änderungen während des Betriebs zu vermeiden. Updates werden nur manuell per Befehl gestartet.
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Mode Switcher Toggle Button Group */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0 self-start lg:self-center">
            <button
              type="button"
              onClick={() => handleUpdateSetting('updateMode', 'automatic')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                isAutoMode
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Automatisch</span>
            </button>

            <button
              type="button"
              onClick={() => handleUpdateSetting('updateMode', 'manual')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                !isAutoMode
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>Manuell</span>
            </button>
          </div>
        </div>

        {/* Dynamic Detail Settings for Automatic Mode */}
        {isAutoMode && (
          <div className="mt-5 pt-4 border-t border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Frequency presets */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                <span>Intervall / Ausführungs-Rhythmus:</span>
              </label>
              <select
                value={updateFrequency}
                onChange={e => handleSelectFrequency(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium cursor-pointer"
              >
                <option value="weekly">Wöchentlich (Jeden Mo 04:00 Uhr) - Empfohlen</option>
                <option value="daily">Täglich (Nachts um 03:30 Uhr)</option>
                <option value="monthly">Monatlich (Am 1. des Monats)</option>
                <option value="boot">Beim Systemstart (nach 15 Min)</option>
                <option value="custom">Benutzerdefiniert (OnCalendar)</option>
              </select>
            </div>

            {/* Custom OnCalendar Expression or Readonly summary */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span>systemd OnCalendar Syntax:</span>
              </label>
              <input
                type="text"
                value={updateOnCalendar}
                onChange={e => {
                  handleUpdateSetting('updateOnCalendar', e.target.value);
                  if (updateFrequency !== 'custom') handleUpdateSetting('updateFrequency', 'custom');
                }}
                placeholder="z.B. Mon *-*-* 04:00:00"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Persistent & Delay controls */}
            <div className="space-y-2">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
                <span>Ausfallsicherheit:</span>
              </label>
              <div className="flex items-center space-x-3 pt-0.5">
                <label className="flex items-center space-x-2 text-xs text-slate-300 hover:text-white cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={updatePersistent}
                    onChange={e => handleUpdateSetting('updatePersistent', e.target.checked)}
                    className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Persistent (Verpasste Termine nachholen)</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Manual Mode Quick Info Bar */}
        {!isAutoMode && (
          <div className="mt-5 pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400 bg-slate-950/60 p-3.5 rounded-lg">
            <div className="flex items-center space-x-2 text-amber-300 font-medium">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Manuelle Ausführung bereit: Führen Sie Updates per Terminal aus, wenn Sie Zeit haben.</span>
            </div>
            <div className="flex items-center space-x-2 shrink-0">
              <span className="text-slate-500 font-mono text-[11px]">Befehl:</span>
              <code className="bg-slate-900 border border-slate-800 text-indigo-300 px-2 py-1 rounded font-mono text-[11px]">
                sudo /usr/local/bin/update_system.sh
              </code>
              <button
                type="button"
                onClick={() => handleCopy('sudo /usr/local/bin/update_system.sh', 'quick_manual_cmd')}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer transition-colors"
                title="Befehl kopieren"
              >
                {copiedKey === 'quick_manual_cmd' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 30-Day Update Frequency Bar Chart */}
      <UpdateFrequencyChart history={history} />

      {/* Sub-Navigation Tabs */}
      <div className="flex space-x-2 border-b border-slate-800 pb-2 overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveSubTab('systemd')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
            activeSubTab === 'systemd'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Systemd Timer & Service Konfiguration</span>
          {isAutoMode ? (
            <span className="w-2 h-2 rounded-full bg-emerald-400 ml-1" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-amber-400 ml-1" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('workflow')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
            activeSubTab === 'workflow'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Update-Prozess Schritt-für-Schritt</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('history')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
            activeSubTab === 'history'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Update-Verlauf & Protokolle</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('generator')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
            activeSubTab === 'generator'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Skript-Konfigurator (update_system.sh)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('cheatsheet')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
            activeSubTab === 'cheatsheet'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Befehls-Referenz & Notfall-Rollback</span>
        </button>
      </div>

      {/* Tab: Systemd Automation & Timer Settings */}
      {activeSubTab === 'systemd' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-indigo-400" />
                  <span>systemd Timer & Service Manager</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Verwaltet die automatische Hintergrundausführung von <code className="text-slate-300 font-mono">update_system.sh</code> über native systemd-Timer.
                </p>
              </div>

              {/* Mode indicator pill */}
              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-400">Aktiver Modus:</span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    isAutoMode
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  }`}
                >
                  {isAutoMode ? 'AUTOMATISCH' : 'MANUELL'}
                </span>
              </div>
            </div>

            {/* Live Generated systemd Files Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* system-update.timer File */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-md flex flex-col">
                <div className="bg-slate-900/90 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className={`w-4 h-4 ${isAutoMode ? 'text-emerald-400' : 'text-amber-400'}`} />
                    <span className="text-xs font-mono font-bold text-white">system-update.timer</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {isAutoMode ? '(Aktiviert)' : '(Deaktiviert/Manuell)'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(systemdTimer, 'timer_file_code')}
                    className="flex items-center space-x-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs transition-colors cursor-pointer"
                  >
                    {copiedKey === 'timer_file_code' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Kopiert!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Kopieren</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="p-4 bg-slate-950 font-mono text-xs text-slate-300 leading-relaxed overflow-x-auto flex-1">
                  <pre className="whitespace-pre">{systemdTimer}</pre>
                </div>
                <div className="bg-slate-900/50 px-4 py-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Zielpfad: <code className="text-slate-300 font-mono">airootfs/etc/systemd/system/system-update.timer</code></span>
                  <FileCheck className="w-3.5 h-3.5 text-indigo-400" />
                </div>
              </div>

              {/* system-update.service File */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-md flex flex-col">
                <div className="bg-slate-900/90 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileCode className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-mono font-bold text-white">system-update.service</span>
                    <span className="text-[10px] text-slate-400 font-mono">(oneshot Service)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(systemdService, 'service_file_code')}
                    className="flex items-center space-x-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs transition-colors cursor-pointer"
                  >
                    {copiedKey === 'service_file_code' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Kopiert!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Kopieren</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="p-4 bg-slate-950 font-mono text-xs text-slate-300 leading-relaxed overflow-x-auto flex-1">
                  <pre className="whitespace-pre">{systemdService}</pre>
                </div>
                <div className="bg-slate-900/50 px-4 py-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Zielpfad: <code className="text-slate-300 font-mono">airootfs/etc/systemd/system/system-update.service</code></span>
                  <FileCheck className="w-3.5 h-3.5 text-indigo-400" />
                </div>
              </div>
            </div>

            {/* Target Machine Activation Guide */}
            <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center space-x-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span>
                    {isAutoMode
                      ? 'Befehle zur Aktivierung des automatischen Timers auf Arch Linux:'
                      : 'Befehle für manuelle Ausführung & Diagnose:'}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const cmdText = isAutoMode
                      ? `sudo chmod +x /usr/local/bin/update_system.sh\nsudo systemctl daemon-reload\nsudo systemctl enable --now system-update.timer\nsystemctl list-timers system-update.timer`
                      : `sudo /usr/local/bin/update_system.sh\nsudo systemctl status system-update.service`;
                    handleCopy(cmdText, 'activation_cmds');
                  }}
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center space-x-1 cursor-pointer"
                >
                  {copiedKey === 'activation_cmds' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Alle Befehle kopieren</span>
                </button>
              </div>

              {isAutoMode ? (
                <div className="font-mono text-xs text-indigo-300 space-y-1.5 bg-slate-900 p-3.5 rounded-lg border border-slate-800">
                  <div className="text-slate-500"># 1. Skript ausführbar machen:</div>
                  <div>sudo chmod +x /usr/local/bin/update_system.sh</div>
                  <div className="text-slate-500 pt-1"># 2. systemd Konfiguration neu laden:</div>
                  <div>sudo systemctl daemon-reload</div>
                  <div className="text-slate-500 pt-1"># 3. Timer aktivieren und sofort starten:</div>
                  <div>sudo systemctl enable --now system-update.timer</div>
                  <div className="text-slate-500 pt-1"># 4. Timer-Plan und nächsten Ausführungszeitpunkt prüfen:</div>
                  <div>systemctl list-timers system-update.timer</div>
                </div>
              ) : (
                <div className="font-mono text-xs text-amber-300 space-y-1.5 bg-slate-900 p-3.5 rounded-lg border border-slate-800">
                  <div className="text-slate-500"># Vollständiges System- & Treiber-Update bei Bedarf ausführen:</div>
                  <div>sudo /usr/local/bin/update_system.sh</div>
                  <div className="text-slate-500 pt-1"># Oder Service einmalig im Hintergrund triggern:</div>
                  <div>sudo systemctl start system-update.service</div>
                  <div className="text-slate-500 pt-1"># Live-Logs der Ausführung einsehen:</div>
                  <div>journalctl -u system-update.service -f</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Update History */}
      {activeSubTab === 'history' && <UpdateHistory />}

      {/* Tab: Detailed Workflow Guide */}
      {activeSubTab === 'workflow' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Step 1: Pre-Flight & Snapshot */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center space-x-2.5">
                <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center text-xs font-bold font-mono">
                  1
                </span>
                <h3 className="text-sm font-bold text-white">Schritt 1: Vorab-Check & Rollback-Snapshot</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Bevor Pakete heruntergeladen oder ersetzt werden, prüft der Prozess bestehende Paketmanager-Sperren (<code className="text-slate-300 font-mono">db.lck</code>) und erstellt einen inkrementellen Snapshot.
              </p>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-xs text-slate-300 space-y-1">
                <div className="text-slate-500"># Btrfs / Timeshift Snapshot erstellen:</div>
                <div className="text-blue-400">sudo timeshift --create --comments &quot;Pre-Update&quot; --tags D</div>
              </div>
              <div className="text-[11px] text-slate-500 flex items-center space-x-1.5">
                <Info className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>Falls nach einem Kernel-Update das System nicht startet, kann im Bootmenü direkt zurückgerollt werden.</span>
              </div>
            </div>

            {/* Step 2: Mirrors & Keyring */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center space-x-2.5">
                <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center text-xs font-bold font-mono">
                  2
                </span>
                <h3 className="text-sm font-bold text-white">Schritt 2: Arch-Keyring & Spiegelserver</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Arch Linux nutzt PGP-Signaturprüfungen. Wenn der Schlüsselbund veraltet ist, scheitern Updates mit Signaturfehlern. Zuerst wird der Keyring separat synchronisiert.
              </p>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-xs text-slate-300 space-y-1">
                <div className="text-slate-500"># Schlüssel aktualisieren & schnellste Server filtern:</div>
                <div className="text-indigo-400">sudo pacman -Sy archlinux-keyring</div>
                <div className="text-indigo-400">sudo reflector --latest 10 --protocol https --sort rate --save /etc/pacman.d/mirrorlist</div>
              </div>
            </div>

            {/* Step 3: Core & AUR Update */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center space-x-2.5">
                <span className="w-6 h-6 rounded-full bg-violet-500/20 text-violet-400 border border-violet-500/30 flex items-center justify-center text-xs font-bold font-mono">
                  3
                </span>
                <h3 className="text-sm font-bold text-white">Schritt 3: Offizielles Upgrade & AUR/Flatpak</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Aktualisierung aller Core-, Extra- und Multilib-Pakete (inkl. Wine, DXVK und Steam) sowie Community-AUR-Pakete über Hilfsprogramme wie <code className="text-slate-300 font-mono">paru</code> oder <code className="text-slate-300 font-mono">yay</code>.
              </p>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-xs text-slate-300 space-y-1">
                <div className="text-slate-500"># Vollständiges System-Upgrade:</div>
                <div className="text-violet-400">sudo pacman -Syu</div>
                <div className="text-slate-500"># AUR-Pakete (als normaler Benutzer):</div>
                <div className="text-violet-400">paru -Sua</div>
              </div>
            </div>

            {/* Step 4: Hardware & GPU Drivers */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center space-x-2.5">
                <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center text-xs font-bold font-mono">
                  4
                </span>
                <h3 className="text-sm font-bold text-white">Schritt 4: GPU-Treiber & Kernel-Module (DKMS)</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Beim Update des Linux-Kernels müssen proprietäre Grafiktreiber (NVIDIA) oder spezielle Kernel-Module per DKMS neu gebaut werden, gefolgt von der Erstellung des Initial Ramdisks.
              </p>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-xs text-slate-300 space-y-1">
                <div className="text-slate-500"># DKMS Module kompilieren & Initramfs generieren:</div>
                <div className="text-amber-400">sudo dkms autoinstall</div>
                <div className="text-amber-400">sudo mkinitcpio -P</div>
              </div>
            </div>

            {/* Step 5: Security Audit */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center space-x-2.5">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-xs font-bold font-mono">
                  5
                </span>
                <h3 className="text-sm font-bold text-white">Schritt 5: CVE-Sicherheits-Audit & Bereinigung</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Prüft das System mit der Arch Security Team Datenbank auf bekannte Sicherheitslücken (CVEs), aktualisiert Antiviren-Datenbanken und entfernt verwaiste Abhängigkeiten.
              </p>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-xs text-slate-300 space-y-1">
                <div className="text-slate-500"># CVE-Audit & Viren-Signaturen:</div>
                <div className="text-emerald-400">arch-audit</div>
                <div className="text-emerald-400">sudo freshclam && sudo ufw status</div>
              </div>
            </div>

            {/* Step 6: Cache Maintenance */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center space-x-2.5">
                <span className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center text-xs font-bold font-mono">
                  6
                </span>
                <h3 className="text-sm font-bold text-white">Schritt 6: Speicherplatz & Cache-Hygiene</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Pacman speichert standardmäßig alle heruntergeladenen Tarballs in <code className="text-slate-300 font-mono">/var/cache/pacman/pkg/</code>. Wir behalten die letzten 2 Versionen zur Ausfallsicherheit und bereinigen den Rest.
              </p>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-xs text-slate-300 space-y-1">
                <div className="text-slate-500"># Caches bereinigen & verwaiste Pakete löschen:</div>
                <div className="text-rose-400">paccache -r -k 2</div>
                <div className="text-rose-400">sudo pacman -Rns $(pacman -Qtdq)</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Live Interactive Script Generator */}
      {activeSubTab === 'generator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Options Panel */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-800">
              <Sliders className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">Update-Optionen konfigurieren</h3>
            </div>

            {/* GPU Architecture Selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                <span>Grafiktreiber-Architektur:</span>
              </label>
              <select
                value={selectedGpu}
                onChange={(e) => setSelectedGpu(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="auto">Automatische Erkennung (lspci scan)</option>
                <option value="nvidia">NVIDIA (nvidia-dkms + lib32-nvidia-utils)</option>
                <option value="amd">AMD Radeon (mesa + vulkan-radeon + lib32)</option>
                <option value="intel">Intel Graphics (mesa + vulkan-intel)</option>
              </select>
            </div>

            {/* Toggle Checkboxes */}
            <div className="space-y-2.5 pt-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                Sicherheits- & Systemmodule:
              </span>

              <label className="flex items-center space-x-2.5 text-xs text-slate-300 hover:text-white cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeTimeshift}
                  onChange={(e) => setIncludeTimeshift(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Timeshift Pre-Update Snapshot erstellen</span>
              </label>

              <label className="flex items-center space-x-2.5 text-xs text-slate-300 hover:text-white cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeKeyring}
                  onChange={(e) => setIncludeKeyring(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Archlinux Keyring (PGP Signaturen) aktualisieren</span>
              </label>

              <label className="flex items-center space-x-2.5 text-xs text-slate-300 hover:text-white cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeReflector}
                  onChange={(e) => setIncludeReflector(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Spiegelserver mit Reflector automatisch optimieren</span>
              </label>

              <label className="flex items-center space-x-2.5 text-xs text-slate-300 hover:text-white cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includePacman}
                  onChange={(e) => setIncludePacman(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Offizielle Pacman Repositories upgraden (pacman -Syu)</span>
              </label>

              <label className="flex items-center space-x-2.5 text-xs text-slate-300 hover:text-white cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeAur}
                  onChange={(e) => setIncludeAur(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
                />
                <span>AUR Pakete via paru / yay aktualisieren</span>
              </label>

              <label className="flex items-center space-x-2.5 text-xs text-slate-300 hover:text-white cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeFlatpak}
                  onChange={(e) => setIncludeFlatpak(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Flatpak Runtimes & Spiele-Bibliotheken aktualisieren</span>
              </label>

              <label className="flex items-center space-x-2.5 text-xs text-slate-300 hover:text-white cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeDkms}
                  onChange={(e) => setIncludeDkms(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
                />
                <span>DKMS Module kompilieren & mkinitcpio ausführen</span>
              </label>

              <label className="flex items-center space-x-2.5 text-xs text-slate-300 hover:text-white cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeArchAudit}
                  onChange={(e) => setIncludeArchAudit(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
                />
                <span>arch-audit CVE-Sicherheitsprüfung ausführen</span>
              </label>

              <label className="flex items-center space-x-2.5 text-xs text-slate-300 hover:text-white cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeClamav}
                  onChange={(e) => setIncludeClamav(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
                />
                <span>ClamAV Antivirus-Signaturen (freshclam) updaten</span>
              </label>

              <label className="flex items-center space-x-2.5 text-xs text-slate-300 hover:text-white cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeCacheClean}
                  onChange={(e) => setIncludeCacheClean(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Pacman Cache bereinigen (paccache -r -k 2)</span>
              </label>

              <label className="flex items-center space-x-2.5 text-xs text-slate-300 hover:text-white cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeOrphans}
                  onChange={(e) => setIncludeOrphans(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Verwaiste Pakete (Orphans) automatisch löschen</span>
              </label>
            </div>
          </div>

          {/* Script Output Preview */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl flex flex-col overflow-hidden shadow-xl">
            <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileCode className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-mono font-bold text-white">update_system.sh</span>
                <span className="text-[10px] text-slate-500 font-mono">Bash Skript</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handleCopy(generatedScript, 'generated_script')}
                  className="flex items-center space-x-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs transition-colors cursor-pointer"
                >
                  {copiedKey === 'generated_script' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-semibold">Kopiert</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Kopieren</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleDownloadScript}
                  className="flex items-center space-x-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>
            </div>

            <div className="flex-1 p-4 bg-slate-950/60 overflow-y-auto max-h-[500px]">
              <pre className="font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                {generatedScript}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Cheatsheet & Emergency Rollback */}
      {activeSubTab === 'cheatsheet' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-indigo-400" />
              <h4 className="text-sm font-bold text-white">Standard-Wartungsbefehle</h4>
            </div>
            <div className="space-y-2 font-mono text-xs">
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-slate-400 text-[10px]">Vollständiges Systemupdate</div>
                  <div className="text-white font-bold">sudo pacman -Syu</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy('sudo pacman -Syu', 'cmd_1')}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  {copiedKey === 'cmd_1' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-slate-400 text-[10px]">Arch Keyring Reparatur</div>
                  <div className="text-white font-bold">sudo pacman -Sy archlinux-keyring</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy('sudo pacman -Sy archlinux-keyring', 'cmd_2')}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  {copiedKey === 'cmd_2' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-slate-400 text-[10px]">Spiegelserver aktualisieren</div>
                  <div className="text-white font-bold">sudo reflector --latest 10 --sort rate --save /etc/pacman.d/mirrorlist</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy('sudo reflector --latest 10 --sort rate --save /etc/pacman.d/mirrorlist', 'cmd_3')}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  {copiedKey === 'cmd_3' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center space-x-2">
              <RotateCcw className="w-4 h-4 text-rose-400" />
              <h4 className="text-sm font-bold text-white">Notfall-Rollback & Fehlerbehebung</h4>
            </div>
            <div className="space-y-2 font-mono text-xs">
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-slate-400 text-[10px]">Timeshift Snapshot wiederherstellen</div>
                  <div className="text-white font-bold">sudo timeshift --restore</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy('sudo timeshift --restore', 'cmd_4')}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  {copiedKey === 'cmd_4' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-slate-400 text-[10px]">DKMS Treiber neu kompilieren</div>
                  <div className="text-white font-bold">sudo dkms autoinstall && sudo mkinitcpio -P</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy('sudo dkms autoinstall && sudo mkinitcpio -P', 'cmd_5')}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  {copiedKey === 'cmd_5' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-slate-400 text-[10px]">Pacman Lock entfernen (falls blockiert)</div>
                  <div className="text-white font-bold">sudo rm -f /var/lib/pacman/db.lck</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy('sudo rm -f /var/lib/pacman/db.lck', 'cmd_6')}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  {copiedKey === 'cmd_6' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
