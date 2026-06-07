import { useEffect, useMemo, useState } from 'react';
import HoldingForm from './HoldingForm';
import HoldingSummary from './HoldingSummary';
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
const sortOptions: Array<{ value: SortField; label: string }> = [
  { value: 'marketValue', label: '当前金额' },
  { value: 'dailyProfitLoss', label: '当日收益' },
  { value: 'dailyProfitLossRate', label: '当日收益率' },
  { value: 'totalProfitLoss', label: '持有收益' },
  { value: 'totalProfitLossRate', label: '持有收益率' },
  { value: 'holdingDays', label: '持有天数' },
  { value: 'fundName', label: '基金名称' },
];

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

      {formVisible && (
        <HoldingForm
          fundPool={fundPool}
          onSave={saveHolding}
          onCancelEdit={() => setFormVisible(false)}
        />
      )}

      {/* Holdings table card with integrated toolbar */}
      <div className="ui-card overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => setFormVisible((v) => !v)} className="ui-button-primary rounded-lg px-3.5 py-[7px] text-[13px] font-medium">添加持仓</button>
            <button onClick={() => onRefresh()} disabled={snapshotsLoading} className="ui-button-secondary rounded-lg px-3.5 py-[7px] text-[13px] font-medium disabled:cursor-wait disabled:opacity-60">
              {snapshotsLoading ? '刷新中...' : '刷新净值'}
            </button>
            <span className="hidden text-[12px] text-slate-400 lg:inline">确认净值优先，盘中使用估算净值</span>
          </div>
          <div className="flex items-center gap-3">
            {lastUpdatedAt && <span className="text-[12px] text-slate-400">{lastUpdatedAt}</span>}
            <label className="flex items-center gap-1.5 text-[12px] font-medium text-slate-400">
              排序
              <select className="field-control rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-slate-700" value={sortField} onChange={(e) => changeSort(e.target.value as SortField)}>
                {sortOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </label>
          </div>
        </div>

        {/* Table */}
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
      </div>
    </section>
  );
}
