import type { FundData, ChartDataPoint } from '../types/fund';
import { getTrendColor, getScoreColor } from '../types/fund';

// 转换收益数据为柱状图格式
export function transformReturnsToBarData(fund: FundData): ChartDataPoint[] {
  return [
    { name: '近1周', value: fund.performance.return1w },
    { name: '近1月', value: fund.performance.return1m },
    { name: '近3月', value: fund.performance.return3m },
    { name: '近6月', value: fund.performance.return6m },
    { name: '近1年', value: fund.performance.return1y },
    { name: '成立以来', value: fund.performance.returnSinceStart },
  ];
}

// 转换多只基金收益对比数据（A股风格：红涨绿跌）
export function transformMultiFundReturns(funds: FundData[]): ChartDataPoint[] {
  return funds.map((fund) => ({
    name: fund.basicInfo.code,
    value: fund.performance.return1y,
    color: fund.performance.return1y >= 0 ? '#ef4444' : '#22c55e',
  }));
}

// 转换持仓数据为饼图格式
export function transformHoldingsToPieData(fund: FundData): ChartDataPoint[] {
  if (!fund.holdings || fund.holdings.length === 0) return [];

  return fund.holdings.map((holding) => ({
    name: holding.stock,
    value: holding.percentage,
  }));
}

// 转换趋势分布数据
export function transformTrendDistribution(funds: FundData[]): ChartDataPoint[] {
  const distribution: Record<string, number> = {
    '偏上涨': 0,
    '震荡偏强': 0,
    '震荡': 0,
    '震荡偏弱': 0,
    '偏下跌': 0,
  };

  for (const fund of funds) {
    const shortTrend = fund.trends.find((t) => t.period.includes('短期'));
    if (shortTrend) {
      distribution[shortTrend.trend] = (distribution[shortTrend.trend] || 0) + 1;
    }
  }

  return Object.entries(distribution)
    .filter(([, count]) => count > 0)
    .map(([trend, count]) => ({
      name: trend,
      value: count,
      color: getTrendColor(trend),
    }));
}

// 转换评分数据
export function transformScoresToData(funds: FundData[]): ChartDataPoint[] {
  return funds.map((fund) => ({
    name: fund.basicInfo.code,
    value: fund.score,
    color: getScoreColor(fund.score),
  }));
}

// 转换行业分布数据
export function transformIndustryDistribution(funds: FundData[]): ChartDataPoint[] {
  const industryMap: Record<string, number> = {};

  for (const fund of funds) {
    if (fund.holdings) {
      for (const holding of fund.holdings) {
        if (holding.industry) {
          industryMap[holding.industry] = (industryMap[holding.industry] || 0) + holding.percentage;
        }
      }
    }
  }

  return Object.entries(industryMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([industry, percentage]) => ({
      name: industry,
      value: Math.round(percentage * 100) / 100,
    }));
}

// 转换市场分布数据
export function transformMarketDistribution(funds: FundData[]): ChartDataPoint[] {
  const marketMap: Record<string, number> = {};

  for (const fund of funds) {
    if (fund.holdings) {
      for (const holding of fund.holdings) {
        const market = holding.market || '未知';
        marketMap[market] = (marketMap[market] || 0) + holding.percentage;
      }
    }
  }

  return Object.entries(marketMap).map(([market, percentage]) => ({
    name: market,
    value: Math.round(percentage * 100) / 100,
  }));
}

// 计算平均收益
export function calculateAverageReturn(funds: FundData[], period: string): number {
  if (funds.length === 0) return 0;

  const returns = funds.map((fund) => {
    switch (period) {
      case '1w': return fund.performance.return1w;
      case '1m': return fund.performance.return1m;
      case '3m': return fund.performance.return3m;
      case '6m': return fund.performance.return6m;
      case '1y': return fund.performance.return1y;
      default: return 0;
    }
  });

  return Math.round((returns.reduce((sum, r) => sum + r, 0) / returns.length) * 100) / 100;
}

// 计算平均评分
export function calculateAverageScore(funds: FundData[]): number {
  if (funds.length === 0) return 0;
  const total = funds.reduce((sum, fund) => sum + fund.score, 0);
  return Math.round((total / funds.length) * 10) / 10;
}

// 获取收益排名
export function getReturnRanking(funds: FundData[], period: string): FundData[] {
  return [...funds].sort((a, b) => {
    const getReturn = (fund: FundData) => {
      switch (period) {
        case '1w': return fund.performance.return1w;
        case '1m': return fund.performance.return1m;
        case '3m': return fund.performance.return3m;
        case '6m': return fund.performance.return6m;
        case '1y': return fund.performance.return1y;
        default: return 0;
      }
    };
    return getReturn(b) - getReturn(a);
  });
}

// 获取评分排名
export function getScoreRanking(funds: FundData[]): FundData[] {
  return [...funds].sort((a, b) => b.score - a.score);
}

// 格式化百分比
export function formatPercentage(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

// 格式化净值
export function formatNav(value: number): string {
  return value.toFixed(4);
}

// 获取收益颜色（A股风格：红涨绿跌）
export function getReturnColor(value: number): string {
  if (value > 0) return '#ef4444';   // 红色 - 上涨
  if (value < 0) return '#22c55e';   // 绿色 - 下跌
  return '#6b7280';                  // 灰色 - 平
}

// 获取收益背景色（A股风格）
export function getReturnBgColor(value: number): string {
  if (value > 0) return 'bg-red-50';
  if (value < 0) return 'bg-green-50';
  return 'bg-gray-50';
}
