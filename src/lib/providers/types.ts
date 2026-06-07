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

export interface FundDataProvider {
  searchFunds(keyword: string): Promise<FundSearchResult[]>;
  fetchFundBasicInfo(fundCode: string): Promise<UnifiedFundBasicInfo | null>;
  fetchFundRealtimeEstimate(fundCode: string): Promise<FundRealtimeEstimate | null>;
  fetchFundNavHistory(fundCode: string, range?: string): Promise<FundNavHistoryItem[]>;
  fetchFundLatestNav(fundCode: string): Promise<FundLatestNav | null>;
  fetchFundHoldings(fundCode: string): Promise<UnifiedFundHolding[]>;
  fetchFundIndustryAllocation(fundCode: string): Promise<IndustryAllocation[]>;
  fetchFundRiskMetrics(fundCode: string): Promise<FundRiskMetrics | null>;
}
