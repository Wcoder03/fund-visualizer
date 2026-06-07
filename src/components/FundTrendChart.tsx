import { useMemo, useState } from 'react';
import type { FundTrendPoint } from '../types/fund';

type TimeRange = '1m' | '3m' | '6m' | '1y' | 'all';

const RANGE_OPTIONS: { key: TimeRange; label: string; days: number }[] = [
  { key: '1m', label: '近1月', days: 30 },
  { key: '3m', label: '近3月', days: 90 },
  { key: '6m', label: '近6月', days: 180 },
  { key: '1y', label: '近1年', days: 365 },
  { key: 'all', label: '成立以来', days: 0 },
];

function filterByRange(data: FundTrendPoint[], days: number): FundTrendPoint[] {
  if (days === 0) return data;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  return data.filter(p => p.date >= cutoffStr);
}

interface FundTrendChartProps {
  data: FundTrendPoint[];
  fundName: string;
}

export default function FundTrendChart({ data, fundName }: FundTrendChartProps) {
  const [range, setRange] = useState<TimeRange>('6m');

  const filtered = useMemo(() => {
    const opt = RANGE_OPTIONS.find(r => r.key === range);
    return filterByRange(data, opt?.days ?? 0);
  }, [data, range]);

  if (data.length < 2) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/50">
        <p className="text-[13px] text-slate-400">暂无业绩走势数据</p>
      </div>
    );
  }

  const navs = filtered.map(p => p.nav);
  const minNav = Math.min(...navs);
  const maxNav = Math.max(...navs);
  const range_nav = maxNav - minNav || 1;

  // Calculate return for the period
  const startNav = filtered[0]?.nav ?? 0;
  const endNav = filtered[filtered.length - 1]?.nav ?? 0;
  const periodReturn = startNav > 0 ? ((endNav - startNav) / startNav) * 100 : 0;
  const returnColor = periodReturn > 0 ? 'text-red-600' : periodReturn < 0 ? 'text-green-600' : 'text-slate-500';

  // SVG chart dimensions
  const W = 800;
  const H = 280;
  const PAD = { top: 20, right: 20, bottom: 30, left: 60 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  // Build path
  const points = filtered.map((p, i) => {
    const x = PAD.left + (i / (filtered.length - 1)) * chartW;
    const y = PAD.top + (1 - (p.nav - minNav) / range_nav) * chartH;
    return `${x},${y}`;
  });
  const pathD = `M${points.join('L')}`;
  const areaD = `${pathD}L${PAD.left + chartW},${PAD.top + chartH}L${PAD.left},${PAD.top + chartH}Z`;

  // Y-axis labels
  const yLabels = [0, 0.25, 0.5, 0.75, 1].map(pct => {
    const val = minNav + pct * range_nav;
    const y = PAD.top + (1 - pct) * chartH;
    return { val: val.toFixed(2), y };
  });

  // X-axis labels (show ~5 dates)
  const xLabels = [0, 0.25, 0.5, 0.75, 1].map(pct => {
    const idx = Math.floor(pct * (filtered.length - 1));
    const date = filtered[idx]?.date ?? '';
    const x = PAD.left + pct * chartW;
    return { date: date.slice(5), x };
  });

  return (
    <div>
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-[14px] font-semibold text-slate-800">业绩走势</span>
          <span className={`text-[13px] font-bold tabular-nums ${returnColor}`}>
            {periodReturn > 0 ? '+' : ''}{periodReturn.toFixed(2)}%
          </span>
        </div>
        <div className="flex gap-1">
          {RANGE_OPTIONS.map(opt => (
            <button
              key={opt.key}
              onClick={() => setRange(opt.key)}
              className={`rounded-lg px-2.5 py-1 text-[12px] font-medium transition-colors ${
                range === opt.key
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="overflow-hidden rounded-xl border border-slate-200/60 bg-white">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 280 }}>
          {/* Grid lines */}
          {yLabels.map((l, i) => (
            <g key={i}>
              <line x1={PAD.left} y1={l.y} x2={PAD.left + chartW} y2={l.y} stroke="#e2e8f0" strokeWidth="1" />
              <text x={PAD.left - 8} y={l.y + 4} textAnchor="end" fill="#94a3b8" fontSize="11" fontFamily="inherit">
                {l.val}
              </text>
            </g>
          ))}

          {/* X-axis labels */}
          {xLabels.map((l, i) => (
            <text key={i} x={l.x} y={H - 8} textAnchor="middle" fill="#94a3b8" fontSize="11" fontFamily="inherit">
              {l.date}
            </text>
          ))}

          {/* Area fill */}
          <defs>
            <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0.01" />
            </linearGradient>
          </defs>
          <path d={areaD} fill="url(#trendGrad)" />

          {/* Line */}
          <path d={pathD} fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

          {/* Last point dot */}
          {filtered.length > 0 && (() => {
            const last = filtered[filtered.length - 1];
            const x = PAD.left + chartW;
            const y = PAD.top + (1 - (last.nav - minNav) / range_nav) * chartH;
            return <circle cx={x} cy={y} r="4" fill="#2563eb" stroke="#fff" strokeWidth="2" />;
          })()}
        </svg>
      </div>

      {/* Legend */}
      <div className="mt-2 flex items-center gap-4 text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-5 rounded-sm bg-blue-500" />
          {fundName}
        </span>
        <span className="flex items-center gap-1.5 opacity-40">
          <span className="inline-block h-2 w-5 rounded-sm bg-slate-300" />
          基准对比 (暂未接入)
        </span>
      </div>
    </div>
  );
}
