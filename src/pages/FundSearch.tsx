import { useCallback, useState } from 'react';
import type { FundSearchResult } from '../types/fund';

export default function FundSearch() {
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState<FundSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const doSearch = useCallback(async () => {
    const q = keyword.trim();
    if (!q) return;
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const resp = await fetch(`/api/funds/search?keyword=${encodeURIComponent(q)}`);
      if (!resp.ok) throw new Error(`请求失败: ${resp.status}`);
      const data = (await resp.json()) as { items: FundSearchResult[] };
      setResults(data.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '搜索失败，请重试');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [keyword]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') void doSearch();
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0b1f4d] via-[#122d6b] to-[#1a3f8a] p-6 text-white shadow-lg shadow-blue-900/20 lg:px-8 lg:py-7">
        <div className="pointer-events-none absolute inset-0 opacity-[0.03]" style={{backgroundImage:'repeating-linear-gradient(0deg,#fff 0 1px,transparent 1px 40px),repeating-linear-gradient(90deg,#fff 0 1px,transparent 1px 40px)'}} />
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-blue-500/10 blur-[80px]" />
        <div className="relative">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-300/60">Fund Search</p>
          <h1 className="mt-1.5 text-[26px] font-bold tracking-tight text-white/95 sm:text-[32px]">基金搜索</h1>
          <p className="mt-2 text-[13px] leading-[1.7] text-blue-100/50">
            通过基金代码或名称搜索基金信息，查看基金类型和基本资料。
          </p>
        </div>
      </section>

      {/* Search Card */}
      <section className="ui-card p-5">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <svg className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="请输入基金代码或基金名称"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-11 pr-4 text-[14px] text-slate-700 shadow-sm placeholder:text-slate-400 focus:border-blue-300 focus:shadow-blue-50 focus:outline-none"
            />
          </div>
          <button
            onClick={doSearch}
            disabled={loading || !keyword.trim()}
            className="ui-button-primary flex items-center gap-2 px-5 py-2.5 text-[13px] font-semibold disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            )}
            搜索
          </button>
        </div>
      </section>

      {/* Results */}
      {error && (
        <section className="ui-card border-red-100 bg-red-50/50 p-5 text-center">
          <p className="text-[13px] text-red-600">{error}</p>
        </section>
      )}

      {!loading && searched && results.length === 0 && !error && (
        <section className="ui-card p-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
            <svg className="h-6 w-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
          <p className="mt-3 text-[14px] font-medium text-slate-500">未找到匹配的基金</p>
          <p className="mt-1 text-[12px] text-slate-400">请尝试其他关键词或基金代码</p>
        </section>
      )}

      {!loading && !searched && (
        <section className="ui-card p-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
            <svg className="h-6 w-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
          <p className="mt-3 text-[14px] font-medium text-slate-500">输入基金代码或名称开始搜索</p>
          <p className="mt-1 text-[12px] text-slate-400">支持模糊搜索，例如输入"电力"或"018173"</p>
        </section>
      )}

      {results.length > 0 && (
        <section className="ui-card overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-3">
            <span className="text-[13px] font-medium text-slate-500">搜索结果</span>
            <span className="ml-2 text-[12px] text-slate-400">{results.length} 条</span>
          </div>
          <div className="divide-y divide-slate-100">
            {results.map((fund) => (
              <div key={fund.fundCode} className="flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-[11px] font-bold text-blue-600">
                    {fund.fundCode.slice(0, 2)}
                  </span>
                  <div>
                    <p className="text-[13px] font-medium text-slate-800">{fund.fundName}</p>
                    <p className="mt-px text-[11px] text-slate-400">{fund.fundCode} · {fund.fundType}</p>
                  </div>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${
                  fund.dataSource === 'eastmoney'
                    ? 'bg-emerald-50 text-emerald-600 ring-emerald-200/60'
                    : 'bg-slate-50 text-slate-500 ring-slate-200/60'
                }`}>
                  {fund.dataSource === 'eastmoney' ? '实时数据' : '演示数据'}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
