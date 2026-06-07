import type { DcaPlan, FundNavSnapshot } from '../types/portfolio';
import { estimateNextDcaShares } from '../lib/portfolioCalculator';
import { getDisplayNav } from '../lib/marketStatus';

interface DcaPlanCardProps {
  plan?: DcaPlan;
  snapshot?: FundNavSnapshot;
  onToggle?: () => void;
  onDelete?: () => void;
}

const frequencyLabel = {
  daily: '每日',
  weekly: '每周',
  biweekly: '双周',
  monthly: '每月',
};

function navNote(snapshot?: FundNavSnapshot): string {
  if (!snapshot) return '暂无净值，无法估算';
  if (snapshot.dataSource === 'mock') return '按演示净值测算';
  if (snapshot.marketStatus === 'trading') return '按盘中估算净值测算';
  if (snapshot.marketStatus === 'nav_confirmed') return '按最新确认净值测算';
  return '按最新可用净值测算';
}

export default function DcaPlanCard({ plan, snapshot, onToggle, onDelete }: DcaPlanCardProps) {
  if (!plan?.enabled) {
    return <p className="text-sm text-slate-500">未启用定投计划</p>;
  }

  const displayNav = getDisplayNav(snapshot);
  const estimatedShares = displayNav ? estimateNextDcaShares(plan.amount, displayNav) : null;

  return (
    <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-950">{frequencyLabel[plan.frequency]}定投 · {plan.amount.toFixed(2)} 元</p>
          <p className="mt-1 text-xs text-slate-500">下一次：{plan.status === 'paused' ? '已暂停' : plan.nextInvestDate || '待计算'}</p>
        </div>
        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${plan.status === 'active' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
          {plan.status}
        </span>
      </div>
      <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
        <span>累计定投：{plan.totalInvestedAmount.toFixed(2)} 元</span>
        <span>预计下次份额：{estimatedShares === null ? '暂无净值，无法估算' : `${estimatedShares.toFixed(4)} 份`}</span>
      </div>
      <p className="mt-2 text-xs text-slate-500">{navNote(snapshot)}</p>
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={onToggle} className="ui-button-secondary rounded-lg px-2.5 py-1.5 text-xs font-medium">
          {plan.status === 'paused' ? '恢复' : '暂停'}
        </button>
        <button type="button" onClick={onDelete} className="rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50">
          删除计划
        </button>
      </div>
    </div>
  );
}
