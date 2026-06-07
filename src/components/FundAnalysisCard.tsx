import { useState } from 'react';
import RiskBadge from './RiskBadge';
import ScenarioTable from './ScenarioTable';
import TrendBadge from './TrendBadge';
import type { FundAnalysisResult } from '../types/fundAnalysis';

interface FundAnalysisCardProps {
  result: FundAnalysisResult;
}

function pct(value: number): string {
  if (value === 0) return '--';
  return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
}

function Val({ value, fallback = '暂无数据' }: { value: string | number | undefined | null; fallback?: string }) {
  if (value === undefined || value === null || value === '' || value === 0) {
    return <span className="text-slate-300">{fallback}</span>;
  }
  return <>{String(value)}</>;
}

function MetricCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2.5">
      <p className="text-[11px] text-slate-400">{label}</p>
      <p className={`mt-0.5 text-[15px] font-bold tabular-nums ${highlight ? 'text-rose-600' : 'text-slate-800'}`}>{value}</p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/50">
      <p className="text-[12px] text-slate-400">{text}</p>
    </div>
  );
}

export default function FundAnalysisCard({ result }: FundAnalysisCardProps) {
  const { data, framework, performance, holdings, trends, scenarios, advice, score } = result;
  const [detailsVisible, setDetailsVisible] = useState(false);

  const hasReturns = data.return1m !== 0 || data.return3m !== 0 || data.return1y !== 0;
  const hasHoldings = data.holdings.length > 0;
  const hasIndustry = data.industryAllocation.length > 0;
  const hasRisk = data.maxDrawdown !== 0 || data.volatility !== 0 || data.sharpeRatio !== 0;
  const hasPosition = data.stockPosition > 0 || data.bondPosition > 0 || data.cashPosition > 0;

  return (
    <article className="ui-card overflow-hidden">
      <header className="border-b border-slate-100 px-5 py-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[13px] font-semibold text-slate-500">{data.code}</span>
              <RiskBadge level={data.riskLevel} />
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-600 ring-1 ring-blue-200/60">{data.type}</span>
            </div>
            <h3 className="mt-1.5 text-[17px] font-bold text-slate-900">{data.name}</h3>
            <p className="mt-0.5 text-[13px] text-slate-400">
              {data.company || '基金公司信息待更新'} · {data.coreDirection || '投资方向待更新'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-center">
              <p className="text-[10px] font-medium text-slate-400">综合评分</p>
              <p className="mt-0.5 text-[22px] font-bold leading-none text-slate-900 tabular-nums">
                {score.toFixed(1)}
                <span className="ml-0.5 text-[11px] font-medium text-slate-400">/10</span>
              </p>
            </div>
            <button
              type="button"
              aria-expanded={detailsVisible}
              onClick={() => setDetailsVisible((visible) => !visible)}
              className="ui-button-primary shrink-0 rounded-lg px-3.5 py-2 text-[13px] font-medium"
            >
              {detailsVisible ? '收起详情' : '基金详情'}
            </button>
          </div>
        </div>
      </header>

      {detailsVisible && (
        <div className="space-y-4 p-5">
          {/* Core metrics */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            <MetricCard label="当前净值" value={data.latestNav ? data.latestNav.toFixed(4) : '--'} />
            <MetricCard label="近1月" value={data.return1m ? pct(data.return1m) : '--'} highlight={data.return1m > 0} />
            <MetricCard label="近3月" value={data.return3m ? pct(data.return3m) : '--'} highlight={data.return3m > 0} />
            <MetricCard label="近1年" value={data.return1y ? pct(data.return1y) : '--'} highlight={data.return1y > 0} />
            <MetricCard label="最大回撤" value={data.maxDrawdown ? pct(data.maxDrawdown) : '--'} />
            <MetricCard label="波动率" value={data.volatility ? pct(data.volatility) : '--'} />
          </div>

          {/* Basic info + Framework */}
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h4 className="mb-2 text-[14px] font-semibold text-slate-800">基本信息</h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[13px]">
                {[
                  ['基金公司', data.company],
                  ['投资范围', data.investmentScope],
                  ['当前风格', data.currentStyle || undefined],
                  ['累计净值', data.accumulatedNav ? data.accumulatedNav.toFixed(4) : undefined],
                  ['夏普比率', data.sharpeRatio ? data.sharpeRatio.toFixed(2) : undefined],
                  ['数据来源', data.source],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between gap-2">
                    <span className="shrink-0 text-slate-400">{label}</span>
                    <span className="truncate font-medium text-slate-700"><Val value={val} /></span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
              <h4 className="mb-2 text-[14px] font-semibold text-slate-800">{framework.title}</h4>
              <ul className="space-y-1.5 text-[13px] leading-[1.6] text-slate-600">
                {framework.points.map((point) => <li key={point}>{point}</li>)}
              </ul>
            </div>
          </div>

          {/* Returns chart or empty */}
          {hasReturns ? (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h4 className="mb-3 text-[14px] font-semibold text-slate-800">收益表现</h4>
              <div className="flex items-end gap-3">
                {[
                  { label: '近1月', val: data.return1m },
                  { label: '近3月', val: data.return3m },
                  { label: '近6月', val: data.return6m },
                  { label: '近1年', val: data.return1y },
                  { label: '近3年', val: data.return3y },
                ].filter(d => d.val !== 0).map(d => {
                  const maxAbs = Math.max(1, Math.abs(data.return1m), Math.abs(data.return3m), Math.abs(data.return6m), Math.abs(data.return1y));
                  const height = Math.max(16, Math.min(120, (Math.abs(d.val) / maxAbs) * 120));
                  return (
                    <div key={d.label} className="flex flex-1 flex-col items-center gap-1">
                      <span className={`text-[12px] font-bold tabular-nums ${d.val >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {pct(d.val)}
                      </span>
                      <div
                        className={`w-full max-w-[48px] rounded-t-md ${d.val >= 0 ? 'bg-red-400' : 'bg-green-400'}`}
                        style={{ height: `${height}px` }}
                      />
                      <span className="text-[11px] text-slate-400">{d.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <EmptyState text="暂无历史收益数据" />
          )}

          {/* Holdings / Industry */}
          <div className="grid gap-4 lg:grid-cols-2">
            {hasHoldings ? (
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <h4 className="mb-2 text-[14px] font-semibold text-slate-800">前十大持仓</h4>
                <div className="space-y-1.5">
                  {data.holdings.slice(0, 10).map((h, i) => (
                    <div key={i} className="flex items-center gap-2 text-[13px]">
                      <span className="w-5 text-right text-[11px] text-slate-400">{i + 1}</span>
                      <span className="flex-1 truncate text-slate-700">{h.name}</span>
                      <span className="shrink-0 tabular-nums text-slate-500">{h.weight.toFixed(1)}%</span>
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-blue-400" style={{ width: `${Math.min(100, h.weight * 5)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState text="当前数据源暂未提供持仓结构" />
            )}

            {hasIndustry ? (
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <h4 className="mb-2 text-[14px] font-semibold text-slate-800">行业分布</h4>
                <div className="space-y-1.5">
                  {data.industryAllocation.slice(0, 8).map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-[13px]">
                      <span className="flex-1 truncate text-slate-700">{item.name}</span>
                      <span className="shrink-0 tabular-nums text-slate-500">{item.weight.toFixed(1)}%</span>
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-indigo-400" style={{ width: `${Math.min(100, item.weight * 2.5)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState text="当前数据源暂未提供行业分布" />
            )}
          </div>

          {/* Risk + Position */}
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h4 className="mb-2 text-[14px] font-semibold text-slate-800">风险指标</h4>
              {hasRisk ? (
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[13px]">
                  {data.maxDrawdown !== 0 && (
                    <div className="flex justify-between"><span className="text-slate-400">最大回撤</span><span className="font-medium text-slate-700">{pct(data.maxDrawdown)}</span></div>
                  )}
                  {data.volatility !== 0 && (
                    <div className="flex justify-between"><span className="text-slate-400">波动率</span><span className="font-medium text-slate-700">{pct(data.volatility)}</span></div>
                  )}
                  {data.sharpeRatio !== 0 && (
                    <div className="flex justify-between"><span className="text-slate-400">夏普比率</span><span className="font-medium text-slate-700">{data.sharpeRatio.toFixed(2)}</span></div>
                  )}
                  <div className="flex justify-between"><span className="text-slate-400">风险等级</span><span className="font-medium text-slate-700">{data.riskLevel}</span></div>
                </div>
              ) : (
                <p className="text-[12px] text-slate-400">部分风险指标暂未接入数据源</p>
              )}
              {data.type === 'QDII' && (
                <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-[12px] text-amber-700">
                  QDII 基金受海外市场、汇率和时区差异影响，非交易日净值更新可能滞后。
                </p>
              )}
            </div>
            {hasPosition && (
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <h4 className="mb-2 text-[14px] font-semibold text-slate-800">资产配置</h4>
                <div className="flex items-center gap-3">
                  {data.stockPosition > 0 && (
                    <div className="flex-1 text-center">
                      <div className="mx-auto h-20 w-20 rounded-full border-8 border-blue-400 flex items-center justify-center">
                        <span className="text-[14px] font-bold text-slate-800 tabular-nums">{data.stockPosition}%</span>
                      </div>
                      <p className="mt-1 text-[11px] text-slate-400">股票</p>
                    </div>
                  )}
                  {data.bondPosition > 0 && (
                    <div className="flex-1 text-center">
                      <div className="mx-auto h-20 w-20 rounded-full border-8 border-indigo-400 flex items-center justify-center">
                        <span className="text-[14px] font-bold text-slate-800 tabular-nums">{data.bondPosition}%</span>
                      </div>
                      <p className="mt-1 text-[11px] text-slate-400">债券</p>
                    </div>
                  )}
                  {data.cashPosition > 0 && (
                    <div className="flex-1 text-center">
                      <div className="mx-auto h-20 w-20 rounded-full border-8 border-slate-300 flex items-center justify-center">
                        <span className="text-[14px] font-bold text-slate-800 tabular-nums">{data.cashPosition}%</span>
                      </div>
                      <p className="mt-1 text-[11px] text-slate-400">现金</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Performance analysis */}
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h4 className="text-[14px] font-semibold text-slate-800">历史表现与持仓分析</h4>
            <p className="mt-2 text-[13px] leading-[1.6] text-slate-600">{performance.summary}</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <div className="rounded-lg bg-emerald-50/50 px-3 py-2">
                <p className="text-[11px] font-semibold text-emerald-700">主要优势</p>
                <ul className="mt-1 space-y-0.5 text-[12px] text-emerald-800">
                  {performance.strengths.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
              <div className="rounded-lg bg-amber-50/50 px-3 py-2">
                <p className="text-[11px] font-semibold text-amber-700">主要风险</p>
                <ul className="mt-1 space-y-0.5 text-[12px] text-amber-800">
                  {performance.weaknesses.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
            </div>
          </div>

          {/* Trends */}
          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <h4 className="mb-2 text-[14px] font-semibold text-slate-800">未来趋势判断</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-[11px] font-semibold text-slate-400">
                    <th className="px-2 py-1.5">周期</th>
                    <th className="px-2 py-1.5">趋势</th>
                    <th className="px-2 py-1.5">核心理由</th>
                    <th className="px-2 py-1.5">风险因素</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {trends.map((trend) => (
                    <tr key={trend.period} className="align-top">
                      <td className="whitespace-nowrap px-2 py-2 font-medium text-slate-700">{trend.period}</td>
                      <td className="px-2 py-2"><TrendBadge trend={trend.trend} confidence={trend.confidence} size="sm" /></td>
                      <td className="px-2 py-2 text-slate-600">{trend.reason}</td>
                      <td className="px-2 py-2 text-slate-600">{trend.riskFactors}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Scenarios */}
          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <h4 className="mb-2 text-[14px] font-semibold text-slate-800">情景分析</h4>
            <ScenarioTable scenarios={scenarios} />
          </section>

          {/* Advice */}
          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <h4 className="mb-2 text-[14px] font-semibold text-slate-800">操作建议</h4>
            <p className="mb-2 text-[11px] text-slate-400">基于当前可用数据自动生成，仅供参考</p>
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-[11px] font-semibold text-slate-400">
                    <th className="px-2 py-1.5">投资者类型</th>
                    <th className="px-2 py-1.5">加仓</th>
                    <th className="px-2 py-1.5">定投</th>
                    <th className="px-2 py-1.5">仓位区间</th>
                    <th className="px-2 py-1.5">风险提醒</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {advice.map((item) => (
                    <tr key={item.investorType} className="align-top">
                      <td className="whitespace-nowrap px-2 py-2 font-medium text-slate-700">{item.investorType}</td>
                      <td className="px-2 py-2 text-slate-600">{item.addPosition}</td>
                      <td className="px-2 py-2 text-slate-600">{item.fixedInvestment}</td>
                      <td className="px-2 py-2 text-slate-600">{item.positionRange}</td>
                      <td className="px-2 py-2 text-slate-600">{item.riskReminder}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Footer */}
          <footer className="flex flex-col gap-1 border-t border-slate-100 pt-3 text-[11px] text-slate-400 sm:flex-row sm:justify-between">
            <span>数据来源：{data.source || '暂无数据'}</span>
            <span>{data.dataDate ? `数据日期：${data.dataDate}` : ''}</span>
          </footer>
        </div>
      )}
    </article>
  );
}
