import { IsoConfig, PackageItem, ProjectFiles } from '../types';

export const initialIsoConfig: IsoConfig = {
  isoName: 'wine-os-alpha',
  isoLabel: 'WINE_OS',
  isoPublisher: 'Custom OS',
  isoApplication: 'Wine OS Alpha',
  isoVersion: '0.1',
  installDir: 'arch',
  arch: 'x86_64',
  compression: 'zstd',
  blockSize: '1M',
  targetSizeMB: 2048,
  autoBackup: true,
  autoBackupIntervalSec: 30,
  lastBackupTimestamp: undefined,
  // Update Automation Defaults
  updateMode: 'automatic',
  updateFrequency: 'weekly',
  updateOnCalendar: 'Mon *-*-* 04:00:00',
  updatePersistent: true,
  updateRandomizedDelaySec: 1800,
  updateOnBootSec: 900,
  bootmodes: [
    'bios.syslinux.mbr',
    'bios.syslinux.eltorito',
    'uefi-x64.systemd-boot.esp',
    'uefi-x64.systemd-boot.eltorito'
  ]
};

export const initialPackages: PackageItem[] = [
  { name: 'base', category: 'base', description: 'Essential Arch Linux package set', enabled: true, sizeMB: 180 },
  { name: 'linux', category: 'base', description: 'Linux kernel', enabled: true, sizeMB: 195 },
  { name: 'linux-firmware', category: 'base', description: 'Firmware files for Linux', enabled: true, sizeMB: 560 },
  { name: 'wine', category: 'gaming', description: 'Run Windows applications on Linux', enabled: true, sizeMB: 430 },
  { name: 'wine-mono', category: 'gaming', description: 'Free implementation of .NET', enabled: true, sizeMB: 115 },
  { name: 'wine-gecko', category: 'gaming', description: 'HTML support for Wine applications', enabled: true, sizeMB: 95 },
  { name: 'steam', category: 'gaming', description: 'Digital distribution platform for games', enabled: false, sizeMB: 110 },
  { name: 'lutris', category: 'gaming', description: 'Open gaming platform for Linux', enabled: false, sizeMB: 65 },
  { name: 'gamemode', category: 'gaming', description: 'Optimise game performance on demand', enabled: false, sizeMB: 15 },
  { name: 'dxvk', category: 'gaming', description: 'Vulkan-based translation layer for Direct3D', enabled: false, sizeMB: 50 },
  { name: 'ufw', category: 'security', description: 'Uncomplicated Firewall for network security', enabled: true, sizeMB: 12 },
  { name: 'clamav', category: 'security', description: 'Anti-virus toolkit for UNIX', enabled: true, sizeMB: 245 },
  { name: 'fail2ban', category: 'security', description: 'Ban hosts that cause authentication errors', enabled: false, sizeMB: 10 },
  { name: 'xorg-server', category: 'xorg', description: 'Xorg X server', enabled: true, sizeMB: 80 },
  { name: 'xorg-xinit', category: 'xorg', description: 'X.Org initialisation program', enabled: true, sizeMB: 5 },
  { name: 'xterm', category: 'xorg', description: 'Standard X terminal emulator', enabled: true, sizeMB: 8 },
  { name: 'i3-wm', category: 'xorg', description: 'Tiling window manager', enabled: false, sizeMB: 14 },
  { name: 'picom', category: 'xorg', description: 'X11 compositor', enabled: false, sizeMB: 8 },
  { name: 'nano', category: 'utilities', description: 'Pico clone text editor', enabled: false, sizeMB: 4 },
  { name: 'htop', category: 'utilities', description: 'Interactive process viewer', enabled: false, sizeMB: 6 },
  { name: 'git', category: 'utilities', description: 'Fast, scalable, distributed revision control system', enabled: false, sizeMB: 45 },
];

export function generateProjectFiles(config: IsoConfig, packages: PackageItem[]): ProjectFiles {
  const enabledPackages = packages.filter(p => p.enabled).map(p => p.name).join('\n');

  const bootmodesStr = config.bootmodes.map(b => `'${b}'`).join(' ');

  const buildIsoSh = `#!/usr/bin/env bash
# ==============================================================================
# Arch Wine OS - ISO Build Engine (Zero-Tempfile Clean Execution)
# ==============================================================================
set -euo pipefail

PROFILE_DIR="./${config.installDir}_wine_os"
OUT_DIR="./out"
WORK_DIR="./.build_work"

# Automatische, rückstandslose Bereinigung bei Abschluss oder Abbruch
cleanup() {
  if [[ -d "\${WORK_DIR}" ]]; then
    echo ">> Bereinige temporäre Arbeitsdateien und Build-Cache rückstandslos..."
    rm -rf "\${WORK_DIR}"
  fi
}
trap cleanup EXIT INT TERM

echo ">> Starte Arch Wine OS ISO-Kompilierung..."
mkdir -p "\${OUT_DIR}"

# mkarchiso mit isoliertem Arbeitsverzeichnis & anschließendem Auto-Cleanup
sudo mkarchiso -v -w "\${WORK_DIR}" -o "\${OUT_DIR}" "\${PROFILE_DIR}"

echo ">> Fertig! ISO liegt in \${OUT_DIR} (alle temporären Daten wurden restlos bereinigt)."
`;

  const profiledefSh = `#!/usr/bin/env bash
iso_name="${config.isoName}"
iso_label="${config.isoLabel}"
iso_publisher="${config.isoPublisher}"
iso_application="${config.isoApplication}"
iso_version="${config.isoVersion}"
install_dir="${config.installDir}"
buildmodes=('iso')
bootmodes=(${bootmodesStr})
arch="${config.arch}"
pacman_conf="pacman.conf"
airootfs_image_type="squashfs"
airootfs_image_tool_options=('-comp' '${config.compression}' '-b' '${config.blockSize}')
`;

  const pacmanConf = `[options]
HoldPkg     = pacman glibc
Architecture = auto
CheckSpace
SigLevel    = Required DatabaseOptional
LocalFileSigLevel = Optional

[core]
Include = /etc/pacman.d/mirrorlist

[extra]
Include = /etc/pacman.d/mirrorlist

[multilib]
Include = /etc/pacman.d/mirrorlist
`;

  const securitySetupSh = `#!/bin/bash
ufw default deny incoming
ufw default allow outgoing
ufw enable
freshclam
echo "Sicherheitssysteme aktiv."
`;

  const updateSystemSh = `#!/usr/bin/env bash
# ==============================================================================
# Arch Wine OS - Ganzheitliches System-, Treiber- & Sicherheits-Update-Skript
# ==============================================================================
set -euo pipefail

RED='\\033[0;31m'
GREEN='\\033[0;32m'
YELLOW='\\033[1;33m'
BLUE='\\033[0;34m'
CYAN='\\033[0;36m'
NC='\\033[0m' # No Color

LOG_DIR="/var/log/arch-wine-os"
LOG_FILE="\${LOG_DIR}/update-$(date +'%Y%m%d-%H%M%S').log"
mkdir -p "\${LOG_DIR}"

log() {
  echo -e "\${1}" | tee -a "\${LOG_FILE}"
}

header() {
  echo ""
  log "\${CYAN}=================================================================\${NC}"
  log "\${CYAN}>>> \${1}\${NC}"
  log "\${CYAN}=================================================================\${NC}"
}

header "SCHRITT 1: Vorab-Prüfungen & Systemzustand"

# Root-Rechte prüfen
if [[ $EUID -ne 0 ]]; then
   log "\${RED}[FEHLER] Dieses Skript muss mit Root-Rechten ausgeführt werden (sudo).\${NC}"
   exit 1
fi

# Internetverbindung testen
log "\${BLUE}[*] Prüfe Internetverbindung zu Arch-Mirrors...\${NC}"
if ! ping -c 1 archlinux.org &>/dev/null; then
  log "\${RED}[FEHLER] Keine Verbindung zu archlinux.org. Bitte Netzwerk prüfen!\${NC}"
  exit 1
fi
log "\${GREEN}[✓] Internetverbindung aktiv.\${NC}"

# Pacman Lock-File prüfen
if [[ -f /var/lib/pacman/db.lck ]]; then
  log "\${YELLOW}[WARNUNG] /var/lib/pacman/db.lck existiert!\${NC}"
  log "Prüfe ob pacman noch im Hintergrund läuft..."
  if pgrep -x "pacman" >/dev/null; then
    log "\${RED}[FEHLER] Pacman läuft bereits in einem anderen Prozess. Bitte warten.\${NC}"
    exit 1
  else
    log "\${YELLOW}[*] Entferne verwaiste db.lck Datei...\${NC}"
    rm -f /var/lib/pacman/db.lck
  fi
fi

# Automatischer Btrfs / Timeshift Wiederherstellungs-Snapshot (falls vorhanden)
header "SCHRITT 2: Sicherheits-Snapshot (Rollback-Schutz)"
if command -v timeshift &>/dev/null; then
  log "\${BLUE}[*] Erstelle Pre-Update Timeshift Snapshot...\${NC}"
  timeshift --create --comments "Pre-Update Snapshot $(date +'%Y-%m-%d %H:%M')" --tags D || log "\${YELLOW}[!] Timeshift Snapshot übersprungen oder fehlgeschlagen.\${NC}"
else
  log "\${YELLOW}[i] Timeshift nicht installiert. Wir empfehlen Timeshift für automatische System-Rollbacks.\${NC}"
fi

# Schlüsselbunde aktualisieren (verhindert Signaturfehler)
header "SCHRITT 3: Arch Keyring & Spiegelserver aktualisieren"
log "\${BLUE}[*] Aktualisiere archlinux-keyring gegen veraltete GPG-Schlüssel...\${NC}"
pacman -Sy --noconfirm archlinux-keyring

if command -v reflector &>/dev/null; then
  log "\${BLUE}[*] Optimiere Pacman Mirrorlist mit den 10 schnellsten HTTPS-Servern...\${NC}"
  reflector --latest 10 --protocol https --sort rate --save /etc/pacman.d/mirrorlist || true
fi

# Offizielles System-Update (Core, Extra, Multilib)
header "SCHRITT 4: System- & Program-Updates (Pacman)"
log "\${BLUE}[*] Führe vollständiges System-Upgrade durch (pacman -Syu)...\${NC}"
pacman -Syu --noconfirm

# AUR Pakete aktualisieren (falls AUR-Helper vorhanden und als normaler User gerootet)
header "SCHRITT 5: AUR- & Flatpak-Updates"
SUDO_USER_NAME=\${SUDO_USER:-}
if [[ -n "\${SUDO_USER_NAME}" && "\${SUDO_USER_NAME}" != "root" ]]; then
  if command -v paru &>/dev/null; then
    log "\${BLUE}[*] Aktualisiere AUR-Pakete mit paru für Benutzer: \${SUDO_USER_NAME}...\${NC}"
    su - "\${SUDO_USER_NAME}" -c "paru -Sua --noconfirm" || true
  elif command -v yay &>/dev/null; then
    log "\${BLUE}[*] Aktualisiere AUR-Pakete mit yay für Benutzer: \${SUDO_USER_NAME}...\${NC}"
    su - "\${SUDO_USER_NAME}" -c "yay -Sua --noconfirm" || true
  fi
fi

if command -v flatpak &>/dev/null; then
  log "\${BLUE}[*] Aktualisiere Flatpak-Runtimes & Apps...\${NC}"
  flatpak update -y || true
fi

# Treiber & Kernel-Module (DKMS & Initramfs)
header "SCHRITT 6: GPU-, Hardware-Treiber & Kernel-Module"
if command -v dkms &>/dev/null; then
  log "\${BLUE}[*] Kompiliere DKMS-Treibermodule (z.B. Nvidia, Wi-Fi, VirtualBox) für alle Kernel...\${NC}"
  dkms autoinstall || true
fi

log "\${BLUE}[*] Erstelle Initramfs-Images neu (mkinitcpio -P)...\${NC}"
mkinitcpio -P

# Sicherheits-Audit & Viren-Signaturen
header "SCHRITT 7: Sicherheits-Audit & Schutzsysteme"
if command -v arch-audit &>/dev/null; then
  log "\${BLUE}[*] Führe CVE-Sicherheits-Audit der installierten Pakete durch...\${NC}"
  arch-audit | tee -a "\${LOG_FILE}" || true
else
  log "\${YELLOW}[i] Tipp: Installiere 'arch-audit' für automatische CVE-Schwachstellenprüfungen.\${NC}"
fi

if command -v freshclam &>/dev/null; then
  log "\${BLUE}[*] Aktualisiere ClamAV Antivirus-Signaturen...\${NC}"
  freshclam || true
fi

if command -v ufw &>/dev/null; then
  log "\${BLUE}[*] Überprüfe Firewall Status...\${NC}"
  ufw status | tee -a "\${LOG_FILE}"
fi

# Bereinigung alter Paket-Caches & verwaister Abhängigkeiten
header "SCHRITT 8: Systembereinigung"
log "\${BLUE}[*] Bereinige alte Pacman-Caches (behalte letzte 2 Versionen)...\${NC}"
if command -v paccache &>/dev/null; then
  paccache -r -k 2 || true
else
  pacman -Sc --noconfirm || true
fi

ORPHANS=$(pacman -Qtdq 2>/dev/null || true)
if [[ -n "\${ORPHANS}" ]]; then
  log "\${YELLOW}[*] Entferne verwaiste, ungenutzte Abhängigkeiten (Orphans)...\${NC}"
  pacman -Rns --noconfirm \${ORPHANS} || true
else
  log "\${GREEN}[✓] Keine verwaisten Pakete gefunden.\${NC}"
fi

# Wine-Prefix & Proton Überprüfung
header "SCHRITT 9: Wine- & Gaming-Stack Status"
if command -v wine &>/dev/null; then
  WINE_VER=$(wine --version)
  log "\${GREEN}[✓] Wine ist installiert: \${WINE_VER}\${NC}"
fi

header "ZUSAMMENFASSUNG & ABSCHLUSS"
log "\${GREEN}=================================================================\${NC}"
log "\${GREEN}[ERFOLG] Alle Updates, Treiber und Sicherheitsprüfungen abgeschlossen!\${NC}"
log "\${GREEN}Detailliertes Protokoll gespeichert in: \${LOG_FILE}\${NC}"
log "\${GREEN}=================================================================\${NC}"

# Prüfen ob Kernel aktualisiert wurde und Neustart empfohlen wird
RUNNING_KERNEL=$(uname -r)
INSTALLED_KERNEL=$(pacman -Q linux 2>/dev/null | awk '{print $2}' || echo "")
if [[ -n "\${INSTALLED_KERNEL}" && "\${RUNNING_KERNEL}" != *"\${INSTALLED_KERNEL}"* ]]; then
  log "\${YELLOW}[EMPFEHLUNG] Der Linux-Kernel wurde aktualisiert! Bitte System neustarten (sudo reboot).\${NC}"
fi
`;

  const updateDriversSh = `#!/usr/bin/env bash
# ==============================================================================
# Arch Wine OS - Hardware- & Grafiktreiber Updater
# ==============================================================================
set -euo pipefail

echo "=== Arch Wine OS Hardware & Driver Diagnostics ==="

# 1. Erkennung der Grafikkarte
if lspci | grep -iE 'vga|3d|display' | grep -i nvidia >/dev/null; then
  echo "[+] NVIDIA GPU erkannt. Installiere/Aktualisiere NVIDIA Stack (64-Bit & 32-Bit)..."
  sudo pacman -S --needed --noconfirm nvidia-dkms nvidia-utils lib32-nvidia-utils opencl-nvidia lib32-opencl-nvidia nvidia-settings
elif lspci | grep -iE 'vga|3d|display' | grep -i amd >/dev/null; then
  echo "[+] AMD Radeon GPU erkannt. Installiere/Aktualisiere Mesa & RADV Stack..."
  sudo pacman -S --needed --noconfirm mesa lib32-mesa vulkan-radeon lib32-vulkan-radeon xf86-video-amdgpu libva-mesa-driver
elif lspci | grep -iE 'vga|3d|display' | grep -i intel >/dev/null; then
  echo "[+] Intel GPU erkannt. Installiere/Aktualisiere Intel Vulkan & Mesa Stack..."
  sudo pacman -S --needed --noconfirm mesa lib32-mesa vulkan-intel lib32-vulkan-intel intel-media-driver
else
  echo "[i] Standard Mesa 3D Treiber wird aktualisiert..."
  sudo pacman -S --needed --noconfirm mesa lib32-mesa
fi

# 2. CPU Microcode & Linux Firmware
echo "[+] Aktualisiere CPU-Microcode & Hardware-Firmware..."
if grep -i "AuthenticAMD" /proc/cpuinfo >/dev/null; then
  sudo pacman -S --needed --noconfirm amd-ucode linux-firmware
elif grep -i "GenuineIntel" /proc/cpuinfo >/dev/null; then
  sudo pacman -S --needed --noconfirm intel-ucode linux-firmware
else
  sudo pacman -S --needed --noconfirm linux-firmware
fi

# 3. Kernel Modules neu kompilieren
echo "[+] Führe DKMS autoinstall & mkinitcpio aus..."
sudo dkms autoinstall || true
sudo mkinitcpio -P

echo "[✓] Treiber-Aktualisierung erfolgreich abgeschlossen!"
`;

  // systemd Service Definition
  const systemUpdateService = `[Unit]
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
WantedBy=multi-user.target
`;

  // systemd Timer Definition (Automatic vs Manual mode)
  const isAutoMode = (config.updateMode ?? 'automatic') === 'automatic';
  const onCalendar = config.updateOnCalendar || 'Mon *-*-* 04:00:00';
  const persistent = config.updatePersistent !== false;
  const delaySec = config.updateRandomizedDelaySec ?? 1800;
  const bootSec = config.updateOnBootSec ?? 900;

  const systemUpdateTimer = isAutoMode
    ? `[Unit]
Description=Arch Wine OS Scheduled System & Security Update Timer
Documentation=man:systemd.timer(5)
Requires=system-update.service

[Timer]
# Mode: AUTOMATIC (${config.updateFrequency || 'weekly'})
OnCalendar=${onCalendar}
Persistent=${persistent ? 'true' : 'false'}
RandomizedDelaySec=${delaySec}
OnBootSec=${bootSec}s

[Install]
WantedBy=timers.target
`
    : `[Unit]
Description=Arch Wine OS System & Security Update Timer (MANUAL MODE - INACTIVE)
Documentation=man:systemd.timer(5)
# Mode: MANUAL - Automated background updates are disabled.
# To perform updates on demand, run: sudo /usr/local/bin/update_system.sh

[Timer]
# Automatic schedule is disabled in manual mode.
# To enable, switch to Automatic in Wine OS Studio or uncomment below:
# OnCalendar=${onCalendar}
# Persistent=${persistent ? 'true' : 'false'}
# RandomizedDelaySec=${delaySec}

# [Install]
# WantedBy=timers.target
`;

  const setupPs1 = `# PowerShell-Skript: Arch Wine OS Setup
$ErrorActionPreference = "Stop"

Write-Host "Erstelle Ordnerstruktur..." -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path "${config.installDir}_wine_os/airootfs/root" | Out-Null
New-Item -ItemType Directory -Force -Path "${config.installDir}_wine_os/airootfs/usr/local/bin" | Out-Null

# 1. build_iso.sh
@"
${buildIsoSh.trim()}
"@ | Set-Content -Path "build_iso.sh" -Encoding UTF8

# 2. profiledef.sh
@"
${profiledefSh.trim()}
"@ | Set-Content -Path "${config.installDir}_wine_os/profiledef.sh" -Encoding UTF8

# 3. packages.x86_64
@"
${enabledPackages}
"@ | Set-Content -Path "${config.installDir}_wine_os/packages.x86_64" -Encoding UTF8

# 4. pacman.conf
@"
${pacmanConf.trim()}
"@ | Set-Content -Path "${config.installDir}_wine_os/pacman.conf" -Encoding UTF8

# 5. security_setup.sh
@"
${securitySetupSh.trim()}
"@ | Set-Content -Path "${config.installDir}_wine_os/airootfs/root/security_setup.sh" -Encoding UTF8

# 6. update_system.sh
@"
${updateSystemSh.trim()}
"@ | Set-Content -Path "${config.installDir}_wine_os/airootfs/usr/local/bin/update_system.sh" -Encoding UTF8
Set-Content -Path "update_system.sh" -Value @"
${updateSystemSh.trim()}
"@ -Encoding UTF8

# 7. update_drivers.sh
@"
${updateDriversSh.trim()}
"@ | Set-Content -Path "${config.installDir}_wine_os/airootfs/usr/local/bin/update_drivers.sh" -Encoding UTF8

# 8. systemd system-update.service & timer
$systemdPath = "${config.installDir}_wine_os/airootfs/etc/systemd/system"
if (!(Test-Path $systemdPath)) { New-Item -ItemType Directory -Path $systemdPath -Force | Out-Null }

@"
${systemUpdateService.trim()}
"@ | Set-Content -Path "$systemdPath/system-update.service" -Encoding UTF8

@"
${systemUpdateTimer.trim()}
"@ | Set-Content -Path "$systemdPath/system-update.timer" -Encoding UTF8

Write-Host "\`nFertig! Alle Dateien & Update-Skripte wurden erfolgreich erstellt." -ForegroundColor Green
`;

  return {
    buildIsoSh,
    profiledefSh,
    packages: enabledPackages,
    pacmanConf,
    securitySetupSh,
    updateSystemSh,
    updateDriversSh,
    systemUpdateService,
    systemUpdateTimer,
    setupPs1,
  };
}
