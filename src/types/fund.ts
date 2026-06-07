// 基金基本信息
export interface FundBasicInfo {
  code: string;           // 基金代码
  name: string;           // 基金名称
  company: string;        // 基金公司
  manager: string;        // 基金经理
  managerTenure: string;  // 经理任职时间
  establishDate: string;  // 成立日期
  scale: string;          // 基金规模
  type: string;           // 基金类型
  riskLevel: string;      // 风险等级
  trackingIndex?: string; // 跟踪标的（指数基金）
  morningstarRating?: string; // 晨星评级
  turnoverRate?: string;  // 换手率
}

// 业绩表现
export interface FundPerformance {
  nav: number;            // 最新净值
  return1w: number;       // 近1周收益
  return1m: number;       // 近1月收益
  return3m: number;       // 近3月收益
  return6m: number;       // 近6月收益
  return1y: number;       // 近1年收益
  return3y?: number;      // 近3年收益
  returnSinceStart: number; // 成立以来收益
  rating: '顶级' | '优秀' | '中等' | '-'; // 同类对比
}

// 年度收益
export interface YearlyReturn {
  year: number;
  returnRate: number;
}

// 风险指标
export interface RiskMetrics {
  maxDrawdown?: string;   // 最大回撤
  sharpeRatio?: string;   // 夏普比率
  trackingError?: string; // 跟踪误差
  volatility?: string;    // 波动率
}

// 持仓信息
export interface Holding {
  rank: number;
  stock: string;
  percentage: number;
  industry: string;
  market?: string;
}

// 持仓结构
export interface HoldingStructure {
  coreTrack?: string;     // 核心赛道
  industryDistribution?: string; // 行业分布
  marketDistribution?: string;   // 市场分布
  investmentStyle?: string;      // 投资风格
  concentration?: string;        // 集中度
}

// 市场环境影响
export interface MarketImpact {
  factor: string;
  impact: string;
  direction: '利好' | '利空' | '中性';
}

// 趋势判断
export interface TrendJudgment {
  period: '短期（1个月）' | '中期（3-6个月）' | '长期（1年以上）';
  trend: '偏上涨' | '震荡偏强' | '震荡' | '震荡偏弱' | '偏下跌';
  confidence: '高' | '中' | '低';
  basis: string;
  catalysts: string;
  risks: string;
  watchIndicators: string;
}

// 情景分析
export interface ScenarioAnalysis {
  scenario: '乐观' | '中性' | '悲观';
  trigger: string;
  performance: string;
  indicator: string;
  strategy: string;
}

// 操作建议
export interface OperationAdvice {
  investorType: string;
  suitable: string;
  position: string;
  advice: string;
}

// 风格漂移警告
export interface StyleDriftWarning {
  fundName: string;
  actualHolding: string;
  driftLevel: string;
  riskNote: string;
}

// 完整基金数据
export interface FundData {
  basicInfo: FundBasicInfo;
  performance: FundPerformance;
  yearlyReturns?: YearlyReturn[];
  riskMetrics?: RiskMetrics;
  holdings?: Holding[];
  holdingStructure?: HoldingStructure;
  marketImpact?: MarketImpact[];
  trends: TrendJudgment[];
  scenarios?: ScenarioAnalysis[];
  advice: OperationAdvice[];
  score: number;
  styleDrift?: StyleDriftWarning;
  comparisonWithPeers?: Record<string, string>[];
}

// 排序结果
export interface Ranking {
  dimension: string;
  code: string;
  name: string;
  reason: string;
}

// 最终结论
export interface Conclusions {
  noteworthy: { code: string; name: string; reason: string }[];
  longTerm: { code: string; name: string; position: string }[];
  shortTerm: { code: string; name: string; watch: string }[];
  notRecommended: { code: string; name: string; reason: string }[];
  keyIndicators: { category: string; indicator: string; importance: string }[];
}

// 报告数据
export interface ReportData {
  date: string;           // 报告日期
  dataDate: string;       // 数据日期
  summary: string;        // 分析摘要
  funds: FundData[];      // 基金数据列表
  rankings: Ranking[];    // 排序结果
  conclusions: Conclusions; // 最终结论
}

// 报告文件信息
export interface ReportFile {
  filename: string;
  date: string;
  path: string;
}

// 图表数据格式
export interface ChartDataPoint {
  name: string;
  value: number;
  color?: string;
}

// 趋势类型映射（A股风格：红涨绿跌）
export const TREND_COLORS: Record<string, string> = {
  '偏上涨': '#ef4444',    // 红色 - 上涨
  '震荡偏强': '#f97316',  // 橙色 - 偏强
  '震荡': '#6b7280',      // 灰色 - 震荡
  '震荡偏弱': '#eab308',  // 黄色 - 偏弱
  '偏下跌': '#22c55e',    // 绿色 - 下跌
};

// 趋势箭头映射
export const TREND_ARROWS: Record<string, string> = {
  '偏上涨': '↑',
  '震荡偏强': '↗',
  '震荡': '→',
  '震荡偏弱': '↘',
  '偏下跌': '↓',
};

// 评分颜色映射
export const SCORE_COLORS: Record<string, string> = {
  excellent: '#ef4444',   // 红色 - 优秀
  good: '#f97316',        // 橙色 - 良好
  average: '#6b7280',     // 灰色 - 一般
  poor: '#22c55e',        // 绿色 - 较差
};

// 获取评分颜色
export function getScoreColor(score: number): string {
  if (score >= 8) return SCORE_COLORS.excellent;
  if (score >= 6) return SCORE_COLORS.good;
  if (score >= 4) return SCORE_COLORS.average;
  return SCORE_COLORS.poor;
}

// 获取评分等级
export function getScoreLevel(score: number): string {
  if (score >= 8) return '优秀';
  if (score >= 6) return '良好';
  if (score >= 4) return '一般';
  return '较差';
}

// 获取趋势颜色
export function getTrendColor(trend: string): string {
  return TREND_COLORS[trend] || '#6b7280';
}

// 获取趋势箭头
export function getTrendArrow(trend: string): string {
  return TREND_ARROWS[trend] || '→';
}

// 方向颜色映射（A股风格）
export const DIRECTION_COLORS: Record<string, string> = {
  '利好': '#ef4444',      // 红色 - 利好
  '利空': '#22c55e',      // 绿色 - 利空
  '中性': '#6b7280',      // 灰色 - 中性
};

// 同类对比评级颜色
export const RATING_COLORS: Record<string, string> = {
  '顶级': '#ef4444',
  '优秀': '#f97316',
  '中等': '#6b7280',
  '-': '#9ca3af',
};

export type UnifiedDataSource = 'eastmoney' | 'mock' | 'mixed' | 'unavailable';
export type UnifiedDataStatus = 'live' | 'delayed' | 'estimated' | 'confirmed' | 'partial' | 'fallback' | 'error';

export interface FundSearchResult {
  fundCode: string;
  fundName: string;
  fundType: string;
  pinyin: string;
  dataSource: UnifiedDataSource;
}

export interface UnifiedFundBasicInfo {
  fundCode: string;
  fundName: string;
  fundType: string;
  fundCompany: string;
  fundManager: string;
  inceptionDate: string;
  fundSize: string;
  riskLevel: string;
  benchmark?: string;
  dataSource: UnifiedDataSource;
  dataStatus: UnifiedDataStatus;
  updatedAt: string;
}

export interface FundRealtimeEstimate {
  fundCode: string;
  fundName: string;
  previousNav?: number;
  latestConfirmedNav?: number;
  estimatedNav?: number;
  estimatedChangeRate?: number;
  estimateTime?: string;
  navDate?: string;
  marketStatus?: string;
  dataSource: UnifiedDataSource;
  dataStatus: UnifiedDataStatus;
}

export interface FundLatestNav {
  fundCode: string;
  fundName: string;
  latestNav?: number;
  accumulatedNav?: number;
  navDate?: string;
  dailyChangeRate?: number;
  dataSource: UnifiedDataSource;
  dataStatus: UnifiedDataStatus;
}

export interface FundNavHistoryItem {
  date: string;
  unitNav: number;
  accumulatedNav?: number;
  dailyChangeRate?: number;
  dividend?: string;
  dataSource: UnifiedDataSource;
}

export interface UnifiedFundHolding {
  name: string;
  code?: string;
  type: string;
  weight: number;
  market?: string;
  dataSource: UnifiedDataSource;
  dataStatus: UnifiedDataStatus;
}

export interface IndustryAllocation {
  industry: string;
  weight: number;
  dataSource: UnifiedDataSource;
  dataStatus: UnifiedDataStatus;
}

export interface FundRiskMetrics {
  maxDrawdown?: number;
  volatility?: number;
  sharpeRatio?: number;
  trackingError?: number;
  dataSource: UnifiedDataSource;
  dataStatus: UnifiedDataStatus;
}

// 基金经理信息
export interface FundManagerInfo {
  name: string;
  workTime: string;
  fundSize: string;
  star: number;
  performanceScore?: number;
}

// 资产配置
export interface FundAssetAllocation {
  stockRatio: number;
  bondRatio: number;
  cashRatio: number;
  navSize?: number;
  date: string;
}

// 收益率
export interface FundReturnRates {
  return1y?: number;
  return6y?: number;
  return3y?: number;
  return1n?: number;
}

// 持有人结构
export interface FundHolderStructure {
  institutional: number;
  individual: number;
  internal: number;
  date: string;
}

// 综合评价
export interface FundPerformanceEvaluation {
  averageScore: number;
  dimensions: { name: string; score: number }[];
}

// 扩展基金快照（包含 pingzhongdata 解析的额外数据）
export interface FundExtendedData {
  managers: FundManagerInfo[];
  assetAllocation?: FundAssetAllocation;
  returnRates?: FundReturnRates;
  holderStructure?: FundHolderStructure;
  performanceEvaluation?: FundPerformanceEvaluation;
  stockPosition?: number;
}
