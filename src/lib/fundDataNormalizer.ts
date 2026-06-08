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
  // 从历史净值中找最新确认净值（确保 value 和 date 来自同一条记录）
  const validHistory = (input.history ?? []).filter(
    (item) => item.date && item.unitNav != null && Number.isFinite(item.unitNav) && item.unitNav > 0
  );

  // 最新确认净值：历史列表最后一条（已按时间正序）
  const latestFromHistory = validHistory.length > 0 ? validHistory[validHistory.length - 1] : undefined;

  // 前一交易日净值：历史列表倒数第二条
  const previous = validHistory.length >= 2 ? validHistory[validHistory.length - 2] : undefined;

  // 最新确认净值：优先从 realtime API 的 dwjz+jzrq 获取（最准确的确认净值+日期）
  const rtNav = input.realtime?.latestConfirmedNav;
  const rtDate = input.realtime?.navDate;
  const latestNav = input.latest?.latestNav;
  const latestDate = input.latest?.navDate;

  // 选择日期最新的来源
  let latestConfirmedNav: number | undefined;
  let latestConfirmedNavDate: string | undefined;

  if (rtNav && rtDate && latestNav && latestDate) {
    // 两个来源都有数据，选日期更新的
    if (rtDate >= latestDate) {
      latestConfirmedNav = rtNav;
      latestConfirmedNavDate = rtDate;
    } else {
      latestConfirmedNav = latestNav;
      latestConfirmedNavDate = latestDate;
    }
  } else if (rtNav && rtDate) {
    latestConfirmedNav = rtNav;
    latestConfirmedNavDate = rtDate;
  } else if (latestNav && latestDate) {
    latestConfirmedNav = latestNav;
    latestConfirmedNavDate = latestDate;
  } else {
    latestConfirmedNav = latestFromHistory?.unitNav;
    latestConfirmedNavDate = latestFromHistory?.date;
  }

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
    previousNav: previous?.unitNav ?? input.realtime?.previousNav,
    previousNavDate: previous?.date,
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
    navHistory: input.history?.map((item) => ({
      date: item.date,
      unitNav: item.unitNav,
    })),
  };
}
