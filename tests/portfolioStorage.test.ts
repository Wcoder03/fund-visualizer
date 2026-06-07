import { beforeEach, describe, expect, it } from 'vitest';
import { clearPortfolioStorage, loadPortfolioFromStorage, savePortfolioToStorage } from '../src/lib/portfolioStorage';
import type { PortfolioHolding } from '../src/types/portfolio';

describe('portfolioStorage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('returns empty array for damaged data', () => {
    window.localStorage.setItem('fund-visualizer.portfolio.v1', '{bad json');
    expect(loadPortfolioFromStorage()).toEqual([]);
  });

  it('saves, loads, and clears holdings', () => {
    const holding: PortfolioHolding = {
      id: 'h1',
      fundCode: '001',
      fundName: '测试基金',
      costAmount: 1000,
      firstBuyDate: '2026-01-01',
      holdingDays: 1,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    };
    savePortfolioToStorage([holding]);
    expect(loadPortfolioFromStorage()).toHaveLength(1);
    clearPortfolioStorage();
    expect(loadPortfolioFromStorage()).toEqual([]);
  });

  it('filters old built-in demo holdings from storage', () => {
    const demo: PortfolioHolding = {
      id: 'holding-018173',
      fundCode: '018173',
      fundName: '华泰柏瑞中证电力ETF联接C',
      costAmount: 1000,
      firstBuyDate: '2026-01-01',
      holdingDays: 1,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    };
    const real: PortfolioHolding = {
      ...demo,
      id: 'user-holding-018173',
    };
    window.localStorage.setItem('fund-visualizer.portfolio.v1', JSON.stringify({ version: 1, holdings: [demo, real] }));
    expect(loadPortfolioFromStorage()).toEqual([real]);
  });
});
