import { useEffect, useMemo, useState } from 'react';
import { calculateHoldingDays } from '../lib/portfolioCalculator';
import type { PortfolioHolding } from '../types/portfolio';

interface FundOption {
  code: string;
  name: string;
}

interface HoldingFormProps {
  fundPool?: FundOption[];
  onSave: (holding: PortfolioHolding) => void;
  editingHolding?: PortfolioHolding | null;
  onCancelEdit?: () => void;
}

function normalizeFundCode(value: string): string {
  return value.trim().replace(/\s+/g, '').toUpperCase();
}

export default function HoldingForm({ fundPool = [], onSave, editingHolding, onCancelEdit }: HoldingFormProps) {
  const [fundCode, setFundCode] = useState('');
  const [holdingAmount, setHoldingAmount] = useState('');
  const [holdingProfit, setHoldingProfit] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!editingHolding) {
      queueMicrotask(() => {
        setFundCode('');
        setHoldingAmount('');
        setHoldingProfit('');
        setSubmitted(false);
      });
      return;
    }

    queueMicrotask(() => {
      setFundCode(editingHolding.fundCode);
      setHoldingAmount(editingHolding.holdingAmount ? String(editingHolding.holdingAmount) : '');
      const inferredProfit = editingHolding.holdingAmount !== undefined ? editingHolding.holdingAmount - editingHolding.costAmount : 0;
      setHoldingProfit(Number.isFinite(inferredProfit) ? String(Number(inferredProfit.toFixed(2))) : '');
      setSubmitted(false);
    });
  }, [editingHolding]);

  const activeFundCode = normalizeFundCode(fundCode);
  const knownFund = fundPool.find((fund) => fund.code === activeFundCode);

  const errors = useMemo(() => {
    const amount = Number(holdingAmount || 0);
    const profit = Number(holdingProfit || 0);
    return {
      fundCode: activeFundCode ? '' : '请输入基金代码',
      holdingAmount: Number.isFinite(amount) && amount > 0 ? '' : '请输入持有金额',
      holdingProfit: holdingProfit === '' || Number.isFinite(profit) ? '' : '请输入有效的持有收益',
    };
  }, [activeFundCode, holdingAmount, holdingProfit]);

  const hasErrors = Object.values(errors).some(Boolean);

  const reset = () => {
    setFundCode('');
    setHoldingAmount('');
    setHoldingProfit('');
    setSubmitted(false);
  };

  const save = (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (hasErrors) return;

    const amount = Number(holdingAmount || 0);
    const profit = Number(holdingProfit || 0);
    const cost = Math.max(0, amount - profit);
    const firstBuyDate = editingHolding?.firstBuyDate || new Date().toISOString().slice(0, 10);
    const now = new Date().toISOString();

    onSave({
      id: editingHolding?.id || `holding-${activeFundCode}-${Date.now()}`,
      fundCode: activeFundCode,
      fundName: knownFund?.name || editingHolding?.fundName || `基金 ${activeFundCode}`,
      holdingAmount: Number(amount.toFixed(2)),
      holdingShares: editingHolding?.holdingShares,
      costAmount: Number(cost.toFixed(2)),
      costNav: editingHolding?.costNav,
      firstBuyDate,
      holdingDays: calculateHoldingDays(firstBuyDate),
      note: editingHolding?.note || (profit !== 0 ? `录入持有收益：${profit.toFixed(2)} 元` : ''),
      dcaPlan: editingHolding?.dcaPlan,
      createdAt: editingHolding?.createdAt || now,
      updatedAt: now,
    });

    reset();
    onCancelEdit?.();
  };

  return (
    <form onSubmit={save} className="ui-card p-5">
      <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">{editingHolding ? 'Edit Holding' : 'Add Holding'}</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950">{editingHolding ? '编辑我的持仓' : '添加我的持仓'}</h2>
        </div>
        {editingHolding && (
          <button type="button" onClick={onCancelEdit} className="ui-button-secondary rounded-xl px-3 py-2 text-sm font-semibold">
            取消编辑
          </button>
        )}
      </div>

      <div className="mt-5 max-w-3xl rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="grid gap-3 border-b border-slate-100 py-3 sm:grid-cols-[120px_minmax(0,1fr)] sm:items-center">
          <span className="text-sm font-semibold text-slate-950">基金代码</span>
          <input aria-label="基金代码" className="field-control w-full rounded-xl px-3 py-2.5 text-sm text-slate-950" inputMode="numeric" placeholder="请输入基金代码，例如 018173" value={fundCode} onChange={(event) => setFundCode(event.target.value)} />
          {submitted && errors.fundCode && <span className="text-xs text-red-600 sm:col-start-2">{errors.fundCode}</span>}
        </label>

        <label className="grid gap-3 border-b border-slate-100 py-3 sm:grid-cols-[120px_minmax(0,1fr)] sm:items-center">
          <span className="text-sm font-semibold text-slate-950">持有金额</span>
          <input aria-label="持有金额" className="field-control w-full rounded-xl px-3 py-2.5 text-sm text-slate-950" type="number" min="0" step="0.01" placeholder="请输入该基金的持有金额" value={holdingAmount} onChange={(event) => setHoldingAmount(event.target.value)} />
          {submitted && errors.holdingAmount && <span className="text-xs text-red-600 sm:col-start-2">{errors.holdingAmount}</span>}
        </label>

        <label className="grid gap-3 py-3 sm:grid-cols-[120px_minmax(0,1fr)] sm:items-center">
          <span className="text-sm font-semibold text-slate-950">持有收益</span>
          <input aria-label="持有收益" className="field-control w-full rounded-xl px-3 py-2.5 text-sm text-slate-950" type="number" step="0.01" placeholder="请输入该基金的持有收益" value={holdingProfit} onChange={(event) => setHoldingProfit(event.target.value)} />
          {submitted && errors.holdingProfit && <span className="text-xs text-red-600 sm:col-start-2">{errors.holdingProfit}</span>}
        </label>
      </div>

      <p className="mt-3 text-xs leading-5 text-slate-500">可添加任意基金代码。成本金额会自动按“持有金额 - 持有收益”计算；份额由最新可用净值估算。</p>

      <div className="mt-5 flex justify-end">
        <button className="ui-button-primary rounded-xl px-5 py-2.5 text-sm font-semibold" type="submit">
          {editingHolding ? '保存修改' : '添加持仓'}
        </button>
      </div>
    </form>
  );
}
