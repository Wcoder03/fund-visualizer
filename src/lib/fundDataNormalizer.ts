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
  // 从历史净值中提取有效记录
  let validHistory = (input.history ?? []).filter(
    (item) => item.date && item.unitNav != null && Number.isFinite(item.unitNav) && item.unitNav > 0
  );

  // 如果实时 API 有更新的确认净值，追加到历史中（修复历史数据滞后问题）
  const rtNav = input.realtime?.latestConfirmedNav;
  const rtDate = input.realtime?.navDate;
  if (rtNav && rtDate && rtNav > 0) {
    const lastHistoryDate = validHistory.length > 0 ? validHistory[validHistory.length - 1].date : '';
    if (!lastHistoryDate || rtDate > lastHistoryDate) {
      validHistory = [...validHistory, { date: rtDate, unitNav: rtNav, dataSource: 'eastmoney' as const }];
    }
  }

  const latestFromHistory = validHistory.length > 0 ? validHistory[validHistory.length - 1] : undefined;

  // 最新确认净值和前一交易日净值：从合并后的历史中取
  const latestConfirmedNav = latestFromHistory?.unitNav;
  const latestConfirmedNavDate = latestFromHistory?.date;

  const previous = validHistory.length >= 2 ? validHistory[validHistory.length - 2] : undefined;
  const previousNav = previous?.unitNav;
  const previousNavDate = previous?.date;

  const confirmedNav = input.marketStatus === 'nav_confirmed' ? latestConfirmedNav : undefined;
  const confirmedNavDate = input.marketStatus === 'nav_confirmed' ? latestConfirmedNavDate : undefined;
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
    previousNav,
    previousNavDate,
    latestConfirmedNav,
    latestConfirmedNavDate,
    currentNav: displayNav,
    confirmedNav,
    confirmedNavDate,
    displayNav,
    navDate: latestConfirmedNavDate || input.realtime?.navDate || '',
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
    navHistory: validHistory.map((item) => ({
      date: item.date,
      unitNav: item.unitNav,
    })),
  };
}
