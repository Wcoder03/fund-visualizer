import type { FundNavHistoryItem, FundRealtimeEstimate } from '../types/fund';
import type { FundNavSnapshot, MarketStatus } from '../types/portfolio';

export function normalizeNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  const parsed = Number(String(value).replace('%', ''));
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function normalizeRatePercent(value: unknown): number | undefined {
  const parsed = normalizeNumber(value);
  return parsed === undefined ? undefined : parsed / 100;
}

export function buildSnapshot(input: {
  fundCode: string;
  fundName: string;
  realtime?: FundRealtimeEstimate | null;
  latest?: { latestNav?: number; accumulatedNav?: number; navDate?: string; dailyChangeRate?: number } | null;
  history?: FundNavHistoryItem[];
  marketStatus: MarketStatus;
  dataSource: FundNavSnapshot['dataSource'];
  dataStatus: FundNavSnapshot['dataStatus'];
  message?: string;
}): FundNavSnapshot {
  const previous = input.history?.[1] ?? input.history?.[0];
  const latestConfirmedNav = input.latest?.latestNav ?? input.realtime?.latestConfirmedNav;
  const confirmedNav = input.marketStatus === 'nav_confirmed' ? latestConfirmedNav : undefined;
  const estimatedNav = input.realtime?.estimatedNav;
  const displayNav =
    input.marketStatus === 'nav_confirmed'
      ? confirmedNav ?? latestConfirmedNav
      : input.marketStatus === 'trading' || input.marketStatus === 'closed_pending_nav'
        ? estimatedNav ?? latestConfirmedNav
        : latestConfirmedNav;

  return {
    fundCode: input.fundCode,
    fundName: input.fundName,
    previousNav: previous?.unitNav ?? input.realtime?.previousNav,
    previousNavDate: previous?.date,
    latestConfirmedNav,
    currentNav: displayNav,
    confirmedNav,
    confirmedNavDate: input.latest?.navDate,
    displayNav,
    navDate: input.latest?.navDate || input.realtime?.navDate || '',
    estimatedNav,
    estimatedNavDate: input.realtime?.estimateTime || '',
    estimateTime: input.realtime?.estimateTime,
    dailyChangeRate: input.latest?.dailyChangeRate,
    intradayChangeRate: input.realtime?.estimatedChangeRate ?? 0,
    confirmedChangeRate: input.latest?.dailyChangeRate,
    marketStatus: input.marketStatus,
    dataSource: input.dataSource,
    dataStatus: input.dataStatus,
    updatedAt: new Date().toISOString(),
    message: input.message,
    navHistory: input.history?.map((item) => ({
      date: item.date,
      unitNav: item.unitNav,
    })),
  };
}
