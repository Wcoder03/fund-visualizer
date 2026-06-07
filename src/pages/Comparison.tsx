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
      <div className="research-panel mx-auto max-w-2xl rounded-2xl p-6 text-center">
        <p className="font-semibold text-red-600">{error}</p>
        <button onClick={loadFunds} className="ui-button-primary mt-4 rounded-xl px-4 py-2 text-sm font-semibold">
          重试加载基金池
        </button>
      </div>
    );
  }

  const hasFallback = Object.values(snapshotsByFundCode).some((snapshot) => snapshot.dataSource === 'mock' || snapshot.dataStatus === 'fallback');
  const dataStatusText = snapshotsLoading
    ? '净值刷新中'
    : hasFallback
      ? '部分数据为演示来源'
      : holdings.length > 0
        ? '数据口径已同步'
        : '等待添加持仓';

  return (
    <div className="mx-auto max-w-7xl space-y-6 animate-fade-in">
      <section className="research-panel overflow-hidden rounded-2xl">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Portfolio & DCA</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950 sm:text-4xl">我的持仓</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              基于持仓金额、持有收益和基金净值数据计算当前市值、当日收益、持有收益与定投摘要。盘中估值只用于记录测算，最终以基金公司确认净值为准。
            </p>
          </div>

          <aside className="border-t border-slate-200 bg-blue-50/70 p-6 lg:border-l lg:border-t-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Data Notes</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-950">净值口径</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              确认净值优先；交易时段使用估算净值辅助展示；非交易日展示最近确认净值。
            </p>
            <div className="mt-5 grid gap-2 text-sm">
              <div className="flex items-center justify-between rounded-xl border border-blue-100 bg-white px-3 py-2">
                <span className="text-slate-500">数据状态</span>
                <span className="font-semibold text-blue-700">{dataStatusText}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-blue-100 bg-white px-3 py-2">
                <span className="text-slate-500">更新时间</span>
                <span className="font-mono text-xs font-semibold text-slate-700">{lastUpdatedAt || '--'}</span>
              </div>
            </div>
          </aside>
        </div>
      </section>

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

      <section className="rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-sm leading-6 text-slate-600">
        本工具仅用于持仓记录和辅助测算，不构成投资建议。盘中净值和当日收益为估算值，最终以基金公司披露的确认净值为准。
        {hasFallback && (
          <span className="mt-2 block font-semibold text-orange-600">部分数据来自演示来源，仅用于功能展示，不应作为投资依据。</span>
        )}
      </section>
    </div>
  );
}
