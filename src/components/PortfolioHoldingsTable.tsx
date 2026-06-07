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

const columns: Array<{ field?: SortField; label: string; align?: 'left' | 'right' | 'center' }> = [
  { field: 'fundName', label: '基金', align: 'left' },
  { field: 'marketValue', label: '当前市值', align: 'right' },
  { label: '成本金额', align: 'right' },
  { label: '当前净值', align: 'right' },
  { field: 'dailyProfitLoss', label: '当日收益', align: 'right' },
  { field: 'totalProfitLoss', label: '持有收益', align: 'right' },
  { field: 'holdingDays', label: '持有天数', align: 'center' },
  { label: '数据状态', align: 'center' },
  { label: '定投', align: 'center' },
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
          <p className="text-[14px] font-semibold text-slate-900">定投设置</p>
          <p className="mt-0.5 text-[12px] text-slate-400">{holding.fundCode} · {holding.fundName}</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onCancel} className="ui-button-secondary rounded-lg px-3 py-1.5 text-[12px] font-medium">取消</button>
          <button type="button" onClick={onSave} className="ui-button-primary rounded-lg px-3 py-1.5 text-[12px] font-medium">保存定投</button>
        </div>
      </div>
      <DcaPlanForm value={value} onChange={onChange} />
    </div>
  );
}

interface EditFormState {
  holdingAmount: string;
  holdingProfit: string;
}

function EditInlineEditor({
  holding,
  displayName,
  form,
  error,
  onChange,
  onCancel,
  onSave,
}: {
  holding: PortfolioHolding;
  displayName: string;
  form: EditFormState;
  error: string;
  onChange: (form: EditFormState) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <div className="border-t border-slate-200/80 bg-[#f8fafc] px-4 py-3.5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-6">
        {/* Left: fund info */}
        <div className="min-w-0 shrink-0 lg:w-[200px]">
          <p className="text-[14px] font-semibold text-slate-900 truncate">{displayName}</p>
          <p className="mt-0.5 text-[12px] text-slate-400">{holding.fundCode}</p>
        </div>

        {/* Middle: form fields */}
        <div className="flex flex-1 flex-wrap items-end gap-3">
          <label className="text-[12px] font-medium text-slate-500">
            持有金额
            <input
              type="number"
              step="0.01"
              value={form.holdingAmount}
              onChange={(e) => onChange({ ...form, holdingAmount: e.target.value })}
              className="field-control mt-1 block w-[140px] rounded-lg px-3 py-1.5 text-[13px] text-slate-800"
            />
          </label>
          <label className="text-[12px] font-medium text-slate-500">
            持有收益
            <input
              type="number"
              step="0.01"
              value={form.holdingProfit}
              onChange={(e) => onChange({ ...form, holdingProfit: e.target.value })}
              className="field-control mt-1 block w-[140px] rounded-lg px-3 py-1.5 text-[13px] text-slate-800"
            />
          </label>
          <p className="text-[11px] text-slate-400 self-end pb-1.5">成本 = 持有金额 - 持有收益 · 份额按最新净值估算</p>
        </div>

        {/* Right: actions */}
        <div className="flex shrink-0 gap-2">
          <button type="button" onClick={onCancel} className="ui-button-secondary rounded-lg px-3.5 py-1.5 text-[12px] font-medium">取消</button>
          <button type="button" onClick={onSave} className="ui-button-primary rounded-lg px-3.5 py-1.5 text-[12px] font-medium">保存修改</button>
        </div>
      </div>
      {error && <p className="mt-2 text-[12px] text-red-500">{error}</p>}
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
  onUpdate,
  onDelete,
}: PortfolioHoldingsTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingDcaId, setEditingDcaId] = useState<string | null>(null);
  const [dcaDraft, setDcaDraft] = useState<DcaPlanDraft | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditFormState>({ holdingAmount: '', holdingProfit: '' });
  const [editError, setEditError] = useState('');

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
      <div className="ui-card p-10 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
          <svg className="h-6 w-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
          </svg>
        </div>
        <p className="mt-3 text-[14px] font-medium text-slate-500">暂无持仓</p>
        <p className="mt-1 text-[12px] text-slate-400">添加基金代码、持有金额和持有收益后，即可开始分析</p>
      </div>
    );
  }

  return (
    <div className="ui-card overflow-x-auto">
      <table className="w-full border-collapse text-left">
        <colgroup>
          <col style={{ width: '20%' }} />
          <col style={{ width: '12%' }} />
          <col style={{ width: '12%' }} />
          <col style={{ width: '11%' }} />
          <col style={{ width: '11%' }} />
          <col style={{ width: '12%' }} />
          <col style={{ width: '8%' }} />
          <col style={{ width: '9%' }} />
          <col style={{ width: '5%' }} />
        </colgroup>
        <thead>
          <tr className="border-b border-slate-200/80 bg-[#f8fafc]">
            {columns.map((column) => (
              <th key={column.label} className={`whitespace-nowrap px-3 py-2.5 text-[13px] font-semibold text-slate-500 leading-5 ${column.align === 'left' ? 'text-left' : column.align === 'center' ? 'text-center' : 'text-right'}`}>
                {column.field ? (
                  <button type="button" onClick={() => onSortChange(column.field as SortField)} className="inline-flex items-center gap-1 hover:text-blue-600 transition-colors">
                    {column.label}
                    <span className="text-slate-300 text-[11px]">{sortField === column.field ? (sortDirection === 'desc' ? '↓' : '↑') : '↕'}</span>
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
            const isEditing = editingId === row.holding.id;

            const openDcaEditor = () => {
              setExpandedId(null);
              setEditingId(null);
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

            const openEdit = () => {
              if (isEditing) {
                setEditingId(null);
                setEditError('');
                return;
              }
              setExpandedId(null);
              setEditingDcaId(null);
              setDcaDraft(null);
              setEditingId(row.holding.id);
              setEditForm({
                holdingAmount: row.holding.holdingAmount !== undefined ? String(row.holding.holdingAmount) : '',
                holdingProfit: row.holding.holdingAmount !== undefined ? String(Number((row.holding.holdingAmount - row.holding.costAmount).toFixed(2))) : '',
              });
              setEditError('');
            };

            const saveEdit = () => {
              const amount = Number(editForm.holdingAmount);
              const profit = Number(editForm.holdingProfit);
              if (!Number.isFinite(amount) || amount <= 0) {
                setEditError('请输入有效的持有金额');
                return;
              }
              if (!Number.isFinite(profit)) {
                setEditError('请输入有效的持有收益');
                return;
              }
              const cost = Math.max(0, Number((amount - profit).toFixed(2)));
              onUpdate({
                ...row.holding,
                holdingAmount: Number(amount.toFixed(2)),
                costAmount: cost,
                note: profit !== 0 ? `持有收益：${profit.toFixed(2)} 元` : row.holding.note,
                updatedAt: new Date().toISOString(),
              });
              setEditingId(null);
              setEditError('');
            };

            return (
              <Fragment key={row.holding.id}>
                <tr className="border-b border-slate-100/80 transition-colors hover:bg-[#f8fafc]">
                  {/* 基金 */}
                  <td className="px-3 py-3 align-middle">
                    <p className="truncate text-[15px] font-semibold text-slate-900 leading-[22px]">{row.displayName}</p>
                    <div className="mt-0.5 flex items-center gap-2">
                      <span className="whitespace-nowrap text-[13px] text-slate-400 font-medium">{row.holding.fundCode}</span>
                      {row.profit.sharesEstimated && <span className="whitespace-nowrap rounded-full bg-orange-50 px-2 py-0.5 text-[11px] font-medium text-orange-600 ring-1 ring-orange-200/60">份额估算</span>}
                    </div>
                    <div className="mt-1 flex gap-2 text-[13px] text-slate-400">
                      <button type="button" onClick={() => { setExpandedId(isExpanded ? null : row.holding.id); setEditingId(null); }} className={`whitespace-nowrap font-medium transition-colors ${isExpanded ? 'text-blue-600' : 'hover:text-blue-600'}`}>详情</button>
                      <button type="button" onClick={openEdit} className={`whitespace-nowrap font-medium transition-colors ${isEditing ? 'text-blue-600' : 'hover:text-blue-600'}`}>编辑</button>
                      <button type="button" onClick={() => onDelete(row.holding.id)} className="whitespace-nowrap font-medium hover:text-red-500 transition-colors">删除</button>
                    </div>
                  </td>
                  {/* 当前市值 */}
                  <td className="px-3 py-3 text-right align-middle">
                    <div className="flex flex-col gap-[3px]">
                      <span className="whitespace-nowrap text-[15px] font-bold text-slate-900 leading-5 tabular-nums">{formatMoney(row.profit.marketValue)}</span>
                      <span className="whitespace-nowrap text-[12px] text-slate-400 leading-4">份额 {formatNumber(row.profit.calculatedHoldingShares, 2)}</span>
                    </div>
                  </td>
                  {/* 成本金额 */}
                  <td className="px-3 py-3 text-right align-middle">
                    <div className="flex flex-col gap-[3px]">
                      <span className="whitespace-nowrap text-[15px] font-bold text-slate-900 leading-5 tabular-nums">{formatMoney(row.profit.costAmount)}</span>
                      <span className="whitespace-nowrap text-[12px] text-slate-400 leading-4">成本净值 {formatNumber(row.profit.inferredCostNav, 2)}</span>
                    </div>
                  </td>
                  {/* 当前净值 */}
                  <td className="px-3 py-3 text-right align-middle">
                    <div className="flex flex-col gap-[3px]">
                      <span className="whitespace-nowrap text-[15px] font-bold text-slate-900 leading-5 tabular-nums">{formatNav(row.displayNav)}</span>
                      <span className="whitespace-nowrap text-[12px] text-slate-400 leading-4">{row.navDate || '--'}</span>
                    </div>
                  </td>
                  {/* 当日收益 */}
                  <td className="px-3 py-3 text-right align-middle">
                    <div className="flex flex-col gap-[3px]">
                      <span className="whitespace-nowrap text-[15px] font-bold leading-5 tabular-nums"><ProfitLossValue value={dailyValue} type="money" /></span>
                      <span className="whitespace-nowrap text-[12px] leading-4"><ProfitLossValue value={dailyRate} type="rate" /></span>
                    </div>
                  </td>
                  {/* 持有收益 */}
                  <td className="px-3 py-3 text-right align-middle">
                    <div className="flex flex-col gap-[3px]">
                      <span className="whitespace-nowrap text-[15px] font-bold leading-5 tabular-nums"><ProfitLossValue value={row.profit.totalProfitLoss} type="money" /></span>
                      <span className="whitespace-nowrap text-[12px] leading-4"><ProfitLossValue value={row.profit.totalProfitLossRate} type="rate" /></span>
                    </div>
                  </td>
                  {/* 持有天数 */}
                  <td className="whitespace-nowrap px-3 py-3 text-center align-middle text-[14px] font-medium text-slate-600 tabular-nums">{row.profit.holdingDays}</td>
                  {/* 数据状态 */}
                  <td className="px-3 py-3 align-middle">
                    <div className="flex flex-col items-center gap-[3px]">
                      <NavStatusBadge status={row.snapshot?.marketStatus} />
                      <DataStatusBadge snapshot={row.snapshot} error={row.error} />
                      {row.error && <button type="button" onClick={() => onRetry?.(row.holding.fundCode)} className="text-[12px] text-blue-600 font-medium hover:text-blue-700 transition-colors">重试</button>}
                    </div>
                  </td>
                  {/* 定投 */}
                  <td className="px-3 py-3 text-center align-middle">
                    <div className="flex flex-col items-center gap-[3px]">
                      <span className="whitespace-nowrap text-[13px] text-slate-500 leading-4">{dcaSummary(row.holding)}</span>
                      <button type="button" onClick={openDcaEditor} className="whitespace-nowrap text-[12px] font-medium text-slate-400 hover:text-blue-600 transition-colors leading-4">
                        {row.holding.dcaPlan?.enabled ? '编辑' : '设置'}
                      </button>
                    </div>
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
                {isEditing && (
                  <tr>
                    <td colSpan={columns.length} className="p-0">
                      <EditInlineEditor
                        holding={row.holding}
                        displayName={row.displayName}
                        form={editForm}
                        error={editError}
                        onChange={setEditForm}
                        onCancel={() => { setEditingId(null); setEditError(''); }}
                        onSave={saveEdit}
                      />
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
