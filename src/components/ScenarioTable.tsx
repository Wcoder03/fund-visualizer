import type { ScenarioAnalysis } from '../types/fundAnalysis';

interface ScenarioTableProps {
  scenarios: ScenarioAnalysis[];
}

export default function ScenarioTable({ scenarios }: ScenarioTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-[760px] w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold text-slate-500">
            <th className="px-3 py-2">情景</th>
            <th className="px-3 py-2">触发条件</th>
            <th className="px-3 py-2">可能表现</th>
            <th className="px-3 py-2">观察指标</th>
            <th className="px-3 py-2">应对策略</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {scenarios.map((scenario) => (
            <tr key={scenario.scenario}>
              <td className="px-3 py-3 font-semibold text-slate-900">{scenario.scenario}</td>
              <td className="px-3 py-3 text-slate-600">{scenario.trigger}</td>
              <td className="px-3 py-3 text-slate-600">{scenario.possiblePerformance}</td>
              <td className="px-3 py-3 text-slate-600">{scenario.watchIndicator}</td>
              <td className="px-3 py-3 text-slate-600">{scenario.strategy}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
