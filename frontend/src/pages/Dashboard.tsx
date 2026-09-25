import { AuraConsole } from '../components/hud/AuraConsole';
import { DataField } from '../components/hud/CommandDeck';

export function Dashboard() {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-[#f7f7f7] px-6 py-10">
      <DataField />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(255,255,255,0.97) 0%, rgba(255,255,255,0.88) 22%, rgba(255,255,255,0.35) 48%, rgba(190,190,190,0.28) 100%)',
        }}
      />
      <AuraConsole />
    </div>
  );
}
