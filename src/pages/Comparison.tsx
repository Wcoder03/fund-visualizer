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
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#1a3a8f] via-[#2546a8] to-[#3b5ccc] p-6 text-white shadow-lg shadow-blue-600/15 lg:p-8">
        {/* Decorative elements */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/5 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 right-20 h-48 w-48 rounded-full bg-indigo-400/10 blur-2xl" />
        <div className="pointer-events-none absolute right-8 top-6 hidden h-28 w-28 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm lg:block" />
        <div className="pointer-events-none absolute right-20 top-12 hidden h-16 w-16 rounded-xl border border-white/5 bg-white/5 lg:block" />

        <div className="relative">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-200/80">Portfolio & DCA</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">我的持仓</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100/80">
            基于持仓金额、持有收益和基金净值数据计算当前市值、当日收益与定投摘要。盘中估值仅用于测算，以确认净值为准。
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              {snapshotsLoading ? '净值刷新中' : hasFallback ? '部分演示数据' : holdings.length > 0 ? '数据已同步' : '等待添加持仓'}
            </span>
            {lastUpdatedAt && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur-sm">
                更新于 {lastUpdatedAt}
              </span>
            )}
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
