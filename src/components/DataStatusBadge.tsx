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
    return <span className="inline-flex h-[22px] items-center whitespace-nowrap rounded-full px-2.5 text-[12px] font-medium ring-1 bg-red-50 text-red-500 ring-red-200/60">错误</span>;
  }

  if (!snapshot) {
    return <span className="inline-flex h-[22px] items-center whitespace-nowrap rounded-full px-2.5 text-[12px] font-medium ring-1 bg-slate-50 text-slate-400 ring-slate-200/60">缺失</span>;
  }

  const isFallback = snapshot.dataSource === 'mock' || snapshot.dataStatus === 'fallback';
  const className = isFallback
    ? 'bg-orange-50 text-orange-500 ring-orange-200/60'
    : snapshot.dataStatus === 'partial'
      ? 'bg-slate-50 text-slate-500 ring-slate-200/60'
      : 'bg-blue-50 text-blue-500 ring-blue-200/60';

  return (
    <span className={`inline-flex h-[22px] items-center whitespace-nowrap rounded-full px-2.5 text-[12px] font-medium ring-1 ${className}`}>
      {dataSourceText(snapshot)}
    </span>
  );
}
