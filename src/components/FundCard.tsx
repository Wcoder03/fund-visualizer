import { Link } from 'react-router-dom';
import type { FundData } from '../types/fund';
import { formatPercentage, getReturnColor } from '../utils/dataTransform';
import TrendBadge from './TrendBadge';
import ScoreRing from './ScoreRing';

interface FundCardProps {
  fund: FundData;
}

export default function FundCard({ fund }: FundCardProps) {
  const { basicInfo, performance, trends, score } = fund;
  const shortTrend = trends.find((t) => t.period.includes('短期'));

  return (
    <Link
      to={`/fund/${basicInfo.code}`}
      className="block bg-white rounded-xl shadow-sm border border-gray-200 p-5 card-hover"
    >
      {/* 头部：名称 + 评分 */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-gray-500 truncate">
            {basicInfo.code}
          </h3>
          <h2 className="text-base font-semibold text-gray-900 mt-0.5 truncate">
            {basicInfo.name}
          </h2>
        </div>
        <div className="relative ml-3">
          <ScoreRing score={score} size="sm" showLevel={false} />
        </div>
      </div>

      {/* 分隔线 */}
      <div className="border-t border-gray-100 my-3" />

      {/* 关键指标 */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <p className="text-xs text-gray-500">近1月</p>
          <p
            className="text-sm font-semibold"
            style={{ color: getReturnColor(performance.return1m) }}
          >
            {formatPercentage(performance.return1m)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">近1年</p>
          <p
            className="text-sm font-semibold"
            style={{ color: getReturnColor(performance.return1y) }}
          >
            {formatPercentage(performance.return1y)}
          </p>
        </div>
      </div>

      {/* 分隔线 */}
      <div className="border-t border-gray-100 my-3" />

      {/* 趋势标签 */}
      <div className="flex items-center justify-between">
        {shortTrend && (
          <TrendBadge
            trend={shortTrend.trend}
            confidence={shortTrend.confidence}
            size="sm"
          />
        )}
        <span className="text-xs text-gray-400">
          {basicInfo.type}
        </span>
      </div>
    </Link>
  );
}
