import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { ChartDataPoint } from '../types/fund';

interface CompareBarProps {
  data: ChartDataPoint[];
  title?: string;
  height?: number;
  horizontal?: boolean;
}

export default function CompareBar({
  data,
  title,
  height = 300,
  horizontal = false,
}: CompareBarProps) {
  const getBarColor = (value: number): string => {
    if (value > 0) return '#dc2626';
    if (value < 0) return '#16a34a';
    return '#64748b';
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderCustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      return (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 shadow-sm">
          <p className="text-sm text-slate-500">{label}</p>
          <p className="text-lg font-semibold" style={{ color: getBarColor(value) }}>
            {value >= 0 ? '+' : ''}{value.toFixed(2)}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      {title && (
        <h3 className="mb-4 text-base font-semibold text-slate-950">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        {horizontal ? (
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 10, right: 30, left: 80, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              type="number"
              tick={{ fontSize: 12, fill: '#64748b' }}
              tickFormatter={(value) => `${value}%`}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 12, fill: '#64748b' }}
              width={70}
            />
            <Tooltip content={renderCustomTooltip} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color || getBarColor(entry.value)}
                  fillOpacity={0.86}
                />
              ))}
            </Bar>
          </BarChart>
        ) : (
          <BarChart
            data={data}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12, fill: '#64748b' }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#64748b' }}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip content={renderCustomTooltip} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color || getBarColor(entry.value)}
                  fillOpacity={0.86}
                />
              ))}
            </Bar>
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
