import type { ReactNode } from 'react';

interface SectionProps {
  kicker: string;
  title: string;
  action?: ReactNode;
  children: ReactNode;
}

export function Section({ kicker, title, action, children }: SectionProps) {
  return (
    <div className="mx-auto max-w-5xl">
      {/* ─── Samaritan Surgical Header ─── */}
      <div className="mb-6">
        {/* Top Surgical Rule */}
        <div className="relative flex w-full items-center justify-between">
          <span className="font-mono text-[10px] leading-none text-black/40">+</span>
          <div className="h-px flex-1 bg-black/85 mx-1" />
          <span className="font-mono text-[10px] leading-none text-black/40">+</span>
        </div>

        <div className="my-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 bg-[#e10600] lamp" />
              <p className="font-mono text-[9px] uppercase tracking-[0.26em] text-black/60 font-bold">
                DIRECTIVE // {kicker}
              </p>
            </div>
            <h1 className="font-display mt-1 text-2xl font-bold uppercase tracking-[0.24em] text-black sm:text-3xl">
              {title}
            </h1>
          </div>
          {action}
        </div>

        {/* Bottom Surgical Rule */}
        <div className="relative flex w-full items-center justify-between">
          <span className="font-mono text-[10px] leading-none text-black/40">+</span>
          <div className="h-px flex-1 bg-black/85 mx-1" />
          <span className="font-mono text-[10px] leading-none text-black/40">+</span>
        </div>
      </div>

      {children}
    </div>
  );
}

export function Register({ children }: { children: ReactNode }) {
  return <div className="border border-black/80 bg-white shadow-sm divide-y divide-black/10">{children}</div>;
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
      className="group block w-full p-4 text-left transition-all hover:bg-black/[0.03] focus:bg-black/[0.05]"
    >
      <div className="flex items-baseline justify-between gap-4 font-mono">
        <div className="flex items-center gap-2">
          <span className="text-[#e10600] font-bold text-xs opacity-0 group-hover:opacity-100 transition-opacity">
            ➔
          </span>
          <h2 className="font-display text-base font-bold tracking-wide text-black group-hover:text-[#e10600] transition-colors">
            {title}
          </h2>
        </div>
        {meta && (
          <span className="shrink-0 border border-black/20 bg-[#fafafa] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.16em] text-black/70">
            {meta}
          </span>
        )}
      </div>
      {detail && (
        <p className="mt-1.5 pl-4 font-mono text-[11px] leading-relaxed text-black/60 max-w-3xl">
          {detail}
        </p>
      )}
    </Tag>
  );
}
