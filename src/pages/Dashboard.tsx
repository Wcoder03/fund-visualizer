import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Disclaimer from '../components/Disclaimer';
import FundAnalysisCard from '../components/FundAnalysisCard';
import FundComparisonTable from '../components/FundComparisonTable';
import { usePortfolioSnapshots } from '../hooks/usePortfolioSnapshots';
import { runFundAnalysis } from '../lib/fundAnalyzer';
import { formatMoney, formatRate } from '../lib/portfolioFormatters';
import { loadPortfolioFromStorage } from '../lib/portfolioStorage';
import type { FundAnalysisRun, FundInput } from '../types/fundAnalysis';
import type { FundNavSnapshot, PortfolioHolding } from '../types/portfolio';

interface HoldingAnalysisProps {
  holdings: PortfolioHolding[];
  snapshotsByFundCode: Record<string, FundNavSnapshot>;
}

function isPlaceholderFundName(name: string, code: string): boolean {
  const normalizedName = name.replace(/\s+/g, '').toUpperCase();
  return normalizedName === `基金${code.toUpperCase()}`;
}

function getDisplayFundName(holding: PortfolioHolding, snapshotsByFundCode: Record<string, FundNavSnapshot>): string {
  const code = holding.fundCode.trim();
  const snapshotName = snapshotsByFundCode[code]?.fundName?.trim();
  const savedName = holding.fundName?.trim();

  if (snapshotName && !isPlaceholderFundName(snapshotName, code)) return snapshotName;
  if (savedName && !isPlaceholderFundName(savedName, code)) return savedName;
  return snapshotName || savedName || `基金 ${code}`;
}

function buildFundInputs(holdings: PortfolioHolding[], snapshotsByFundCode: Record<string, FundNavSnapshot>): FundInput[] {
  const seen = new Set<string>();
  return holdings.reduce<FundInput[]>((items, holding) => {
    const code = holding.fundCode.trim();
    if (!code || seen.has(code)) return items;
    seen.add(code);
    items.push({
      id: holding.id,
      code,
      name: getDisplayFundName(holding, snapshotsByFundCode),
    });
    return items;
  }, []);
}

function HoldingAnalysis({ holdings, snapshotsByFundCode }: HoldingAnalysisProps) {
  const stats = useMemo(() => {
    const totalHoldingAmount = holdings.reduce((sum, item) => sum + (item.holdingAmount ?? 0), 0);
    const totalCost = holdings.reduce((sum, item) => sum + item.costAmount, 0);
    const totalProfit = totalHoldingAmount - totalCost;
    const totalProfitRate = totalCost > 0 ? totalProfit / totalCost : null;
    const sortedByAmount = [...holdings].sort((a, b) => (b.holdingAmount ?? 0) - (a.holdingAmount ?? 0));
    const largest = sortedByAmount[0];
    const largestWeight = largest && totalHoldingAmount > 0 ? (largest.holdingAmount ?? 0) / totalHoldingAmount : null;
    const profitCount = holdings.filter((item) => (item.holdingAmount ?? 0) - item.costAmount > 0).length;
    const lossCount = holdings.filter((item) => (item.holdingAmount ?? 0) - item.costAmount < 0).length;
    const dcaCount = holdings.filter((item) => item.dcaPlan?.enabled && item.dcaPlan.status !== 'paused').length;
    const rows = sortedByAmount.map((holding) => {
      const amount = holding.holdingAmount ?? 0;
      const profit = amount - holding.costAmount;
      return {
        id: holding.id,
        code: holding.fundCode,
        name: getDisplayFundName(holding, snapshotsByFundCode),
        amount,
        weight: totalHoldingAmount > 0 ? amount / totalHoldingAmount : null,
        profit,
        profitRate: holding.costAmount > 0 ? profit / holding.costAmount : null,
      };
    });

    return {
      totalHoldingAmount,
      totalCost,
      totalProfit,
      totalProfitRate,
      largest,
      largestName: largest ? getDisplayFundName(largest, snapshotsByFundCode) : '',
      largestWeight,
      profitCount,
      lossCount,
      dcaCount,
      rows,
    };
  }, [holdings, snapshotsByFundCode]);

  const concentrationText = stats.largestWeight === null
    ? '暂无可计算仓位'
    : stats.largestWeight >= 0.45
      ? '单只仓位偏高'
      : stats.largestWeight >= 0.3
        ? '仓位相对集中'
        : '仓位较分散';

  return (
    <section className="research-panel rounded-2xl p-5 sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Position Review</p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-950">持仓分析</h2>
          <p className="mt-1 text-sm text-slate-500">按“我的持仓”中的持有金额、成本金额和持有收益汇总。</p>
        </div>
        <span className="w-fit rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
          {holdings.length} 只基金
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="ui-card-subtle card-hover rounded-2xl px-4 py-3">
          <p className="text-xs font-medium text-slate-500">当前持仓金额</p>
          <p className="mt-1 text-2xl font-semibold text-slate-950">{formatMoney(stats.totalHoldingAmount)}</p>
        </div>
        <div className="ui-card-subtle card-hover rounded-2xl px-4 py-3">
          <p className="text-xs font-medium text-slate-500">成本金额</p>
          <p className="mt-1 text-2xl font-semibold text-slate-950">{formatMoney(stats.totalCost)}</p>
        </div>
        <div className="ui-card-subtle card-hover rounded-2xl px-4 py-3">
          <p className="text-xs font-medium text-slate-500">持有收益</p>
          <p className={`mt-1 text-2xl font-semibold ${stats.totalProfit >= 0 ? 'text-red-600' : 'text-green-600'}`}>
            {formatMoney(stats.totalProfit, true)}
          </p>
          <p className="mt-1 text-xs text-slate-500">{formatRate(stats.totalProfitRate, true)}</p>
        </div>
        <div className="ui-card-subtle card-hover rounded-2xl px-4 py-3">
          <p className="text-xs font-medium text-slate-500">仓位集中度</p>
          <p className="mt-1 text-2xl font-semibold text-slate-950">{concentrationText}</p>
          <p className="mt-1 truncate text-xs text-slate-500">
            最大仓位 {stats.largest ? `${stats.largestName} ${formatRate(stats.largestWeight)}` : '--'}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <table className="w-full table-fixed text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold text-slate-500">
                <th className="px-4 py-3">基金</th>
                <th className="px-4 py-3 text-right">持有金额</th>
                <th className="px-4 py-3 text-right">占比</th>
                <th className="px-4 py-3 text-right">持有收益</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats.rows.map((row) => (
                <tr key={row.id} className="hover:bg-blue-50/35">
                  <td className="px-4 py-3">
                    <p className="truncate font-semibold text-slate-950">{row.name}</p>
                    <p className="mt-1 font-mono text-xs text-slate-500">{row.code}</p>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-950">{formatMoney(row.amount)}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{formatRate(row.weight)}</td>
                  <td className={`px-4 py-3 text-right font-semibold ${row.profit >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatMoney(row.profit, true)}
                    <p className="mt-1 text-xs font-normal">{formatRate(row.profitRate, true)}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-sm font-semibold text-slate-950">组合提示</p>
          <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
            <p>盈利基金 {stats.profitCount} 只，亏损基金 {stats.lossCount} 只。</p>
            <p>已启用定投 {stats.dcaCount} 只，可在“我的持仓”中继续调整频率和金额。</p>
            <p>{stats.largestWeight !== null && stats.largestWeight >= 0.45 ? '最大单只基金占比较高，分析结论需要优先关注该基金风险。' : '当前仓位没有明显单只过度集中。'}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Dashboard() {
  const [holdings] = useState<PortfolioHolding[]>(() => loadPortfolioFromStorage());
  const [analysis, setAnalysis] = useState<FundAnalysisRun | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { snapshotsByFundCode, loading: snapshotsLoading } = usePortfolioSnapshots(holdings);

  const fundInputs = useMemo(() => buildFundInputs(holdings, snapshotsByFundCode), [holdings, snapshotsByFundCode]);

  useEffect(() => {
    let ignore = false;

    async function analyzePortfolio() {
      if (fundInputs.length === 0) {
        setAnalysis(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const result = await runFundAnalysis(fundInputs);
        if (!ignore) setAnalysis(result);
      } catch (err) {
        if (!ignore) setError(err instanceof Error ? err.message : '分析失败，请检查持仓数据后重试');
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    analyzePortfolio();
    return () => {
      ignore = true;
    };
  }, [fundInputs]);

  const headlineStats = useMemo(() => {
    if (!analysis || analysis.results.length === 0) {
      return [
        { label: '持仓基金', value: `${fundInputs.length} 只` },
        { label: '分析模式', value: '自动' },
        { label: '数据来源', value: '我的持仓' },
      ];
    }

    const averageScore = analysis.results.reduce((sum, item) => sum + item.score, 0) / analysis.results.length;
    const highRiskCount = analysis.results.filter((item) => String(item.data.riskLevel).includes('高')).length;
    return [
      { label: '已分析基金', value: `${analysis.results.length} 只` },
      { label: '平均评分', value: averageScore.toFixed(1) },
      { label: '较高风险', value: `${highRiskCount} 只` },
    ];
  }, [analysis, fundInputs.length]);

  return (
    <div className="mx-auto max-w-7xl space-y-7 animate-fade-in">
      <section className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
        <div className="research-panel overflow-hidden rounded-2xl">
          <div className="p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700 ring-1 ring-blue-100">
                Portfolio Driven
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                我的持仓 · 自动分析
              </span>
            </div>
            <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight text-slate-950 sm:text-5xl">
              基金趋势分析工作台
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              分析范围自动跟随“我的持仓”。持仓中有多少只基金，这里就分析多少只基金，并结合持仓金额生成组合层面的持仓分析。
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              {headlineStats.map((stat) => (
                <div key={stat.label} className="ui-card-subtle card-hover rounded-2xl px-4 py-3">
                  <p className="text-xs font-medium text-slate-500">{stat.label}</p>
                  <p className="mt-1 text-2xl font-semibold text-slate-950">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="border-t border-slate-200 bg-slate-50/80 px-6 py-4 sm:px-8">
            <p className="text-sm text-slate-600">本工具用于辅助基金研究，不构成投资建议。</p>
          </div>
        </div>

        <div className="info-surface rounded-2xl p-5">
          <div className="flex items-center justify-between border-b border-blue-100 pb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Research Pipeline</p>
              <p className="mt-1 text-lg font-semibold text-slate-950">持仓驱动分析流程</p>
            </div>
            <span className="rounded-lg bg-blue-100 px-2 py-1 font-mono text-xs font-semibold text-blue-700">v2.2</span>
          </div>
          <ol className="mt-5 grid gap-2">
            {['读取我的持仓', '按基金代码去重', '生成单基金分析', '汇总持仓金额', '计算收益与仓位占比', '输出组合提示', '生成多基金横向比较'].map((item, index) => (
              <li key={item} className="grid grid-cols-[32px_minmax(0,1fr)] items-center gap-3 rounded-xl border border-blue-100 bg-white px-3 py-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 font-mono text-xs font-semibold text-blue-700">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="text-sm text-slate-700">{item}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {holdings.length > 0 && <HoldingAnalysis holdings={holdings} snapshotsByFundCode={snapshotsByFundCode} />}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {(loading || snapshotsLoading) && (
        <section className="research-panel rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-100 border-t-blue-600" />
            <div>
              <p className="font-semibold text-slate-950">正在分析我的持仓</p>
              <p className="mt-1 text-sm text-slate-500">系统正在获取基金名称和净值快照，并按当前持仓生成趋势分析和横向比较。</p>
            </div>
          </div>
        </section>
      )}

      {holdings.length === 0 && !loading && !snapshotsLoading && (
        <section className="rounded-2xl border border-dashed border-blue-200 bg-white/80 p-10 text-center shadow-sm">
          <p className="text-sm font-semibold text-slate-700">当前没有可分析的持仓</p>
          <p className="mt-2 text-sm text-slate-500">请先在“我的持仓”添加基金代码、持有金额和持有收益。</p>
          <Link
            to="/"
            className="ui-button-primary mt-5 inline-flex rounded-xl px-4 py-2 text-sm font-semibold"
          >
            去添加持仓
          </Link>
        </section>
      )}

      {analysis && !loading && !snapshotsLoading && (
        <section className="space-y-6">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-950">分析结果</h2>
              <p className="mt-1 text-sm text-slate-500">生成时间：{analysis.generatedAt}</p>
            </div>
          </div>

          <FundComparisonTable comparison={analysis.comparison} />

          <div className="pt-1">
            <h2 className="text-lg font-semibold text-slate-950">单只基金分析</h2>
            <p className="mt-1 text-sm text-slate-500">按“我的持仓”中的每只基金逐一生成类型识别、趋势判断、持仓拆解和风控建议。</p>
          </div>

          <div className="grid gap-5">
            {analysis.results.map((result) => (
              <FundAnalysisCard key={result.data.code} result={result} />
            ))}
          </div>
        </section>
      )}

      <Disclaimer />
    </div>
  );
}
