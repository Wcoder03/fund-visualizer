import { getMarketStatus } from '../marketStatus';
import { normalizeNumber, normalizeRatePercent } from '../fundDataNormalizer';
import type {
  FundExtendedData,
  FundLatestNav,
  FundNavHistoryItem,
  FundRiskMetrics,
  FundSearchResult,
  IndustryAllocation,
  UnifiedFundHolding,
} from '../../types/fund';
import type { FundDataProvider } from './types';

function readEnv(key: string): string | undefined {
  return (globalThis as unknown as { process?: { env?: Record<string, string | undefined> } }).process?.env?.[key];
}

const DEFAULT_TIMEOUT = Number(readEnv('FUND_API_TIMEOUT_MS') || 8000);

async function fetchText(url: string, timeoutMs = DEFAULT_TIMEOUT): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Referer: 'https://fund.eastmoney.com/' },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.text();
  } finally {
    clearTimeout(timer);
  }
}

export function parseJsonp<T>(text: string): T | null {
  const match = text.match(/^[\w$]+\(([\s\S]*)\);?$/);
  if (!match) return null;
  try {
    return JSON.parse(match[1]) as T;
  } catch {
    return null;
  }
}

function extractJsonVariable<T>(text: string, name: string): T | null {
  const prefix = `var ${name} = `;
  const start = text.indexOf(prefix);
  if (start === -1) return null;
  const valueStart = start + prefix.length;
  const firstChar = text[valueStart];
  if (firstChar !== '[' && firstChar !== '{') return null;

  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = valueStart; i < text.length; i++) {
    const c = text[i];
    if (escape) { escape = false; continue; }
    if (c === '\\') { escape = true; continue; }
    if (c === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (c === firstChar) depth++;
    else if ((firstChar === '[' && c === ']') || (firstChar === '{' && c === '}')) {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(text.substring(valueStart, i + 1)) as T;
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

function extractStringVariable(text: string, name: string): string {
  const match = text.match(new RegExp(`var\\s+${name}\\s*=\\s*["']([^"']*)["']`));
  return match?.[1] || '';
}

interface EastmoneyEstimatePayload {
  fundcode: string;
  name: string;
  jzrq?: string;
  dwjz?: string;
  gsz?: string;
  gszzl?: string;
  gztime?: string;
}

interface EastmoneyTrendItem {
  x: number;
  y: number;
  equityReturn?: number;
  unitMoney?: string;
}

function historyRangeLimit(range = '1y'): number {
  const map: Record<string, number> = { '1m': 35, '3m': 100, '6m': 190, '1y': 380, '3y': 1150, all: 10000 };
  return map[range] ?? map['1y'];
}

export const eastmoneyProvider: FundDataProvider = {
  async searchFunds(keyword) {
    try {
      const text = await fetchText('https://fund.eastmoney.com/js/fundcode_search.js');
      const arrayText = text.replace(/^var\s+r\s*=\s*/, '').replace(/;?\s*$/, '');
      const rows = JSON.parse(arrayText) as [string, string, string, string, string][];
      const lower = keyword.toLowerCase();
      return rows
        .filter((row) => row[0].includes(keyword) || row[2].includes(keyword) || row[1].toLowerCase().includes(lower))
        .slice(0, 20)
        .map((row): FundSearchResult => ({
          fundCode: row[0],
          pinyin: row[1],
          fundName: row[2],
          fundType: row[3],
          dataSource: 'eastmoney',
        }));
    } catch {
      return [];
    }
  },

  async fetchFundRealtimeEstimate(fundCode) {
    try {
      const text = await fetchText(`https://fundgz.1234567.com.cn/js/${fundCode}.js?rt=${Date.now()}`);
      const payload = parseJsonp<EastmoneyEstimatePayload>(text);
      if (!payload) return null;
      return {
        fundCode: payload.fundcode,
        fundName: payload.name,
        latestConfirmedNav: normalizeNumber(payload.dwjz),
        estimatedNav: normalizeNumber(payload.gsz),
        estimatedChangeRate: normalizeRatePercent(payload.gszzl),
        estimateTime: payload.gztime,
        navDate: payload.jzrq,
        marketStatus: getMarketStatus(new Date()),
        dataSource: 'eastmoney',
        dataStatus: 'estimated',
      };
    } catch {
      return null;
    }
  },

  async fetchFundNavHistory(fundCode, range) {
    try {
      const text = await fetchText(`https://fund.eastmoney.com/pingzhongdata/${fundCode}.js?v=${Date.now()}`);
      const trend = extractJsonVariable<EastmoneyTrendItem[]>(text, 'Data_netWorthTrend') || [];
      return trend.slice(-historyRangeLimit(range)).map((item): FundNavHistoryItem => ({
        date: new Date(item.x).toISOString().slice(0, 10),
        unitNav: item.y,
        accumulatedNav: item.y,
        dailyChangeRate: typeof item.equityReturn === 'number' ? item.equityReturn / 100 : undefined,
        dividend: item.unitMoney,
        dataSource: 'eastmoney',
      }));
    } catch {
      return [];
    }
  },

  async fetchFundBasicInfo(fundCode) {
    try {
      const text = await fetchText(`https://fund.eastmoney.com/pingzhongdata/${fundCode}.js?v=${Date.now()}`);
      const fundName = extractStringVariable(text, 'fS_name');
      const code = extractStringVariable(text, 'fS_code') || fundCode;
      if (!fundName) return null;
      return {
        fundCode: code,
        fundName,
        fundType: '',
        fundCompany: '',
        fundManager: '',
        inceptionDate: '',
        fundSize: '',
        riskLevel: '',
        dataSource: 'eastmoney',
        dataStatus: 'partial',
        updatedAt: new Date().toISOString(),
      };
    } catch {
      return null;
    }
  },

  async fetchFundLatestNav(fundCode) {
    const history = await this.fetchFundNavHistory(fundCode, '1m');
    const latest = history.at(-1);
    if (!latest) return null;
    return {
      fundCode,
      fundName: '',
      latestNav: latest.unitNav,
      accumulatedNav: latest.accumulatedNav,
      navDate: latest.date,
      dailyChangeRate: latest.dailyChangeRate,
      dataSource: 'eastmoney',
      dataStatus: 'confirmed',
    } satisfies FundLatestNav;
  },

  async fetchFundHoldings() {
    return [] satisfies UnifiedFundHolding[];
  },

  async fetchFundIndustryAllocation() {
    return [] satisfies IndustryAllocation[];
  },

  async fetchFundRiskMetrics() {
    return null satisfies FundRiskMetrics | null;
  },
};

export async function fetchFundExtendedData(fundCode: string): Promise<FundExtendedData> {
  try {
    const text = await fetchText(`https://fund.eastmoney.com/pingzhongdata/${fundCode}.js?v=${Date.now()}`);

    // 收益率
    const syl1y = normalizeNumber(extractStringVariable(text, 'syl_1y'));
    const syl6y = normalizeNumber(extractStringVariable(text, 'syl_6y'));
    const syl3y = normalizeNumber(extractStringVariable(text, 'syl_3y'));
    const syl1n = normalizeNumber(extractStringVariable(text, 'syl_1n'));

    // 基金经理
    const managerRaw = extractJsonVariable<Array<{
      name: string;
      workTime: string;
      fundSize: string;
      star: number;
      power?: { data?: number[] };
    }>>(text, 'Data_currentFundManager');
    const managers = (managerRaw ?? []).map((m) => ({
      name: m.name,
      workTime: m.workTime,
      fundSize: m.fundSize,
      star: m.star,
      performanceScore: m.power?.data?.length ? Math.round(m.power.data.reduce((s, v) => s + v, 0) / m.power.data.length) : undefined,
    }));

    // 资产配置
    const assetRaw = extractJsonVariable<{
      series: { name: string; data: number[] }[];
      categories: string[];
    }>(text, 'Data_assetAllocation');
    let assetAllocation: FundExtendedData['assetAllocation'];
    if (assetRaw?.series?.length && assetRaw.categories?.length) {
      const lastIdx = assetRaw.categories.length - 1;
      const stock = assetRaw.series.find((s) => s.name.includes('股票'));
      const bond = assetRaw.series.find((s) => s.name.includes('债券'));
      const cash = assetRaw.series.find((s) => s.name.includes('现金'));
      const nav = assetRaw.series.find((s) => s.name.includes('净资产'));
      assetAllocation = {
        stockRatio: stock?.data?.[lastIdx] ?? 0,
        bondRatio: bond?.data?.[lastIdx] ?? 0,
        cashRatio: cash?.data?.[lastIdx] ?? 0,
        navSize: nav?.data?.[lastIdx],
        date: assetRaw.categories[lastIdx] ?? '',
      };
    }

    // 持有人结构
    const holderRaw = extractJsonVariable<{
      series: { name: string; data: number[] }[];
      categories: string[];
    }>(text, 'Data_holderStructure');
    let holderStructure: FundExtendedData['holderStructure'];
    if (holderRaw?.series?.length && holderRaw.categories?.length) {
      const lastIdx = holderRaw.categories.length - 1;
      const inst = holderRaw.series.find((s) => s.name.includes('机构'));
      const indiv = holderRaw.series.find((s) => s.name.includes('个人'));
      const intern = holderRaw.series.find((s) => s.name.includes('内部'));
      holderStructure = {
        institutional: inst?.data?.[lastIdx] ?? 0,
        individual: indiv?.data?.[lastIdx] ?? 0,
        internal: intern?.data?.[lastIdx] ?? 0,
        date: holderRaw.categories[lastIdx] ?? '',
      };
    }

    // 综合评价
    const evalRaw = extractJsonVariable<{
      averageScore?: string | number;
      categories?: string[];
      data?: number[];
    }>(text, 'Data_performanceEvaluation');
    let performanceEvaluation: FundExtendedData['performanceEvaluation'];
    if (evalRaw?.categories?.length && evalRaw.data?.length) {
      performanceEvaluation = {
        averageScore: Number(evalRaw.averageScore ?? 0),
        dimensions: evalRaw.categories.map((cat, i) => ({
          name: cat ?? `维度${i + 1}`,
          score: evalRaw.data?.[i] ?? 0,
        })),
      };
    }

    // 股票仓位（最新值）
    const positionsRaw = extractJsonVariable<[number, number][]>(text, 'Data_fundSharesPositions');
    const stockPosition = positionsRaw?.length ? positionsRaw[positionsRaw.length - 1]?.[1] : undefined;

    // 走势数据（NAV历史）
    const trendRaw = extractJsonVariable<Array<{ x: number; y: number }>>(text, 'Data_netWorthTrend');
    const trendData = trendRaw?.map(item => ({
      date: new Date(item.x).toISOString().slice(0, 10),
      nav: item.y,
    })) ?? [];

    return {
      managers,
      assetAllocation,
      returnRates: { return1y: syl1y, return6y: syl6y, return3y: syl3y, return1n: syl1n },
      holderStructure,
      performanceEvaluation,
      stockPosition,
      trendData,
    };
  } catch {
    return { managers: [] };
  }
}

export const eastmoneyParsing = {
  extractJsonVariable,
  extractStringVariable,
};
