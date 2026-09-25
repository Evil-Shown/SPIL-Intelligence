import type { ReactNode } from 'react';

interface SectionProps {
  kicker: string;
  title: string;
  action?: ReactNode;
  children: ReactNode;
}

export function Section({ kicker, title, action, children }: SectionProps) {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-black/40">{kicker}</p>
          <h1 className="font-display mt-2 text-3xl font-medium tracking-[0.18em] text-black">{title}</h1>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

export function Register({ children }: { children: ReactNode }) {
  return <div className="border-t border-black/15">{children}</div>;
}

export function RegisterRow({
  title,
  meta,
  detail,
  onClick,
}: {
  title: string;
  meta?: string;
  detail?: string;
  onClick?: () => void;
}) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className="block w-full border-b border-black/10 py-5 text-left"
    >
      <div className="flex items-baseline justify-between gap-6">
        <h2 className="font-display text-lg tracking-wide text-black">{title}</h2>
        {meta && (
          <span className="shrink-0 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-black/70">
            {meta}
          </span>
        )}
      </div>
      {detail && <p className="mt-1 max-w-xl text-sm leading-relaxed text-black/55">{detail}</p>}
    </Tag>
  );
}
