import { Fragment, useMemo, useState } from 'react';
import DataStatusBadge from './DataStatusBadge';
import DcaPlanForm, { type DcaPlanDraft } from './DcaPlanForm';
import NavStatusBadge from './NavStatusBadge';
import PortfolioHoldingDetail from './PortfolioHoldingDetail';
import ProfitLossValue from './ProfitLossValue';
import { calculateNextDcaDate, calculatePortfolioProfitLoss } from '../lib/portfolioCalculator';
import { getDisplayNav } from '../lib/marketStatus';
import { navStatusLabel } from '../lib/navStatusText';
import { formatMoney, formatNav, formatNumber } from '../lib/portfolioFormatters';
import type { DcaFrequency, FundNavSnapshot, PortfolioHolding, PortfolioProfitLoss } from '../types/portfolio';

export type SortField =
  | 'marketValue'
  | 'dailyProfitLoss'
  | 'dailyProfitLossRate'
  | 'totalProfitLoss'
  | 'totalProfitLossRate'
  | 'holdingDays'
  | 'fundName';

export type SortDirection = 'asc' | 'desc';

interface PortfolioHoldingsTableProps {
  holdings: PortfolioHolding[];
  snapshotsByFundCode: Record<string, FundNavSnapshot>;
  errorsByFundCode: Record<string, string>;
  sortField: SortField;
  sortDirection: SortDirection;
  onSortChange: (field: SortField) => void;
  onRetry?: (fundCode: string) => void;
  onEdit: (holding: PortfolioHolding) => void;
  onUpdate: (holding: PortfolioHolding) => void;
  onDelete: (id: string) => void;
}

interface RowModel {
  holding: PortfolioHolding;
  snapshot?: FundNavSnapshot;
  error?: string;
  profit: PortfolioProfitLoss;
  displayNav?: number;
  navDate?: string;
  displayName: string;
}

const columns: Array<{ field?: SortField; label: string; align?: 'left' | 'right' }> = [
  { field: 'fundName', label: '基金', align: 'left' },
  { field: 'marketValue', label: '当前市值' },
  { label: '成本金额' },
  { label: '当前净值' },
  { field: 'dailyProfitLoss', label: '当日收益' },
  { field: 'totalProfitLoss', label: '持有收益' },
  { field: 'holdingDays', label: '持有天数' },
  { label: '数据状态' },
  { label: '定投' },
];

function sortValue(row: RowModel, field: SortField): number | string {
  if (field === 'fundName') return row.displayName;
  if (field === 'holdingDays') return row.profit.holdingDays;
  return row.profit[field] ?? Number.NEGATIVE_INFINITY;
}

function compareRows(a: RowModel, b: RowModel, field: SortField, direction: SortDirection): number {
  const av = sortValue(a, field);
  const bv = sortValue(b, field);
  const modifier = direction === 'asc' ? 1 : -1;
  if (typeof av === 'string' || typeof bv === 'string') return String(av).localeCompare(String(bv), 'zh-CN') * modifier;
  return (av - Number(bv)) * modifier;
}

function dcaSummary(holding: PortfolioHolding): string {
  const plan = holding.dcaPlan;
  if (!plan?.enabled) return '未启用';
  const frequency = plan.frequency === 'daily' ? '每日' : plan.frequency === 'weekly' ? '每周' : plan.frequency === 'biweekly' ? '双周' : '每月';
  return `${frequency} ${formatMoney(plan.amount)} 元`;
}

function toDcaDraft(holding: PortfolioHolding): DcaPlanDraft {
  const plan = holding.dcaPlan;
  return {
    enabled: Boolean(plan?.enabled),
    amount: plan?.amount ? String(plan.amount) : '',
    frequency: plan?.frequency || 'daily',
    investDay: plan?.investDay ? String(plan.investDay) : '1',
    startDate: plan?.startDate || new Date().toISOString().slice(0, 10),
    endDate: plan?.endDate || '',
  };
}

function DcaInlineEditor({
  holding,
  value,
  onChange,
  onCancel,
  onSave,
}: {
  holding: PortfolioHolding;
  value: DcaPlanDraft;
  onChange: (value: DcaPlanDraft) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <div className="border-t border-slate-200 bg-blue-50/40 px-5 py-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-950">定投设置</p>
          <p className="mt-1 text-xs text-slate-500">{holding.fundCode} · {holding.fundName}</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onCancel} className="ui-button-secondary rounded-xl px-3 py-2 text-xs font-semibold">取消</button>
          <button type="button" onClick={onSave} className="ui-button-primary rounded-xl px-3 py-2 text-xs font-semibold">保存定投</button>
        </div>
      </div>
      <DcaPlanForm value={value} onChange={onChange} />
    </div>
  );
}

export default function PortfolioHoldingsTable({
  holdings,
  snapshotsByFundCode,
  errorsByFundCode,
  sortField,
  sortDirection,
  onSortChange,
  onRetry,
  onEdit,
  onUpdate,
  onDelete,
}: PortfolioHoldingsTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingDcaId, setEditingDcaId] = useState<string | null>(null);
  const [dcaDraft, setDcaDraft] = useState<DcaPlanDraft | null>(null);

  const rows = useMemo<RowModel[]>(() => {
    return holdings.map((holding) => {
      const snapshot = snapshotsByFundCode[holding.fundCode];
      const profit = calculatePortfolioProfitLoss(holding, snapshot);
      return {
        holding,
        snapshot,
        error: errorsByFundCode[holding.fundCode],
        profit,
        displayNav: getDisplayNav(snapshot),
        navDate: snapshot?.navDate || snapshot?.estimatedNavDate,
        displayName: snapshot?.fundName || holding.fundName,
      };
    }).sort((a, b) => compareRows(a, b, sortField, sortDirection));
  }, [errorsByFundCode, holdings, snapshotsByFundCode, sortDirection, sortField]);

  if (holdings.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-blue-200 bg-blue-50/70 p-10 text-center text-sm text-slate-500">
        暂无持仓。添加基金代码、持有金额和持有收益后，即可开始分析。
      </div>
    );
  }

  return (
    <div className="ui-card overflow-hidden rounded-2xl">
      <table className="w-full table-fixed border-collapse text-left">
        <colgroup>
          <col className="w-[23%]" />
          <col className="w-[11%]" />
          <col className="w-[11%]" />
          <col className="w-[12%]" />
          <col className="w-[10%]" />
          <col className="w-[10%]" />
          <col className="w-[8%]" />
          <col className="w-[10%]" />
          <col className="w-[6%]" />
        </colgroup>
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500">
            {columns.map((column) => (
              <th key={column.label} className={`px-2.5 py-3 ${column.align === 'left' ? 'text-left' : 'text-right'}`}>
                {column.field ? (
                  <button type="button" onClick={() => onSortChange(column.field as SortField)} className="inline-flex items-center gap-1 hover:text-blue-700">
                    {column.label}
                    <span className="text-slate-300">{sortField === column.field ? (sortDirection === 'desc' ? '↓' : '↑') : '↕'}</span>
                  </button>
                ) : column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const dailyValue = row.snapshot?.marketStatus === 'nav_confirmed' ? row.profit.confirmedDailyProfitLoss : row.profit.dailyProfitLoss;
            const dailyRate = row.snapshot?.marketStatus === 'nav_confirmed' ? row.profit.confirmedDailyProfitLossRate : row.profit.dailyProfitLossRate;
            const isExpanded = expandedId === row.holding.id;
            const isEditingDca = editingDcaId === row.holding.id && dcaDraft;

            const openDcaEditor = () => {
              setExpandedId(null);
              setEditingDcaId(row.holding.id);
              setDcaDraft(toDcaDraft(row.holding));
            };

            const saveDca = () => {
              if (!dcaDraft) return;
              const amount = Number(dcaDraft.amount || 0);
              const investDay = Number(dcaDraft.investDay || 1);
              const startDate = dcaDraft.startDate || new Date().toISOString().slice(0, 10);
              onUpdate({
                ...row.holding,
                dcaPlan: dcaDraft.enabled ? {
                  enabled: true,
                  amount: Math.max(0, amount),
                  frequency: dcaDraft.frequency as DcaFrequency,
                  investDay,
                  startDate,
                  endDate: dcaDraft.endDate || undefined,
                  nextInvestDate: calculateNextDcaDate({
                    frequency: dcaDraft.frequency as DcaFrequency,
                    investDay,
                    startDate,
                    endDate: dcaDraft.endDate || undefined,
                    status: 'active',
                  }),
                  status: 'active',
                  totalInvestedAmount: row.holding.dcaPlan?.totalInvestedAmount || 0,
                  estimatedNextShares: row.holding.dcaPlan?.estimatedNextShares || 0,
                } : undefined,
                updatedAt: new Date().toISOString(),
              });
              setEditingDcaId(null);
              setDcaDraft(null);
            };

            return (
              <Fragment key={row.holding.id}>
                <tr className="border-b border-slate-100 transition-colors hover:bg-blue-50/35">
                  <td className="px-2.5 py-4 align-top">
                    <p className="truncate text-sm font-semibold text-slate-950">{row.displayName}</p>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500">
                      <span>{row.holding.fundCode}</span>
                      {row.profit.sharesEstimated && <span className="text-orange-600">份额估算</span>}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-slate-400">
                      <button type="button" onClick={() => setExpandedId(isExpanded ? null : row.holding.id)} className="hover:text-blue-700 hover:underline">详情</button>
                      <button type="button" onClick={() => onEdit(row.holding)} className="hover:text-blue-700 hover:underline">编辑</button>
                      <button type="button" onClick={() => onDelete(row.holding.id)} className="hover:text-red-600 hover:underline">删除</button>
                    </div>
                  </td>
                  <td className="px-2.5 py-4 text-right align-top">
                    <p className="font-mono text-sm font-semibold text-slate-950">{formatMoney(row.profit.marketValue)}</p>
                    <p className="mt-1 text-xs text-slate-500">份额 {formatNumber(row.profit.calculatedHoldingShares, 4)}</p>
                  </td>
                  <td className="px-2.5 py-4 text-right align-top">
                    <p className="font-mono text-sm font-semibold text-slate-950">{formatMoney(row.profit.costAmount)}</p>
                    <p className="mt-1 text-xs text-slate-500">成本净值 {formatNav(row.profit.inferredCostNav)}</p>
                  </td>
                  <td className="px-2.5 py-4 text-right align-top">
                    <p className="font-mono text-sm font-semibold text-slate-950">{formatNav(row.displayNav)}</p>
                    <p className="mt-1 text-xs text-slate-500">{row.navDate || '--'} · {navStatusLabel(row.snapshot?.marketStatus)}</p>
                  </td>
                  <td className="px-2.5 py-4 text-right align-top">
                    <p className="font-mono text-sm font-semibold"><ProfitLossValue value={dailyValue} type="money" /></p>
                    <p className="mt-1 text-xs"><ProfitLossValue value={dailyRate} type="rate" /></p>
                  </td>
                  <td className="px-2.5 py-4 text-right align-top">
                    <p className="font-mono text-sm font-semibold"><ProfitLossValue value={row.profit.totalProfitLoss} type="money" /></p>
                    <p className="mt-1 text-xs"><ProfitLossValue value={row.profit.totalProfitLossRate} type="rate" /></p>
                  </td>
                  <td className="px-2.5 py-4 text-right align-top font-mono text-sm text-slate-600">{row.profit.holdingDays}</td>
                  <td className="px-2.5 py-4 text-right align-top">
                    <div className="flex flex-col items-end gap-1">
                      <NavStatusBadge status={row.snapshot?.marketStatus} />
                      <DataStatusBadge snapshot={row.snapshot} error={row.error} />
                      {row.error && <button type="button" onClick={() => onRetry?.(row.holding.fundCode)} className="text-xs text-blue-700 underline-offset-2 hover:underline">重试</button>}
                    </div>
                  </td>
                  <td className="px-2.5 py-4 text-right align-top text-xs text-slate-600">
                    <p>{dcaSummary(row.holding)}</p>
                    <button type="button" onClick={openDcaEditor} className="mt-1 text-[11px] text-slate-400 hover:text-blue-700 hover:underline">
                      {row.holding.dcaPlan?.enabled ? '编辑' : '设置'}
                    </button>
                  </td>
                </tr>
                {isEditingDca && (
                  <tr>
                    <td colSpan={columns.length} className="p-0">
                      <DcaInlineEditor
                        holding={row.holding}
                        value={dcaDraft}
                        onChange={setDcaDraft}
                        onCancel={() => {
                          setEditingDcaId(null);
                          setDcaDraft(null);
                        }}
                        onSave={saveDca}
                      />
                    </td>
                  </tr>
                )}
                {isExpanded && (
                  <tr>
                    <td colSpan={columns.length} className="p-0">
                      <PortfolioHoldingDetail holding={row.holding} snapshot={row.snapshot} error={row.error} />
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
