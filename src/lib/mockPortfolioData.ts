import { calculateHoldingDays, calculateNextDcaDate, estimateNextDcaShares } from './portfolioCalculator';
import { getMockNavSnapshot } from './mockNavSnapshots';
import type { PortfolioHolding } from '../types/portfolio';

export function createMockPortfolioHoldings(): PortfolioHolding[] {
  const now = new Date().toISOString();
  const electricNav = getMockNavSnapshot('018173')?.currentNav;
  const qdiiNav = getMockNavSnapshot('008254')?.estimatedNav;

  return [
    {
      id: 'holding-018173',
      fundCode: '018173',
      fundName: '华泰柏瑞中证电力ETF联接C',
      holdingAmount: 12800,
      holdingShares: 9450.21,
      costAmount: 11600,
      costNav: 1.2275,
      firstBuyDate: '2025-09-12',
      holdingDays: calculateHoldingDays('2025-09-12'),
      note: '防御配置，观察电力红利风格延续性',
      dcaPlan: {
        enabled: true,
        amount: 800,
        frequency: 'monthly',
        investDay: 15,
        startDate: '2025-10-15',
        nextInvestDate: calculateNextDcaDate({ frequency: 'monthly', investDay: 15, startDate: '2025-10-15', status: 'active' }),
        status: 'active',
        totalInvestedAmount: 6400,
        estimatedNextShares: estimateNextDcaShares(800, electricNav),
      },
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'holding-008254',
      fundCode: '008254',
      fundName: '华宝致远混合(QDII)C',
      holdingAmount: 9200,
      holdingShares: 4513.72,
      costAmount: 9800,
      costNav: 2.171,
      firstBuyDate: '2026-01-08',
      holdingDays: calculateHoldingDays('2026-01-08'),
      note: '海外科技弹性仓位，控制单基金比例',
      dcaPlan: {
        enabled: true,
        amount: 500,
        frequency: 'biweekly',
        investDay: 3,
        startDate: '2026-02-01',
        nextInvestDate: calculateNextDcaDate({ frequency: 'biweekly', investDay: 3, startDate: '2026-02-01', status: 'paused' }),
        status: 'paused',
        totalInvestedAmount: 2500,
        estimatedNextShares: estimateNextDcaShares(500, qdiiNav),
      },
      createdAt: now,
      updatedAt: now,
    },
  ];
}
