import { buildSnapshot } from './fundDataNormalizer';
import { getMarketStatus } from './marketStatus';
import { CACHE_TTL, serverCacheGet, serverCacheSet } from './serverCache';
import { eastmoneyProvider } from './providers/eastmoneyProvider';
import { mockFundProvider } from './providers/mockFundProvider';
import type { FundSearchResult } from '../types/fund';
import type { FundNavSnapshot } from '../types/portfolio';

function readEnv(key: string): string | undefined {
  return (globalThis as unknown as { process?: { env?: Record<string, string | undefined> } }).process?.env?.[key];
}

const fallbackEnabled = String(readEnv('ENABLE_MOCK_FALLBACK') ?? 'true') !== 'false';
const appDataMode = String(readEnv('NEXT_PUBLIC_APP_DATA_MODE') ?? 'real');

async function withFallback<T>(
  cacheKey: string,
  ttlMs: number,
  realFetcher: () => Promise<T | null | undefined>,
  mockFetcher: () => Promise<T | null | undefined>
): Promise<T | null> {
  const cached = serverCacheGet<T>(cacheKey);
  if (cached) return cached;

  if (appDataMode !== 'mock') {
    const real = await realFetcher();
    if (real && (!Array.isArray(real) || real.length > 0)) {
      serverCacheSet(cacheKey, real, ttlMs);
      return real;
    }
  }

  if (!fallbackEnabled) return null;
  const mock = await mockFetcher();
  if (mock) serverCacheSet(cacheKey, mock, ttlMs);
  return mock ?? null;
}

export async function searchFunds(keyword: string): Promise<FundSearchResult[]> {
  return withFallback(
    `funds:search:${keyword}`,
    CACHE_TTL.search,
    () => eastmoneyProvider.searchFunds(keyword),
    () => mockFundProvider.searchFunds(keyword)
  ).then((value) => value ?? []);
}

export async function getFundSnapshot(fundCode: string): Promise<FundNavSnapshot> {
  const cached = serverCacheGet<FundNavSnapshot>(`fund:${fundCode}:snapshot`);
  if (cached) return cached;

  const realRealtime = appDataMode === 'mock' ? null : await eastmoneyProvider.fetchFundRealtimeEstimate(fundCode);
  const realLatest = appDataMode === 'mock' ? null : await eastmoneyProvider.fetchFundLatestNav(fundCode);
  const realHistory = appDataMode === 'mock' ? [] : await eastmoneyProvider.fetchFundNavHistory(fundCode, '1y');
  const realBasic = appDataMode === 'mock' ? null : await eastmoneyProvider.fetchFundBasicInfo(fundCode);

  const hasReal = Boolean(realRealtime || realLatest || realHistory.length > 0 || realBasic);

  if (hasReal) {
    const snapshot = buildSnapshot({
      fundCode,
      fundName: realRealtime?.fundName || realBasic?.fundName || fundCode,
      realtime: realRealtime,
      latest: realLatest,
      history: realHistory,
      marketStatus: getMarketStatus(new Date()),
      dataSource: 'eastmoney',
      dataStatus: realRealtime?.dataStatus || realLatest?.dataStatus || 'partial',
      message: realRealtime && realLatest ? '真实数据' : '部分真实数据缺失',
    });
    serverCacheSet(`fund:${fundCode}:snapshot`, snapshot, CACHE_TTL.snapshot);
    return snapshot;
  }

  if (!fallbackEnabled) {
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
      message: '真实数据获取失败，且 mock fallback 已关闭',
    };
  }

  const [mockRealtime, mockLatest, mockHistory, mockBasic] = await Promise.all([
    mockFundProvider.fetchFundRealtimeEstimate(fundCode),
    mockFundProvider.fetchFundLatestNav(fundCode),
    mockFundProvider.fetchFundNavHistory(fundCode, '1m'),
    mockFundProvider.fetchFundBasicInfo(fundCode),
  ]);
  const snapshot = buildSnapshot({
    fundCode,
    fundName: mockRealtime?.fundName || mockBasic?.fundName || fundCode,
    realtime: mockRealtime,
    latest: mockLatest,
    history: mockHistory,
    marketStatus: (mockRealtime?.marketStatus as FundNavSnapshot['marketStatus']) || getMarketStatus(new Date()),
    dataSource: 'mock',
    dataStatus: 'fallback',
    message: '部分数据来自模拟数据，仅用于功能演示',
  });

  const hasNav = snapshot.displayNav ?? snapshot.currentNav ?? snapshot.latestConfirmedNav ?? snapshot.estimatedNav ?? snapshot.previousNav;
  if (!hasNav) {
    return {
      fundCode,
      fundName: mockBasic?.fundName || fundCode,
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

  serverCacheSet(`fund:${fundCode}:snapshot`, snapshot, CACHE_TTL.snapshot);
  return snapshot;
}

export const fundDataProvider = {
  searchFunds,
  getFundSnapshot,
};
