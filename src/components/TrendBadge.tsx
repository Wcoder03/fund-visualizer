interface TrendBadgeProps {
  trend: string;
  confidence?: string;
  showArrow?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const trendMeta: Record<string, { color: string; arrow: string }> = {
  偏上涨: { color: '#16a34a', arrow: '↗' },
  震荡偏强: { color: '#2563eb', arrow: '↗' },
  震荡: { color: '#64748b', arrow: '→' },
  震荡偏弱: { color: '#f97316', arrow: '↘' },
  偏下跌: { color: '#dc2626', arrow: '↘' },
};

export default function TrendBadge({
  trend,
  confidence,
  showArrow = true,
  size = 'md',
}: TrendBadgeProps) {
  const meta = trendMeta[trend] || trendMeta['震荡'];

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${sizeClasses[size]}`}
      style={{
        backgroundColor: `${meta.color}14`,
        color: meta.color,
        border: `1px solid ${meta.color}33`,
      }}
    >
      {showArrow && <span className="trend-arrow">{meta.arrow}</span>}
      <span>{trend}</span>
      {confidence && <span className="text-xs opacity-70">({confidence})</span>}
    </span>
  );
}
