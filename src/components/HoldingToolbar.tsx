import type { SortField, SortDirection } from './PortfolioHoldingsTable';

interface HoldingToolbarProps {
  sortField: SortField;
  sortDirection: SortDirection;
  snapshotsLoading: boolean;
  lastUpdatedAt?: string | null;
  hasFallback: boolean;
  onAdd: () => void;
  onRefresh: () => void;
  onSortChange: (field: SortField) => void;
}

const sortOptions: Array<{ value: SortField; label: string }> = [
  { value: 'marketValue', label: '当前市值' },
  { value: 'dailyProfitLoss', label: '当日收益' },
  { value: 'dailyProfitLossRate', label: '当日收益率' },
  { value: 'totalProfitLoss', label: '持有收益' },
  { value: 'totalProfitLossRate', label: '持有收益率' },
  { value: 'holdingDays', label: '持有天数' },
  { value: 'fundName', label: '基金名称' },
];

export default function HoldingToolbar({
  sortField,
  sortDirection,
  snapshotsLoading,
  lastUpdatedAt,
  hasFallback,
  onAdd,
  onRefresh,
  onSortChange,
}: HoldingToolbarProps) {
  return (
    <section className="ui-card p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          <button onClick={onAdd} className="ui-button-primary rounded-xl px-4 py-2 text-sm font-semibold">添加持仓</button>
          <button onClick={onRefresh} disabled={snapshotsLoading} className="ui-button-secondary rounded-xl px-4 py-2 text-sm font-semibold disabled:cursor-wait disabled:opacity-60">
            {snapshotsLoading ? '刷新中...' : '刷新净值'}
          </button>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <span className="text-xs text-slate-500">最后更新：{lastUpdatedAt || '--'}</span>
          <label className="flex items-center gap-2 text-xs font-medium text-slate-500">
            排序
            <select className="field-control rounded-xl px-3 py-2 text-sm font-semibold text-slate-950" value={sortField} onChange={(event) => onSortChange(event.target.value as SortField)}>
              {sortOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <span>{sortDirection === 'desc' ? '降序' : '升序'}</span>
          </label>
        </div>
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-500">
        净值口径：确认净值优先，盘中使用估算净值。非交易日不会触发定投执行，定投计划会顺延到下一个可用交易日。
        {hasFallback && <span className="ml-2 font-semibold text-orange-600">部分数据为演示来源。</span>}
      </p>
    </section>
  );
}
