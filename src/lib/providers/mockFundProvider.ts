import { getMockNavSnapshot, mockNavSnapshots } from '../mockNavSnapshots';
import type {
  FundLatestNav,
  FundNavHistoryItem,
  FundRealtimeEstimate,
  FundRiskMetrics,
  FundSearchResult,
  IndustryAllocation,
  UnifiedFundBasicInfo,
  UnifiedFundHolding,
} from '../../types/fund';
import type { FundDataProvider } from './types';

const mockFunds = mockNavSnapshots.map((snapshot) => ({
  fundCode: snapshot.fundCode,
  fundName: snapshot.fundName,
}));

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

/** 为不在 mock 列表中的基金生成一个合理的 fallback snapshot */
function buildFallbackSnapshot(fundCode: string) {
  const nav = 1.0 + Math.random() * 2;
  const prevNav = nav * (1 - 0.005 + Math.random() * 0.01);
  return {
    fundCode,
    fundName: `基金 ${fundCode}`,
    previousNav: Number(prevNav.toFixed(4)),
    previousNavDate: yesterdayKey(),
    latestConfirmedNav: Number(nav.toFixed(4)),
    currentNav: Number(nav.toFixed(4)),
    confirmedNav: Number(nav.toFixed(4)),
    confirmedNavDate: yesterdayKey(),
    displayNav: Number(nav.toFixed(4)),
    navDate: yesterdayKey(),
    estimatedNav: Number((nav * (1 + Math.random() * 0.01)).toFixed(4)),
    estimatedNavDate: todayKey(),
    estimateTime: `${todayKey()} 15:00`,
    dailyChangeRate: Number((Math.random() * 0.02 - 0.01).toFixed(4)),
    intradayChangeRate: Number((Math.random() * 0.02 - 0.01).toFixed(4)),
    confirmedChangeRate: Number((Math.random() * 0.02 - 0.01).toFixed(4)),
    marketStatus: 'nav_confirmed' as const,
    dataSource: 'mock' as const,
    dataStatus: 'fallback' as const,
    updatedAt: new Date().toISOString(),
    message: '该基金代码未在演示数据中，当前展示模拟净值',
  };
}

export const mockFundProvider: FundDataProvider = {
  async searchFunds(keyword) {
    return mockFunds
      .filter((fund) => fund.fundCode.includes(keyword) || fund.fundName.includes(keyword))
      .map((fund): FundSearchResult => ({
        ...fund,
        fundType: fund.fundName.includes('QDII') ? 'QDII' : '指数型',
        pinyin: '',
        dataSource: 'mock',
      }));
  },

  async fetchFundBasicInfo(fundCode) {
    const snapshot = getMockNavSnapshot(fundCode);
    return {
      fundCode,
      fundName: snapshot?.fundName ?? `基金 ${fundCode}`,
      fundType: snapshot?.fundName?.includes('QDII') ? 'QDII' : '指数型',
      fundCompany: 'Mock 基金公司',
      fundManager: 'Mock 基金经理',
      inceptionDate: '2020-01-01',
      fundSize: '10.00亿元',
      riskLevel: '中高风险',
      dataSource: 'mock',
      dataStatus: 'fallback',
      updatedAt: new Date().toISOString(),
    } satisfies UnifiedFundBasicInfo;
  },

  async fetchFundRealtimeEstimate(fundCode) {
    const snapshot = getMockNavSnapshot(fundCode) ?? buildFallbackSnapshot(fundCode);
    return {
      fundCode,
      fundName: snapshot.fundName,
      previousNav: snapshot.previousNav,
      latestConfirmedNav: snapshot.latestConfirmedNav ?? snapshot.currentNav,
      estimatedNav: snapshot.estimatedNav,
      estimatedChangeRate: snapshot.intradayChangeRate,
      estimateTime: snapshot.estimateTime ?? snapshot.estimatedNavDate,
      navDate: snapshot.navDate,
      marketStatus: snapshot.marketStatus,
      dataSource: 'mock',
      dataStatus: 'fallback',
    } satisfies FundRealtimeEstimate;
  },

  async fetchFundNavHistory(fundCode) {
    const snapshot = getMockNavSnapshot(fundCode) ?? buildFallbackSnapshot(fundCode);
    if (!snapshot.previousNav || !snapshot.currentNav) return [];
    return [
      {
        date: snapshot.previousNavDate || yesterdayKey(),
        unitNav: snapshot.previousNav,
        accumulatedNav: snapshot.previousNav,
        dataSource: 'mock',
      },
      {
        date: snapshot.navDate,
        unitNav: snapshot.currentNav,
        accumulatedNav: snapshot.currentNav,
        dailyChangeRate: snapshot.confirmedChangeRate,
        dataSource: 'mock',
      },
    ] satisfies FundNavHistoryItem[];
  },

  async fetchFundLatestNav(fundCode) {
    const snapshot = getMockNavSnapshot(fundCode) ?? buildFallbackSnapshot(fundCode);
    return {
      fundCode,
      fundName: snapshot.fundName,
      latestNav: snapshot.latestConfirmedNav ?? snapshot.currentNav,
      accumulatedNav: snapshot.latestConfirmedNav ?? snapshot.currentNav,
      navDate: snapshot.confirmedNavDate ?? snapshot.navDate,
      dailyChangeRate: snapshot.confirmedChangeRate,
      dataSource: 'mock',
      dataStatus: 'fallback',
    } satisfies FundLatestNav;
  },

  async fetchFundHoldings() {
    return [] satisfies UnifiedFundHolding[];
  },

  async fetchFundIndustryAllocation() {
    return [] satisfies IndustryAllocation[];
  },

  async fetchFundRiskMetrics() {
    return {
      maxDrawdown: undefined,
      volatility: undefined,
      sharpeRatio: undefined,
      dataSource: 'mock',
      dataStatus: 'fallback',
    } satisfies FundRiskMetrics;
  },
};
