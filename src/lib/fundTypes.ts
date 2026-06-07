import type { FundInput, FundType, InvestmentScope, TypeIdentification } from '../types/fundAnalysis';

function includesAny(value: string, keywords: string[]): boolean {
  return keywords.some((keyword) => value.includes(keyword));
}

export function identifyFundType(input: Pick<FundInput, 'code' | 'name'>): TypeIdentification {
  const name = input.name.toUpperCase();
  let fundType: FundType = '其他';
  let investmentScope: InvestmentScope = 'A股';
  let coreDirection = '均衡配置';

  if (includesAny(name, ['QDII', '全球', '海外', '纳斯达克', '标普', '美股'])) {
    fundType = 'QDII';
    investmentScope = includesAny(name, ['全球']) ? '全球市场' : '美股';
    coreDirection = includesAny(name, ['科技', 'AI', '纳斯达克'])
      ? '海外科技成长'
      : '海外资产配置';
  } else if (includesAny(name, ['ETF'])) {
    fundType = 'ETF';
    investmentScope = 'A股';
    coreDirection = includesAny(name, ['电力', '新能源', '医药', '消费'])
      ? '行业主题'
      : '宽基指数';
  } else if (includesAny(name, ['指数', '联接'])) {
    fundType = '指数型';
    investmentScope = 'A股';
    coreDirection = includesAny(name, ['红利'])
      ? '红利指数'
      : includesAny(name, ['电力', '新能源', '医药', '消费'])
        ? '行业主题'
        : '宽基指数';
  } else if (includesAny(name, ['债', '固收'])) {
    fundType = '债券型';
    investmentScope = '债券市场';
    coreDirection = '债券久期策略';
  } else if (includesAny(name, ['货币', '现金'])) {
    fundType = '货币型';
    investmentScope = '债券市场';
    coreDirection = '现金管理';
  } else if (includesAny(name, ['FOF'])) {
    fundType = 'FOF';
    investmentScope = '多资产';
    coreDirection = '多资产配置';
  } else if (includesAny(name, ['混合'])) {
    fundType = '偏股混合型';
    investmentScope = includesAny(name, ['全球']) ? '全球市场' : 'A股';
    coreDirection = includesAny(name, ['成长', '科技']) ? '成长' : '均衡配置';
  } else if (includesAny(name, ['股票'])) {
    fundType = '主动股票型';
    investmentScope = 'A股';
    coreDirection = includesAny(name, ['科技', '新能源', '医药', '消费'])
      ? '行业主题'
      : '成长';
  }

  return { fundType, investmentScope, coreDirection };
}
