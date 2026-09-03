import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from 'recharts';
import { UpdateLogEntry } from './UpdateHistory';
import { Calendar, Activity, CheckCircle2, RotateCcw } from 'lucide-react';

interface UpdateFrequencyChartProps {
  history: UpdateLogEntry[];
}

interface DayData {
  dateKey: string; // YYYY-MM-DD
  displayDate: string; // DD.MM
  count: number;
  packages: number;
  successCount: number;
  otherCount: number;
}

export const UpdateFrequencyChart: React.FC<UpdateFrequencyChartProps> = ({ history }) => {
  // Aggregate history entries for the last 30 days
  const { chartData, totalUpdates30d, totalPackages30d, activeDaysCount } = useMemo(() => {
    const daysMap: { [key: string]: { count: number; packages: number; successCount: number; otherCount: number } } = {};
    const now = new Date();

    // Create 30 days buckets (from 29 days ago up to today)
    const days: DayData[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;
      const displayDate = `${day}.${month}`;

      daysMap[dateKey] = { count: 0, packages: 0, successCount: 0, otherCount: 0 };
      days.push({
        dateKey,
        displayDate,
        count: 0,
        packages: 0,
        successCount: 0,
        otherCount: 0,
      });
    }

    // Populate with history
    history.forEach((entry) => {
      // timestamp is expected like '2026-08-26 18:30:15' or ISO format
      const entryDateKey = entry.timestamp.slice(0, 10);
      if (daysMap[entryDateKey]) {
        daysMap[entryDateKey].count += 1;
        daysMap[entryDateKey].packages += entry.packagesUpdated || 0;
        if (entry.status === 'success') {
          daysMap[entryDateKey].successCount += 1;
        } else {
          daysMap[entryDateKey].otherCount += 1;
        }
      }
    });

    let totalUpdates = 0;
    let totalPackages = 0;
    let activeDays = 0;

    const data = days.map((d) => {
      const agg = daysMap[d.dateKey];
      const count = agg ? agg.count : 0;
      const packages = agg ? agg.packages : 0;
      const successCount = agg ? agg.successCount : 0;
      const otherCount = agg ? agg.otherCount : 0;

      totalUpdates += count;
      totalPackages += packages;
      if (count > 0) activeDays += 1;

      return {
        dateKey: d.dateKey,
        displayDate: d.displayDate,
        count,
        packages,
        successCount,
        otherCount,
      };
    });

    return {
      chartData: data,
      totalUpdates30d: totalUpdates,
      totalPackages30d: totalPackages,
      activeDaysCount: activeDays,
    };
  }, [history]);

  const maxUpdates = useMemo(() => {
    const max = Math.max(...chartData.map((d) => d.count), 0);
    return Math.max(max, 3);
  }, [chartData]);

  // Custom tooltip for clean dark-theme styling
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: DayData = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-2.5 shadow-xl text-xs space-y-1 z-50">
          <div className="font-bold text-white flex items-center space-x-1.5 pb-1 border-b border-slate-800">
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            <span>{data.dateKey}</span>
          </div>
          <div className="text-slate-300 flex items-center justify-between space-x-4">
            <span className="text-slate-400">Updates:</span>
            <span className="font-bold font-mono text-white">{data.count}</span>
          </div>
          {data.packages > 0 && (
            <div className="text-slate-300 flex items-center justify-between space-x-4">
              <span className="text-slate-400">Pakete aktualisiert:</span>
              <span className="font-bold font-mono text-indigo-300">{data.packages}</span>
            </div>
          )}
          {data.count > 0 && (
            <div className="text-[11px] text-slate-400 pt-0.5">
              {data.successCount > 0 && (
                <span className="text-emerald-400 mr-2">✓ {data.successCount} Erfolgreich</span>
              )}
              {data.otherCount > 0 && (
                <span className="text-amber-400">⚠ {data.otherCount} Rollback/Warnung</span>
              )}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
      {/* Header & Quick stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-indigo-500/10 border border-indigo-500/30 rounded-lg text-indigo-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              Update-Frequenz der letzten 30 Tage
            </h3>
            <p className="text-xs text-slate-400">
              Anzahl durchgeführter System-, Kernel- & Treiber-Aktualisierungen im Zeitverlauf
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <div className="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-md">
            <span className="text-slate-400">Gesamt (30d): </span>
            <span className="font-bold text-white font-mono">{totalUpdates30d}</span>
          </div>
          <div className="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-md">
            <span className="text-slate-400">Aktive Tage: </span>
            <span className="font-bold text-indigo-400 font-mono">{activeDaysCount}</span>
          </div>
          <div className="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-md hidden sm:block">
            <span className="text-slate-400">Pakete: </span>
            <span className="font-bold text-emerald-400 font-mono">{totalPackages30d}</span>
          </div>
        </div>
      </div>

      {/* Bar Chart Container */}
      <div className="h-52 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />
            <XAxis
              dataKey="displayDate"
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
              interval="preserveStartEnd"
              minTickGap={16}
            />
            <YAxis
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
              allowDecimals={false}
              domain={[0, maxUpdates]}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99, 102, 241, 0.08)' }} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={28}>
              {chartData.map((entry) => {
                const isZero = entry.count === 0;
                let fill = '#334155'; // empty state bar
                if (!isZero) {
                  if (entry.otherCount > 0 && entry.successCount === 0) {
                    fill = '#3b82f6'; // rollback blue
                  } else if (entry.otherCount > 0) {
                    fill = '#f59e0b'; // warning amber
                  } else {
                    fill = '#6366f1'; // primary indigo
                  }
                }
                return (
                  <Cell
                    key={`cell-${entry.dateKey}`}
                    fill={fill}
                    opacity={isZero ? 0.3 : 1}
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend / Info Footer */}
      <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded bg-indigo-500 inline-block" />
            <span>Erfolgreiche Updates</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded bg-blue-500 inline-block" />
            <span>Rollbacks / Wiederherstellung</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded bg-slate-700 inline-block opacity-40" />
            <span>Keine Updates</span>
          </div>
        </div>
        <span className="text-slate-500 font-mono text-[10px]">Intervall: 30 Tage Rolling Window</span>
      </div>
    </div>
  );
};
