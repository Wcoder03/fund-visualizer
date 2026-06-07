import { useEffect, useMemo, useState } from 'react';
import HoldingForm from './HoldingForm';
import HoldingSummary from './HoldingSummary';
import HoldingToolbar from './HoldingToolbar';
import PortfolioHoldingsTable, { type SortDirection, type SortField } from './PortfolioHoldingsTable';
import type { FundNavSnapshot, PortfolioHolding } from '../types/portfolio';

interface PortfolioHoldingsPageSectionProps {
  holdings: PortfolioHolding[];
  fundPool: { code: string; name: string }[];
  snapshotsByFundCode: Record<string, FundNavSnapshot>;
  errorsByFundCode: Record<string, string>;
  snapshotsLoading: boolean;
  lastUpdatedAt?: string | null;
  onSave: (holding: PortfolioHolding) => void;
  onDelete: (id: string) => void;
  onRefresh: (fundCodes?: string[]) => void;
}

const SORT_STORAGE_KEY = 'fund-visualizer.portfolio.sort.v1';
const validSortFields: SortField[] = ['marketValue', 'dailyProfitLoss', 'dailyProfitLossRate', 'totalProfitLoss', 'totalProfitLossRate', 'holdingDays', 'fundName'];

function loadSort(): { field: SortField; direction: SortDirection } {
  if (typeof window === 'undefined') return { field: 'marketValue', direction: 'desc' };
  try {
    const raw = window.localStorage.getItem(SORT_STORAGE_KEY);
    if (!raw) return { field: 'marketValue', direction: 'desc' };
    const parsed = JSON.parse(raw) as { field?: SortField; direction?: SortDirection };
    return {
      field: parsed.field && validSortFields.includes(parsed.field) ? parsed.field : 'marketValue',
      direction: parsed.direction || 'desc',
    };
  } catch {
    return { field: 'marketValue', direction: 'desc' };
  }
}

export default function PortfolioHoldingsPageSection({
  holdings,
  fundPool,
  snapshotsByFundCode,
  errorsByFundCode,
  snapshotsLoading,
  lastUpdatedAt,
  onSave,
  onDelete,
  onRefresh,
}: PortfolioHoldingsPageSectionProps) {
  const initialSort = useMemo(() => loadSort(), []);
  const [sortField, setSortField] = useState<SortField>(initialSort.field);
  const [sortDirection, setSortDirection] = useState<SortDirection>(initialSort.direction);
  const [formVisible, setFormVisible] = useState(false);

  useEffect(() => {
    window.localStorage.setItem(SORT_STORAGE_KEY, JSON.stringify({ field: sortField, direction: sortDirection }));
  }, [sortDirection, sortField]);

  const hasFallback = Object.values(snapshotsByFundCode).some((snapshot) => snapshot.dataSource === 'mock' || snapshot.dataStatus === 'fallback');

  const changeSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection((current) => (current === 'desc' ? 'asc' : 'desc'));
      return;
    }
    setSortField(field);
    setSortDirection('desc');
  };

  const saveHolding = (holding: PortfolioHolding) => {
    onSave(holding);
    setFormVisible(false);
  };

  return (
    <section className="space-y-5">
      <HoldingSummary holdings={holdings} snapshotsByFundCode={snapshotsByFundCode} lastUpdatedAt={lastUpdatedAt} />

      <HoldingToolbar
        sortField={sortField}
        sortDirection={sortDirection}
        snapshotsLoading={snapshotsLoading}
        lastUpdatedAt={lastUpdatedAt}
        hasFallback={hasFallback}
        onAdd={() => setFormVisible((visible) => !visible)}
        onRefresh={() => onRefresh()}
        onSortChange={changeSort}
      />

      {formVisible && (
        <HoldingForm
          fundPool={fundPool}
          onSave={saveHolding}
          onCancelEdit={() => setFormVisible(false)}
        />
      )}

      <PortfolioHoldingsTable
        holdings={holdings}
        snapshotsByFundCode={snapshotsByFundCode}
        errorsByFundCode={errorsByFundCode}
        sortField={sortField}
        sortDirection={sortDirection}
        onSortChange={changeSort}
        onRetry={(fundCode) => onRefresh([fundCode])}
        onUpdate={onSave}
        onDelete={onDelete}
      />
    </section>
  );
}
