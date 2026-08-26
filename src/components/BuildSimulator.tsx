import React, { useState, useEffect } from 'react';
import { Terminal, Play, RefreshCw, CheckCircle2, AlertCircle, Layers } from 'lucide-react';

export const BuildSimulator: React.FC = () => {
  const [isBuilding, setIsBuilding] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [buildComplete, setBuildComplete] = useState(false);

  const startBuild = () => {
    setIsBuilding(true);
    setLogs(['Initializing mkarchiso environment...']);
    setProgress(10);
    setBuildComplete(false);
  };

  useEffect(() => {
    if (!isBuilding) return;

    const steps = [
      { text: 'Creating working directory /tmp/archiso-tmp...', progress: 25 },
      { text: 'Configuring pacman mirrors from pacman.conf...', progress: 40 },
      { text: 'Installing base, linux, wine, ufw, clamav packages...', progress: 65 },
      { text: 'Copying airootfs security setup scripts and configurations...', progress: 85 },
      { text: 'Generating SquashFS compressed image and bootable ISO in ./out...', progress: 95 },
      { text: 'Fertig! ISO successfully built and saved to ./out/wine-os-alpha.iso', progress: 100 },
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        const step = steps[currentStep];
        setLogs(prev => [...prev, step.text]);
        setProgress(step.progress);
        currentStep++;
      } else {
        clearInterval(interval);
        setIsBuilding(false);
        setBuildComplete(true);
      }
    }, 1200);

    return () => clearInterval(interval);
  }, [isBuilding]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center space-x-2">
            <Terminal className="w-5 h-5 text-indigo-400" />
            <span>Interactive mkarchiso Build Simulator</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Simulate running `sudo mkarchiso -v -w /tmp/archiso-tmp -o ./out ./arch_wine_os` in real time.
          </p>
        </div>

        <button
          onClick={startBuild}
          disabled={isBuilding}
          className={`flex items-center space-x-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-lg cursor-pointer ${
            isBuilding
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
          }`}
        >
          {isBuilding ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          <span>{isBuilding ? 'Building ISO...' : 'Start Build Simulation'}</span>
        </button>
      </div>

      {/* Progress Bar */}
      {(isBuilding || buildComplete || logs.length > 0) && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-slate-400 font-mono">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
            <div
              className={`h-full transition-all duration-500 ${
                buildComplete ? 'bg-emerald-500' : 'bg-indigo-600'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Terminal Output */}
      <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 font-mono text-xs sm:text-sm text-slate-300 h-80 overflow-y-auto space-y-2 shadow-inner">
        <div className="text-slate-500">$ sudo mkarchiso -v -w /tmp/archiso-tmp -o ./out ./arch_wine_os</div>
        {logs.map((log, index) => (
          <div key={index} className="flex items-start space-x-2">
            <span className="text-indigo-400 select-none">&gt;</span>
            <span className={log.includes('Fertig!') ? 'text-emerald-400 font-bold' : 'text-slate-200'}>
              {log}
            </span>
          </div>
        ))}
        {isBuilding && (
          <div className="flex items-center space-x-2 text-slate-500 animate-pulse">
            <span>_</span>
          </div>
        )}
      </div>

      {buildComplete && (
        <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-4 flex items-center space-x-3 text-emerald-300">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
          <div className="text-sm">
            <span className="font-semibold">ISO Build Successful!</span> The bootable Arch Wine OS ISO is ready in <code className="bg-slate-900 px-1.5 py-0.5 rounded text-xs font-mono">./out/wine-os-alpha.iso</code>.
          </div>
        </div>
      )}
    </div>
  );
};
