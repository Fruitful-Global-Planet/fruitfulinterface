import { Hand } from "lucide-react";
import { FruitfulLogo, FruitfulWordmark } from "./FruitfulLogo";

export function AttractorScreen({ onBegin }: { onBegin: () => void }) {
  return (
    <button
      type="button"
      onClick={onBegin}
      className="relative flex h-full w-full flex-col overflow-hidden text-left"
      style={{ backgroundColor: "var(--background)", color: "var(--ink)" }}
      aria-label="Tap to start ordering"
    >
      <div className="grid h-full grid-rows-[auto_minmax(0,1fr)_auto] px-6 py-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FruitfulLogo className="h-9 w-9" />
            <FruitfulWordmark className="text-xl" />
          </div>
          <div
            className="rounded-full px-3 py-2 font-display text-[10px] font-black uppercase tracking-[0.22em]"
            style={{ backgroundColor: "var(--mint)", color: "var(--ink)" }}
          >
            Kiosk open
          </div>
        </header>

        <main className="flex min-h-0 flex-col justify-center py-8">
          <div className="relative mx-auto grid h-52 w-52 place-items-center">
            <div
              className="absolute inset-0 rounded-full"
              style={{ backgroundColor: "var(--mint)", boxShadow: "0 28px 60px rgba(0,0,0,0.12)" }}
            />
            <FruitfulLogo className="relative h-32 w-32" />
          </div>

          <div className="mt-10">
            <p className="font-display text-[11px] font-black uppercase tracking-[0.35em]" style={{ color: "var(--coral)" }}>
              Fruitful Portal
            </p>
            <h1 className="mt-4 font-display text-[58px] font-black leading-[0.88]" style={{ letterSpacing: "0" }}>
              Shop local.
              <br />
              Pay fast.
              <br />
              Grow good.
            </h1>
            <p className="mt-5 max-w-[360px] text-lg font-extrabold leading-tight" style={{ color: "color-mix(in oklab, var(--ink) 72%, transparent)" }}>
              Kidswear, SamFox prints, artisan hats and one-of-one pieces from South African makers.
            </p>
          </div>
        </main>

        <footer>
          <div
            className="mb-4 grid grid-cols-3 gap-2 rounded-3xl p-2"
            style={{ backgroundColor: "var(--cream)" }}
          >
            {[
              ["01", "Browse"],
              ["02", "Add"],
              ["03", "Pay"],
            ].map(([n, label]) => (
              <div key={n} className="rounded-2xl bg-card px-3 py-3 text-center">
                <div className="font-display text-xs font-black" style={{ color: "var(--coral)" }}>{n}</div>
                <div className="font-display text-sm font-black uppercase tracking-wider">{label}</div>
              </div>
            ))}
          </div>

          <div
            className="flex h-24 w-full items-center justify-center gap-4 rounded-[28px] font-display text-2xl font-black uppercase tracking-wider"
            style={{ backgroundColor: "var(--coral)", color: "var(--coral-foreground)", boxShadow: "0 16px 0 color-mix(in oklab, var(--coral) 70%, black)" }}
          >
            <Hand className="h-8 w-8" />
            Tap to start
          </div>
        </footer>
      </div>
    </button>
  );
}