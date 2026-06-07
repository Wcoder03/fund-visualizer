export type FundType =
  | '主动股票型'
  | '偏股混合型'
  | '指数型'
  | 'ETF'
  | '债券型'
  | 'QDII'
  | '货币型'
  | 'FOF'
  | '其他';

export type InvestmentScope =
  | 'A股'
  | '港股'
  | '美股'
  | '全球市场'
  | '债券市场'
  | '商品'
  | '多资产';

export type TrendLabel = '偏上涨' | '震荡偏强' | '震荡' | '震荡偏弱' | '偏下跌';
export type ConfidenceLevel = '高' | '中' | '低';
export type ScenarioName = '乐观情景' | '中性情景' | '悲观情景';
export type InvestorType =
  | '激进型投资者'
  | '平衡型投资者'
  | '稳健型投资者'
  | '已持有该基金的投资者'
  | '准备买入该基金的投资者';

export interface FundInput {
  id: string;
  code: string;
  name: string;
}

export interface HoldingItem {
  name: string;
  weight: number;
  industry: string;
}

export interface IndustryAllocation {
  name: string;
  weight: number;
}

export interface FundProfile {
  code: string;
  name: string;
  company: string;
  manager: string;
  inceptionDate: string;
  scale: string;
  type: FundType;
  riskLevel: '低风险' | '中低风险' | '中风险' | '中高风险' | '高风险';
  investmentScope: InvestmentScope;
  coreDirection: string;
  currentStyle: string;
  latestNav: number;
  accumulatedNav: number;
  return1m: number;
  return3m: number;
  return6m: number;
  return1y: number;
  return3y: number;
  maxDrawdown: number;
  volatility: number;
  sharpeRatio: number;
  holdings: HoldingItem[];
  industryAllocation: IndustryAllocation[];
  stockPosition: number;
  bondPosition: number;
  cashPosition: number;
  trackingIndex?: string;
  trackingError?: number;
  feeRate?: number;
  duration?: string;
  creditBondRatio?: number;
  convertibleBondRatio?: number;
  sevenDayAnnualized?: number;
  tenThousandIncome?: number;
  overseasMarket?: string;
  source: string;
  dataDate: string;
}

export interface TypeIdentification {
  fundType: FundType;
  investmentScope: InvestmentScope;
  coreDirection: string;
}

export interface PerformanceAnalysis {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  riskControl: string;
}

export interface HoldingsAnalysis {
  summary: string;
  concentration: '低' | '中' | '高';
  styleDrift: string;
  keyExposure: string;
}

export interface AnalysisFramework {
  title: string;
  points: string[];
}

export interface TrendForecast {
  period: '短期：未来 1 个月' | '中期：未来 3-6 个月' | '长期：未来 1 年以上';
  trend: TrendLabel;
  confidence: ConfidenceLevel;
  reason: string;
  positiveFactors: string;
  riskFactors: string;
  watchIndicators: string;
}

export interface ScenarioAnalysis {
  scenario: ScenarioName;
  trigger: string;
  possiblePerformance: string;
  watchIndicator: string;
  strategy: string;
}

export interface RiskControlAdvice {
  investorType: InvestorType;
  addPosition: string;
  batchBuy: string;
  fixedInvestment: string;
  positionRange: string;
  takeProfitStopLoss: string;
  riskReminder: string;
}

export interface FundAnalysisResult {
  input: FundInput;
  identification: TypeIdentification;
  data: FundProfile;
  framework: AnalysisFramework;
  performance: PerformanceAnalysis;
  holdings: HoldingsAnalysis;
  trends: TrendForecast[];
  scenarios: ScenarioAnalysis[];
  advice: RiskControlAdvice[];
  score: number;
  extendedData?: import('./fund').FundExtendedData;
}

export interface FundComparisonRow {
  code: string;
  name: string;
  fundType: FundType;
  direction: string;
  currentStyle: string;
  shortTrend: TrendLabel;
  midTrend: TrendLabel;
  longTrend: TrendLabel;
  mainAdvantage: string;
  mainRisk: string;
  suitableInvestors: string;
  fixedInvestment: string;
  longTermHolding: string;
  score: number;
}

export interface FundRanking {
  title: string;
  code: string;
  name: string;
  reason: string;
}

export interface FundComparisonResult {
  rows: FundComparisonRow[];
  rankings: FundRanking[];
}

export interface FundAnalysisRun {
  results: FundAnalysisResult[];
  comparison: FundComparisonResult;
  generatedAt: string;
}
