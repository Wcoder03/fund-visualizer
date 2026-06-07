import { useFunds } from '../hooks/useFunds';

export default function History() {
  const { funds, loading } = useFunds();

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-slate-900">基金列表</h1>

      <div className="ui-card p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">当前监控的基金</h2>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : funds.length === 0 ? (
          <p className="text-slate-500 text-center py-8">暂无基金数据</p>
        ) : (
          <div className="space-y-3">
            {funds.map((fund) => (
              <div
                key={fund.basicInfo.code}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
              >
                <div>
                  <span className="font-mono text-sm text-blue-600">
                    {fund.basicInfo.code}
                  </span>
                  <span className="ml-3 text-sm text-slate-900">{fund.basicInfo.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-slate-500">{fund.basicInfo.type}</span>
                  <span className="text-sm font-medium text-blue-600">
                    {fund.score.toFixed(1)}分
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
