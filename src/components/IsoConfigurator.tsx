import React from 'react';
import { IsoConfig } from '../types';
import { Sliders, Cpu, Disc, ShieldCheck } from 'lucide-react';

interface IsoConfiguratorProps {
  config: IsoConfig;
  setConfig: React.Dispatch<React.SetStateAction<IsoConfig>>;
}

export const IsoConfigurator: React.FC<IsoConfiguratorProps> = ({ config, setConfig }) => {
  const handleChange = (field: keyof IsoConfig, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
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
  );
};
