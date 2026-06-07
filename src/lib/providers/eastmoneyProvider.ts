import { getMarketStatus } from '../marketStatus';
import { normalizeNumber, normalizeRatePercent } from '../fundDataNormalizer';
import type {
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
        fundType: '暂无数据',
        fundCompany: '暂无数据',
        fundManager: '暂无数据',
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

export const eastmoneyParsing = {
  extractJsonVariable,
  extractStringVariable,
};
