import { useState } from 'react';
import HoldingPie from '../charts/HoldingPie';
import ReturnBar from '../charts/ReturnBar';
import RiskBadge from './RiskBadge';
import ScenarioTable from './ScenarioTable';
import TrendBadge from './TrendBadge';
import type { FundAnalysisResult } from '../types/fundAnalysis';

interface FundAnalysisCardProps {
  result: FundAnalysisResult;
}

function pct(value: number): string {
  return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
}

function MiniTable({ rows }: { rows: [string, React.ReactNode][] }) {
  return (
    <table className="w-full text-sm">
      <tbody className="divide-y divide-slate-100">
        {rows.map(([label, value]) => (
          <tr key={label}>
            <td className="w-32 py-2 pr-3 text-slate-500">{label}</td>
            <td className="py-2 font-medium text-slate-900">{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function FundAnalysisCard({ result }: FundAnalysisCardProps) {
  const { data, framework, performance, holdings, trends, scenarios, advice, score } = result;
  const [detailsVisible, setDetailsVisible] = useState(false);
  const returnData = [
    { name: '近1月', value: data.return1m },
    { name: '近3月', value: data.return3m },
    { name: '近6月', value: data.return6m },
    { name: '近1年', value: data.return1y },
    { name: '近3年', value: data.return3y },
  ];
  const positionData = [
    { name: '股票仓位', value: data.stockPosition },
    { name: '债券仓位', value: data.bondPosition },
    { name: '现金比例', value: data.cashPosition },
  ].filter((item) => item.value > 0);

  return (
    <article className="ui-card overflow-hidden">
      <header className="border-b border-slate-100 bg-white p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-semibold text-slate-500">{data.code}</span>
              <RiskBadge level={data.riskLevel} />
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-100">{data.type}</span>
            </div>
            <h3 className="mt-2 text-xl font-semibold text-slate-950">{data.name}</h3>
            <p className="mt-1 text-sm text-slate-500">{data.company} · {data.manager} · {data.coreDirection}</p>
          </div>
          <div className="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 sm:w-auto sm:justify-start">
            <div className="min-w-20">
              <p className="text-[11px] font-medium text-slate-500">综合评分</p>
              <p className="mt-0.5 text-xl font-semibold leading-none text-slate-950">
                {score.toFixed(1)}
                <span className="ml-1 text-xs font-medium text-slate-500">/ 10</span>
              </p>
            </div>
            <button
              type="button"
              aria-expanded={detailsVisible}
              onClick={() => setDetailsVisible((visible) => !visible)}
              className="ui-button-primary shrink-0 rounded-xl px-3.5 py-2 text-sm font-semibold"
            >
              {detailsVisible ? '收起详情' : '基金详情'}
            </button>
          </div>
        </div>
      </header>

      {detailsVisible && (
        <div className="grid gap-5 p-5">
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <h4 className="mb-3 text-sm font-semibold text-slate-950">基本信息</h4>
              <MiniTable rows={[
                ['成立日期', data.inceptionDate],
                ['基金规模', data.scale],
                ['投资范围', data.investmentScope],
                ['当前风格', data.currentStyle],
                ['最新单位净值', data.latestNav.toFixed(4)],
                ['最新累计净值', data.accumulatedNav.toFixed(4)],
              ]} />
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <h4 className="mb-3 text-sm font-semibold text-slate-950">风险指标</h4>
              <MiniTable rows={[
                ['最大回撤', pct(data.maxDrawdown)],
                ['波动率', pct(data.volatility)],
                ['夏普比率', data.sharpeRatio.toFixed(2)],
                ['股票仓位', pct(data.stockPosition)],
                ['债券仓位', pct(data.bondPosition)],
                ['现金比例', pct(data.cashPosition)],
              ]} />
            </div>
            <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
              <h4 className="mb-3 text-sm font-semibold text-slate-950">{framework.title}</h4>
              <ul className="space-y-2 text-sm leading-6 text-slate-600">
                {framework.points.map((point) => <li key={point}>{point}</li>)}
              </ul>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <ReturnBar data={returnData} title="收益表现" height={260} />
            <HoldingPie data={data.industryAllocation.map((item) => ({ name: item.name, value: item.weight }))} title="行业分布" height={260} />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <HoldingPie data={positionData} title="持仓结构" height={240} />
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <h4 className="text-sm font-semibold text-slate-950">历史表现与持仓分析</h4>
              <p className="mt-3 text-sm leading-6 text-slate-600">{performance.summary}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-red-50 p-3">
                  <p className="text-xs font-semibold text-red-700">主要优势</p>
                  <ul className="mt-2 space-y-1 text-sm text-red-900">
                    {performance.strengths.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </div>
                <div className="rounded-xl bg-green-50 p-3">
                  <p className="text-xs font-semibold text-green-700">主要风险</p>
                  <ul className="mt-2 space-y-1 text-sm text-green-900">
                    {performance.weaknesses.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </div>
              </div>
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-600">
                <p>{holdings.summary}</p>
                <p>{holdings.keyExposure}</p>
                <p>{holdings.styleDrift}</p>
              </div>
            </div>
          </div>

          <section className="rounded-2xl border border-slate-200 bg-white p-4">
            <h4 className="text-sm font-semibold text-slate-950">未来趋势判断</h4>
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-[920px] w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold text-slate-500">
                    <th className="px-3 py-2">周期</th>
                    <th className="px-3 py-2">趋势</th>
                    <th className="px-3 py-2">核心理由</th>
                    <th className="px-3 py-2">利好因素</th>
                    <th className="px-3 py-2">风险因素</th>
                    <th className="px-3 py-2">观察指标</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {trends.map((trend) => (
                    <tr key={trend.period} className="align-top">
                      <td className="px-3 py-3 font-medium text-slate-900">{trend.period}</td>
                      <td className="px-3 py-3"><TrendBadge trend={trend.trend} confidence={trend.confidence} size="sm" /></td>
                      <td className="px-3 py-3 text-slate-600">{trend.reason}</td>
                      <td className="px-3 py-3 text-slate-600">{trend.positiveFactors}</td>
                      <td className="px-3 py-3 text-slate-600">{trend.riskFactors}</td>
                      <td className="px-3 py-3 text-slate-600">{trend.watchIndicators}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4">
            <h4 className="mb-3 text-sm font-semibold text-slate-950">乐观 / 中性 / 悲观情景分析</h4>
            <ScenarioTable scenarios={scenarios} />
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4">
            <h4 className="mb-3 text-sm font-semibold text-slate-950">操作建议</h4>
            <div className="overflow-x-auto">
              <table className="min-w-[920px] w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold text-slate-500">
                    <th className="px-3 py-2">投资者类型</th>
                    <th className="px-3 py-2">加仓</th>
                    <th className="px-3 py-2">分批买入</th>
                    <th className="px-3 py-2">定投</th>
                    <th className="px-3 py-2">仓位区间</th>
                    <th className="px-3 py-2">止盈 / 止损参考</th>
                    <th className="px-3 py-2">风险提醒</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {advice.map((item) => (
                    <tr key={item.investorType} className="align-top">
                      <td className="px-3 py-3 font-medium text-slate-900">{item.investorType}</td>
                      <td className="px-3 py-3 text-slate-600">{item.addPosition}</td>
                      <td className="px-3 py-3 text-slate-600">{item.batchBuy}</td>
                      <td className="px-3 py-3 text-slate-600">{item.fixedInvestment}</td>
                      <td className="px-3 py-3 text-slate-600">{item.positionRange}</td>
                      <td className="px-3 py-3 text-slate-600">{item.takeProfitStopLoss}</td>
                      <td className="px-3 py-3 text-slate-600">{item.riskReminder}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <footer className="flex flex-col gap-1 border-t border-slate-100 pt-4 text-xs text-slate-500 sm:flex-row sm:justify-between">
            <span>数据来源：{data.source}</span>
            <span>数据日期：{data.dataDate}</span>
          </footer>
        </div>
      )}
    </article>
  );
}
