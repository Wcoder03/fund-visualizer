import type { FundNavSnapshot } from '../types/portfolio';

interface DataStatusBadgeProps {
  snapshot?: FundNavSnapshot;
  error?: string;
}

function dataSourceText(snapshot?: FundNavSnapshot): string {
  if (!snapshot) return '缺失';
  if (snapshot.dataSource === 'eastmoney') return '东方财富';
  if (snapshot.dataSource === 'mock') return '演示数据';
  if (snapshot.dataSource === 'mixed') return '混合来源';
  if (snapshot.dataSource === 'unavailable') return '不可用';
  return '数据来源';
}

export default function DataStatusBadge({ snapshot, error }: DataStatusBadgeProps) {
  if (error) {
    return <span className="rounded-full bg-red-50 px-2 py-1 text-xs font-semibold text-red-600 ring-1 ring-red-200">错误</span>;
  }

  if (!snapshot) {
    return <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-500 ring-1 ring-slate-200">缺失</span>;
  }

  const isFallback = snapshot.dataSource === 'mock' || snapshot.dataStatus === 'fallback';
  const className = isFallback
    ? 'bg-orange-50 text-orange-700 ring-orange-200'
    : snapshot.dataStatus === 'partial'
      ? 'bg-slate-100 text-slate-600 ring-slate-200'
      : 'bg-blue-50 text-blue-700 ring-blue-200';

  return (
    <span className={`rounded-full px-2 py-1 text-xs font-semibold ring-1 ${className}`}>
      {dataSourceText(snapshot)}
    </span>
  );
}
