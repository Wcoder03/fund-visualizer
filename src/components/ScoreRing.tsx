import { getScoreColor, getScoreLevel } from '../types/fund';

interface ScoreRingProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showLevel?: boolean;
}

export default function ScoreRing({
  score,
  size = 'md',
  showLabel = true,
  showLevel = false,
}: ScoreRingProps) {
  const color = getScoreColor(score);
  const level = getScoreLevel(score);
  const percentage = (score / 10) * 100;

  const sizeConfig = {
    sm: { width: 60, strokeWidth: 6, fontSize: 16 },
    md: { width: 80, strokeWidth: 8, fontSize: 20 },
    lg: { width: 120, strokeWidth: 12, fontSize: 28 },
  };

  const { width, strokeWidth, fontSize } = sizeConfig[size];
  const radius = (width - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={width} height={width} className="transform -rotate-90">
        {/* 背景圆 */}
        <circle
          cx={width / 2}
          cy={width / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />
        {/* 进度圆 */}
        <circle
          cx={width / 2}
          cy={width / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: 'stroke-dashoffset 0.5s ease-in-out',
          }}
        />
      </svg>
      {/* 分数文字 */}
      {showLabel && (
        <div
          className="absolute flex items-center justify-center"
          style={{ width, height: width }}
        >
          <span
            className="font-bold"
            style={{ fontSize, color }}
          >
            {score.toFixed(1)}
          </span>
        </div>
      )}
      {/* 等级标签 */}
      {showLevel && (
        <span
          className="text-xs font-medium px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: `${color}15`,
            color,
          }}
        >
          {level}
        </span>
      )}
    </div>
  );
}
