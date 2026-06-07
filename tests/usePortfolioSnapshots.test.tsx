import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { usePortfolioSnapshots } from '../src/hooks/usePortfolioSnapshots';
import type { FundNavSnapshot, PortfolioHolding } from '../src/types/portfolio';

const holding = (id: string, fundCode: string): PortfolioHolding => ({
  id,
  fundCode,
  fundName: `基金${fundCode}`,
  holdingShares: 100,
  costAmount: 100,
  firstBuyDate: '2026-01-01',
  holdingDays: 1,
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
});

const snapshot = (fundCode: string): FundNavSnapshot => ({
  fundCode,
  fundName: `基金${fundCode}`,
  previousNav: 1,
  latestConfirmedNav: 1.1,
  displayNav: 1.1,
  navDate: '2026-06-05',
  estimatedNavDate: '2026-06-05',
  intradayChangeRate: 0.1,
  marketStatus: 'nav_confirmed',
  dataSource: 'eastmoney',
  dataStatus: 'confirmed',
});

describe('usePortfolioSnapshots', () => {
  it('deduplicates fundCode requests and refreshes', async () => {
    const fetchMock = vi.fn((url: string) => Promise.resolve({ ok: true, json: () => Promise.resolve(snapshot(url.split('/')[3])) }));
    vi.stubGlobal('fetch', fetchMock);
    const holdings = [holding('1', '018173'), holding('2', '018173')];

    const { result } = renderHook(() => usePortfolioSnapshots(holdings));
    await waitFor(() => expect(result.current.snapshotsByFundCode['018173']).toBeTruthy());
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.refresh(['018173']);
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    vi.unstubAllGlobals();
  });

  it('keeps successful snapshots when one fund fails', async () => {
    const fetchMock = vi.fn((url: string) => {
      const code = url.split('/')[3];
      if (code === 'FAIL') return Promise.resolve({ ok: false });
      return Promise.resolve({ ok: true, json: () => Promise.resolve(snapshot(code)) });
    });
    vi.stubGlobal('fetch', fetchMock);
    const holdings = [holding('1', '018173'), holding('2', 'FAIL')];

    const { result } = renderHook(() => usePortfolioSnapshots(holdings));
    await waitFor(() => expect(result.current.errorsByFundCode.FAIL).toBeTruthy());
    expect(result.current.snapshotsByFundCode['018173']).toBeTruthy();
    vi.unstubAllGlobals();
  });

  it('records error when API fails for known fund', async () => {
    const fetchMock = vi.fn(() => Promise.resolve({ ok: false }));
    vi.stubGlobal('fetch', fetchMock);
    const holdings = [holding('1', '018173')];

    const { result } = renderHook(() => usePortfolioSnapshots(holdings));
    await waitFor(() => expect(result.current.errorsByFundCode['018173']).toBeTruthy());
    expect(result.current.snapshotsByFundCode['018173']).toBeUndefined();
    vi.unstubAllGlobals();
  });
});
