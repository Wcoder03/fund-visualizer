import type { FundNavSnapshot } from '../types/portfolio';
import type { PortfolioHolding } from '../types/portfolio';
import type { FundExtendedData, FundTrendPoint } from '../types/fund';

export interface FundAnalysisResult {
  // 基金概览
  overview: {
    fundCode: string;
    fundName: string;
    fundType: string;
    currentNav?: number;
    navDate: string;
    dailyChange?: number;
    dataSource: string;
    isInPortfolio: boolean;
    portfolioHolding?: PortfolioHolding;
  };

  // 综合评分
  score: {
    total: number; // 0-10
    level: '优秀' | '良好' | '一般' | '较差' | '数据不足';
    dimensions: {
      name: string;
      score: number;
      comment: string;
    }[];
  };

  // 买入参考结论
  recommendation: {
    conclusion: '值得关注' | '谨慎观察' | '暂不建议买入' | '数据不足';
    summary: string;
  };

  // 优点
  pros: string[];

  // 缺点与风险
  cons: string[];

  // 适合人群
  suitableFor: string[];
  notSuitableFor: string[];

  // 关键指标
  keyMetrics: {
    label: string;
    value: string;
    highlight?: boolean;
    lowlight?: boolean;
  }[];

  // 与持仓关系
  portfolioRelation: {
    alreadyHeld: boolean;
    holdingInfo?: string;
    complementarity: string;
    duplicateWarning?: string;
  };

  // 收益表现
  performance?: {
    return1m?: number;
    return3m?: number;
    return6m?: number;
    return1y?: number;
    dailyChange?: number;
    nav?: number;
    navDate?: string;
  };

  // 走势数据
  trendData?: FundTrendPoint[];
}

function identifyFundType(name: string): string {
  const upper = name.toUpperCase();
  if (upper.includes('QDII')) return 'QDII';
  if (upper.includes('ETF联接') || upper.includes('ETF')) return 'ETF/指数';
  if (upper.includes('指数') || upper.includes('联接')) return '指数型';
  if (upper.includes('债') || upper.includes('固收')) return '债券型';
  if (upper.includes('货币') || upper.includes('现金')) return '货币型';
  if (upper.includes('FOF')) return 'FOF';
  if (upper.includes('混合')) return '混合型';
  if (upper.includes('股票')) return '股票型';
  return '其他';
}

function inferRiskLevel(fundType: string, name: string): string {
  if (fundType === '货币型') return '低风险';
  if (fundType === '债券型') return '中低风险';
  if (fundType === 'QDII' || name.includes('纳斯达克') || name.includes('标普')) return '高风险';
  if (fundType === 'ETF/指数' || fundType === '指数型') return '中高风险';
  if (fundType === '混合型') return '中风险';
  return '中风险';
}

function calculateScore(snapshot: FundNavSnapshot, fundType: string): { total: number; level: FundAnalysisResult['score']['level']; dimensions: FundAnalysisResult['score']['dimensions'] } {
  const nav = snapshot.displayNav ?? snapshot.latestConfirmedNav ?? snapshot.currentNav;
  const prevNav = snapshot.previousNav;
  const dailyChange = snapshot.dailyChangeRate ?? snapshot.intradayChangeRate;

  // 各维度评分 (0-10)
  const dimensions: FundAnalysisResult['score']['dimensions'] = [];

  // 收益表现
  let returnScore = 5;
  if (dailyChange !== undefined) {
    if (dailyChange > 0.02) returnScore = 8;
    else if (dailyChange > 0.005) returnScore = 7;
    else if (dailyChange > 0) returnScore = 6;
    else if (dailyChange > -0.01) returnScore = 4;
    else returnScore = 3;
  }
  dimensions.push({ name: '收益表现', score: returnScore, comment: dailyChange !== undefined ? (dailyChange >= 0 ? '近期收益为正' : '近期收益为负') : '数据不足' });

  // 波动水平 (基于日涨跌幅绝对值)
  let volatilityScore = 5;
  if (dailyChange !== undefined) {
    const abs = Math.abs(dailyChange);
    if (abs < 0.005) volatilityScore = 8;
    else if (abs < 0.015) volatilityScore = 6;
    else if (abs < 0.03) volatilityScore = 4;
    else volatilityScore = 3;
  }
  dimensions.push({ name: '波动水平', score: volatilityScore, comment: dailyChange !== undefined ? (Math.abs(dailyChange) < 0.01 ? '波动较低' : '波动较高') : '数据不足' });

  // 数据完整性
  const dataScore = (nav ? 3 : 0) + (prevNav ? 3 : 0) + (snapshot.navDate ? 2 : 0) + (snapshot.dataSource === 'eastmoney' ? 2 : 0);
  dimensions.push({ name: '数据完整度', score: Math.min(10, dataScore + 2), comment: snapshot.dataSource === 'eastmoney' ? '实时数据来源' : '数据来源有限' });

  // 基金类型匹配
  const typeScore = fundType === '货币型' ? 8 : fundType === '债券型' ? 7 : fundType === 'ETF/指数' ? 7 : 5;
  dimensions.push({ name: '产品类型', score: typeScore, comment: `${fundType}类基金` });

  const total = Math.round(dimensions.reduce((s, d) => s + d.score, 0) / dimensions.length * 10) / 10;

  let level: FundAnalysisResult['score']['level'];
  if (total >= 7.5) level = '优秀';
  else if (total >= 6) level = '良好';
  else if (total >= 4) level = '一般';
  else level = '较差';

  if (!nav && !prevNav) level = '数据不足';

  return { total, level, dimensions };
}

function generatePros(snapshot: FundNavSnapshot, fundType: string, dailyChange: number | undefined): string[] {
  const pros: string[] = [];
  const nav = snapshot.displayNav ?? snapshot.latestConfirmedNav ?? snapshot.currentNav;

  if (nav && snapshot.previousNav && nav > snapshot.previousNav) {
    pros.push('最新净值较前一交易日上涨，短期趋势向好');
  }
  if (fundType === 'ETF/指数' || fundType === '指数型') {
    pros.push('指数基金费率较低，透明度高，适合长期配置');
  }
  if (fundType === '债券型') {
    pros.push('债券型基金波动较低，适合稳健配置');
  }
  if (fundType === 'QDII') {
    pros.push('可投资海外市场，有助于分散单一市场风险');
  }
  if (dailyChange !== undefined && dailyChange > 0) {
    pros.push('当日收益为正，市场情绪偏乐观');
  }
  if (snapshot.dataSource === 'eastmoney') {
    pros.push('数据来源为实时行情，信息时效性较好');
  }
  if (nav && nav > 1) {
    pros.push('当前净值高于初始面值，历史累计收益为正');
  }
  if (pros.length === 0) {
    pros.push('当前数据有限，建议进一步研究后判断');
  }
  return pros.slice(0, 5);
}

function generateCons(snapshot: FundNavSnapshot, fundType: string, dailyChange: number | undefined): string[] {
  const cons: string[] = [];

  if (dailyChange !== undefined && dailyChange < -0.02) {
    cons.push('当日跌幅较大，短期承压明显');
  }
  if (dailyChange !== undefined && Math.abs(dailyChange) > 0.03) {
    cons.push('日波动幅度较大，需关注短期风险');
  }
  if (fundType === 'QDII') {
    cons.push('QDII基金受海外市场、汇率和时区差异影响');
    cons.push('非交易日与国内不同步，净值更新可能滞后');
  }
  if (fundType === '股票型' || fundType === '混合型') {
    cons.push('权益类基金波动较大，需有承受回撤的心理准备');
  }
  if (!snapshot.latestConfirmedNav && !snapshot.displayNav) {
    cons.push('当前净值数据缺失，分析可信度有限');
  }
  if (snapshot.dataSource !== 'eastmoney') {
    cons.push('当前数据非实时来源，可能存在延迟');
  }
  if (cons.length === 0) {
    cons.push('当前未发现明显风险信号，但仍需持续关注');
  }
  return cons.slice(0, 5);
}

function generateSuitability(fundType: string, riskLevel: string): { suitableFor: string[]; notSuitableFor: string[] } {
  const suitableFor: string[] = [];
  const notSuitableFor: string[] = [];

  if (fundType === '货币型') {
    suitableFor.push('需要现金管理工具的用户', '追求流动性和安全性的用户');
    notSuitableFor.push('追求高收益的用户');
  } else if (fundType === '债券型') {
    suitableFor.push('稳健型投资者', '想降低组合波动的用户', '资产配置中需要固收部分的用户');
    notSuitableFor.push('追求短期高收益的用户');
  } else if (fundType === 'QDII') {
    suitableFor.push('想配置海外资产的用户', '希望分散单一市场风险的用户', '长期全球配置型投资者');
    notSuitableFor.push('无法接受汇率波动的用户', '需要实时交易的用户');
  } else if (fundType === 'ETF/指数' || fundType === '指数型') {
    suitableFor.push('偏好被动投资的用户', '长期定投型投资者', '看好特定行业或宽基指数的用户');
    notSuitableFor.push('希望获得超额收益的用户');
  } else {
    suitableFor.push('有一定风险承受能力的用户', '中长期投资视角的用户');
    notSuitableFor.push('短期资金需求用户', '无法接受净值波动的用户');
  }

  if (riskLevel === '高风险') {
    notSuitableFor.push('低风险偏好用户');
  }

  return { suitableFor, notSuitableFor };
}

function analyzePortfolioRelation(
  snapshot: FundNavSnapshot,
  holdings: PortfolioHolding[]
): FundAnalysisResult['portfolioRelation'] {
  const code = snapshot.fundCode;
  const existing = holdings.find(h => h.fundCode === code);

  if (existing) {
    return {
      alreadyHeld: true,
      holdingInfo: `当前持仓 ${existing.holdingAmount ?? 0} 元，成本 ${existing.costAmount} 元`,
      complementarity: '已持有该基金，无需重复添加。可关注当前持仓收益情况，适时调整。',
    };
  }

  const fundType = identifyFundType(snapshot.fundName);
  const sameTypeCount = holdings.filter(h => {
    const name = h.fundName.toUpperCase();
    if (fundType === 'QDII') return name.includes('QDII');
    if (fundType === 'ETF/指数') return name.includes('ETF') || name.includes('指数');
    if (fundType === '债券型') return name.includes('债');
    return false;
  }).length;

  let complementarity = '该基金可作为组合的补充配置。';
  let duplicateWarning: string | undefined;

  if (sameTypeCount >= 2) {
    duplicateWarning = `当前持仓中已有 ${sameTypeCount} 只同类型基金，注意避免配置过于集中。`;
    complementarity = '建议评估是否与现有持仓存在重叠。';
  } else if (holdings.length === 0) {
    complementarity = '当前无持仓，可考虑作为初始配置标的。';
  }

  return {
    alreadyHeld: false,
    complementarity,
    duplicateWarning,
  };
}

function generateRecommendation(
  score: number
): FundAnalysisResult['recommendation'] {
  if (score >= 7) {
    return {
      conclusion: '值得关注',
      summary: `该基金当前综合评分 ${score} 分，表现较好。建议加入观察列表，结合自身风险偏好和持仓情况评估是否配置。`,
    };
  }
  if (score >= 5) {
    return {
      conclusion: '谨慎观察',
      summary: `该基金综合评分 ${score} 分，表现中等。建议持续观察净值走势和市场环境，等待更合适的时机。`,
    };
  }
  if (score > 0) {
    return {
      conclusion: '暂不建议买入',
      summary: `该基金综合评分 ${score} 分，当前表现偏弱。建议先了解基金基本面和持仓方向，不急于买入。`,
    };
  }
  return {
    conclusion: '数据不足',
    summary: '当前可用数据有限，无法给出可靠的分析结论。建议查阅更多公开信息后再做判断。',
  };
}

export function analyzeFund(
  snapshot: FundNavSnapshot,
  holdings: PortfolioHolding[],
  extendedData?: FundExtendedData
): FundAnalysisResult {
  const fundType = identifyFundType(snapshot.fundName);
  const riskLevel = inferRiskLevel(fundType, snapshot.fundName);
  const dailyChange = snapshot.dailyChangeRate ?? snapshot.intradayChangeRate ?? undefined;
  const nav = snapshot.displayNav ?? snapshot.latestConfirmedNav ?? snapshot.currentNav;
  const returnRates = extendedData?.returnRates;

  const scoreResult = calculateScore(snapshot, fundType);
  const pros = generatePros(snapshot, fundType, dailyChange);
  const cons = generateCons(snapshot, fundType, dailyChange);
  const { suitableFor, notSuitableFor } = generateSuitability(fundType, riskLevel);
  const portfolioRelation = analyzePortfolioRelation(snapshot, holdings);
  const recommendation = generateRecommendation(scoreResult.total);

  const dailyChangeStr = dailyChange !== undefined
    ? `${dailyChange > 0 ? '+' : ''}${(dailyChange * 100).toFixed(2)}%`
    : '暂无数据';

  const keyMetrics: FundAnalysisResult['keyMetrics'] = [
    { label: '当前净值', value: nav ? nav.toFixed(4) : '暂无数据' },
    { label: '日涨跌幅', value: dailyChangeStr, highlight: dailyChange !== undefined && dailyChange > 0, lowlight: dailyChange !== undefined && dailyChange < 0 },
    { label: '净值日期', value: snapshot.navDate || '暂无数据' },
    { label: '基金类型', value: fundType },
    { label: '风险等级', value: riskLevel },
    { label: '数据来源', value: snapshot.dataSource === 'eastmoney' ? '东方财富' : snapshot.dataSource === 'mock' ? '演示数据' : snapshot.dataSource || '未知' },
  ];

  return {
    overview: {
      fundCode: snapshot.fundCode,
      fundName: snapshot.fundName,
      fundType,
      currentNav: nav,
      navDate: snapshot.navDate,
      dailyChange,
      dataSource: snapshot.dataSource ?? 'unknown',
      isInPortfolio: portfolioRelation.alreadyHeld,
      portfolioHolding: portfolioRelation.alreadyHeld ? holdings.find(h => h.fundCode === snapshot.fundCode) : undefined,
    },
    score: scoreResult,
    recommendation,
    pros,
    cons,
    suitableFor,
    notSuitableFor,
    keyMetrics,
    portfolioRelation,
    performance: {
      return1m: returnRates?.return1n,
      return3m: returnRates?.return3y,
      return6m: returnRates?.return6y,
      return1y: returnRates?.return1y,
      dailyChange,
      nav,
      navDate: snapshot.navDate,
    },
    trendData: extendedData?.trendData,
  };
}
