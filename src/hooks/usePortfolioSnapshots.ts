import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getMockNavSnapshot } from '../lib/mockNavSnapshots';
import type { FundNavSnapshot, MarketStatus, PortfolioHolding } from '../types/portfolio';

interface SnapshotState {
  snapshotsByFundCode: Record<string, FundNavSnapshot>;
  loading: boolean;
  errorsByFundCode: Record<string, string>;
  lastUpdatedAt: string | null;
  refresh: (codes?: string[]) => Promise<void>;
}

async function fetchSnapshot(fundCode: string, signal: AbortSignal): Promise<FundNavSnapshot> {
  try {
    const response = await fetch(`/api/funds/${fundCode}/snapshot`, { signal });
    if (!response.ok) throw new Error(`获取 ${fundCode} 净值失败`);
    const snapshot = (await response.json()) as FundNavSnapshot;
    if (snapshot.dataStatus === 'error') {
      throw new Error(snapshot.message || `基金 ${fundCode} 的净值数据暂不可用`);
    }
    return snapshot;
  } catch (error) {
    if (signal.aborted) throw error;
    const fallback = getMockNavSnapshot(fundCode);
    if (fallback) {
      return {
        ...fallback,
        dataSource: 'mock',
        dataStatus: 'fallback',
        updatedAt: new Date().toISOString(),
        message: 'API snapshot 获取失败，已切换到本地 mock fallback',
      };
    }
    throw error;
  }
}

export function usePortfolioSnapshots(holdings: PortfolioHolding[]): SnapshotState {
  const uniqueCodes = useMemo(() => Array.from(new Set(holdings.map((holding) => holding.fundCode))).filter(Boolean), [holdings]);
  const [snapshotsByFundCode, setSnapshotsByFundCode] = useState<Record<string, FundNavSnapshot>>({});
  const [errorsByFundCode, setErrorsByFundCode] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const refresh = useCallback(async (codes?: string[]) => {
    const targetCodes = codes && codes.length > 0 ? Array.from(new Set(codes)) : uniqueCodes;
    if (targetCodes.length === 0) return;

    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setLoading(true);

    const results = await Promise.allSettled(targetCodes.map((code) => fetchSnapshot(code, controller.signal).then((snapshot) => [code, snapshot] as const)));
    if (controller.signal.aborted) return;

    setSnapshotsByFundCode((current) => {
      const next = { ...current };
      for (const result of results) {
        if (result.status === 'fulfilled') next[result.value[0]] = result.value[1];
      }
      return next;
    });
    setErrorsByFundCode((current) => {
      const next = { ...current };
      results.forEach((result, index) => {
        const code = targetCodes[index];
        if (result.status === 'fulfilled') delete next[code];
        else next[code] = result.reason instanceof Error ? result.reason.message : 'snapshot 获取失败';
      });
      return next;
    });
    setLastUpdatedAt(new Date().toLocaleString('zh-CN'));
    setLoading(false);
  }, [uniqueCodes]);

  useEffect(() => {
    queueMicrotask(() => {
      void refresh();
    });
    return () => controllerRef.current?.abort();
  }, [refresh]);

  const marketStatusesRef = useRef<MarketStatus[]>([]);
  useEffect(() => {
    const statuses = Object.values(snapshotsByFundCode).map((snapshot) => snapshot.marketStatus);
    const prev = marketStatusesRef.current;
    const changed = statuses.length !== prev.length || statuses.some((s, i) => s !== prev[i]);
    if (!changed) return undefined;
    marketStatusesRef.current = statuses;

    const delay = statuses.includes('trading') ? 60_000 : statuses.includes('closed_pending_nav') ? 300_000 : null;
    if (!delay) return undefined;
    const timer = window.setInterval(() => {
      void refresh();
    }, delay);
    return () => window.clearInterval(timer);
  }, [refresh, snapshotsByFundCode]);

  return { snapshotsByFundCode, loading, errorsByFundCode, lastUpdatedAt, refresh };
}
