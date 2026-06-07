import { useEffect, useMemo, useState } from 'react';
import PortfolioHoldingsPageSection from '../components/PortfolioHoldingsPageSection';
import { useFunds } from '../hooks/useFunds';
import { usePortfolioSnapshots } from '../hooks/usePortfolioSnapshots';
import { loadPortfolioFromStorage, savePortfolioToStorage } from '../lib/portfolioStorage';
import type { PortfolioHolding } from '../types/portfolio';

export default function Comparison() {
  const { funds, loading, error, loadFunds } = useFunds();
  const [holdings, setHoldings] = useState<PortfolioHolding[]>([]);
  const [initialized, setInitialized] = useState(false);
  const { snapshotsByFundCode, loading: snapshotsLoading, errorsByFundCode, lastUpdatedAt, refresh } = usePortfolioSnapshots(holdings);

  useEffect(() => {
    queueMicrotask(() => {
      const stored = loadPortfolioFromStorage();
      setHoldings(stored);
      setInitialized(true);
    });
  }, []);

  useEffect(() => {
    if (initialized) savePortfolioToStorage(holdings);
  }, [holdings, initialized]);

  const fundPool = useMemo(() => {
    return funds.map((fund) => ({
      code: fund.basicInfo.code,
      name: fund.basicInfo.name,
    }));
  }, [funds]);

  const saveHolding = (holding: PortfolioHolding) => {
    setHoldings((current) => {
      const exists = current.some((item) => item.id === holding.id);
      return exists ? current.map((item) => (item.id === holding.id ? holding : item)) : [holding, ...current];
    });
  };

  const deleteHolding = (id: string) => {
    setHoldings((current) => current.filter((item) => item.id !== id));
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-100 border-t-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="ui-card mx-auto max-w-2xl p-8 text-center">
        <p className="font-semibold text-red-600">{error}</p>
        <button onClick={loadFunds} className="ui-button-primary mt-4 px-5 py-2.5 text-sm font-semibold">
          重试加载基金池
        </button>
      </div>
    );
  }

  const hasFallback = Object.values(snapshotsByFundCode).some((snapshot) => snapshot.dataSource === 'mock' || snapshot.dataStatus === 'fallback');

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0b1f4d] via-[#122d6b] to-[#1a3f8a] p-6 text-white shadow-lg shadow-blue-900/20 lg:px-8 lg:py-7">
        {/* Decorative: grid pattern */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.03]" style={{backgroundImage:'repeating-linear-gradient(0deg,#fff 0 1px,transparent 1px 40px),repeating-linear-gradient(90deg,#fff 0 1px,transparent 1px 40px)'}} />
        {/* Decorative: blurred orbs */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-blue-500/10 blur-[80px]" />
        <div className="pointer-events-none absolute -bottom-16 left-1/3 h-48 w-48 rounded-full bg-indigo-400/8 blur-[60px]" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          {/* Left: text */}
          <div className="max-w-lg">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-300/60">Portfolio & DCA</p>
            <h1 className="mt-1.5 text-[26px] font-bold tracking-tight text-white/95 sm:text-[32px]">我的持仓</h1>
            <p className="mt-2 text-[13px] leading-[1.7] text-blue-100/50">
              基于持仓金额、持有收益和基金净值数据计算当前市值、当日收益与定投摘要。
            </p>
          </div>

          {/* Right: glass stat cards */}
          <div className="flex gap-2.5">
            <div className="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 backdrop-blur-md">
              <p className="text-[10px] font-medium text-blue-200/40">基金数量</p>
              <p className="mt-0.5 text-[22px] font-bold tracking-tight text-white/90 tabular-nums">{holdings.length}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 backdrop-blur-md">
              <p className="text-[10px] font-medium text-blue-200/40">定投计划</p>
              <p className="mt-0.5 text-[22px] font-bold tracking-tight text-white/90 tabular-nums">
                {holdings.filter(h => h.dcaPlan?.enabled && h.dcaPlan.status !== 'paused').length}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Holdings Section */}
      <PortfolioHoldingsPageSection
        holdings={holdings}
        fundPool={fundPool}
        snapshotsByFundCode={snapshotsByFundCode}
        errorsByFundCode={errorsByFundCode}
        snapshotsLoading={snapshotsLoading}
        lastUpdatedAt={lastUpdatedAt}
        onSave={saveHolding}
        onDelete={deleteHolding}
        onRefresh={(fundCodes) => void refresh(fundCodes)}
      />

      {/* Disclaimer */}
      <section className="rounded-xl border border-slate-200/60 bg-white/60 px-4 py-3 text-xs leading-5 text-slate-400">
        本工具仅用于持仓记录和辅助测算，不构成投资建议。盘中净值和当日收益为估算值，最终以基金公司披露的确认净值为准。
      </section>
    </div>
  );
}
