export function formatNumber(value: number | null | undefined, digits = 2): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '--';
  return value.toLocaleString('zh-CN', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function formatMoney(value: number | null | undefined, showSign = false): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '--';
  const sign = showSign && value > 0 ? '+' : '';
  return `${sign}${formatNumber(value, 2)}`;
}

export function formatRate(value: number | null | undefined, showSign = false): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '--';
  const sign = showSign && value > 0 ? '+' : '';
  return `${sign}${formatNumber(value * 100, 2)}%`;
}

export function formatNav(value: number | null | undefined): string {
  return formatNumber(value, 4);
}

export function profitLossColor(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value) || value === 0) return 'text-slate-500';
  return value > 0 ? 'text-red-600' : 'text-green-600';
}
