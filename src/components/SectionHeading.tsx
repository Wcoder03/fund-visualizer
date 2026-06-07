interface SectionHeadingProps {
  title: string;
}

export default function SectionHeading({ title }: SectionHeadingProps) {
  return (
    <h2 className="text-[28px] font-bold leading-9 text-slate-900" style={{ letterSpacing: '-0.02em' }}>{title}</h2>
  );
}
