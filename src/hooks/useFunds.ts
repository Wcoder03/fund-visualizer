import { useState, useEffect, useCallback } from 'react';
import type { FundData, FundSearchResult } from '../types/fund';
import type { FundNavSnapshot } from '../types/portfolio';

const DEFAULT_SEARCH_KEYWORDS = ['电力', '科技', '混合', '指数', 'QDII'];

function snapshotToFundData(snapshot: FundNavSnapshot): FundData {
  const nav = snapshot.displayNav ?? snapshot.latestConfirmedNav ?? snapshot.currentNav ?? 0;
  const dailyChange = snapshot.dailyChangeRate ?? snapshot.intradayChangeRate ?? 0;

  const name = snapshot.fundName;
  const upper = name.toUpperCase();
  let fundType = '其他';
  if (upper.includes('ETF联接') || upper.includes('ETF')) fundType = '指数型-股票';
  else if (upper.includes('QDII')) fundType = 'QDII';
  else if (upper.includes('混合')) fundType = '混合型';
  else if (upper.includes('股票')) fundType = '股票型';
  else if (upper.includes('债')) fundType = '债券型';
  else if (upper.includes('货币')) fundType = '货币型';

  return {
    basicInfo: {
      code: snapshot.fundCode,
      name,
      company: '',
      manager: '',
      managerTenure: '',
      establishDate: '',
      scale: '',
      type: fundType,
      riskLevel: '中高风险',
    },
    performance: {
      nav,
      return1w: 0,
      return1m: 0,
      return3m: 0,
      return6m: 0,
      return1y: 0,
      returnSinceStart: 0,
      rating: '-',
    },
    trends: [],
    advice: [],
    score: 7.0,
  };
}

async function fetchSnapshot(fundCode: string): Promise<FundNavSnapshot | null> {
  try {
    const resp = await fetch(`/api/funds/${fundCode}/snapshot`);
    if (!resp.ok) return null;
    const snapshot = (await resp.json()) as FundNavSnapshot;
    return snapshot.dataStatus === 'error' ? null : snapshot;
  } catch {
    return null;
  }
}

async function searchFundsFromApi(keyword: string): Promise<FundSearchResult[]> {
  try {
    const resp = await fetch(`/api/funds/search?keyword=${encodeURIComponent(keyword)}`);
    if (!resp.ok) return [];
    const data = (await resp.json()) as { items: FundSearchResult[] };
    return data.items ?? [];
  } catch {
    return [];
  }
}

export interface Conclusions {
  noteworthy: { code: string; name: string; reason: string }[];
  longTerm: { code: string; name: string; position: string }[];
  shortTerm: { code: string; name: string; watch: string }[];
  notRecommended: { code: string; name: string; reason: string }[];
  keyIndicators: { category: string; indicator: string; importance: string }[];
}

const defaultConclusions: Conclusions = {
  noteworthy: [],
  longTerm: [],
  shortTerm: [],
  notRecommended: [],
  keyIndicators: [],
};

export function useFunds() {
  const [funds, setFunds] = useState<FundData[]>([]);
  const [conclusions] = useState<Conclusions>(defaultConclusions);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFunds = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Search for funds using multiple keywords to build a diverse pool
      const searchResults = await Promise.all(
        DEFAULT_SEARCH_KEYWORDS.map((kw) => searchFundsFromApi(kw))
      );
      const allResults = searchResults.flat();
      const seen = new Set<string>();
      const unique = allResults.filter((r) => {
        if (seen.has(r.fundCode)) return false;
        seen.add(r.fundCode);
        return true;
      });

      if (unique.length === 0) {
        setFunds([]);
        setLoading(false);
        return;
      }

      // Fetch snapshots for each fund
      const snapshots = await Promise.all(
        unique.map((r) => fetchSnapshot(r.fundCode))
      );

      const fundDataList: FundData[] = [];
      for (let i = 0; i < unique.length; i++) {
        const snapshot = snapshots[i];
        if (snapshot) {
          fundDataList.push(snapshotToFundData(snapshot));
        }
      }

      setFunds(fundDataList);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载基金数据失败');
    } finally {
      setLoading(false);
    }
  }, []);

  const getFundByCode = useCallback(
    (code: string): FundData | undefined => {
      return funds.find((f) => f.basicInfo.code === code);
    },
    [funds]
  );

  useEffect(() => {
    queueMicrotask(() => {
      void loadFunds();
    });
  }, [loadFunds]);

  return {
    funds,
    conclusions,
    loading,
    error,
    loadFunds,
    getFundByCode,
  };
}
