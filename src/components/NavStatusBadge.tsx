import type { MarketStatus } from '../types/portfolio';
import { navStatusLabel } from '../lib/navStatusText';

interface NavStatusBadgeProps {
  status?: MarketStatus;
}

export default function NavStatusBadge({ status }: NavStatusBadgeProps) {
  const className = status === 'trading' || status === 'closed_pending_nav'
    ? 'bg-blue-50 text-blue-600 ring-blue-200/60'
    : status === 'nav_confirmed'
      ? 'bg-emerald-50 text-emerald-600 ring-emerald-200/60'
      : 'bg-slate-50 text-slate-500 ring-slate-200/60';

  return <span className={`inline-flex h-[22px] items-center whitespace-nowrap rounded-full px-2.5 text-[12px] font-medium ring-1 ${className}`}>{navStatusLabel(status)}</span>;
}
