export type MarketStatus =
  | 'before_open'
  | 'trading'
  | 'closed_pending_nav'
  | 'nav_confirmed'
  | 'non_trading_day';

export type DcaFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly';
export type DcaStatus = 'active' | 'paused' | 'ended';
export type PortfolioDataStatus = 'complete' | 'partial';
export type PortfolioDataSource = 'eastmoney' | 'mock' | 'mixed' | 'unavailable';
export type SnapshotDataStatus = 'live' | 'delayed' | 'estimated' | 'confirmed' | 'partial' | 'fallback' | 'error';

export interface DcaPlan {
  enabled: boolean;
  amount: number;
  frequency: DcaFrequency;
  investDay: number;
  startDate: string;
  endDate?: string;
  nextInvestDate?: string;
  status: DcaStatus;
  totalInvestedAmount: number;
  estimatedNextShares: number;
}

export interface PortfolioHolding {
  id: string;
  fundCode: string;
  fundName: string;
  holdingAmount?: number;
  holdingShares?: number;
  costAmount: number;
  costNav?: number;
  firstBuyDate: string;
  holdingDays: number;
  note?: string;
  dcaPlan?: DcaPlan;
  createdAt: string;
  updatedAt: string;
}

export interface PortfolioHoldingInput {
  fundCode: string;
  fundName: string;
  holdingAmount?: number;
  holdingShares?: number;
  costAmount: number;
  costNav?: number;
  firstBuyDate: string;
  note?: string;
  dcaPlan?: DcaPlan;
}

export type FundMarketType = 'domestic' | 'overseas' | 'unknown';

export interface FundNavSnapshot {
  fundCode: string;
  fundName: string;
  marketType?: FundMarketType;
  previousNav?: number;
  previousNavDate?: string;
  latestConfirmedNav?: number;
  latestConfirmedNavDate?: string;
  currentNav?: number;
  confirmedNav?: number;
  confirmedNavDate?: string;
  displayNav?: number;
  navDate: string;
  estimatedNav?: number;
  estimatedNavDate: string;
  estimateTime?: string;
  dailyChangeRate?: number;
  intradayChangeRate: number;
  confirmedChangeRate?: number;
  marketStatus: MarketStatus;
  dataSource?: PortfolioDataSource;
  dataStatus?: SnapshotDataStatus;
  updatedAt?: string;
  message?: string;
  navHistory?: Array<{
    date: string;
    unitNav: number;
  }>;
}

export interface PortfolioProfitLoss {
  marketValue: number | null;
  costAmount: number;
  totalProfitLoss: number | null;
  totalProfitLossRate: number | null;
  dailyProfitLoss: number | null;
  dailyProfitLossRate: number | null;
  confirmedDailyProfitLoss: number | null;
  confirmedDailyProfitLossRate: number | null;
  holdingDays: number;
  annualizedReturn: number | null;
  dataStatus: PortfolioDataStatus;
  calculationTime: string;
  calculatedHoldingShares: number;
  sharesEstimated: boolean;
  inferredFirstBuyDate?: string;
  inferredCostNav?: number;
}

export interface PortfolioStorageData {
  version: 1;
  holdings: PortfolioHolding[];
}
