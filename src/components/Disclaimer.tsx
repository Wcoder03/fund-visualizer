import { DISCLAIMER_TEXT } from '../lib/compliance';

export default function Disclaimer() {
  return (
    <section className="rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-sm text-slate-600">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-3">
        <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
          !
        </span>
        <div>
          <p className="font-semibold text-slate-950">风险提示</p>
          <p className="mt-1 leading-6">{DISCLAIMER_TEXT}</p>
        </div>
      </div>
    </section>
  );
}
