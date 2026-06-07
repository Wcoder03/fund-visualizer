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

  // Don't block the page on fundPool loading — it's only used for autocomplete
  // Show page immediately with localStorage holdings

  return (
    <div className="space-y-5 animate-fade-in">
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
