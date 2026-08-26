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
  bootmodes: [
    'bios.syslinux.mbr',
    'bios.syslinux.eltorito',
    'uefi-x64.systemd-boot.esp',
    'uefi-x64.systemd-boot.eltorito'
  ]
};

export const initialPackages: PackageItem[] = [
  { name: 'base', category: 'base', description: 'Essential Arch Linux package set', enabled: true },
  { name: 'linux', category: 'base', description: 'Linux kernel', enabled: true },
  { name: 'linux-firmware', category: 'base', description: 'Firmware files for Linux', enabled: true },
  { name: 'wine', category: 'gaming', description: 'Run Windows applications on Linux', enabled: true },
  { name: 'wine-mono', category: 'gaming', description: 'Free implementation of .NET', enabled: true },
  { name: 'wine-gecko', category: 'gaming', description: 'HTML support for Wine applications', enabled: true },
  { name: 'steam', category: 'gaming', description: 'Digital distribution platform for games', enabled: false },
  { name: 'lutris', category: 'gaming', description: 'Open gaming platform for Linux', enabled: false },
  { name: 'gamemode', category: 'gaming', description: 'Optimise game performance on demand', enabled: false },
  { name: 'dxvk', category: 'gaming', description: 'Vulkan-based translation layer for Direct3D', enabled: false },
  { name: 'ufw', category: 'security', description: 'Uncomplicated Firewall for network security', enabled: true },
  { name: 'clamav', category: 'security', description: 'Anti-virus toolkit for UNIX', enabled: true },
  { name: 'fail2ban', category: 'security', description: 'Ban hosts that cause authentication errors', enabled: false },
  { name: 'xorg-server', category: 'xorg', description: 'Xorg X server', enabled: true },
  { name: 'xorg-xinit', category: 'xorg', description: 'X.Org initialisation program', enabled: true },
  { name: 'xterm', category: 'xorg', description: 'Standard X terminal emulator', enabled: true },
  { name: 'i3-wm', category: 'xorg', description: 'Tiling window manager', enabled: false },
  { name: 'picom', category: 'xorg', description: 'X11 compositor', enabled: false },
  { name: 'nano', category: 'utilities', description: 'Pico clone text editor', enabled: false },
  { name: 'htop', category: 'utilities', description: 'Interactive process viewer', enabled: false },
  { name: 'git', category: 'utilities', description: 'Fast, scalable, distributed revision control system', enabled: false },
];

export function generateProjectFiles(config: IsoConfig, packages: PackageItem[]): ProjectFiles {
  const enabledPackages = packages.filter(p => p.enabled).map(p => p.name).join('\n');

  const bootmodesStr = config.bootmodes.map(b => `'${b}'`).join(' ');

  const buildIsoSh = `#!/bin/bash
echo "Baue OS..."
sudo mkarchiso -v -w /tmp/archiso-tmp -o ./out ./${config.installDir}_wine_os
echo "Fertig! ISO liegt in ./out"
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

  const setupPs1 = `# PowerShell-Skript: Arch Wine OS Setup
$ErrorActionPreference = "Stop"

Write-Host "Erstelle Ordnerstruktur..." -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path "${config.installDir}_wine_os/airootfs/root" | Out-Null

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

Write-Host "\`nFertig! Alle Dateien wurden erfolgreich erstellt." -ForegroundColor Green
`;

  return {
    buildIsoSh,
    profiledefSh,
    packages: enabledPackages,
    pacmanConf,
    securitySetupSh,
    setupPs1,
  };
}
