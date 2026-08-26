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
}

export interface PackageItem {
  name: string;
  category: 'base' | 'gaming' | 'security' | 'xorg' | 'utilities';
  description: string;
  enabled: boolean;
}

export interface ProjectFiles {
  buildIsoSh: string;
  profiledefSh: string;
  packages: string;
  pacmanConf: string;
  securitySetupSh: string;
  setupPs1: string;
}
