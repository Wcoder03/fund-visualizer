import type { MarketStatus } from '../types/portfolio';
import { navStatusLabel } from '../lib/navStatusText';

interface NavStatusBadgeProps {
  status?: MarketStatus;
}

export default function NavStatusBadge({ status }: NavStatusBadgeProps) {
  const className = status === 'trading' || status === 'closed_pending_nav'
    ? 'bg-blue-50 text-blue-700 ring-blue-200'
    : status === 'nav_confirmed'
      ? 'bg-green-50 text-green-700 ring-green-200'
      : 'bg-slate-100 text-slate-600 ring-slate-200';

  return <span className={`rounded-full px-2 py-1 text-xs font-semibold ring-1 ${className}`}>{navStatusLabel(status)}</span>;
}
