import { sanitizeObject } from './compliance';
import { identifyFundType } from './fundTypes';
import { fetchFundExtendedData } from './providers/eastmoneyProvider';
import type { FundNavSnapshot } from '../types/portfolio';

const MARKET_CONTEXT = {
  rateTone: '利率环境整体平稳，但海外利率仍会影响成长资产估值',
  equityTone: '权益市场结构分化，资金偏好确定性和景气度较高的方向',
  fxTone: '汇率波动会影响 QDII 净值折算和短期表现',
};
import type {
  AnalysisFramework,
  FundAnalysisResult,
  FundAnalysisRun,
  FundComparisonResult,
  FundInput,
  FundProfile,
  HoldingsAnalysis,
  PerformanceAnalysis,
  RiskControlAdvice,
  ScenarioAnalysis,
  TrendForecast,
  TrendLabel,
} from '../types/fundAnalysis';

export { identifyFundType };

function inferCompany(name: string): string {
  const companies: [string, string][] = [
    ['华泰柏瑞', '华泰柏瑞基金'], ['华宝', '华宝基金'], ['广发', '广发基金'],
    ['易方达', '易方达基金'], ['长城', '长城基金'], ['南方', '南方基金'],
    ['华夏', '华夏基金'], ['嘉实', '嘉实基金'], ['博时', '博时基金'],
    ['招商', '招商基金'], ['富国', '富国基金'], ['汇添富', '汇添富基金'],
    ['中欧', '中欧基金'], ['景顺长城', '景顺长城基金'], ['工银瑞信', '工银瑞信基金'],
    ['鹏华', '鹏华基金'], ['天弘', '天弘基金'], ['交银', '交银施罗德基金'],
  ];
  for (const [keyword, company] of companies) {
    if (name.includes(keyword)) return company;
  }
  return '';
}

function inferDirection(name: string, type: string): string {
  const keywords: [string, string][] = [
    ['电力', '电力公用事业'], ['新能源', '新能源产业链'], ['纳斯达克', '纳斯达克100'],
    ['科技', '科技创新'], ['医药', '医药健康'], ['消费', '大消费'],
    ['半导体', '半导体芯片'], ['白酒', '白酒消费'], ['红利', '高股息红利'],
    ['全球成长', '全球成长精选'], ['全球新能源', '全球新能源车'],
  ];
  for (const [keyword, direction] of keywords) {
    if (name.includes(keyword)) return direction;
  }
  if (type === 'QDII') return '海外资产配置';
  if (type === '债券型') return '固定收益';
  return '均衡配置';
}

function buildProfileFromSnapshot(
  snapshot: FundNavSnapshot,
  identification: ReturnType<typeof identifyFundType>,
  extended?: import('../types/fund').FundExtendedData
): FundProfile {
  const nav = snapshot.displayNav ?? snapshot.latestConfirmedNav ?? snapshot.currentNav ?? 0;
  const isBond = identification.fundType === '债券型';
  const isMoney = identification.fundType === '货币型';

  const managerName = extended?.managers?.length
    ? extended.managers.map((m) => m.name).join('、')
    : '';

  const assetAlloc = extended?.assetAllocation;
  const returns = extended?.returnRates;

  return {
    code: snapshot.fundCode,
    name: snapshot.fundName,
    company: inferCompany(snapshot.fundName),
    manager: managerName,
    inceptionDate: '',
    scale: assetAlloc?.navSize ? `${assetAlloc.navSize.toFixed(2)}亿元` : '',
    type: identification.fundType,
    riskLevel: isMoney ? '低风险' : isBond ? '中低风险' : '中高风险',
    investmentScope: identification.investmentScope,
    coreDirection: inferDirection(snapshot.fundName, identification.fundType),
    currentStyle: '',
    latestNav: nav,
    accumulatedNav: nav,
    return1m: returns?.return1n ?? 0,
    return3m: 0,
    return6m: returns?.return6y ?? 0,
    return1y: returns?.return1y ?? 0,
    return3y: returns?.return3y ?? 0,
    maxDrawdown: 0,
    volatility: 0,
    sharpeRatio: 0,
    holdings: [],
    industryAllocation: [],
    stockPosition: extended?.stockPosition ?? assetAlloc?.stockRatio ?? 0,
    bondPosition: assetAlloc?.bondRatio ?? 0,
    cashPosition: assetAlloc?.cashRatio ?? 0,
    source: snapshot.dataSource === 'eastmoney' ? '东方财富实时数据' : snapshot.dataSource === 'mock' ? '演示数据' : '数据源',
    dataDate: snapshot.navDate || new Date().toISOString().slice(0, 10),
  };
}

function formatPercent(value: number): string {
  return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
}

function getFramework(profile: FundProfile): AnalysisFramework {
  if (profile.type === '债券型') {
    return {
      title: '债券基金分析框架',
      points: [
        `利率环境：关注久期暴露，当前久期特征为 ${profile.duration || '未披露'}`,
        `信用风险：信用债比例约 ${profile.creditBondRatio ?? 0}%`,
        `可转债比例：约 ${profile.convertibleBondRatio ?? 0}%`,
        '流动性：结合规模和现金比例评估赎回压力',
      ],
    };
  }

  if (profile.type === '指数型' || profile.type === 'ETF') {
    return {
      title: '指数基金 / ETF 分析框架',
      points: [
        `跟踪指数：${profile.trackingIndex || '待识别指数'}`,
        `行业分布：重点关注 ${profile.industryAllocation.slice(0, 2).map((item) => item.name).join('、')}`,
        `跟踪误差：${profile.trackingError ?? 0}%`,
        `费率和流动性：当前费率约 ${profile.feeRate ?? 0}%`,
      ],
    };
  }

  if (profile.type === 'QDII') {
    return {
      title: 'QDII 分析框架',
      points: [
        `海外市场：重点暴露于 ${profile.overseasMarket || profile.investmentScope}`,
        '汇率影响：人民币汇率波动会影响净值折算',
        '海外利率：成长资产对利率和估值变化更敏感',
        '净值滞后：跨市场交易和披露时点可能造成短期偏差',
      ],
    };
  }

  if (profile.type === '货币型') {
    return {
      title: '货币基金分析框架',
      points: [
        `七日年化：${profile.sevenDayAnnualized ?? 0}%`,
        `万份收益：${profile.tenThousandIncome ?? 0}`,
        '流动性：关注现金比例和资产剩余期限',
        '现金管理价值：适合作为低波动资金管理工具评估',
      ],
    };
  }

  return {
    title: '主动权益类分析框架',
    points: [
      `基金经理：关注 ${profile.manager} 的任职表现和回撤控制`,
      `持仓风格：${profile.currentStyle}`,
      `行业集中度：前两大行业合计 ${profile.industryAllocation.slice(0, 2).reduce((sum, item) => sum + item.weight, 0).toFixed(1)}%`,
      '风格漂移：比较基金名称、投资范围和实际持仓暴露',
    ],
  };
}

export function analyzeFundPerformance(profile: FundProfile): PerformanceAnalysis {
  const score = profile.return1y * 0.05 + profile.sharpeRatio * 2 + Math.max(0, 20 + profile.maxDrawdown) * 0.08;
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  if (profile.return1y > 25) strengths.push(`近 1 年表现较强，收益为 ${formatPercent(profile.return1y)}`);
  if (profile.return3y > 50) strengths.push(`近 3 年表现延续性较好，收益为 ${formatPercent(profile.return3y)}`);
  if (profile.sharpeRatio > 0.9) strengths.push(`夏普比率 ${profile.sharpeRatio.toFixed(2)}，风险调整后收益较突出`);
  if (profile.maxDrawdown < -25) weaknesses.push(`最大回撤 ${formatPercent(profile.maxDrawdown)}，波动承受要求较高`);
  if (profile.volatility > 24) weaknesses.push(`波动率 ${profile.volatility.toFixed(1)}%，短期净值波动较明显`);
  if (strengths.length === 0) strengths.push('收益表现较为均衡，需要结合持仓和风险指标继续观察');
  if (weaknesses.length === 0) weaknesses.push('当前主要风险来自市场风格切换和行业轮动');

  return {
    summary: score >= 5
      ? '历史表现具备一定亮点，但仍需结合估值、波动和持仓集中度审慎评估。'
      : '历史表现偏稳健，短期弹性有限，更适合与风险预算配合评估。',
    strengths,
    weaknesses,
    riskControl: profile.maxDrawdown < -25
      ? '建议控制单只基金仓位，避免在短期涨幅较大后集中买入。'
      : '可关注回撤后的分批配置窗口，同时设置组合层面的再平衡规则。',
  };
}

export function analyzeHoldings(profile: FundProfile): HoldingsAnalysis {
  const topWeight = profile.holdings.reduce((sum, item) => sum + item.weight, 0);
  const concentration = topWeight > 45 ? '高' : topWeight > 28 ? '中' : '低';
  const leading = profile.industryAllocation[0];
  const nameSignalsTheme = ['新能源', '医药', '消费', '电力'].some((word) => profile.name.includes(word));
  const holdingMatchesName = leading ? profile.name.includes(leading.name) || profile.coreDirection.includes(leading.name) : true;

  return {
    summary: `前十大持仓合计约 ${topWeight.toFixed(1)}%，第一大行业为 ${leading?.name || '未披露'}。`,
    concentration,
    styleDrift: nameSignalsTheme && !holdingMatchesName
      ? '基金名称主题与第一大行业暴露存在差异，需要重点关注风格漂移。'
      : '基金名称、投资方向与主要持仓暴露基本一致，仍需跟踪季度报告变化。',
    keyExposure: leading
      ? `${leading.name} 暴露约 ${leading.weight.toFixed(1)}%，是影响净值弹性的核心来源。`
      : '持仓暴露需要等待进一步披露。',
  };
}

function trendFromProfile(profile: FundProfile, period: TrendForecast['period']): TrendLabel {
  const momentum = period.startsWith('短期') ? profile.return1m : period.startsWith('中期') ? profile.return6m : profile.return1y;
  const penalty = profile.volatility > 28 || profile.maxDrawdown < -30 ? 6 : profile.volatility > 20 ? 3 : 0;
  const adjusted = momentum - penalty;

  if (adjusted >= 18) return '偏上涨';
  if (adjusted >= 8) return '震荡偏强';
  if (adjusted >= 0) return '震荡';
  if (adjusted >= -8) return '震荡偏弱';
  return '偏下跌';
}

export function generateTrendForecast(profile: FundProfile, market = ''): TrendForecast[] {
  const periods: TrendForecast['period'][] = ['短期：未来 1 个月', '中期：未来 3-6 个月', '长期：未来 1 年以上'];

  return periods.map((period) => {
    const trend = trendFromProfile(profile, period);
    const confidence = profile.volatility > 26 ? '低' : profile.return1y > 20 && profile.sharpeRatio > 0.8 ? '中' : '中';
    const mainIndustry = profile.industryAllocation[0]?.name || profile.coreDirection;

    return {
      period,
      trend,
      confidence,
      reason: `${profile.coreDirection} 暴露清晰，近 1 月收益 ${formatPercent(profile.return1m)}，近 1 年收益 ${formatPercent(profile.return1y)}。`,
      positiveFactors: `${mainIndustry} 景气度、资金偏好和基金经理执行能力是主要利好来源。`,
      riskFactors: `${profile.volatility.toFixed(1)}% 波动率、${formatPercent(profile.maxDrawdown)} 最大回撤以及 ${market || '市场风格切换'} 是主要风险。`,
      watchIndicators: profile.type === 'QDII'
        ? '海外利率、美元指数、核心持仓财报、汇率'
        : profile.type === '债券型'
          ? '国债收益率、信用利差、久期变化、赎回压力'
          : '行业指数、成交额、估值分位、基金季报持仓',
    };
  });
}

export function generateScenarioAnalysis(profile: FundProfile): ScenarioAnalysis[] {
  const direction = profile.coreDirection;
  return [
    {
      scenario: '乐观情景',
      trigger: `${direction} 景气度继续改善，市场风险偏好维持较高水平。`,
      possiblePerformance: '净值可能延续相对强势，但仍需观察估值和波动。',
      watchIndicator: profile.type === 'QDII' ? '核心海外资产财报和美元指数' : '行业指数和资金流向',
      strategy: '已有仓位可继续观察，新增资金更适合分批执行。',
    },
    {
      scenario: '中性情景',
      trigger: '基本面稳定，但市场风格轮动加快。',
      possiblePerformance: '可能以区间震荡为主，收益更多来自结构性机会。',
      watchIndicator: '成交额、估值分位、基金净值相对同类排名',
      strategy: '保持纪律性仓位，按组合再平衡规则处理。',
    },
    {
      scenario: '悲观情景',
      trigger: '宏观流动性收紧、核心持仓回撤或主题热度下降。',
      possiblePerformance: '净值可能出现阶段性回撤，需要结合风险预算处理。',
      watchIndicator: `最大回撤是否接近 ${Math.abs(profile.maxDrawdown).toFixed(0)}% 历史区间`,
      strategy: '降低单一主题暴露，避免短期集中补仓。',
    },
  ];
}

export function generateRiskControlAdvice(profile: FundProfile): RiskControlAdvice[] {
  const highRisk = profile.riskLevel === '高风险' || profile.volatility > 25;
  const basePosition = highRisk ? '5-10%' : profile.type === '债券型' || profile.type === '货币型' ? '10-30%' : '8-15%';

  return [
    {
      investorType: '激进型投资者',
      addPosition: highRisk ? '仅适合小幅加仓' : '可在回撤后评估加仓',
      batchBuy: '适合',
      fixedInvestment: profile.type === '货币型' ? '不作为定投重点' : '可作为卫星仓定投',
      positionRange: basePosition,
      takeProfitStopLoss: `参考 ${Math.abs(profile.maxDrawdown * 0.6).toFixed(0)}% 阶段回撤进行风控复盘`,
      riskReminder: '重点关注行业拥挤度和短期波动。',
    },
    {
      investorType: '平衡型投资者',
      addPosition: highRisk ? '谨慎加仓' : '可分批配置',
      batchBuy: '适合',
      fixedInvestment: '适合小额、分散、长期纪律执行',
      positionRange: highRisk ? '3-8%' : '6-12%',
      takeProfitStopLoss: '以组合再平衡和风险预算为主，不追求短线判断。',
      riskReminder: '避免单一主题仓位过高。',
    },
    {
      investorType: '稳健型投资者',
      addPosition: highRisk ? '不建议主动加仓' : '仅适合低比例配置',
      batchBuy: highRisk ? '谨慎' : '适合',
      fixedInvestment: highRisk ? '需降低金额和频率' : '可评估',
      positionRange: highRisk ? '0-5%' : '3-8%',
      takeProfitStopLoss: '优先控制最大回撤和流动性需求。',
      riskReminder: '应避免超出自身风险承受能力。',
    },
    {
      investorType: '已持有该基金的投资者',
      addPosition: '结合持仓成本和组合集中度决定',
      batchBuy: '回撤后再分批优于集中操作',
      fixedInvestment: '可保留纪律性定投，但需定期复盘',
      positionRange: basePosition,
      takeProfitStopLoss: '当风险指标恶化或风格漂移扩大时进行减仓复盘。',
      riskReminder: '不要仅依据阶段收益扩大仓位。',
    },
    {
      investorType: '准备买入该基金的投资者',
      addPosition: '先建立观察仓更稳妥',
      batchBuy: '适合',
      fixedInvestment: profile.type === '指数型' || profile.type === 'ETF' ? '较适合' : '视风险承受能力评估',
      positionRange: highRisk ? '0-5%' : '3-10%',
      takeProfitStopLoss: '买入前先设定回撤承受范围和复盘频率。',
      riskReminder: '需理解基金类型、持仓方向和净值波动来源。',
    },
  ];
}

function calculateScore(profile: FundProfile, holdings: HoldingsAnalysis): number {
  const returnScore = Math.min(3.2, Math.max(0, profile.return1y / 20));
  const sharpeScore = Math.min(2.2, Math.max(0, profile.sharpeRatio * 1.4));
  const drawdownScore = Math.min(2, Math.max(0, (35 + profile.maxDrawdown) / 12));
  const diversificationScore = holdings.concentration === '高' ? 0.8 : holdings.concentration === '中' ? 1.3 : 1.7;
  const liquidityScore = Number.parseFloat(profile.scale) > 5 ? 1.3 : 0.8;
  return Math.min(10, returnScore + sharpeScore + drawdownScore + diversificationScore + liquidityScore);
}

export function compareFunds(results: FundAnalysisResult[]): FundComparisonResult {
  const rows = results.map((result) => {
    const [shortTrend, midTrend, longTrend] = result.trends;
    return {
      code: result.data.code,
      name: result.data.name,
      fundType: result.data.type,
      direction: result.data.coreDirection,
      currentStyle: result.data.currentStyle,
      shortTrend: shortTrend.trend,
      midTrend: midTrend.trend,
      longTrend: longTrend.trend,
      mainAdvantage: result.performance.strengths[0],
      mainRisk: result.performance.weaknesses[0],
      suitableInvestors: result.data.riskLevel === '高风险' ? '激进型、风险承受能力较高' : '平衡型、长期研究型',
      fixedInvestment: result.data.type === '指数型' || result.data.type === 'ETF' ? '较适合' : '谨慎评估',
      longTermHolding: result.score >= 7 ? '较适合' : '需持续观察',
      score: Number(result.score.toFixed(1)),
    };
  });

  const byScore = [...rows].sort((a, b) => b.score - a.score);
  const byReturn = [...results].sort((a, b) => b.data.return1y - a.data.return1y);
  const byRisk = [...results].sort((a, b) => b.data.volatility - a.data.volatility);
  const byDrawdownControl = [...results].sort((a, b) => a.data.maxDrawdown - b.data.maxDrawdown);
  const bySharpe = [...results].sort((a, b) => b.data.sharpeRatio - a.data.sharpeRatio);
  const fixed = rows.find((row) => row.fixedInvestment === '较适合') || byScore[0];

  return {
    rows,
    rankings: [
      { title: '最适合长期持有的基金', code: byScore[0]?.code || '-', name: byScore[0]?.name || '-', reason: '综合评分和风险调整后表现相对更均衡。' },
      { title: '最适合定投的基金', code: fixed?.code || '-', name: fixed?.name || '-', reason: '基金类型和投资方向更适合纪律性分批配置。' },
      { title: '短期弹性最大的基金', code: byReturn[0]?.data.code || '-', name: byReturn[0]?.data.name || '-', reason: '近 1 年收益和成长弹性较高。' },
      { title: '风险最高的基金', code: byRisk[0]?.data.code || '-', name: byRisk[0]?.data.name || '-', reason: '波动率和回撤承受要求较高。' },
      { title: '当前最不适合加仓的基金', code: byDrawdownControl[0]?.data.code || '-', name: byDrawdownControl[0]?.data.name || '-', reason: '最大回撤最深，当前风险暴露较高，更适合先观察或控制仓位。' },
      { title: '综合性价比最高的基金', code: bySharpe[0]?.data.code || '-', name: bySharpe[0]?.data.name || '-', reason: '夏普比率最高，风险调整后收益相对更突出。' },
    ],
  };
}

async function fetchSnapshot(fundCode: string): Promise<FundNavSnapshot | null> {
  try {
    const resp = await fetch(`/api/funds/${fundCode}/snapshot`);
    if (!resp.ok) return null;
    const snapshot = (await resp.json()) as FundNavSnapshot;
    if (snapshot.dataStatus === 'error') return null;
    return snapshot;
  } catch {
    return null;
  }
}

export async function runFundAnalysis(inputs: FundInput[]): Promise<FundAnalysisRun> {
  const results = await Promise.all(
    inputs.map(async (input) => {
      const identification = identifyFundType(input);
      const [snapshot, extended] = await Promise.all([
        fetchSnapshot(input.code),
        fetchFundExtendedData(input.code),
      ]);
      const data = snapshot
        ? buildProfileFromSnapshot(snapshot, identification, extended)
        : { code: input.code, name: input.name, company: '', manager: '', inceptionDate: '', scale: '', type: identification.fundType, riskLevel: '中高风险' as const, investmentScope: identification.investmentScope, coreDirection: inferDirection(input.name, identification.fundType), currentStyle: '', latestNav: 0, accumulatedNav: 0, return1m: 0, return3m: 0, return6m: 0, return1y: 0, return3y: 0, maxDrawdown: 0, volatility: 0, sharpeRatio: 0, holdings: [], industryAllocation: [], stockPosition: 0, bondPosition: 0, cashPosition: 0, source: '数据获取失败', dataDate: '' };
      const framework = getFramework(data);
      const performance = analyzeFundPerformance(data);
      const holdings = analyzeHoldings(data);
      const trends = generateTrendForecast(data, MARKET_CONTEXT.equityTone);
      const scenarios = generateScenarioAnalysis(data);
      const advice = generateRiskControlAdvice(data);
      const score = calculateScore(data, holdings);

      return sanitizeObject({
        input,
        identification,
        data,
        framework,
        performance,
        holdings,
        trends,
        scenarios,
        advice,
        score,
        extendedData: extended,
      });
    })
  );

  return sanitizeObject({
    results,
    comparison: compareFunds(results),
    generatedAt: new Date().toLocaleString('zh-CN'),
  });
}
