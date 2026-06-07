import { buildSnapshot } from './fundDataNormalizer';
import { getMarketStatus } from './marketStatus';
import { CACHE_TTL, serverCacheGet, serverCacheSet } from './serverCache';
import { eastmoneyProvider } from './providers/eastmoneyProvider';
import type { FundSearchResult } from '../types/fund';
import type { FundNavSnapshot } from '../types/portfolio';

export async function searchFunds(keyword: string): Promise<FundSearchResult[]> {
  const cached = serverCacheGet<FundSearchResult[]>(`funds:search:${keyword}`);
  if (cached) return cached;
  const result = await eastmoneyProvider.searchFunds(keyword);
  if (result.length > 0) serverCacheSet(`funds:search:${keyword}`, result, CACHE_TTL.search);
  return result;
}

export async function getFundSnapshot(fundCode: string): Promise<FundNavSnapshot> {
  const cached = serverCacheGet<FundNavSnapshot>(`fund:${fundCode}:snapshot`);
  if (cached) return cached;

  const [realRealtime, realLatest, realHistory, realBasic] = await Promise.all([
    eastmoneyProvider.fetchFundRealtimeEstimate(fundCode),
    eastmoneyProvider.fetchFundLatestNav(fundCode),
    eastmoneyProvider.fetchFundNavHistory(fundCode, '1y'),
    eastmoneyProvider.fetchFundBasicInfo(fundCode),
  ]);

  const hasReal = Boolean(realRealtime || realLatest || realHistory.length > 0 || realBasic);

  if (!hasReal) {
    return {
      fundCode,
      fundName: fundCode,
      navDate: '',
      estimatedNavDate: '',
      intradayChangeRate: 0,
      marketStatus: 'non_trading_day',
      dataSource: 'unavailable',
      dataStatus: 'error',
      updatedAt: new Date().toISOString(),
      message: `基金 ${fundCode} 的净值数据暂不可用，请确认基金代码是否正确`,
    };
  }

  const hasNav = Boolean(
    (realRealtime?.estimatedNav) ||
    (realRealtime?.latestConfirmedNav) ||
    (realLatest?.latestNav) ||
    (realHistory.length > 0)
  );

  const snapshot = buildSnapshot({
    fundCode,
    fundName: realRealtime?.fundName || realBasic?.fundName || fundCode,
    realtime: realRealtime,
    latest: realLatest,
    history: realHistory,
    marketStatus: getMarketStatus(new Date()),
    dataSource: 'eastmoney',
    dataStatus: hasNav ? (realRealtime?.dataStatus || realLatest?.dataStatus || 'partial') : 'error',
    message: hasNav ? (realRealtime && realLatest ? '真实数据' : '部分真实数据缺失') : '净值数据不可用',
  });

  serverCacheSet(`fund:${fundCode}:snapshot`, snapshot, CACHE_TTL.snapshot);
  return snapshot;
}

export const fundDataProvider = {
  searchFunds,
  getFundSnapshot,
};
