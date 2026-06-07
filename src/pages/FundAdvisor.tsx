import { useCallback, useState } from 'react';
import type { FundSearchResult } from '../types/fund';
import type { PortfolioHolding } from '../types/portfolio';
import { analyzeFund, type FundAnalysisResult } from '../lib/fundAdvisorService';
import { fetchFundExtendedData } from '../lib/providers/eastmoneyProvider';
import FundPerformanceBar from '../components/FundPerformanceBar';
import FundTrendChart from '../components/FundTrendChart';
import type { FundNavSnapshot } from '../types/portfolio';
import { loadPortfolioFromStorage, savePortfolioToStorage } from '../lib/portfolioStorage';

export default function FundAdvisor() {
  const [keyword, setKeyword] = useState('');
  const [candidates, setCandidates] = useState<FundSearchResult[]>([]);
  const [analysis, setAnalysis] = useState<FundAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [holdings, setHoldings] = useState<PortfolioHolding[]>(() => loadPortfolioFromStorage());

  const analyzeFundByCode = useCallback(async (code: string, name?: string) => {
    setLoading(true);
    setError(null);
    setCandidates([]);
    try {
      const [snapshotResp, extendedData] = await Promise.all([
        fetch(`/api/funds/${code}/snapshot`),
        fetchFundExtendedData(code),
      ]);
      if (!snapshotResp.ok) throw new Error(`获取基金数据失败: ${snapshotResp.status}`);
      const snapshot = (await snapshotResp.json()) as FundNavSnapshot;
      if (name && !snapshot.fundName) snapshot.fundName = name;
      const result = analyzeFund(snapshot, holdings, extendedData);
      setAnalysis(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '分析失败，请重试');
    } finally {
      setLoading(false);
    }
  }, [holdings]);

  const doSearch = useCallback(async () => {
    const q = keyword.trim();
    if (!q) return;
    setLoading(true);
    setError(null);
    setSearched(true);
    setAnalysis(null);
    setCandidates([]);
    try {
      const resp = await fetch(`/api/funds/search?keyword=${encodeURIComponent(q)}`);
      if (!resp.ok) throw new Error(`请求失败: ${resp.status}`);
      const data = (await resp.json()) as { items: FundSearchResult[] };
      const items = data.items ?? [];
      if (items.length === 1) {
        await analyzeFundByCode(items[0].fundCode, items[0].fundName);
      } else {
        setCandidates(items);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '搜索失败，请重试');
    } finally {
      setLoading(false);
    }
  }, [analyzeFundByCode, keyword]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') void doSearch();
  };

  const addToPortfolio = () => {
    if (!analysis) return;
    const code = analysis.overview.fundCode;
    const existing = holdings.find(h => h.fundCode === code);
    if (existing) return;
    const newHolding: PortfolioHolding = {
      id: `holding-${code}-${Date.now()}`,
      fundCode: code,
      fundName: analysis.overview.fundName,
      holdingAmount: 0,
      costAmount: 0,
      firstBuyDate: new Date().toISOString().slice(0, 10),
      holdingDays: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [newHolding, ...holdings];
    setHoldings(updated);
    savePortfolioToStorage(updated);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Search bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <svg className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="请输入基金代码或基金名称，例如 008254、华宝致远"
            className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-[14px] text-slate-700 shadow-sm placeholder:text-slate-400 focus:border-blue-300 focus:shadow-blue-50 focus:outline-none"
          />
        </div>
        <button
          onClick={doSearch}
          disabled={loading || !keyword.trim()}
          className="ui-button-primary flex h-12 shrink-0 items-center gap-2 rounded-xl px-5 text-[14px] font-semibold disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h3m-3 3h3" />
            </svg>
          )}
          开始分析
        </button>
      </div>

      {/* Error */}
      {error && (
        <section className="ui-card border-red-100 bg-red-50/50 p-5 text-center">
          <p className="text-[13px] text-red-600">{error}</p>
        </section>
      )}

      {/* Empty state */}
      {!loading && !searched && !analysis && (
        <section className="ui-card p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20">
            <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h3m-3 3h3" />
            </svg>
          </div>
          <p className="mt-4 text-[15px] font-semibold text-slate-700">输入基金，开始分析</p>
          <p className="mt-1 text-[13px] text-slate-400">支持基金代码、名称、关键词搜索</p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {['基础资料', '收益表现', '风险评估', '优缺点分析'].map(tag => (
              <span key={tag} className="rounded-full bg-slate-50 px-3 py-1 text-[12px] font-medium text-slate-500 ring-1 ring-slate-200/60">{tag}</span>
            ))}
          </div>
        </section>
      )}

      {/* Candidate list */}
      {!loading && candidates.length > 1 && (
        <section className="ui-card overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-3">
            <span className="text-[13px] font-medium text-slate-500">找到 {candidates.length} 只基金，请选择一只进行分析</span>
          </div>
          <div className="divide-y divide-slate-100">
            {candidates.map(fund => (
              <button
                key={fund.fundCode}
                type="button"
                onClick={() => analyzeFundByCode(fund.fundCode, fund.fundName)}
                className="flex w-full items-center justify-between px-5 py-3.5 text-left transition-colors hover:bg-slate-50/60"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-[11px] font-bold text-blue-600">
                    {fund.fundCode.slice(0, 2)}
                  </span>
                  <div>
                    <p className="text-[13px] font-medium text-slate-800">{fund.fundName}</p>
                    <p className="mt-px text-[11px] text-slate-400">{fund.fundCode} · {fund.fundType}</p>
                  </div>
                </div>
                <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* No results */}
      {!loading && searched && candidates.length === 0 && !analysis && !error && (
        <section className="ui-card p-10 text-center">
          <p className="text-[14px] font-medium text-slate-500">未找到匹配的基金</p>
          <p className="mt-1 text-[12px] text-slate-400">请尝试其他关键词或基金代码</p>
        </section>
      )}

      {/* Analysis Report */}
      {analysis && (
        <div className="space-y-4">
          {/* Overview + Performance Bar */}
          <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
            {/* Overview */}
            <section className="ui-card p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Fund Overview</p>
                  <h2 className="mt-1 text-[18px] font-bold text-slate-900">{analysis.overview.fundName}</h2>
                  <p className="mt-0.5 text-[13px] text-slate-400">{analysis.overview.fundCode} · {analysis.overview.fundType}</p>
                </div>
                <div className="flex gap-2">
                  {analysis.overview.isInPortfolio ? (
                    <span className="inline-flex h-8 items-center whitespace-nowrap rounded-lg bg-emerald-50 px-3 text-[12px] font-medium text-emerald-600 ring-1 ring-emerald-200/60">已在持仓</span>
                  ) : (
                    <button type="button" onClick={addToPortfolio} className="ui-button-primary h-8 whitespace-nowrap rounded-lg px-3 text-[12px] font-medium">
                      加入持仓
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {analysis.keyMetrics.map(m => (
                  <div key={m.label} className="rounded-lg bg-slate-50 px-3 py-2">
                    <p className="text-[11px] text-slate-400">{m.label}</p>
                    <p className={`mt-0.5 text-[14px] font-bold tabular-nums ${m.highlight ? 'text-red-600' : m.lowlight ? 'text-green-600' : 'text-slate-800'}`}>{m.value}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Performance Bar */}
            {analysis.performance && (
              <section className="ui-card p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 mb-3">收益表现</p>
                <FundPerformanceBar
                  return1m={analysis.performance.return1m}
                  return3m={analysis.performance.return3m}
                  return6m={analysis.performance.return6m}
                  return1y={analysis.performance.return1y}
                  dailyChange={analysis.performance.dailyChange}
                  nav={analysis.performance.nav}
                />
              </section>
            )}
          </div>

          {/* Trend Chart */}
          {analysis.trendData && analysis.trendData.length > 1 && (
            <section className="ui-card p-5">
              <FundTrendChart data={analysis.trendData} fundName={analysis.overview.fundName} />
            </section>
          )}

          {/* Pros & Cons */}
          <div className="grid gap-4 lg:grid-cols-2">
            <section className="ui-card p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-500">Advantages</p>
              <h3 className="mt-1 text-[15px] font-semibold text-slate-800">优点分析</h3>
              <ul className="mt-3 space-y-2">
                {analysis.pros.map((pro, i) => (
                  <li key={i} className="flex items-start gap-2 text-[13px] leading-[1.6] text-slate-600">
                    <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] text-emerald-600">✓</span>
                    {pro}
                  </li>
                ))}
              </ul>
            </section>
            <section className="ui-card p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-500">Risks</p>
              <h3 className="mt-1 text-[15px] font-semibold text-slate-800">缺点与风险</h3>
              <ul className="mt-3 space-y-2">
                {analysis.cons.map((con, i) => (
                  <li key={i} className="flex items-start gap-2 text-[13px] leading-[1.6] text-slate-600">
                    <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[10px] text-amber-600">!</span>
                    {con}
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {/* Suitability */}
          <div className="grid gap-4 lg:grid-cols-2">
            <section className="ui-card p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-blue-500">Suitable For</p>
              <h3 className="mt-1 text-[15px] font-semibold text-slate-800">适合人群</h3>
              <ul className="mt-3 space-y-1.5">
                {analysis.suitableFor.map((s, i) => (
                  <li key={i} className="flex items-center gap-2 text-[13px] text-slate-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                    {s}
                  </li>
                ))}
              </ul>
            </section>
            <section className="ui-card p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-red-400">Not Suitable For</p>
              <h3 className="mt-1 text-[15px] font-semibold text-slate-800">不适合人群</h3>
              <ul className="mt-3 space-y-1.5">
                {analysis.notSuitableFor.map((s, i) => (
                  <li key={i} className="flex items-center gap-2 text-[13px] text-slate-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                    {s}
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {/* Portfolio relation */}
          <section className="ui-card p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Portfolio Relation</p>
            <h3 className="mt-1 text-[15px] font-semibold text-slate-800">与我的持仓关系</h3>
            <div className="mt-3 space-y-2 text-[13px] leading-[1.7] text-slate-600">
              {analysis.portfolioRelation.alreadyHeld ? (
                <p className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-[10px] text-emerald-600">✓</span>
                  {analysis.portfolioRelation.holdingInfo}
                </p>
              ) : (
                <p>该基金尚未加入持仓。</p>
              )}
              <p>{analysis.portfolioRelation.complementarity}</p>
              {analysis.portfolioRelation.duplicateWarning && (
                <p className="flex items-center gap-2 text-amber-600">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-[10px]">!</span>
                  {analysis.portfolioRelation.duplicateWarning}
                </p>
              )}
            </div>
          </section>

          {/* Disclaimer */}
          <section className="rounded-xl border border-amber-200/60 bg-amber-50/50 px-5 py-3">
            <p className="text-[12px] leading-[1.6] text-amber-700">
              以上分析基于当前可用数据自动生成，仅供参考，不构成投资建议。基金有风险，投资需谨慎。
            </p>
          </section>
        </div>
      )}
    </div>
  );
}
