interface PerformanceMetric {
  label: string;
  value: number | null | undefined;
  suffix?: string;
}

function formatPercent(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '--';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

function formatNav(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '--';
  return value.toFixed(4);
}

function getChangeColor(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return 'text-slate-400';
  if (value > 0) return 'text-red-600';
  if (value < 0) return 'text-green-600';
  return 'text-slate-400';
}

interface FundPerformanceBarProps {
  return1m?: number;
  return3m?: number;
  return6m?: number;
  return1y?: number;
  dailyChange?: number;
  nav?: number;
}

export default function FundPerformanceBar({ return1m, return3m, return6m, return1y, dailyChange, nav }: FundPerformanceBarProps) {
  const metrics: PerformanceMetric[] = [
    { label: '近1月', value: return1m },
    { label: '近3月', value: return3m },
    { label: '近6月', value: return6m },
    { label: '近1年', value: return1y },
    { label: '日涨跌幅', value: dailyChange },
    { label: '当前净值', value: nav },
  ];

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-3 lg:grid-cols-3">
      {metrics.map((m) => {
        const isNav = m.label === '当前净值';
        const displayValue = isNav ? formatNav(m.value) : formatPercent(m.value);
        const colorClass = isNav ? 'text-slate-900' : getChangeColor(m.value);
        return (
          <div key={m.label} className="rounded-lg bg-slate-50 px-3 py-2">
            <p className="whitespace-nowrap text-[11px] text-slate-400">{m.label}</p>
            <p className={`mt-0.5 whitespace-nowrap text-[15px] font-bold tabular-nums ${colorClass}`}>{displayValue}</p>
          </div>
        );
      })}
    </div>
  );
}
