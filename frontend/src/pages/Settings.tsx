import { APP_NAME, USER_NAME, USER_ROLE, WORKSPACE_NAME } from '../lib/constants';
import { Section } from '../components/hud/Section';

const rows = [
  ['Platform', APP_NAME],
  ['Layer', WORKSPACE_NAME],
  ['Phase', 'Phase 1 — internal engineering'],
  ['Name', USER_NAME],
  ['Role', USER_ROLE],
  ['Model', 'claude-sonnet'],
  ['Streaming', 'Enabled'],
];

export function Settings() {
  return (
    <Section kicker="System" title="SETTINGS">
      <div className="border-t border-black/15">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-baseline justify-between gap-6 border-b border-black/10 py-4">
            <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-black/45">{label}</span>
            <span className="text-sm font-medium text-black">{value}</span>
          </div>
        ))}
      </div>
    </Section>
  );
}
