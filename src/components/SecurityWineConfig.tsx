import React from 'react';
import { Shield, Lock, Terminal, Wine, CheckCircle2, AlertTriangle } from 'lucide-react';

interface SecurityWineConfigProps {
  securityScript: string;
  setSecurityScript: (script: string) => void;
}

export const SecurityWineConfig: React.FC<SecurityWineConfigProps> = ({
  securityScript,
  setSecurityScript,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Security Hardening (UFW & ClamAV) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
        <div>
          <div className="flex items-center space-x-2 text-indigo-400 mb-1">
            <Shield className="w-5 h-5" />
            <h2 className="text-lg font-bold text-white">Security Hardening (airootfs)</h2>
          </div>
          <p className="text-sm text-slate-400">
            Automated firewall and anti-virus initialization script executed on first boot or live system setup.
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">UFW Firewall</span>
              <span className="px-2 py-0.5 text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full font-medium flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Default Deny Incoming</span>
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Blocks all incoming unsolicited connections while allowing outgoing traffic (`ufw default deny incoming`, `ufw default allow outgoing`, `ufw enable`).
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">ClamAV Antivirus</span>
              <span className="px-2 py-0.5 text-xs bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 rounded-full font-medium flex items-center space-x-1">
                <Lock className="w-3.5 h-3.5" />
                <span>FreshClam Signature Sync</span>
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Runs `freshclam` on initialization to update virus definition databases for local scanning.
            </p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Edit security_setup.sh
          </label>
          <textarea
            value={securityScript}
            onChange={e => setSecurityScript(e.target.value)}
            rows={5}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 font-mono focus:outline-none focus:border-indigo-500 leading-relaxed"
          />
        </div>
      </div>

      {/* Wine Gaming Environment */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
        <div>
          <div className="flex items-center space-x-2 text-indigo-400 mb-1">
            <Wine className="w-5 h-5" />
            <h2 className="text-lg font-bold text-white">Wine Gaming Environment</h2>
          </div>
          <p className="text-sm text-slate-400">
            Pre-configured Windows compatibility layers (`wine`, `wine-mono`, `wine-gecko`) optimized for gaming & apps.
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">Recommended Wine Environment Variables</h3>
            <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 font-mono text-xs text-indigo-300 space-y-1">
              <div>export WINEPREFIX="$HOME/.wine"</div>
              <div>export WINEARCH="win64"</div>
              <div>export DXVK_HUD=1</div>
            </div>
            <p className="text-xs text-slate-400">
              DXVK provides Vulkan-based Direct3D 9/10/11 translation for smooth high-framerate Windows gaming on Arch Linux.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center space-x-2 text-amber-400 text-xs font-medium">
              <AlertTriangle className="w-4 h-4" />
              <span>Multilib Repository Note</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              `pacman.conf` includes the `[multilib]` repository enabled by default so 32-bit Wine dependencies and Windows games install correctly without missing library errors.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">Quick Wine Test Command</h3>
            <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 font-mono text-xs text-slate-200">
              wine notepad.exe
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
