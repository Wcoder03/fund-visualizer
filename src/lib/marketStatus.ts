import type { FundNavSnapshot, MarketStatus } from '../types/portfolio';

export interface TradingCalendarDay {
  date: string;
  isTradingDay: boolean;
  navConfirmed?: boolean;
}

const pad = (value: number) => String(value).padStart(2, '0');

export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export const mockTradingCalendar: TradingCalendarDay[] = [
  { date: '2026-06-05', isTradingDay: true, navConfirmed: true },
  { date: '2026-06-06', isTradingDay: false, navConfirmed: false },
  { date: '2026-06-08', isTradingDay: true, navConfirmed: false },
];

export function isTradingDay(date: Date, tradingCalendar: TradingCalendarDay[] = mockTradingCalendar): boolean {
  const dateKey = toDateKey(date);
  const calendarDay = tradingCalendar.find((item) => item.date === dateKey);
  if (calendarDay) return calendarDay.isTradingDay;
  const day = date.getDay();
  return day !== 0 && day !== 6;
}

export function getNextTradingDay(date: Date, tradingCalendar: TradingCalendarDay[] = mockTradingCalendar): Date {
  const candidate = new Date(date);
  candidate.setHours(0, 0, 0, 0);
  for (let i = 0; i < 370; i += 1) {
    if (isTradingDay(candidate, tradingCalendar)) return candidate;
    candidate.setDate(candidate.getDate() + 1);
  }
  return candidate;
}

export function getMarketStatus(now: Date, tradingCalendar: TradingCalendarDay[] = mockTradingCalendar): MarketStatus {
  const dateKey = toDateKey(now);
  const day = tradingCalendar.find((item) => item.date === dateKey);
  if (day && !day.isTradingDay) return 'non_trading_day';

  // 不在日历中的日期，按周末规则判断
  if (!day) {
    const weekday = now.getDay();
    if (weekday === 0 || weekday === 6) return 'non_trading_day';
  }

  const hour = now.getHours();
  const minute = now.getMinutes();
  const minutes = hour * 60 + minute;

  if (minutes < 9 * 60 + 30) return 'before_open';
  if (minutes <= 15 * 60) return 'trading';
  if (day?.navConfirmed || minutes >= 21 * 60) return 'nav_confirmed';
  return 'closed_pending_nav';
}

export function getDisplayNav(snapshot?: FundNavSnapshot): number | undefined {
  if (!snapshot) return undefined;
  if (snapshot.displayNav) return snapshot.displayNav;
  if (snapshot.marketStatus === 'nav_confirmed') return snapshot.confirmedNav ?? snapshot.currentNav;
  if (snapshot.marketStatus === 'trading' || snapshot.marketStatus === 'closed_pending_nav') {
    return snapshot.estimatedNav ?? snapshot.latestConfirmedNav ?? snapshot.currentNav;
  }
  return snapshot.latestConfirmedNav ?? snapshot.currentNav ?? snapshot.confirmedNav ?? snapshot.previousNav;
}

export function getDailyProfitLossLabel(status: MarketStatus): string {
  const labels: Record<MarketStatus, string> = {
    before_open: '待交易',
    trading: '盘中估算',
    closed_pending_nav: '闭市估算',
    nav_confirmed: '当日确认盈亏',
    non_trading_day: '非交易日无当日盈亏',
  };
  return labels[status];
}

export function getMarketStatusNote(status: MarketStatus): string {
  const notes: Record<MarketStatus, string> = {
    before_open: '展示昨日确认净值，当日盈亏待交易开始后估算。',
    trading: '盘中数据仅为估算，最终以基金公司披露净值为准。',
    closed_pending_nav: '闭市后净值尚未确认，当前展示闭市估算。',
    nav_confirmed: '净值已确认，使用确认净值计算当日盈亏。',
    non_trading_day: '非交易日展示最近一个交易日确认净值。',
  };
  return notes[status];
}
