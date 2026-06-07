import type { FundInput, FundProfile, TypeIdentification } from '../types/fundAnalysis';

const SAMPLE_PROFILES: FundProfile[] = [
  {
    code: '018173',
    name: '华泰柏瑞中证电力ETF联接C',
    company: '华泰柏瑞基金',
    manager: '尤家妤',
    inceptionDate: '2023-04-14',
    scale: '2.83亿元',
    type: '指数型',
    riskLevel: '中高风险',
    investmentScope: 'A股',
    coreDirection: '电力公用事业',
    currentStyle: '防御、高股息、低波动',
    latestNav: 1.3545,
    accumulatedNav: 1.3545,
    return1m: 12.51,
    return3m: 14.88,
    return6m: 20.89,
    return1y: 27.7,
    return3y: 30.72,
    maxDrawdown: -12.8,
    volatility: 15.4,
    sharpeRatio: 0.86,
    holdings: [
      { name: '长江电力', weight: 9.8, industry: '水电' },
      { name: '中国核电', weight: 7.2, industry: '核电' },
      { name: '华能国际', weight: 6.6, industry: '火电' },
      { name: '国投电力', weight: 5.9, industry: '水电' },
      { name: '三峡能源', weight: 5.1, industry: '新能源电力' },
    ],
    industryAllocation: [
      { name: '水电', weight: 31 },
      { name: '火电', weight: 24 },
      { name: '核电', weight: 16 },
      { name: '新能源电力', weight: 18 },
      { name: '现金及其他', weight: 11 },
    ],
    stockPosition: 88,
    bondPosition: 0,
    cashPosition: 12,
    trackingIndex: '中证全指电力公用事业指数',
    trackingError: 1.57,
    feeRate: 0.6,
    source: 'mock 数据层，参考公开基金披露字段',
    dataDate: '2026-06-01',
  },
  {
    code: '008254',
    name: '华宝致远混合(QDII)C',
    company: '华宝基金',
    manager: '周晶、杨洋',
    inceptionDate: '2019-11-27',
    scale: '3.94亿元',
    type: 'QDII',
    riskLevel: '高风险',
    investmentScope: '美股',
    coreDirection: '海外科技成长',
    currentStyle: 'AI 算力、半导体、集中成长',
    latestNav: 2.0141,
    accumulatedNav: 2.0141,
    return1m: 23.15,
    return3m: 36.63,
    return6m: 52.32,
    return1y: 100.53,
    return3y: 157.2,
    maxDrawdown: -34.5,
    volatility: 29.6,
    sharpeRatio: 1.18,
    holdings: [
      { name: '英伟达', weight: 7.79, industry: 'AI芯片' },
      { name: 'Lumen', weight: 7.07, industry: '光通信' },
      { name: '闪迪', weight: 5.47, industry: '存储芯片' },
      { name: '美光科技', weight: 4.53, industry: '存储芯片' },
      { name: '博通', weight: 4.15, industry: '半导体' },
    ],
    industryAllocation: [
      { name: '半导体', weight: 32 },
      { name: '光通信', weight: 21 },
      { name: '互联网', weight: 14 },
      { name: '云计算', weight: 10 },
      { name: '现金及其他', weight: 23 },
    ],
    stockPosition: 84,
    bondPosition: 0,
    cashPosition: 16,
    overseasMarket: '美国科技股',
    source: 'mock 数据层，参考公开基金披露字段',
    dataDate: '2026-06-01',
  },
  {
    code: '270042',
    name: '广发纳斯达克100ETF联接(QDII)A',
    company: '广发基金',
    manager: '刘杰',
    inceptionDate: '2012-08-15',
    scale: '56.21亿元',
    type: 'QDII',
    riskLevel: '中高风险',
    investmentScope: '美股',
    coreDirection: '纳斯达克100宽基指数',
    currentStyle: '美股大型科技、指数跟踪',
    latestNav: 5.218,
    accumulatedNav: 5.218,
    return1m: 8.4,
    return3m: 17.2,
    return6m: 26.5,
    return1y: 43.8,
    return3y: 88.7,
    maxDrawdown: -28.2,
    volatility: 24.8,
    sharpeRatio: 0.92,
    holdings: [
      { name: '微软', weight: 8.3, industry: '软件' },
      { name: '英伟达', weight: 7.8, industry: 'AI芯片' },
      { name: '苹果', weight: 7.4, industry: '消费电子' },
      { name: '亚马逊', weight: 5.1, industry: '互联网' },
      { name: 'Meta', weight: 4.6, industry: '互联网' },
    ],
    industryAllocation: [
      { name: '软件', weight: 25 },
      { name: '半导体', weight: 22 },
      { name: '互联网', weight: 18 },
      { name: '消费电子', weight: 13 },
      { name: '现金及其他', weight: 22 },
    ],
    stockPosition: 90,
    bondPosition: 0,
    cashPosition: 10,
    trackingIndex: '纳斯达克100指数',
    trackingError: 0.85,
    feeRate: 0.8,
    overseasMarket: '美国成长股',
    source: 'mock 数据层，参考公开基金披露字段',
    dataDate: '2026-06-01',
  },
  {
    code: '016186',
    name: '广发中证全指电力ETF联接C',
    company: '广发基金',
    manager: '陆志明',
    inceptionDate: '2022-07-19',
    scale: '7.62亿元',
    type: '指数型',
    riskLevel: '中风险',
    investmentScope: 'A股',
    coreDirection: '电力公用事业',
    currentStyle: '防御、红利、行业指数',
    latestNav: 1.263,
    accumulatedNav: 1.263,
    return1m: 10.16,
    return3m: 13.4,
    return6m: 18.9,
    return1y: 25.1,
    return3y: 26.3,
    maxDrawdown: -10.9,
    volatility: 13.1,
    sharpeRatio: 0.91,
    holdings: [
      { name: '长江电力', weight: 10.2, industry: '水电' },
      { name: '国电电力', weight: 6.9, industry: '火电' },
      { name: '中国广核', weight: 5.8, industry: '核电' },
      { name: '川投能源', weight: 5.4, industry: '水电' },
      { name: '华电国际', weight: 4.6, industry: '火电' },
    ],
    industryAllocation: [
      { name: '水电', weight: 34 },
      { name: '火电', weight: 23 },
      { name: '核电', weight: 13 },
      { name: '新能源电力', weight: 17 },
      { name: '现金及其他', weight: 13 },
    ],
    stockPosition: 86,
    bondPosition: 0,
    cashPosition: 14,
    trackingIndex: '中证全指电力公用事业指数',
    trackingError: 1.1,
    feeRate: 0.55,
    source: 'mock 数据层，参考公开基金披露字段',
    dataDate: '2026-06-01',
  },
];

function fallbackProfile(input: FundInput, identification: TypeIdentification): FundProfile {
  const isBond = identification.fundType === '债券型';
  const isMoney = identification.fundType === '货币型';
  const baseReturn = isMoney ? 1.8 : isBond ? 4.2 : identification.fundType === 'QDII' ? 18 : 9;

  return {
    code: input.code,
    name: input.name,
    company: '示例基金公司',
    manager: '示例基金经理',
    inceptionDate: '2020-01-15',
    scale: '18.60亿元',
    type: identification.fundType,
    riskLevel: isMoney ? '低风险' : isBond ? '中低风险' : '中高风险',
    investmentScope: identification.investmentScope,
    coreDirection: identification.coreDirection,
    currentStyle: isBond ? '稳健久期、信用精选' : isMoney ? '高流动性、现金管理' : '均衡成长、分散配置',
    latestNav: isMoney ? 1 : 1.368,
    accumulatedNav: isMoney ? 1 : 1.728,
    return1m: baseReturn / 8,
    return3m: baseReturn / 3,
    return6m: baseReturn / 1.8,
    return1y: baseReturn,
    return3y: baseReturn * 2.2,
    maxDrawdown: isMoney ? -0.1 : isBond ? -3.8 : -18.6,
    volatility: isMoney ? 0.4 : isBond ? 4.6 : 18.2,
    sharpeRatio: isMoney ? 0.72 : isBond ? 0.76 : 0.68,
    holdings: [
      { name: isBond ? '国债' : '核心资产A', weight: 8.2, industry: isBond ? '利率债' : '科技' },
      { name: isBond ? '政策性金融债' : '核心资产B', weight: 7.4, industry: isBond ? '金融债' : '消费' },
      { name: isBond ? '高等级信用债' : '核心资产C', weight: 6.1, industry: isBond ? '信用债' : '医药' },
    ],
    industryAllocation: isBond
      ? [
          { name: '利率债', weight: 42 },
          { name: '金融债', weight: 28 },
          { name: '信用债', weight: 18 },
          { name: '现金', weight: 12 },
        ]
      : [
          { name: '科技', weight: 26 },
          { name: '消费', weight: 21 },
          { name: '医药', weight: 15 },
          { name: '高端制造', weight: 14 },
          { name: '现金及其他', weight: 24 },
        ],
    stockPosition: isBond || isMoney ? 0 : 82,
    bondPosition: isMoney ? 55 : isBond ? 86 : 0,
    cashPosition: isMoney ? 45 : isBond ? 14 : 18,
    duration: isBond ? '中短久期' : undefined,
    creditBondRatio: isBond ? 18 : undefined,
    convertibleBondRatio: isBond ? 6 : undefined,
    sevenDayAnnualized: isMoney ? 1.82 : undefined,
    tenThousandIncome: isMoney ? 0.49 : undefined,
    source: 'mock 数据层，待接入真实基金 API',
    dataDate: '2026-06-01',
  };
}

export async function fetchFundBasicInfo(
  input: FundInput,
  identification: TypeIdentification
): Promise<FundProfile> {
  // TODO: Replace with a real fund basic info API when provider credentials and schema are available.
  const matched = SAMPLE_PROFILES.find((fund) => fund.code === input.code);
  return matched ? { ...matched, name: input.name || matched.name } : fallbackProfile(input, identification);
}

export async function fetchFundNavHistory(): Promise<number[]> {
  // TODO: Replace with real NAV history data.
  return [0.6, 1.1, 2.7, 3.4, 4.9, 6.2, 5.8, 7.1];
}

export async function fetchFundHoldings(profile: FundProfile): Promise<FundProfile['holdings']> {
  // TODO: Replace with real quarterly holdings.
  return profile.holdings;
}

export async function fetchMarketData(): Promise<{ rateTone: string; equityTone: string; fxTone: string }> {
  // TODO: Replace with macro, rate, valuation, and currency data feeds.
  return {
    rateTone: '利率环境整体平稳，但海外利率仍会影响成长资产估值',
    equityTone: '权益市场结构分化，资金偏好确定性和景气度较高的方向',
    fxTone: '汇率波动会影响 QDII 净值折算和短期表现',
  };
}

export async function getMockFundData(
  input: FundInput,
  identification: TypeIdentification
): Promise<FundProfile> {
  const profile = await fetchFundBasicInfo(input, identification);
  const holdings = await fetchFundHoldings(profile);
  return { ...profile, holdings };
}
