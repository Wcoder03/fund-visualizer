import type { DcaFrequency } from '../types/portfolio';

export interface DcaPlanDraft {
  enabled: boolean;
  amount: string;
  frequency: DcaFrequency;
  investDay: string;
  startDate: string;
  endDate: string;
}

interface DcaPlanFormProps {
  value: DcaPlanDraft;
  onChange: (value: DcaPlanDraft) => void;
}

export default function DcaPlanForm({ value, onChange }: DcaPlanFormProps) {
  const update = (patch: Partial<DcaPlanDraft>) => onChange({ ...value, ...patch });

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <label className="flex items-center gap-2 text-sm font-semibold text-slate-950">
        <input type="checkbox" checked={value.enabled} onChange={(event) => update({ enabled: event.target.checked })} />
        启用定投计划
      </label>
      {value.enabled && (
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-xs font-medium text-slate-500">
            定投金额
            <input className="field-control mt-1 w-full rounded-xl px-3 py-2 text-sm text-slate-950" type="number" min="0" step="0.01" value={value.amount} onChange={(event) => update({ amount: event.target.value })} />
          </label>
          <label className="text-xs font-medium text-slate-500">
            频率
            <select className="field-control mt-1 w-full rounded-xl px-3 py-2 text-sm text-slate-950" value={value.frequency} onChange={(event) => update({ frequency: event.target.value as DcaFrequency })}>
              <option value="daily">每日</option>
              <option value="weekly">每周</option>
              <option value="biweekly">双周</option>
              <option value="monthly">每月</option>
            </select>
          </label>
          {value.frequency !== 'daily' && (
            <label className="text-xs font-medium text-slate-500">
              定投日
              <input className="field-control mt-1 w-full rounded-xl px-3 py-2 text-sm text-slate-950" type="number" min="1" max={value.frequency === 'monthly' ? 28 : 5} value={value.investDay} onChange={(event) => update({ investDay: event.target.value })} />
            </label>
          )}
          <label className="text-xs font-medium text-slate-500">
            开始日期
            <input className="field-control mt-1 w-full rounded-xl px-3 py-2 text-sm text-slate-950" type="date" value={value.startDate} onChange={(event) => update({ startDate: event.target.value })} />
          </label>
        </div>
      )}
    </div>
  );
}
