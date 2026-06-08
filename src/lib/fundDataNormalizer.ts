import type { FundNavHistoryItem, FundRealtimeEstimate } from '../types/fund';
import type { FundMarketType, FundNavSnapshot, MarketStatus } from '../types/portfolio';

const US_KEYWORDS = ['QDII', '纳斯达克', '标普', '美股', '美国', '中概', '全球精选', '全球成长', '致远'];
const HK_KEYWORDS = ['港股', '恒生', '恒生科技'];
const GLOBAL_KEYWORDS = ['全球', '海外'];
const OTHER_KEYWORDS = ['越南', '印度', '日本', '德国', '欧洲', 'REIT', '石油', '黄金', '原油', '大宗商品'];

export function detectMarketType(fundName: string): FundMarketType {
  const upper = fundName.toUpperCase();
  if (US_KEYWORDS.some((kw) => upper.includes(kw.toUpperCase()))) return 'qdii_us';
  if (HK_KEYWORDS.some((kw) => upper.includes(kw.toUpperCase()))) return 'qdii_hk';
  if (OTHER_KEYWORDS.some((kw) => upper.includes(kw.toUpperCase()))) return 'overseas_other';
  if (GLOBAL_KEYWORDS.some((kw) => upper.includes(kw.toUpperCase()))) return 'qdii_global';
  return 'domestic';
}

export function isOverseasFund(marketType?: FundMarketType): boolean {
  return marketType != null && marketType !== 'domestic' && marketType !== 'unknown';
}

function isValidNumber(v: unknown): v is number {
  return v != null && Number.isFinite(v) && v > 0;
}

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
  const marketType = detectMarketType(input.fundName);

  // 从历史净值中提取有效记录
  let validHistory = (input.history ?? []).filter(
    (item) => item.date && item.unitNav != null && Number.isFinite(item.unitNav) && item.unitNav > 0
  );

  // 如果实时 API 有更新的确认净值，追加到历史中
  const rtNav = input.realtime?.latestConfirmedNav;
  const rtDate = input.realtime?.navDate;
  if (rtNav && rtDate && rtNav > 0) {
    const lastHistoryDate = validHistory.length > 0 ? validHistory[validHistory.length - 1].date : '';
    if (!lastHistoryDate || rtDate > lastHistoryDate) {
      validHistory = [...validHistory, { date: rtDate, unitNav: rtNav, dataSource: 'eastmoney' as const }];
    }
  }

  const latestFromHistory = validHistory.length > 0 ? validHistory[validHistory.length - 1] : undefined;

  const latestConfirmedNav = latestFromHistory?.unitNav;
  const latestConfirmedNavDate = latestFromHistory?.date;

  const previous = validHistory.length >= 2 ? validHistory[validHistory.length - 2] : undefined;
  const previousNav = previous?.unitNav;
  const previousNavDate = previous?.date;

  const estimatedNav = input.realtime?.estimatedNav;
  const estimatedChangeRate = input.realtime?.estimatedChangeRate;
  const isDomestic = marketType === 'domestic';

  // 按基金类型决定当前净值
  let displayNav: number | undefined;
  let confirmedNav: number | undefined;
  let confirmedNavDate: string | undefined;

  if (isDomestic) {
    // A 股基金：按 A 股交易时段判断
    confirmedNav = input.marketStatus === 'nav_confirmed' ? latestConfirmedNav : undefined;
    confirmedNavDate = input.marketStatus === 'nav_confirmed' ? latestConfirmedNavDate : undefined;
    displayNav =
      input.marketStatus === 'nav_confirmed'
        ? confirmedNav ?? latestConfirmedNav
        : input.marketStatus === 'trading' || input.marketStatus === 'closed_pending_nav'
          ? estimatedNav ?? latestConfirmedNav
          : latestConfirmedNav;
  } else {
    // QDII/海外基金：不依赖 A 股交易时段
    // 有估算净值就用估算，否则用最新确认净值
    displayNav = isValidNumber(estimatedNav) ? estimatedNav : latestConfirmedNav;
  }

  return {
    fundCode: input.fundCode,
    fundName: input.fundName,
    marketType,
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
    intradayChangeRate: isValidNumber(estimatedChangeRate) ? estimatedChangeRate : 0,
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
