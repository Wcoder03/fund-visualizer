import type { MarketStatus } from '../types/portfolio';

export function navStatusLabel(status?: MarketStatus): string {
  if (!status) return '净值缺失';
  const labels: Record<MarketStatus, string> = {
    before_open: '待交易',
    trading: '盘中估算',
    closed_pending_nav: '闭市估算',
    nav_confirmed: '当日确认',
    non_trading_day: '非交易日',
  };
  return labels[status];
}

export function navStatusNote(status?: MarketStatus): string {
  if (!status) return '暂无可用净值快照，无法计算金额和收益。';
  const notes: Record<MarketStatus, string> = {
    before_open: '盘前使用最近确认净值，当日收益显示为 --。',
    trading: '盘中使用估算净值，最终以确认净值为准。',
    closed_pending_nav: '闭市后净值尚未确认，披露后会更新。',
    nav_confirmed: '使用当日确认净值计算收益。',
    non_trading_day: '非交易日使用最近确认净值，当日收益显示为 --。',
  };
  return notes[status];
}
