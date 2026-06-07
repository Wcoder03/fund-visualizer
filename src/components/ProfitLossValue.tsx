import { formatMoney, formatNumber, formatRate, profitLossColor } from '../lib/portfolioFormatters';

interface ProfitLossValueProps {
  value: number | null | undefined;
  type?: 'money' | 'rate' | 'plain';
  digits?: number;
  showSign?: boolean;
  className?: string;
}

export default function ProfitLossValue({ value, type = 'money', digits = 2, showSign = true, className = '' }: ProfitLossValueProps) {
  const text = type === 'rate'
    ? formatRate(value, showSign)
    : type === 'money'
      ? formatMoney(value, showSign)
      : formatNumber(value, digits);

  return <span className={`${profitLossColor(value)} ${className}`}>{text}</span>;
}
