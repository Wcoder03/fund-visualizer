import { getDisplayNav, getNextTradingDay } from './marketStatus';
import type { DcaPlan, FundNavSnapshot, PortfolioHolding, PortfolioProfitLoss } from '../types/portfolio';

const round2 = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
const round4 = (value: number) => Math.round((value + Number.EPSILON) * 10000) / 10000;

export function calculateHoldingShares(input: { holdingShares?: number; holdingAmount?: number }, currentNav?: number): number {
  if (input.holdingShares !== undefined && input.holdingShares >= 0) return round4(input.holdingShares);
  if (!currentNav || currentNav <= 0 || !input.holdingAmount) return 0;
  return round4(input.holdingAmount / currentNav);
}

export function isHoldingSharesEstimated(input: { holdingShares?: number; holdingAmount?: number }, currentNav?: number): boolean {
  return (input.holdingShares === undefined || input.holdingShares <= 0) && Boolean(currentNav && currentNav > 0 && input.holdingAmount && input.holdingAmount > 0);
}

export function calculateMarketValue(holdingShares: number, currentNav?: number): number {
  if (!currentNav || currentNav <= 0 || holdingShares <= 0) return 0;
  return round2(holdingShares * currentNav);
}

export function calculateTotalProfitLoss(marketValue: number, costAmount: number): number {
  return round2(marketValue - costAmount);
}

export function calculateTotalProfitLossRate(totalProfitLoss: number | null, costAmount: number): number | null {
  if (totalProfitLoss === null || costAmount <= 0) return null;
  return round4(totalProfitLoss / costAmount);
}

export function calculateDailyProfitLoss(holdingShares: number, currentNav?: number, previousNav?: number): number | null {
  if (!currentNav || !previousNav || currentNav <= 0 || previousNav <= 0) return null;
  const rate = Math.abs((currentNav - previousNav) / previousNav);
  if (rate > 0.2) return null; // 日涨跌幅超过20%视为数据异常
  return round2(holdingShares * (currentNav - previousNav));
}

export function calculateDailyProfitLossRate(currentNav?: number, previousNav?: number): number | null {
  if (!currentNav || !previousNav || previousNav <= 0) return null;
  const rate = (currentNav - previousNav) / previousNav;
  if (Math.abs(rate) > 0.2) return null; // 日涨跌幅超过20%视为数据异常
  return round4(rate);
}

export function calculateConfirmedDailyProfitLoss(
  holdingShares: number,
  confirmedNav?: number,
  previousNav?: number
): number | null {
  return calculateDailyProfitLoss(holdingShares, confirmedNav, previousNav);
}

function isNavReasonable(nav?: number, reference?: number): boolean {
  if (!nav || nav <= 0) return false;
  if (!reference || reference <= 0) return true;
  return Math.abs(nav - reference) / reference < 0.2;
}

export function calculateHoldingDays(firstBuyDate: string, today = new Date()): number {
  const start = new Date(firstBuyDate);
  if (Number.isNaN(start.getTime())) return 0;
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
  const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  return Math.max(0, Math.floor((todayDay - startDay) / 86400000));
}

export function calculateAnnualizedReturn(totalProfitLossRate: number | null, holdingDays: number): number | null {
  if (totalProfitLossRate === null || holdingDays <= 0 || totalProfitLossRate <= -1) return null;
  return round4((1 + totalProfitLossRate) ** (365 / holdingDays) - 1);
}

export function inferCostNav(holding: PortfolioHolding, holdingShares: number): number | undefined {
  if (holding.costNav && holding.costNav > 0) return round4(holding.costNav);
  if (holding.costAmount <= 0 || holdingShares <= 0) return undefined;
  return round4(holding.costAmount / holdingShares);
}

export function inferFirstBuyDateFromNavHistory(
  costNav?: number,
  history: FundNavSnapshot['navHistory'] = []
): string | undefined {
  if (!costNav || costNav <= 0 || history.length === 0) return undefined;
  const validHistory = history.filter((item) => item.date && item.unitNav > 0);
  if (validHistory.length === 0) return undefined;
  return validHistory.reduce((best, item) => {
    return Math.abs(item.unitNav - costNav) < Math.abs(best.unitNav - costNav) ? item : best;
  }, validHistory[0]).date;
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function normalizeWeekday(value: number): number {
  return Math.min(5, Math.max(1, value));
}

export function calculateNextDcaDate(plan: Pick<DcaPlan, 'frequency' | 'investDay' | 'startDate' | 'endDate' | 'status'>, today = new Date()): string | undefined {
  if (plan.status === 'paused' || plan.status === 'ended') return undefined;
  const start = new Date(plan.startDate);
  const base = Number.isNaN(start.getTime()) || start < today ? new Date(today) : start;
  base.setHours(0, 0, 0, 0);

  if (plan.endDate && new Date(plan.endDate) < today) return undefined;

  if (plan.frequency === 'daily') {
    const candidate = new Date(base);
    if (candidate <= today) candidate.setDate(candidate.getDate() + 1);
    return formatDate(getNextTradingDay(candidate));
  }

  if (plan.frequency === 'monthly') {
    const day = Math.min(28, Math.max(1, plan.investDay));
    const candidate = new Date(base.getFullYear(), base.getMonth(), day);
    const todayDay = new Date(today);
    todayDay.setHours(0, 0, 0, 0);
    if (candidate < base || candidate <= todayDay) candidate.setMonth(candidate.getMonth() + 1);
    return formatDate(getNextTradingDay(candidate));
  }

  const targetWeekday = normalizeWeekday(plan.investDay);
  const candidate = new Date(base);
  const currentWeekday = candidate.getDay() === 0 ? 7 : candidate.getDay();
  let offset = targetWeekday - currentWeekday;
  if (offset < 0) offset += 7;
  if (offset === 0 && candidate < today) offset = 7;
  candidate.setDate(candidate.getDate() + offset);
  if (plan.frequency === 'biweekly' && candidate.getTime() < today.getTime() + 7 * 86400000) {
    candidate.setDate(candidate.getDate() + 7);
  }
  return formatDate(getNextTradingDay(candidate));
}

export function estimateNextDcaShares(amount: number, currentNav?: number): number {
  if (!currentNav || currentNav <= 0 || amount <= 0) return 0;
  return round4(amount / currentNav);
}

export function calculatePortfolioProfitLoss(
  holding: PortfolioHolding,
  navSnapshot?: FundNavSnapshot
): PortfolioProfitLoss {
  const displayNav = getDisplayNav(navSnapshot);
  const holdingShares = calculateHoldingShares(holding, displayNav);
  const sharesEstimated = isHoldingSharesEstimated(holding, displayNav);
  const inferredCostNav = inferCostNav(holding, holdingShares);
  const inferredFirstBuyDate = inferFirstBuyDateFromNavHistory(inferredCostNav, navSnapshot?.navHistory);
  const marketValue = displayNav && holdingShares > 0 ? calculateMarketValue(holdingShares, displayNav) : null;
  const totalProfitLoss = marketValue === null ? null : calculateTotalProfitLoss(marketValue, holding.costAmount);
  const totalProfitLossRate = calculateTotalProfitLossRate(totalProfitLoss, holding.costAmount);

  const isOverseas = navSnapshot?.marketType === 'overseas';
  const isTrading = navSnapshot?.marketStatus === 'trading' || navSnapshot?.marketStatus === 'closed_pending_nav';
  const isNonTrading = navSnapshot?.marketStatus === 'non_trading_day' || navSnapshot?.marketStatus === 'before_open';
  const previousNav = navSnapshot?.previousNav;
  const intradayRate = navSnapshot?.intradayChangeRate;
  const confirmedNav = navSnapshot?.confirmedNav ?? navSnapshot?.latestConfirmedNav;

  const previousNavValid = isNavReasonable(previousNav, displayNav);

  let dailyProfitLoss: number | null = null;
  let dailyProfitLossRate: number | null = null;
  let confirmedDailyProfitLoss: number | null = null;
  let confirmedDailyProfitLossRate: number | null = null;

  if (isOverseas) {
    // QDII/海外基金：不依赖 A 股交易时段，有估算涨跌幅就用，否则用净值差
    if (intradayRate != null && intradayRate !== 0) {
      dailyProfitLossRate = round4(intradayRate);
      if (marketValue != null) {
        dailyProfitLoss = round2(marketValue * intradayRate);
      }
    } else if (displayNav && previousNav && previousNavValid) {
      dailyProfitLoss = calculateDailyProfitLoss(holdingShares, displayNav, previousNav);
      dailyProfitLossRate = calculateDailyProfitLossRate(displayNav, previousNav);
    }
  } else if (!isNonTrading) {
    // A 股基金：按 A 股交易时段判断
    if (isTrading && intradayRate != null && intradayRate !== 0) {
      dailyProfitLossRate = round4(intradayRate);
      if (marketValue != null) {
        dailyProfitLoss = round2(marketValue * intradayRate);
      }
    } else if (displayNav && previousNav && previousNavValid) {
      dailyProfitLoss = calculateDailyProfitLoss(holdingShares, displayNav, previousNav);
      dailyProfitLossRate = calculateDailyProfitLossRate(displayNav, previousNav);
    }
  }

  // 确认净值的日收益（仅 A 股基金在有确认净值时计算）
  if (!isOverseas && confirmedNav && previousNav && previousNavValid) {
    confirmedDailyProfitLoss = calculateConfirmedDailyProfitLoss(holdingShares, confirmedNav, previousNav);
    confirmedDailyProfitLossRate = calculateDailyProfitLossRate(confirmedNav, previousNav);
  }

  const holdingDays = calculateHoldingDays(inferredFirstBuyDate || holding.firstBuyDate);

  return {
    marketValue,
    costAmount: round2(holding.costAmount),
    totalProfitLoss,
    totalProfitLossRate,
    dailyProfitLoss,
    dailyProfitLossRate,
    confirmedDailyProfitLoss,
    confirmedDailyProfitLossRate,
    holdingDays,
    annualizedReturn: calculateAnnualizedReturn(totalProfitLossRate, holdingDays),
    dataStatus: displayNav && navSnapshot?.previousNav ? 'complete' : 'partial',
    calculationTime: new Date().toLocaleString('zh-CN'),
    calculatedHoldingShares: holdingShares,
    sharesEstimated,
    inferredFirstBuyDate,
    inferredCostNav,
  };
}
