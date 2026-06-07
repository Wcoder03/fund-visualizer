import DataStatusBadge from './DataStatusBadge';
import NavStatusBadge from './NavStatusBadge';
import { calculatePortfolioProfitLoss } from '../lib/portfolioCalculator';
import { navStatusNote } from '../lib/navStatusText';
import { formatMoney, formatNav } from '../lib/portfolioFormatters';
import type { FundNavSnapshot, PortfolioHolding } from '../types/portfolio';

interface PortfolioHoldingDetailProps {
  holding: PortfolioHolding;
  snapshot?: FundNavSnapshot;
  error?: string;
}

function dcaText(holding: PortfolioHolding): string {
  const plan = holding.dcaPlan;
  if (!plan?.enabled) return '未启用';
  const frequency = plan.frequency === 'daily' ? '每日' : plan.frequency === 'weekly' ? '每周' : plan.frequency === 'biweekly' ? '双周' : '每月';
  return `${frequency} ${formatMoney(plan.amount)} 元，下一次：${plan.nextInvestDate || '--'}`;
}

function snapshotSourceText(snapshot?: FundNavSnapshot): string {
  if (!snapshot) return '--';
  if (snapshot.dataSource === 'eastmoney') return '东方财富数据';
  if (snapshot.dataSource === 'mock') return '演示数据';
  if (snapshot.dataSource === 'mixed') return '混合数据';
  if (snapshot.dataSource === 'unavailable') return '不可用';
  return '数据来源';
}

export default function PortfolioHoldingDetail({ holding, snapshot, error }: PortfolioHoldingDetailProps) {
  const profit = calculatePortfolioProfitLoss(holding, snapshot);
  const firstBuyDate = profit.inferredFirstBuyDate || holding.firstBuyDate || '--';
  const items = [
    ['前一交易日净值', formatNav(snapshot?.previousNav)],
    ['最新确认净值', formatNav(snapshot?.latestConfirmedNav)],
    ['当日确认净值', formatNav(snapshot?.confirmedNav)],
    ['估算净值', formatNav(snapshot?.estimatedNav)],
    ['净值口径说明', navStatusNote(snapshot?.marketStatus)],
    ['首次买入日期', `${firstBuyDate}${profit.inferredFirstBuyDate ? ' · 推算' : ''}`],
    ['成本净值', formatNav(profit.inferredCostNav)],
    ['定投计划', dcaText(holding)],
    ['数据来源', snapshotSourceText(snapshot)],
    ['数据更新时间', snapshot?.updatedAt || '--'],
  ];

  return (
    <div className="border-t border-slate-200 bg-slate-50/80 px-5 py-4">
      <div className="flex flex-wrap items-center gap-2">
        <NavStatusBadge status={snapshot?.marketStatus} />
        <DataStatusBadge snapshot={snapshot} error={error} />
        {error && <span className="text-xs font-medium text-red-600">{error}</span>}
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {items.map(([label, value]) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white p-3">
            <p className="text-xs text-slate-500">{label}</p>
            <p className="mt-1 break-words text-sm font-semibold text-slate-950">{value}</p>
          </div>
        ))}
      </div>
      {holding.note && <p className="mt-3 rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm text-slate-600">{holding.note}</p>}
    </div>
  );
}
