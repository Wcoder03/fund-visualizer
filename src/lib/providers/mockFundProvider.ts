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

// 不再生成随机 fallback 数据，未知基金返回 null

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
    if (!snapshot) return null;
    return {
      fundCode,
      fundName: snapshot.fundName,
      fundType: snapshot.fundName.includes('QDII') ? 'QDII' : '指数型',
      fundCompany: '',
      fundManager: '',
      inceptionDate: '',
      fundSize: '',
      riskLevel: '',
      dataSource: 'mock',
      dataStatus: 'fallback',
      updatedAt: new Date().toISOString(),
    } satisfies UnifiedFundBasicInfo;
  },

  async fetchFundRealtimeEstimate(fundCode) {
    const snapshot = getMockNavSnapshot(fundCode);
    if (!snapshot) return null;
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
    const snapshot = getMockNavSnapshot(fundCode);
    if (!snapshot) return [];
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
    const snapshot = getMockNavSnapshot(fundCode);
    if (!snapshot) return null;
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
