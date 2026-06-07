import { formatMoney, formatRate } from '../lib/portfolioFormatters';

interface ProfitLossBadgeProps {
  value: number | null;
  rate?: number | null;
  muted?: boolean;
}

export default function ProfitLossBadge({ value, rate, muted = false }: ProfitLossBadgeProps) {
  const isFlat = value === null || value === 0 || muted;
  const isProfit = value !== null && value > 0;
  const className = isFlat
    ? 'bg-slate-100 text-slate-600 ring-slate-200'
    : isProfit
      ? 'bg-[#f6e8e2] text-[#b34835] ring-[#e2c0b6]'
      : 'bg-[#eef3e8] text-[#2f7d58] ring-[#d9e3d0]';

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${className}`}>
      {formatMoney(value, true)}
      {rate !== undefined && rate !== null ? ` ${formatRate(rate, true)}` : ''}
    </span>
  );
}

