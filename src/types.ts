export interface IsoConfig {
  isoName: string;
  isoLabel: string;
  isoPublisher: string;
  isoApplication: string;
  isoVersion: string;
  installDir: string;
  arch: string;
  compression: string;
  blockSize: string;
  bootmodes: string[];
  targetSizeMB?: number;
  autoBackup?: boolean;
  autoBackupIntervalSec?: number;
  lastBackupTimestamp?: string;
  // Update Automation & Timer Settings
  updateMode?: 'automatic' | 'manual';
  updateFrequency?: 'daily' | 'weekly' | 'monthly' | 'boot' | 'custom';
  updateOnCalendar?: string;
  updatePersistent?: boolean;
  updateRandomizedDelaySec?: number;
  updateOnBootSec?: number;
}

export interface PackageItem {
  name: string;
  category: 'base' | 'gaming' | 'security' | 'xorg' | 'utilities';
  description: string;
  enabled: boolean;
  sizeMB?: number;
}

export interface ProjectFiles {
  buildIsoSh: string;
  profiledefSh: string;
  packages: string;
  pacmanConf: string;
  securitySetupSh: string;
  updateSystemSh: string;
  updateDriversSh: string;
  systemUpdateService: string;
  systemUpdateTimer: string;
  setupPs1: string;
}
