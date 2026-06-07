import { useMemo, useState } from 'react';
import type { FundInput } from '../types/fundAnalysis';

interface FundInputFormProps {
  onAnalyze: (funds: FundInput[]) => void;
  analyzing?: boolean;
}

const defaultFunds: FundInput[] = [
  { id: 'fund-1', code: '018173', name: '华泰柏瑞中证电力ETF联接C' },
  { id: 'fund-2', code: '008254', name: '华宝致远混合(QDII)C' },
  { id: 'fund-3', code: '270042', name: '广发纳斯达克100ETF联接人民币(QDII)A' },
];

function createEmptyFund(index: number): FundInput {
  return { id: `fund-${Date.now()}-${index}`, code: '', name: '' };
}

export default function FundInputForm({ onAnalyze, analyzing = false }: FundInputFormProps) {
  const [funds, setFunds] = useState<FundInput[]>(defaultFunds);
  const [submitted, setSubmitted] = useState(false);

  const errors = useMemo(() => {
    return funds.map((fund) => ({
      code: fund.code.trim() ? '' : '请输入基金代码',
      name: fund.name.trim() ? '' : '请输入基金名称',
    }));
  }, [funds]);

  const hasErrors = errors.some((error) => error.code || error.name);

  const updateFund = (id: string, key: 'code' | 'name', value: string) => {
    setFunds((current) => current.map((fund) => (fund.id === id ? { ...fund, [key]: value } : fund)));
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (hasErrors) return;
    onAnalyze(funds.map((fund) => ({ ...fund, code: fund.code.trim(), name: fund.name.trim() })));
  };

  return (
    <form onSubmit={submit} className="ui-card p-4 sm:p-5">
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">Input Basket</p>
          <h2 className="mt-1 text-lg font-semibold text-slate-950">基金输入篮</h2>
          <p className="mt-1 text-sm text-slate-500">输入基金代码和名称后进入完整研究流程。</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setFunds((current) => [...current, createEmptyFund(current.length + 1)])} className="ui-button-secondary rounded-xl px-3 py-2 text-sm font-semibold">
            新增
          </button>
          <button type="button" onClick={() => { setSubmitted(false); setFunds([createEmptyFund(1), createEmptyFund(2), createEmptyFund(3)]); }} className="ui-button-secondary rounded-xl px-3 py-2 text-sm font-semibold">
            清空
          </button>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {funds.map((fund, index) => (
          <div key={fund.id} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-3 sm:grid-cols-[170px_minmax(0,1fr)_42px]">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">基金代码</label>
              <input value={fund.code} onChange={(event) => updateFund(fund.id, 'code', event.target.value)} placeholder="例如 018173" className="field-control w-full rounded-xl px-3 py-2 font-mono text-sm text-slate-950" />
              {submitted && errors[index]?.code && <p className="mt-1 text-xs text-red-600">{errors[index].code}</p>}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">基金名称</label>
              <input value={fund.name} onChange={(event) => updateFund(fund.id, 'name', event.target.value)} placeholder="例如 华泰柏瑞中证电力ETF联接C" className="field-control w-full rounded-xl px-3 py-2 text-sm text-slate-950" />
              {submitted && errors[index]?.name && <p className="mt-1 text-xs text-red-600">{errors[index].name}</p>}
            </div>
            <button
              type="button"
              onClick={() => setFunds((current) => (current.length <= 1 ? current : current.filter((item) => item.id !== fund.id)))}
              disabled={funds.length <= 1}
              title="删除基金"
              className="mt-5 h-9 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              x
            </button>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-500">当前版本使用本地分析数据，不调用真实外部基金 API。</p>
        <button type="submit" disabled={analyzing} className="ui-button-primary rounded-xl px-5 py-2.5 text-sm font-semibold disabled:cursor-wait disabled:opacity-70">
          {analyzing ? '分析中...' : '开始分析'}
        </button>
      </div>
    </form>
  );
}
