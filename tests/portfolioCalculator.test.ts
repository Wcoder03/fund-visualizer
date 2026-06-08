import { describe, expect, it } from 'vitest';
import {
  calculateAnnualizedReturn,
  calculateDailyProfitLoss,
  calculateMarketValue,
  calculateNextDcaDate,
  calculatePortfolioProfitLoss,
  inferFirstBuyDateFromNavHistory,
  calculateTotalProfitLoss,
  calculateTotalProfitLossRate,
} from '../src/lib/portfolioCalculator';
import { getDisplayNav } from '../src/lib/marketStatus';
import type { FundNavSnapshot, MarketStatus, PortfolioHolding } from '../src/types/portfolio';

function snapshot(status: MarketStatus, patch: Partial<FundNavSnapshot> = {}): FundNavSnapshot {
  return {
    fundCode: '001',
    fundName: '测试基金',
    previousNav: 1.0,
    latestConfirmedNav: 1.01,
    confirmedNav: 1.02,
    estimatedNav: 1.03,
    navDate: '2026-06-05',
    estimatedNavDate: '2026-06-05',
    intradayChangeRate: 0,
    marketStatus: status,
    ...patch,
  };
}

const holding: PortfolioHolding = {
  id: 'h1',
  fundCode: '001',
  fundName: '测试基金',
  holdingShares: 1000,
  costAmount: 1000,
  firstBuyDate: '2026-01-01',
  holdingDays: 1,
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
};

describe('portfolioCalculator', () => {
  it('calculates market value and total profit loss', () => {
    expect(calculateMarketValue(1000, 1.2345)).toBe(1234.5);
    expect(calculateTotalProfitLoss(1234.5, 1000)).toBe(234.5);
    expect(calculateTotalProfitLossRate(234.5, 1000)).toBe(0.2345);
    expect(calculateTotalProfitLossRate(null, 1000)).toBeNull();
  });

  it('calculates daily profit loss', () => {
    expect(calculateDailyProfitLoss(1000, 1.2, 1.1)).toBe(100);
  });

  it('calculates annualized return safely', () => {
    expect(calculateAnnualizedReturn(0.1, 365)).toBe(0.1);
    expect(calculateAnnualizedReturn(0.1, 0)).toBeNull();
    expect(calculateAnnualizedReturn(0.1, 1)).not.toBeNull();
  });

  it('calculates next DCA date by frequency', () => {
    const today = new Date('2026-06-06T10:00:00');
    expect(calculateNextDcaDate({ frequency: 'daily', investDay: 1, startDate: '2026-01-01', status: 'active' }, today)).toBe('2026-06-08');
    expect(calculateNextDcaDate({ frequency: 'monthly', investDay: 15, startDate: '2026-01-01', status: 'active' }, today)).toBe('2026-06-15');
    expect(calculateNextDcaDate({ frequency: 'weekly', investDay: 1, startDate: '2026-01-01', status: 'active' }, today)).toBe('2026-06-08');
    expect(calculateNextDcaDate({ frequency: 'weekly', investDay: 1, startDate: '2026-01-01', status: 'paused' }, today)).toBeUndefined();
  });

  it('moves DCA dates away from non-trading days', () => {
    const beforeWeekend = new Date('2026-06-01T10:00:00');
    expect(calculateNextDcaDate({ frequency: 'monthly', investDay: 6, startDate: '2026-01-01', status: 'active' }, beforeWeekend)).toBe('2026-06-08');
  });

  it('selects displayNav by market status', () => {
    expect(getDisplayNav(snapshot('nav_confirmed'))).toBe(1.02);
    expect(getDisplayNav(snapshot('trading'))).toBe(1.03);
    expect(getDisplayNav(snapshot('closed_pending_nav'))).toBe(1.03);
    expect(getDisplayNav(snapshot('before_open'))).toBe(1.01);
    expect(getDisplayNav(snapshot('non_trading_day'))).toBe(1.01);
  });

  it('calculates trading daily profit loss', () => {
    const result = calculatePortfolioProfitLoss(holding, snapshot('trading'));
    expect(result.marketValue).toBe(1030);
    expect(result.dailyProfitLoss).toBe(30);
    expect(result.dailyProfitLossRate).toBe(0.03);
  });

  it('calculates closed pending daily profit loss', () => {
    const result = calculatePortfolioProfitLoss(holding, snapshot('closed_pending_nav'));
    expect(result.dailyProfitLoss).toBe(30);
    expect(result.dailyProfitLossRate).toBe(0.03);
  });

  it('calculates confirmed daily profit loss', () => {
    const result = calculatePortfolioProfitLoss(holding, snapshot('nav_confirmed'));
    expect(result.confirmedDailyProfitLoss).toBe(20);
    expect(result.confirmedDailyProfitLossRate).toBe(0.02);
  });

  it('does not calculate daily profit without previous nav', () => {
    const result = calculatePortfolioProfitLoss(holding, snapshot('trading', { previousNav: undefined }));
    expect(result.dailyProfitLoss).toBeNull();
    expect(result.dailyProfitLossRate).toBeNull();
  });

  it('does not calculate market value without displayNav', () => {
    const result = calculatePortfolioProfitLoss({ ...holding, holdingAmount: 678.9, holdingShares: undefined }, undefined);
    expect(result.marketValue).toBeNull();
    expect(result.totalProfitLoss).toBeNull();
    expect(result.dataStatus).toBe('partial');
  });

  it('estimates shares from holding amount and displayNav', () => {
    const result = calculatePortfolioProfitLoss({ ...holding, holdingShares: undefined, holdingAmount: 1030 }, snapshot('trading'));
    expect(result.calculatedHoldingShares).toBe(1000);
    expect(result.sharesEstimated).toBe(true);
    expect(result.marketValue).toBe(1030);
  });

  it('infers first buy date from the nearest cost nav in history', () => {
    expect(inferFirstBuyDateFromNavHistory(1.29, [
      { date: '2026-05-01', unitNav: 1.1 },
      { date: '2026-05-20', unitNav: 1.291 },
      { date: '2026-06-01', unitNav: 1.4 },
    ])).toBe('2026-05-20');
  });

  it('uses inferred first buy date for holding days', () => {
    const result = calculatePortfolioProfitLoss({
      ...holding,
      holdingShares: undefined,
      holdingAmount: 1030,
      costAmount: 1000,
      firstBuyDate: '2026-06-06',
    }, snapshot('trading', {
      navHistory: [
        { date: '2026-05-01', unitNav: 1.0 },
        { date: '2026-06-05', unitNav: 1.03 },
      ],
    }));
    expect(result.inferredCostNav).toBe(1.0);
    expect(result.inferredFirstBuyDate).toBe('2026-05-01');
    expect(result.holdingDays).toBeGreaterThan(0);
  });
});
