import TrendBadge from './TrendBadge';
import type { FundComparisonResult } from '../types/fundAnalysis';

interface FundComparisonTableProps {
  comparison: FundComparisonResult;
}

export default function FundComparisonTable({ comparison }: FundComparisonTableProps) {
  if (comparison.rows.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">多基金横向对比</h2>
          <p className="mt-1 text-sm text-slate-500">按基金类型、趋势、风险和定投适配生成比较结果。</p>
        </div>
      </div>

      <div className="ui-card overflow-hidden rounded-2xl">
        <table className="w-full table-fixed text-xs xl:text-sm">
          <colgroup>
            <col className="w-[7%]" />
            <col className="w-[15%]" />
            <col className="w-[7%]" />
            <col className="w-[9%]" />
            <col className="w-[10%]" />
            <col className="w-[7%]" />
            <col className="w-[7%]" />
            <col className="w-[7%]" />
            <col className="w-[14%]" />
            <col className="w-[13%]" />
            <col className="w-[4%]" />
          </colgroup>
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold text-slate-500">
              <th className="px-2 py-3">代码</th>
              <th className="px-2 py-3">名称</th>
              <th className="px-2 py-3">类型</th>
              <th className="px-2 py-3">投资方向</th>
              <th className="px-2 py-3">当前风格</th>
              <th className="px-2 py-3">短期</th>
              <th className="px-2 py-3">中期</th>
              <th className="px-2 py-3">长期</th>
              <th className="px-2 py-3">主要优势</th>
              <th className="px-2 py-3">主要风险</th>
              <th className="px-2 py-3">定投</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {comparison.rows.map((row) => (
              <tr key={row.code} className="align-top transition-colors hover:bg-blue-50/35">
                <td className="break-words px-2 py-3 font-mono font-semibold text-slate-900">{row.code}</td>
                <td className="break-words px-2 py-3 text-slate-900">{row.name}</td>
                <td className="break-words px-2 py-3 text-slate-600">{row.fundType}</td>
                <td className="break-words px-2 py-3 text-slate-600">{row.direction}</td>
                <td className="break-words px-2 py-3 text-slate-600">{row.currentStyle}</td>
                <td className="px-2 py-3"><TrendBadge trend={row.shortTrend} size="sm" /></td>
                <td className="px-2 py-3"><TrendBadge trend={row.midTrend} size="sm" /></td>
                <td className="px-2 py-3"><TrendBadge trend={row.longTrend} size="sm" /></td>
                <td className="break-words px-2 py-3 text-slate-600">{row.mainAdvantage}</td>
                <td className="break-words px-2 py-3 text-slate-600">{row.mainRisk}</td>
                <td className="break-words px-2 py-3 text-slate-600">{row.fixedInvestment}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {comparison.rankings.map((ranking) => (
          <div key={ranking.title} className="ui-card card-hover rounded-2xl p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{ranking.title}</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-mono text-sm font-semibold text-slate-500">{ranking.code}</span>
              <span className="font-semibold text-slate-950">{ranking.name}</span>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">{ranking.reason}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
