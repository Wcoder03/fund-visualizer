interface RiskBadgeProps {
  level: string;
}

const riskClass: Record<string, string> = {
  低风险: 'bg-green-50 text-green-700 ring-green-200',
  中低风险: 'bg-blue-50 text-blue-700 ring-blue-200',
  中风险: 'bg-slate-100 text-slate-600 ring-slate-200',
  中高风险: 'bg-orange-50 text-orange-700 ring-orange-200',
  高风险: 'bg-red-50 text-red-700 ring-red-200',
};

export default function RiskBadge({ level }: RiskBadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${riskClass[level] || riskClass['中风险']}`}>
      {level}
    </span>
  );
}
