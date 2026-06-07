import { useCallback, useEffect, useMemo, useState } from 'react';
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

function normalizeFundCode(value: string): string {
  return value.trim().replace(/\s+/g, '').toUpperCase();
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
  const [addingVisible, setAddingVisible] = useState(false);
  const [addCode, setAddCode] = useState('');
  const [addAmount, setAddAmount] = useState('');
  const [addProfit, setAddProfit] = useState('');
  const [addError, setAddError] = useState('');

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

  const resetAddForm = useCallback(() => {
    setAddCode('');
    setAddAmount('');
    setAddProfit('');
    setAddError('');
  }, []);

  const handleSaveNew = useCallback(() => {
    const code = normalizeFundCode(addCode);
    const amount = Number(addAmount);
    const profit = Number(addProfit);
    if (!code) { setAddError('请输入基金代码'); return; }
    if (!Number.isFinite(amount) || amount <= 0) { setAddError('请输入有效的持有金额'); return; }
    if (addProfit !== '' && !Number.isFinite(profit)) { setAddError('请输入有效的持有收益'); return; }
    const cost = Math.max(0, Number((amount - profit).toFixed(2)));
    const known = fundPool.find((f) => f.code === code);
    onSave({
      id: `holding-${code}-${Date.now()}`,
      fundCode: code,
      fundName: known?.name || `基金 ${code}`,
      holdingAmount: Number(amount.toFixed(2)),
      costAmount: cost,
      firstBuyDate: new Date().toISOString().slice(0, 10),
      holdingDays: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    resetAddForm();
    setAddingVisible(false);
  }, [addCode, addAmount, addProfit, fundPool, onSave, resetAddForm]);

  return (
    <section className="space-y-5">
      <HoldingSummary holdings={holdings} snapshotsByFundCode={snapshotsByFundCode} lastUpdatedAt={lastUpdatedAt} />

      {/* Holdings table card with toolbar + inline add form + table */}
      <div className="ui-card overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => { setAddingVisible((v) => !v); resetAddForm(); }} className="ui-button-primary rounded-lg px-3.5 py-[7px] text-[13px] font-medium">添加持仓</button>
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

        {/* Inline add form */}
        {addingVisible && (
          <div className="flex flex-wrap items-end gap-3 border-b border-slate-100 bg-[#f8fafc] px-5 py-3">
            <label className="text-[12px] font-medium text-slate-500">
              基金代码
              <input
                type="text"
                inputMode="numeric"
                value={addCode}
                onChange={(e) => setAddCode(e.target.value)}
                placeholder="例如 018173"
                className="field-control mt-1 block w-[140px] rounded-lg px-3 py-1.5 text-[13px] text-slate-800"
              />
            </label>
            <label className="text-[12px] font-medium text-slate-500">
              持有金额
              <input
                type="number"
                step="0.01"
                value={addAmount}
                onChange={(e) => setAddAmount(e.target.value)}
                placeholder="金额"
                className="field-control mt-1 block w-[130px] rounded-lg px-3 py-1.5 text-[13px] text-slate-800"
              />
            </label>
            <label className="text-[12px] font-medium text-slate-500">
              持有收益
              <input
                type="number"
                step="0.01"
                value={addProfit}
                onChange={(e) => setAddProfit(e.target.value)}
                placeholder="收益"
                className="field-control mt-1 block w-[130px] rounded-lg px-3 py-1.5 text-[13px] text-slate-800"
              />
            </label>
            <div className="flex gap-2">
              <button type="button" onClick={() => { setAddingVisible(false); resetAddForm(); }} className="ui-button-secondary rounded-lg px-3 py-1.5 text-[12px] font-medium">取消</button>
              <button type="button" onClick={handleSaveNew} className="ui-button-primary rounded-lg px-3 py-1.5 text-[12px] font-medium">保存持仓</button>
            </div>
            {addError && <p className="w-full text-[12px] text-red-500">{addError}</p>}
          </div>
        )}

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
