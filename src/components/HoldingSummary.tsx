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
  icon: React.ReactNode;
  accent?: boolean;
  color: string;
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
  const statusColor = hasMissing
    ? 'bg-amber-50 text-amber-600 ring-amber-200/60'
    : hasFallback
      ? 'bg-orange-50 text-orange-600 ring-orange-200/60'
      : hasEstimated
        ? 'bg-sky-50 text-sky-600 ring-sky-200/60'
        : 'bg-emerald-50 text-emerald-600 ring-emerald-200/60';

  const iconCost = <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" /></svg>;
  const iconValue = <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
  const iconProfit = <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" /></svg>;
  const iconDaily = <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
  const iconFund = <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>;
  const iconDca = <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" /></svg>;

  const emptyVal = <span className="text-slate-300">--</span>;

  const stats: StatItem[] = [
    { label: '总持仓成本', value: formatMoney(totalCost) || emptyVal, icon: iconCost, color: 'from-blue-500 to-blue-600' },
    { label: '当前总市值', value: formatMoney(totalValue) || emptyVal, icon: iconValue, color: 'from-indigo-500 to-indigo-600' },
    { label: '持有收益', value: totalProfit !== null ? <ProfitLossValue value={totalProfit} type="money" className="text-[15px] font-bold" /> : emptyVal, icon: iconProfit, accent: true, color: 'from-rose-500 to-rose-600' },
    { label: '持有收益率', value: totalRate !== null ? <ProfitLossValue value={totalRate} type="rate" className="text-[15px] font-bold" /> : emptyVal, icon: iconProfit, accent: true, color: 'from-rose-500 to-rose-600' },
    { label: '今日收益', value: dailyProfit !== null ? <ProfitLossValue value={dailyProfit} type="money" className="text-[15px] font-bold" /> : emptyVal, icon: iconDaily, accent: true, color: 'from-amber-500 to-orange-500' },
    { label: '今日收益率', value: dailyRate !== null ? <ProfitLossValue value={dailyRate} type="rate" className="text-[15px] font-bold" /> : emptyVal, icon: iconDaily, accent: true, color: 'from-amber-500 to-orange-500' },
    { label: '基金数量', value: `${holdings.length} 只`, icon: iconFund, color: 'from-sky-500 to-cyan-500' },
    { label: '定投计划', value: `${dcaCount} 个`, icon: iconDca, color: 'from-violet-500 to-purple-500' },
  ];

  return (
    <section className="ui-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-semibold text-slate-800">持仓总览</span>
          <span className="text-[11px] font-medium text-slate-400">Portfolio Summary</span>
        </div>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${statusColor}`}>
          {statusText}
        </span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className={`group relative px-5 py-[18px] transition-colors hover:bg-slate-50/50 ${
              i % 4 !== 3 ? 'border-r border-slate-100/80' : ''
            } ${i < 4 ? 'border-b border-slate-100/80' : ''}`}
          >
            <div className="flex items-center gap-2">
              <span className={`flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br ${stat.color} text-white shadow-sm`}>
                {stat.icon}
              </span>
              <span className="text-[12px] font-medium text-slate-400">{stat.label}</span>
            </div>
            <div className="mt-2 text-[16px] font-bold tracking-tight text-slate-900 tabular-nums">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-slate-100 px-5 py-2 text-[11px] text-slate-400">
        <span>数据更新 {lastUpdatedAt || '--'}</span>
        <span>{hasFallback ? '部分数据来自演示来源' : ''}</span>
      </div>
    </section>
  );
}
