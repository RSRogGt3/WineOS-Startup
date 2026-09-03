import React, { useState, useMemo } from 'react';
import * as d3 from 'd3';
import {
  HardDrive,
  PieChart as PieChartIcon,
  BarChart3,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Info,
  Layers,
  Package,
} from 'lucide-react';
import { PackageItem, IsoConfig } from '../types';

interface IsoSizeDashboardProps {
  packages: PackageItem[];
  config?: IsoConfig;
  onTogglePackage?: (packageName: string) => void;
  targetSizeMB?: number;
  onTargetSizeChange?: (newTargetMB: number) => void;
}

// Category color mappings
const CATEGORY_COLORS: Record<PackageItem['category'], { fill: string; border: string; text: string; bg: string }> = {
  base: { fill: '#3b82f6', border: '#60a5fa', text: 'text-blue-400', bg: 'bg-blue-500/10' }, // Blue
  gaming: { fill: '#8b5cf6', border: '#a78bfa', text: 'text-violet-400', bg: 'bg-violet-500/10' }, // Violet
  security: { fill: '#10b981', border: '#34d399', text: 'text-emerald-400', bg: 'bg-emerald-500/10' }, // Emerald
  xorg: { fill: '#f59e0b', border: '#fbbf24', text: 'text-amber-400', bg: 'bg-amber-500/10' }, // Amber
  utilities: { fill: '#06b6d4', border: '#22d3ee', text: 'text-cyan-400', bg: 'bg-cyan-500/10' }, // Cyan
};

const CATEGORY_LABELS: Record<PackageItem['category'], string> = {
  base: 'Base System',
  gaming: 'Wine & Gaming',
  security: 'Security & UFW',
  xorg: 'X11 / GUI',
  utilities: 'Utilities',
};

// SquashFS compression ratios by algorithm
const COMPRESSION_RATIOS: Record<string, { ratio: number; label: string }> = {
  zstd: { ratio: 0.38, label: 'Zstandard (~38% size)' },
  xz: { ratio: 0.33, label: 'XZ / LZMA2 (~33% size)' },
  gzip: { ratio: 0.45, label: 'Gzip (~45% size)' },
  lz4: { ratio: 0.55, label: 'LZ4 Fast (~55% size)' },
  lzo: { ratio: 0.52, label: 'LZO (~52% size)' },
};

const ISO_TARGET_PRESETS = [
  { label: '700 MB (CD-ROM)', value: 700 },
  { label: '1.5 GB (Compact)', value: 1536 },
  { label: '2.0 GB (Live USB)', value: 2048 },
  { label: '4.0 GB (Standard USB)', value: 4096 },
  { label: '8.5 GB (DVD-DL)', value: 8704 },
];

export const IsoSizeDashboard: React.FC<IsoSizeDashboardProps> = ({
  packages,
  config,
  onTogglePackage,
  targetSizeMB: initialTargetMB,
  onTargetSizeChange,
}) => {
  const [localTargetMB, setLocalTargetMB] = useState<number>(
    initialTargetMB || config?.targetSizeMB || 2048
  );
  const [chartView, setChartView] = useState<'category' | 'topPackages' | 'comparison'>('category');
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [tooltipState, setTooltipState] = useState<{
    x: number;
    y: number;
    title: string;
    subtitle?: string;
    uncompressed: number;
    compressed: number;
    pctTarget: number;
    pctInstalled: number;
    count?: number;
    color: string;
  } | null>(null);

  const currentTargetMB = initialTargetMB || localTargetMB;

  const handleSetTarget = (size: number) => {
    setLocalTargetMB(size);
    if (onTargetSizeChange) {
      onTargetSizeChange(size);
    }
  };

  const compressionAlgo = config?.compression || 'zstd';
  const compInfo = COMPRESSION_RATIOS[compressionAlgo] || COMPRESSION_RATIOS.zstd;
  const BOOTLOADER_OVERHEAD_MB = 65; // EFI + Syslinux + Kernel + initramfs core

  // Enabled packages calculations
  const enabledPackages = useMemo(() => {
    return packages.filter(p => p.enabled);
  }, [packages]);

  // Aggregate stats
  const metrics = useMemo(() => {
    const uncompressedPackagesMB = enabledPackages.reduce((acc, p) => acc + (p.sizeMB || 30), 0);
    const compressedPayloadMB = Math.round(uncompressedPackagesMB * compInfo.ratio);
    const estimatedIsoTotalMB = compressedPayloadMB + BOOTLOADER_OVERHEAD_MB;
    const remainingMB = currentTargetMB - estimatedIsoTotalMB;
    const usagePercent = Math.min(100, (estimatedIsoTotalMB / currentTargetMB) * 100);
    const isOverBudget = estimatedIsoTotalMB > currentTargetMB;

    return {
      uncompressedPackagesMB,
      compressedPayloadMB,
      estimatedIsoTotalMB,
      remainingMB,
      usagePercent,
      isOverBudget,
      packageCount: enabledPackages.length,
    };
  }, [enabledPackages, compInfo.ratio, currentTargetMB]);

  // Data for Category Donut Chart
  const categoryData = useMemo(() => {
    const catMap: Record<PackageItem['category'], { count: number; totalMB: number }> = {
      base: { count: 0, totalMB: 0 },
      gaming: { count: 0, totalMB: 0 },
      security: { count: 0, totalMB: 0 },
      xorg: { count: 0, totalMB: 0 },
      utilities: { count: 0, totalMB: 0 },
    };

    enabledPackages.forEach(p => {
      const size = p.sizeMB || 30;
      if (catMap[p.category]) {
        catMap[p.category].count += 1;
        catMap[p.category].totalMB += size;
      }
    });

    return Object.entries(catMap)
      .filter(([_, val]) => val.totalMB > 0)
      .map(([catKey, val]) => {
        const cat = catKey as PackageItem['category'];
        const compressedMB = Math.round(val.totalMB * compInfo.ratio);
        const percentOfInstalled = metrics.uncompressedPackagesMB > 0
          ? Math.round((val.totalMB / metrics.uncompressedPackagesMB) * 100)
          : 0;
        const percentOfIsoTarget = currentTargetMB > 0
          ? Number(((compressedMB / currentTargetMB) * 100).toFixed(1))
          : 0;

        return {
          category: cat,
          name: CATEGORY_LABELS[cat],
          uncompressedMB: val.totalMB,
          compressedMB,
          count: val.count,
          percentOfInstalled,
          percentOfIsoTarget,
          fill: CATEGORY_COLORS[cat].fill,
        };
      })
      .sort((a, b) => b.uncompressedMB - a.uncompressedMB);
  }, [enabledPackages, compInfo.ratio, metrics.uncompressedPackagesMB, currentTargetMB]);

  // D3 Pie Arcs computation
  const pieArcs = useMemo(() => {
    if (categoryData.length === 0) return [];
    const pie = d3
      .pie<(typeof categoryData)[0]>()
      .value(d => d.uncompressedMB)
      .sort(null)
      .padAngle(0.03);

    const arcGenerator = d3
      .arc<d3.PieArcDatum<(typeof categoryData)[0]>>()
      .innerRadius(68)
      .outerRadius(98)
      .cornerRadius(4);

    const hoverArcGenerator = d3
      .arc<d3.PieArcDatum<(typeof categoryData)[0]>>()
      .innerRadius(65)
      .outerRadius(104)
      .cornerRadius(4);

    const arcs = pie(categoryData);
    return arcs.map(arc => {
      const path = arcGenerator(arc) || '';
      const hoverPath = hoverArcGenerator(arc) || '';
      return {
        ...arc,
        path,
        hoverPath,
      };
    });
  }, [categoryData]);

  // Data for Top Packages Bar Chart
  const topPackagesData = useMemo(() => {
    return [...enabledPackages]
      .map(p => {
        const size = p.sizeMB || 30;
        const compressed = Math.round(size * compInfo.ratio);
        return {
          name: p.name,
          category: p.category,
          categoryLabel: CATEGORY_LABELS[p.category],
          uncompressedMB: size,
          compressedMB: compressed,
          percentOfTarget: Number(((compressed / currentTargetMB) * 100).toFixed(1)),
          fill: CATEGORY_COLORS[p.category].fill,
        };
      })
      .sort((a, b) => b.uncompressedMB - a.uncompressedMB)
      .slice(0, 10);
  }, [enabledPackages, compInfo.ratio, currentTargetMB]);

  const maxPackageSize = useMemo(() => {
    if (topPackagesData.length === 0) return 600;
    return Math.max(...topPackagesData.map(p => p.uncompressedMB), 100);
  }, [topPackagesData]);

  return (
    <div className="space-y-6">
      {/* Top ISO Budget & Capacity Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-indigo-600/15 border border-indigo-500/30 rounded-lg text-indigo-400">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Package Size & ISO Target Distribution
                </h3>
                <p className="text-xs text-slate-400">
                  D3-powered SquashFS size modeling based on <span className="text-indigo-300 font-semibold">{compInfo.label}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Target Size Presets and Selector */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800 self-start lg:self-auto">
            <span className="text-xs text-slate-400 px-2 font-medium flex items-center space-x-1">
              <Sliders className="w-3 h-3 text-slate-500" />
              <span>Target ISO:</span>
            </span>
            {ISO_TARGET_PRESETS.map(preset => (
              <button
                key={preset.value}
                type="button"
                onClick={() => handleSetTarget(preset.value)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  currentTargetMB === preset.value
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* 4-Stat Metric Summary Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3.5 space-y-1">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Uncompressed RootFS</span>
            <div className="text-lg font-bold font-mono text-white">
              {(metrics.uncompressedPackagesMB / 1024).toFixed(2)} <span className="text-xs text-slate-400 font-sans font-normal">GB ({metrics.uncompressedPackagesMB} MB)</span>
            </div>
            <span className="text-[11px] text-slate-500 block">{metrics.packageCount} active packages</span>
          </div>

          <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3.5 space-y-1">
            <span className="text-[11px] font-medium text-indigo-400 uppercase tracking-wider">Compressed SquashFS</span>
            <div className="text-lg font-bold font-mono text-indigo-300">
              {metrics.compressedPayloadMB} <span className="text-xs text-indigo-400 font-sans font-normal">MB (~{Math.round(compInfo.ratio * 100)}%)</span>
            </div>
            <span className="text-[11px] text-slate-500 block">+{BOOTLOADER_OVERHEAD_MB}MB boot/kernel</span>
          </div>

          <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3.5 space-y-1">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Projected ISO Output</span>
            <div className={`text-lg font-bold font-mono ${metrics.isOverBudget ? 'text-rose-400' : 'text-emerald-400'}`}>
              {(metrics.estimatedIsoTotalMB / 1024).toFixed(2)} <span className="text-xs font-sans font-normal text-slate-400">GB ({metrics.estimatedIsoTotalMB} MB)</span>
            </div>
            <span className="text-[11px] text-slate-500 block">{metrics.usagePercent.toFixed(1)}% of target</span>
          </div>

          <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3.5 space-y-1">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Target Headroom</span>
            <div className={`text-lg font-bold font-mono ${metrics.remainingMB < 0 ? 'text-rose-400' : 'text-slate-200'}`}>
              {metrics.remainingMB >= 0 ? `+${metrics.remainingMB} MB` : `${metrics.remainingMB} MB`}
            </div>
            <span className={`text-[11px] block ${metrics.isOverBudget ? 'text-rose-400 font-medium' : 'text-slate-500'}`}>
              {metrics.isOverBudget ? 'Exceeds Target Media!' : 'Available for data'}
            </span>
          </div>
        </div>

        {/* Visual Media Fill Gauge */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2 text-slate-300 font-medium">
              <span>Target Allocation:</span>
              <span className="font-mono text-white">{metrics.estimatedIsoTotalMB} MB / {currentTargetMB} MB</span>
            </div>
            <div className="flex items-center space-x-2">
              {metrics.isOverBudget ? (
                <span className="text-rose-400 font-semibold flex items-center space-x-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Media Overflow by {Math.abs(metrics.remainingMB)} MB</span>
                </span>
              ) : (
                <span className="text-emerald-400 font-medium flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Fits within {(currentTargetMB / 1024).toFixed(1)} GB target</span>
                </span>
              )}
            </div>
          </div>

          <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800 flex">
            {/* Bootloader overhead segment */}
            <div
              className="h-full bg-slate-600 transition-all duration-300"
              style={{ width: `${(BOOTLOADER_OVERHEAD_MB / currentTargetMB) * 100}%` }}
              title={`Bootloader & Kernel Overhead: ${BOOTLOADER_OVERHEAD_MB} MB`}
            />
            {/* Category segments */}
            {categoryData.map(cat => (
              <div
                key={cat.category}
                className="h-full transition-all duration-300"
                style={{
                  width: `${(cat.compressedMB / currentTargetMB) * 100}%`,
                  backgroundColor: cat.fill,
                }}
                title={`${cat.name}: ${cat.compressedMB} MB compressed (${cat.percentOfIsoTarget}% of target)`}
              />
            ))}
          </div>

          {/* Visual Legend for Gauge */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1 text-[11px] text-slate-400">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-slate-600" />
              <span>Boot/EFI ({BOOTLOADER_OVERHEAD_MB}MB)</span>
            </div>
            {categoryData.map(cat => (
              <div key={cat.category} className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-xs" style={{ backgroundColor: cat.fill }} />
                <span>{cat.name} ({cat.compressedMB}MB)</span>
              </div>
            ))}
            {metrics.remainingMB > 0 && (
              <div className="flex items-center space-x-1.5 text-slate-500">
                <span className="w-2.5 h-2.5 rounded-xs bg-slate-800 border border-slate-700" />
                <span>Free Space ({metrics.remainingMB}MB)</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Charts & Visualizations Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5 relative">
        {/* Chart View Mode Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Visualization:</span>
            <div className="inline-flex bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => setChartView('category')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                  chartView === 'category'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <PieChartIcon className="w-3.5 h-3.5" />
                <span>Category Distribution</span>
              </button>

              <button
                type="button"
                onClick={() => setChartView('topPackages')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                  chartView === 'topPackages'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Top Heaviest Packages</span>
              </button>

              <button
                type="button"
                onClick={() => setChartView('comparison')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                  chartView === 'comparison'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Target Composition</span>
              </button>
            </div>
          </div>

          <span className="text-xs text-slate-500">
            {chartView === 'category' && 'Breakdown of installed footprint across subsystem groups'}
            {chartView === 'topPackages' && 'Individual packages with the largest impact on ISO size'}
            {chartView === 'comparison' && 'Compressed category sizes vs total media capacity'}
          </span>
        </div>

        {/* Floating Custom Tooltip */}
        {tooltipState && (
          <div
            className="pointer-events-none fixed z-50 bg-slate-950/95 backdrop-blur-md border border-slate-700 rounded-lg p-3 text-xs shadow-2xl space-y-1 transform -translate-x-1/2 -translate-y-full -mt-2 min-w-[200px]"
            style={{ left: tooltipState.x, top: tooltipState.y }}
          >
            <div className="font-bold text-white flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: tooltipState.color }} />
              <span>{tooltipState.title}</span>
            </div>
            {tooltipState.subtitle && (
              <div className="text-slate-400 text-[11px]">{tooltipState.subtitle}</div>
            )}
            <div className="text-slate-300 font-mono pt-1">
              Uncompressed: <span className="text-white font-bold">{tooltipState.uncompressed} MB</span> ({tooltipState.pctInstalled}%)
            </div>
            <div className="text-indigo-300 font-mono">
              SquashFS Est: <span className="font-bold">{tooltipState.compressed} MB</span> ({tooltipState.pctTarget}% of ISO target)
            </div>
            {tooltipState.count !== undefined && (
              <div className="text-slate-400 text-[11px]">
                Active Packages: {tooltipState.count}
              </div>
            )}
          </div>
        )}

        {/* View 1: D3 / SVG Category Donut & Stat Cards */}
        {chartView === 'category' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* D3 Donut Chart SVG */}
            <div className="lg:col-span-6 h-72 w-full flex items-center justify-center relative">
              <svg viewBox="-120 -120 240 240" className="w-64 h-64 overflow-visible">
                {pieArcs.map(arc => {
                  const isHovered = hoveredCategory === arc.data.category;
                  return (
                    <path
                      key={arc.data.category}
                      d={isHovered ? arc.hoverPath : arc.path}
                      fill={arc.data.fill}
                      stroke="#0f172a"
                      strokeWidth="2.5"
                      className="transition-all duration-200 cursor-pointer"
                      opacity={hoveredCategory ? (isHovered ? 1 : 0.35) : 1}
                      onMouseEnter={(e) => {
                        setHoveredCategory(arc.data.category);
                        const rect = e.currentTarget.getBoundingClientRect();
                        setTooltipState({
                          x: rect.left + rect.width / 2,
                          y: rect.top,
                          title: arc.data.name,
                          uncompressed: arc.data.uncompressedMB,
                          compressed: arc.data.compressedMB,
                          pctTarget: arc.data.percentOfIsoTarget,
                          pctInstalled: arc.data.percentOfInstalled,
                          count: arc.data.count,
                          color: arc.data.fill,
                        });
                      }}
                      onMouseMove={(e) => {
                        setTooltipState(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null);
                      }}
                      onMouseLeave={() => {
                        setHoveredCategory(null);
                        setTooltipState(null);
                      }}
                    />
                  );
                })}
              </svg>

              {/* Donut Center Overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                <span className="text-xs text-slate-400 font-medium">RootFS Total</span>
                <span className="text-2xl font-bold font-mono text-white">{metrics.uncompressedPackagesMB}</span>
                <span className="text-[10px] text-slate-500 font-mono">MB</span>
              </div>
            </div>

            {/* Category Breakdown Cards */}
            <div className="lg:col-span-6 space-y-2.5">
              {categoryData.map(cat => {
                const isHovered = hoveredCategory === cat.category;
                return (
                  <div
                    key={cat.category}
                    onMouseEnter={() => setHoveredCategory(cat.category)}
                    onMouseLeave={() => setHoveredCategory(null)}
                    className={`bg-slate-950 border rounded-xl p-3 flex items-center justify-between transition-all ${
                      isHovered ? 'border-indigo-500/50 bg-slate-950/90' : 'border-slate-800'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: cat.fill }}
                      />
                      <div>
                        <div className="text-sm font-semibold text-white flex items-center space-x-2">
                          <span>{cat.name}</span>
                          <span className="text-[11px] text-slate-400 font-normal">({cat.count} pkgs)</span>
                        </div>
                        <div className="text-xs text-slate-400 flex items-center space-x-2 mt-0.5">
                          <span>Uncompressed: <span className="font-mono text-slate-300">{cat.uncompressedMB} MB</span></span>
                          <span>•</span>
                          <span className="text-indigo-300">ISO share: <span className="font-mono">{cat.percentOfIsoTarget}%</span></span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-mono font-bold text-white">~{cat.compressedMB} MB</span>
                      <span className="block text-[10px] text-slate-500 uppercase tracking-wider">Compressed</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* View 2: Top Heaviest Packages Horizontal Bar Chart */}
        {chartView === 'topPackages' && (
          <div className="space-y-4">
            <div className="space-y-2.5 pt-2">
              {topPackagesData.map((pkg) => {
                const barPercent = Math.min(100, (pkg.uncompressedMB / maxPackageSize) * 100);
                return (
                  <div
                    key={pkg.name}
                    className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 hover:border-slate-700 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setTooltipState({
                        x: rect.left + rect.width / 2,
                        y: rect.top,
                        title: pkg.name,
                        subtitle: pkg.categoryLabel,
                        uncompressed: pkg.uncompressedMB,
                        compressed: pkg.compressedMB,
                        pctTarget: pkg.percentOfTarget,
                        pctInstalled: Math.round((pkg.uncompressedMB / metrics.uncompressedPackagesMB) * 100),
                        color: pkg.fill,
                      });
                    }}
                    onMouseMove={(e) => {
                      setTooltipState(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null);
                    }}
                    onMouseLeave={() => setTooltipState(null)}
                  >
                    <div className="w-48 shrink-0 flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: pkg.fill }} />
                      <span className="text-xs font-bold font-mono text-white truncate">{pkg.name}</span>
                      <span className="text-[10px] text-slate-500 uppercase">({pkg.category})</span>
                    </div>

                    {/* Proportional Bar */}
                    <div className="flex-1 bg-slate-900 h-4 rounded-md overflow-hidden flex items-center border border-slate-800">
                      <div
                        className="h-full rounded-xs transition-all duration-300"
                        style={{
                          width: `${barPercent}%`,
                          backgroundColor: pkg.fill,
                        }}
                      />
                    </div>

                    <div className="w-40 shrink-0 text-right font-mono text-xs text-slate-300">
                      <span className="font-bold text-white">{pkg.uncompressedMB} MB</span>
                      <span className="text-slate-500 text-[11px] ml-1.5">(~{pkg.compressedMB} MB cmp)</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="text-xs text-slate-500 text-center">
              Showing the 10 largest packages selected for inclusion in the live rootfs filesystem.
            </p>
          </div>
        )}

        {/* View 3: Target Composition Breakdown */}
        {chartView === 'comparison' && (
          <div className="space-y-5">
            <div className="space-y-3">
              <div className="flex justify-between text-xs text-slate-400 font-mono">
                <span>0 MB</span>
                <span>{(currentTargetMB / 2).toFixed(0)} MB</span>
                <span>{currentTargetMB} MB (Target Capacity)</span>
              </div>

              {/* Stacked Capacity Bar */}
              <div className="w-full bg-slate-950 h-8 rounded-xl overflow-hidden border border-slate-800 flex shadow-inner">
                <div
                  className="h-full bg-slate-600 flex items-center justify-center text-[10px] font-bold text-white px-1 overflow-hidden"
                  style={{ width: `${(BOOTLOADER_OVERHEAD_MB / currentTargetMB) * 100}%` }}
                  title={`Bootloader & Kernel: ${BOOTLOADER_OVERHEAD_MB} MB`}
                >
                  Boot
                </div>
                {categoryData.map(cat => {
                  const widthPct = (cat.compressedMB / currentTargetMB) * 100;
                  return (
                    <div
                      key={cat.category}
                      className="h-full flex items-center justify-center text-[10px] font-bold text-white px-1 overflow-hidden transition-all"
                      style={{
                        width: `${widthPct}%`,
                        backgroundColor: cat.fill,
                      }}
                      title={`${cat.name}: ${cat.compressedMB} MB compressed`}
                    >
                      {widthPct > 5 ? cat.name.split(' ')[0] : ''}
                    </div>
                  );
                })}
                {metrics.remainingMB > 0 && (
                  <div
                    className="h-full bg-slate-900 border-l border-slate-800 flex items-center justify-center text-[10px] text-slate-400 px-1 font-mono"
                    style={{ width: `${(metrics.remainingMB / currentTargetMB) * 100}%` }}
                    title={`Free Space: ${metrics.remainingMB} MB`}
                  >
                    Free ({metrics.remainingMB} MB)
                  </div>
                )}
              </div>
            </div>

            {/* Allocation Table Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Boot / EFI Core</span>
                <span className="text-sm font-bold font-mono text-slate-300">{BOOTLOADER_OVERHEAD_MB} MB</span>
                <span className="text-[10px] text-slate-500 block">{((BOOTLOADER_OVERHEAD_MB / currentTargetMB) * 100).toFixed(1)}% of ISO</span>
              </div>
              {categoryData.slice(0, 3).map(cat => (
                <div key={cat.category} className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block truncate">{cat.name}</span>
                  <span className="text-sm font-bold font-mono text-white">~{cat.compressedMB} MB</span>
                  <span className="text-[10px] text-indigo-400 block">{cat.percentOfIsoTarget}% of ISO</span>
                </div>
              ))}
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-2">
              <div className="flex items-center space-x-2 text-indigo-300 font-semibold">
                <Info className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Arch Linux ISO Architecture Overview</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                When building with <code className="text-slate-300 font-mono">mkarchiso</code>, the rootfs directory is compressed into a SquashFS image located in <code className="text-slate-300 font-mono">/arch/x86_64/airootfs.sfs</code>. The remaining ISO space accommodates UEFI ESP boot partitions, Syslinux MBR images, the Linux kernel, and the initramfs compressed ramdisk.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Package Size Manifest Quick Toggle Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Package className="w-4 h-4 text-indigo-400" />
            <h4 className="text-sm font-bold text-white">Selected Package Footprint Matrix</h4>
          </div>
          <span className="text-xs text-slate-400">
            Click checkbox to toggle package inclusion and recompute ISO budget
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="pb-3 px-3">Status</th>
                <th className="pb-3 px-3">Package Name</th>
                <th className="pb-3 px-3">Category</th>
                <th className="pb-3 px-3 text-right">Installed Size</th>
                <th className="pb-3 px-3 text-right">SquashFS Est.</th>
                <th className="pb-3 px-3 text-right">% of ISO Target</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {packages.map(pkg => {
                const size = pkg.sizeMB || 30;
                const compressed = Math.round(size * compInfo.ratio);
                const percentOfTarget = Number(((compressed / currentTargetMB) * 100).toFixed(1));
                const catColor = CATEGORY_COLORS[pkg.category];

                return (
                  <tr
                    key={pkg.name}
                    className={`hover:bg-slate-950/60 transition-colors ${
                      pkg.enabled ? 'text-slate-200' : 'text-slate-500 opacity-50'
                    }`}
                  >
                    <td className="py-2.5 px-3 font-sans">
                      <input
                        type="checkbox"
                        checked={pkg.enabled}
                        onChange={() => onTogglePackage && onTogglePackage(pkg.name)}
                        className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </td>
                    <td className="py-2.5 px-3 font-bold text-white font-mono">
                      {pkg.name}
                    </td>
                    <td className="py-2.5 px-3 font-sans">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${catColor.bg} ${catColor.text}`}>
                        {pkg.category}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-300">
                      {size} MB
                    </td>
                    <td className="py-2.5 px-3 text-right text-indigo-300 font-bold">
                      ~{compressed} MB
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-400">
                      {percentOfTarget}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
