import { useParams, Link } from 'react-router-dom';
import { useFunds } from '../hooks/useFunds';
import {
  formatPercentage,
  formatNav,
  getReturnColor,
  transformReturnsToBarData,
} from '../utils/dataTransform';
import { getTrendColor, DIRECTION_COLORS } from '../types/fund';
import ReturnBar from '../charts/ReturnBar';
import ScoreRing from '../components/ScoreRing';
import TrendBadge from '../components/TrendBadge';

export default function FundDetail() {
  const { code } = useParams<{ code: string }>();
  const { funds, loading } = useFunds();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!code) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">未指定基金代码</p>
        <Link to="/" className="text-blue-600 hover:underline mt-2 inline-block">返回总览</Link>
      </div>
    );
  }

  const fund = funds.find((f) => f.basicInfo.code === code);

  if (!fund) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">未找到基金 {code} 的数据</p>
        <Link to="/" className="text-blue-600 hover:underline mt-2 inline-block">返回总览</Link>
      </div>
    );
  }

  const { basicInfo, performance, trends, scenarios, advice, marketImpact, holdingStructure, score } = fund;
  const returnData = transformReturnsToBarData(fund);

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* 返回按钮 + 标题 */}
      <div className="flex items-center gap-4">
        <Link to="/" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{basicInfo.name}</h1>
          <p className="text-sm text-gray-500">{basicInfo.code} · {basicInfo.company}</p>
        </div>
        <ScoreRing score={score} size="lg" showLevel />
      </div>

      {/* 基本信息 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">📋 基本信息</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-500">基金代码</p>
            <p className="text-sm font-medium text-gray-900 mt-1">{basicInfo.code}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">基金名称</p>
            <p className="text-sm font-medium text-gray-900 mt-1">{basicInfo.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">基金公司</p>
            <p className="text-sm font-medium text-gray-900 mt-1">{basicInfo.company || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">基金经理</p>
            <p className="text-sm font-medium text-gray-900 mt-1">{basicInfo.manager || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">成立日期</p>
            <p className="text-sm font-medium text-gray-900 mt-1">{basicInfo.establishDate || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">基金规模</p>
            <p className="text-sm font-medium text-gray-900 mt-1">{basicInfo.scale || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">基金类型</p>
            <p className="text-sm font-medium text-gray-900 mt-1">{basicInfo.type}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">风险等级</p>
            <p className="text-sm font-medium text-gray-900 mt-1">{basicInfo.riskLevel}</p>
          </div>
          {basicInfo.trackingIndex && (
            <div>
              <p className="text-sm text-gray-500">跟踪标的</p>
              <p className="text-sm font-medium text-gray-900 mt-1">{basicInfo.trackingIndex}</p>
            </div>
          )}
        </div>
      </div>

      {/* 业绩表现 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">📈 业绩表现</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">最新净值</p>
            <p className="text-lg font-semibold text-gray-900 mt-1">{formatNav(performance.nav)}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">近1周</p>
            <p className="text-lg font-semibold mt-1" style={{ color: getReturnColor(performance.return1w) }}>
              {formatPercentage(performance.return1w)}
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">近1月</p>
            <p className="text-lg font-semibold mt-1" style={{ color: getReturnColor(performance.return1m) }}>
              {formatPercentage(performance.return1m)}
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">近3月</p>
            <p className="text-lg font-semibold mt-1" style={{ color: getReturnColor(performance.return3m) }}>
              {formatPercentage(performance.return3m)}
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">近6月</p>
            <p className="text-lg font-semibold mt-1" style={{ color: getReturnColor(performance.return6m) }}>
              {formatPercentage(performance.return6m)}
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">近1年</p>
            <p className="text-lg font-semibold mt-1" style={{ color: getReturnColor(performance.return1y) }}>
              {formatPercentage(performance.return1y)}
            </p>
          </div>
          {performance.return3y !== undefined && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">近3年</p>
              <p className="text-lg font-semibold mt-1" style={{ color: getReturnColor(performance.return3y) }}>
                {formatPercentage(performance.return3y)}
              </p>
            </div>
          )}
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">成立以来</p>
            <p className="text-lg font-semibold mt-1" style={{ color: getReturnColor(performance.returnSinceStart) }}>
              {formatPercentage(performance.returnSinceStart)}
            </p>
          </div>
        </div>
        <ReturnBar data={returnData} title="收益柱状图" height={250} />
      </div>

      {/* 趋势判断 */}
      {trends.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">📊 趋势判断</h2>
          <div className="space-y-4">
            {trends.map((trend, index) => (
              <div
                key={index}
                className="p-4 rounded-lg border-2"
                style={{ borderColor: getTrendColor(trend.trend) }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-gray-900">{trend.period}</span>
                  <TrendBadge trend={trend.trend} confidence={trend.confidence} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">主要依据：</span>
                    <span className="text-gray-700">{trend.basis}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">关键利好：</span>
                    <span className="text-red-600">{trend.catalysts}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">关键利空：</span>
                    <span className="text-green-600">{trend.risks}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">观察指标：</span>
                    <span className="text-gray-700">{trend.watchIndicators}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 情景分析 */}
      {scenarios && scenarios.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">🎯 情景分析</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {scenarios.map((scenario, index) => (
              <div
                key={index}
                className="p-4 rounded-lg"
                style={{
                  backgroundColor: scenario.scenario === '乐观' ? '#fef2f2' :
                    scenario.scenario === '中性' ? '#f9fafb' : '#f0fdf4',
                  borderColor: scenario.scenario === '乐观' ? '#fecaca' :
                    scenario.scenario === '中性' ? '#e5e7bb' : '#bbf7d0',
                  borderWidth: '1px',
                }}
              >
                <h3
                  className="font-medium mb-3"
                  style={{
                    color: scenario.scenario === '乐观' ? '#dc2626' :
                      scenario.scenario === '中性' ? '#6b7280' : '#16a34a',
                  }}
                >
                  {scenario.scenario}情景
                </h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-500">触发条件：</span>
                    <span className="text-gray-700">{scenario.trigger}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">可能表现：</span>
                    <span className="text-gray-700">{scenario.performance}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">观察指标：</span>
                    <span className="text-gray-700">{scenario.indicator}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">应对策略：</span>
                    <span className="text-gray-700">{scenario.strategy}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 市场环境影响 */}
      {marketImpact && marketImpact.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">🌍 市场环境影响</h2>
          <div className="space-y-3">
            {marketImpact.map((impact, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">{impact.factor}</span>
                <span className="text-sm text-gray-600">{impact.impact}</span>
                <span
                  className="text-sm font-medium px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: `${DIRECTION_COLORS[impact.direction]}20`,
                    color: DIRECTION_COLORS[impact.direction],
                  }}
                >
                  {impact.direction}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 持仓结构 */}
      {holdingStructure && Object.keys(holdingStructure).length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">📦 持仓结构分析</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(holdingStructure).map(([key, value]) => (
              <div key={key} className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">{key}</p>
                <p className="text-sm font-medium text-gray-900 mt-1">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 操作建议 */}
      {advice.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">💡 操作建议</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">投资者类型</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">是否适合</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">建议仓位</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">操作建议</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {advice.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">{item.investorType}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{item.suitable}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{item.position}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{item.advice}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 返回按钮 */}
      <div className="flex justify-center py-6">
        <Link
          to="/"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          返回总览
        </Link>
      </div>
    </div>
  );
}
