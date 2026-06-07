import { describe, expect, it } from 'vitest';
import { getDailyProfitLossLabel, getDisplayNav, getMarketStatus } from '../src/lib/marketStatus';
import type { FundNavSnapshot } from '../src/types/portfolio';

describe('marketStatus', () => {
  it('detects market status windows', () => {
    const calendar = [{ date: '2026-06-05', isTradingDay: true, navConfirmed: false }];
    expect(getMarketStatus(new Date('2026-06-05T08:30:00'), calendar)).toBe('before_open');
    expect(getMarketStatus(new Date('2026-06-05T10:30:00'), calendar)).toBe('trading');
    expect(getMarketStatus(new Date('2026-06-05T16:30:00'), calendar)).toBe('closed_pending_nav');
    expect(getMarketStatus(new Date('2026-06-05T21:30:00'), calendar)).toBe('nav_confirmed');
    expect(getMarketStatus(new Date('2026-06-06T10:30:00'), [{ date: '2026-06-06', isTradingDay: false }])).toBe('non_trading_day');
  });

  it('selects display nav and labels', () => {
    const snapshot: FundNavSnapshot = {
      fundCode: '001',
      fundName: '测试基金',
      previousNav: 1,
      currentNav: 1.1,
      confirmedNav: 1.12,
      estimatedNav: 1.13,
      navDate: '2026-06-05',
      estimatedNavDate: '2026-06-05',
      intradayChangeRate: 0.1,
      marketStatus: 'trading',
    };
    expect(getDisplayNav(snapshot)).toBe(1.13);
    expect(getDisplayNav({ ...snapshot, marketStatus: 'nav_confirmed' })).toBe(1.12);
    expect(getDailyProfitLossLabel('closed_pending_nav')).toBe('闭市估算');
  });
});
