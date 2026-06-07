import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { ChartDataPoint } from '../types/fund';

interface HoldingPieProps {
  data: ChartDataPoint[];
  title?: string;
  height?: number;
}

const COLORS = [
  '#2563eb', '#0f172a', '#60a5fa', '#16a34a', '#64748b',
  '#f97316', '#1d4ed8', '#94a3b8', '#dc2626', '#0891b2',
];

export default function HoldingPie({ data, title, height = 300 }: HoldingPieProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderCustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 shadow-sm">
          <p className="text-sm text-slate-500">{payload[0].name}</p>
          <p className="text-lg font-semibold text-slate-950">
            {payload[0].value.toFixed(2)}%
          </p>
        </div>
      );
    }
    return null;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderCustomLabel = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props;
    if (percent < 0.05) return null;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={12}
        fontWeight={600}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      {title && (
        <h3 className="mb-4 text-sm font-semibold text-slate-950">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={100}
            fill="#2563eb"
            dataKey="value"
          >
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip content={renderCustomTooltip} />
          <Legend
            layout="vertical"
            verticalAlign="middle"
            align="right"
            formatter={(value: string) => (
              <span className="text-sm text-slate-600">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
