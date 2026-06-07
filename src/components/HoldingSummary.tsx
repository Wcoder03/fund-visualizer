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

  // 总持仓成本 — receipt/账单
  const iconCost = <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.7}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>;
  // 当前总市值 — coins/硬币
  const iconValue = <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.7}><path strokeLinecap="round" strokeLinejoin="round" d="M14.121 7.629A3 3 0 009.017 9.43c.023.212-.014.425-.092.623l-.376.876M14.121 7.629a3 3 0 01.092 3.21M14.121 7.629l2.847-2.847M9.017 9.43l-2.847 2.847m0 0a3 3 0 004.243 4.243m-4.243-4.243l2.847 2.847M12 21a9 9 0 100-18 9 9 0 000 18z" /></svg>;
  // 持有收益 — 趋势上升折线
  const iconProfit = <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.7}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" /></svg>;
  // 持有收益率 — 百分比符号
  const iconRate = <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.7}><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" /></svg>;
  // 今日收益 — 日历
  const iconDaily = <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.7}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>;
  // 今日收益率 — 百分比圆圈
  const iconDailyRate = <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.7}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" /></svg>;
  // 基金数量 — layers/图层
  const iconFund = <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.7}><path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L12 12.75l-5.571-3m11.142 0l4.179 2.25L12 17.25l-9.75-5.25 4.179-2.25" /></svg>;
  // 定投计划 — repeat/循环
  const iconDca = <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.7}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" /></svg>;

  const emptyVal = <span className="text-slate-300">--</span>;

  const valueCls = 'text-[28px] font-bold tracking-tight text-slate-900 tabular-nums';

  const stats: StatItem[] = [
    { label: '总持仓成本', value: formatMoney(totalCost) || emptyVal, icon: iconCost, color: 'from-blue-500 to-blue-600' },
    { label: '当前总市值', value: formatMoney(totalValue) || emptyVal, icon: iconValue, color: 'from-indigo-500 to-indigo-600' },
    { label: '持有收益', value: totalProfit !== null ? <ProfitLossValue value={totalProfit} type="money" className={valueCls} /> : emptyVal, icon: iconProfit, accent: true, color: 'from-rose-500 to-rose-600' },
    { label: '持有收益率', value: totalRate !== null ? <ProfitLossValue value={totalRate} type="rate" className={valueCls} /> : emptyVal, icon: iconRate, accent: true, color: 'from-pink-500 to-pink-600' },
    { label: '今日收益', value: dailyProfit !== null ? <ProfitLossValue value={dailyProfit} type="money" className={valueCls} /> : emptyVal, icon: iconDaily, accent: true, color: 'from-amber-500 to-orange-500' },
    { label: '今日收益率', value: dailyRate !== null ? <ProfitLossValue value={dailyRate} type="rate" className={valueCls} /> : emptyVal, icon: iconDailyRate, accent: true, color: 'from-yellow-500 to-amber-500' },
    { label: '基金数量', value: `${holdings.length} 只`, icon: iconFund, color: 'from-sky-500 to-cyan-500' },
    { label: '定投计划', value: `${dcaCount} 个`, icon: iconDca, color: 'from-violet-500 to-purple-500' },
  ];

  return (
    <section className="ui-card overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-slate-100 px-7 py-6">
        <div>
          <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-blue-600">Portfolio Summary</p>
          <h2 className="mt-1 text-[28px] font-bold leading-tight text-slate-900">持仓总览</h2>
          <p className="mt-1.5 text-[15px] leading-6 text-slate-500">基于"我的持仓"中的持有金额、成本金额和持有收益汇总。</p>
        </div>
        <span className={`mt-1 shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ${statusColor}`}>
          {statusText}
        </span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className={`group relative flex flex-col justify-center px-7 py-6 transition-colors hover:bg-slate-50/50 ${
              i % 4 !== 3 ? 'border-r border-slate-100/80' : ''
            } ${i < 4 ? 'border-b border-slate-100/80' : ''}`}
          >
            <div className="flex items-center gap-2.5">
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color} text-white shadow-sm`}>
                {stat.icon}
              </span>
              <span className="text-[15px] font-medium text-slate-500">{stat.label}</span>
            </div>
            <div className="mt-4 pl-[46px]" style={{ letterSpacing: '-0.02em' }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-slate-100 px-7 py-2.5 text-[12px] text-slate-400">
        <span>数据更新 {lastUpdatedAt || '--'}</span>
        <span>{hasFallback ? '部分数据来自演示来源' : ''}</span>
      </div>
    </section>
  );
}
