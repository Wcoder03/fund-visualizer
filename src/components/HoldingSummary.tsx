import ProfitLossValue from './ProfitLossValue';
import { calculatePortfolioProfitLoss } from '../lib/portfolioCalculator';
import { formatMoney, formatRate } from '../lib/portfolioFormatters';
import type { FundNavSnapshot, PortfolioHolding } from '../types/portfolio';

interface HoldingSummaryProps {
  holdings: PortfolioHolding[];
  snapshotsByFundCode?: Record<string, FundNavSnapshot>;
  lastUpdatedAt?: string | null;
}

function sumNullable(values: Array<number | null>): number | null {
  const valid = values.filter((value): value is number => value !== null && Number.isFinite(value));
  if (valid.length === 0) return null;
  return valid.reduce((sum, value) => sum + value, 0);
}

interface StatItem {
  label: string;
  value: React.ReactNode;
  accent?: boolean;
}

export default function HoldingSummary({ holdings, snapshotsByFundCode = {}, lastUpdatedAt }: HoldingSummaryProps) {
  const rows = holdings.map((holding) => ({
    holding,
    snapshot: snapshotsByFundCode[holding.fundCode],
    profit: calculatePortfolioProfitLoss(holding, snapshotsByFundCode[holding.fundCode]),
  }));

  const totalCost = rows.reduce((sum, row) => sum + row.profit.costAmount, 0);
  const totalValue = sumNullable(rows.map((row) => row.profit.marketValue));
  const dailyProfit = sumNullable(rows.map((row) => row.profit.confirmedDailyProfitLoss ?? row.profit.dailyProfitLoss));
  const totalProfit = totalValue === null ? null : totalValue - totalCost;
  const totalRate = totalProfit === null || totalCost <= 0 ? null : totalProfit / totalCost;
  const dailyRate = dailyProfit === null || totalValue === null || totalValue <= 0 ? null : dailyProfit / totalValue;
  const dcaCount = holdings.filter((item) => item.dcaPlan?.enabled && item.dcaPlan.status !== 'paused').length;
  const hasMissing = rows.some((row) => row.profit.dataStatus === 'partial');
  const hasEstimated = rows.some((row) => row.snapshot?.marketStatus === 'trading' || row.snapshot?.marketStatus === 'closed_pending_nav');
  const hasFallback = rows.some((row) => row.snapshot?.dataSource === 'mock' || row.snapshot?.dataStatus === 'fallback');
  const statusText = hasMissing
    ? '数据缺失'
    : hasFallback
      ? '演示数据'
      : hasEstimated
        ? '含盘中估值'
        : '数据已确认';

  const stats: StatItem[] = [
    { label: '总持仓成本', value: formatMoney(totalCost) },
    { label: '当前总市值', value: formatMoney(totalValue) },
    { label: '今日收益', value: <ProfitLossValue value={dailyProfit} type="money" className="text-base font-semibold" />, accent: true },
    { label: '今日收益率', value: <ProfitLossValue value={dailyRate} type="rate" className="text-base font-semibold" />, accent: true },
    { label: '持有收益', value: <ProfitLossValue value={totalProfit} type="money" className="text-base font-semibold" />, accent: true },
    { label: '持有收益率', value: <ProfitLossValue value={totalRate} type="rate" className="text-base font-semibold" />, accent: true },
    { label: '基金数量', value: `${holdings.length} 只` },
    { label: '定投计划', value: `${dcaCount} 个` },
  ];

  return (
    <section className="rounded-xl border border-slate-200/80 bg-white/95 px-4 py-3 shadow-sm backdrop-blur-sm sm:px-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-semibold text-slate-800">持仓总览</span>
          <span className="h-3 w-px bg-slate-200" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-blue-500/80">Portfolio Summary</span>
        </div>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${
          hasMissing
            ? 'bg-amber-50 text-amber-600 ring-amber-200'
            : hasFallback
              ? 'bg-orange-50 text-orange-600 ring-orange-200'
              : hasEstimated
                ? 'bg-blue-50 text-blue-600 ring-blue-200'
                : 'bg-emerald-50 text-emerald-600 ring-emerald-200'
        }`}>
          {statusText}
        </span>
      </div>

      {/* Stats Grid */}
      <div className="mt-2.5 grid grid-cols-2 gap-1.5 sm:gap-2 md:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`group rounded-lg px-3 py-2 transition-colors ${
              stat.accent
                ? 'bg-slate-50/80 hover:bg-slate-100/80'
                : 'hover:bg-slate-50/60'
            }`}
          >
            <p className="text-[11px] leading-tight text-slate-400">{stat.label}</p>
            <div className="mt-0.5 text-[15px] font-semibold tracking-tight text-slate-900">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-1.5 flex items-center justify-between border-t border-slate-100 pt-1.5 text-[10px] text-slate-400">
        <span>更新：{lastUpdatedAt || '--'}</span>
        <span>{hasFallback ? '部分数据来自演示来源' : dailyRate !== null ? `今日收益率 ${formatRate(dailyRate)}` : ''}</span>
      </div>
    </section>
  );
}
