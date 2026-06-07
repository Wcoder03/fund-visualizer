interface SectionHeadingProps {
  eyebrow: string;
  title: string;
}

export default function SectionHeading({ eyebrow, title }: SectionHeadingProps) {
  return (
    <div>
      <p className="text-[14px] font-bold uppercase tracking-[0.18em] text-blue-600 leading-5 mb-2">{eyebrow}</p>
      <h2 className="text-[32px] font-extrabold leading-10 text-slate-900" style={{ letterSpacing: '-0.03em' }}>{title}</h2>
    </div>
  );
}
