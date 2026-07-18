import { FruitfulLogo, FruitfulWordmark } from "./FruitfulLogo";
import { Hand } from "lucide-react";

export function AttractorScreen({ onBegin }: { onBegin: () => void }) {
  return (
    <button
      type="button"
      onClick={onBegin}
      className="relative flex h-full w-full flex-col overflow-hidden text-left"
      style={{ backgroundColor: "var(--mint)" }}
      aria-label="Tap to start ordering"
    >
      {/* Bold radial glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 70% at 50% 0%, color-mix(in oklab, white 40%, transparent), transparent 55%)",
        }}
      />

      {/* Yellow sun disc behind mascot */}
      <div
        className="pointer-events-none absolute left-1/2 top-[38%] -z-0 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(circle, var(--sun) 0%, color-mix(in oklab, var(--sun) 60%, transparent) 55%, transparent 72%)",
          filter: "blur(2px)",
        }}
      />

      {/* Shine sweep */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute top-0 h-full w-1/3 animate-fruitful-shine"
          style={{
            background:
              "linear-gradient(90deg, transparent, color-mix(in oklab, white 25%, transparent), transparent)",
          }}
        />
      </div>

      {/* Top brand chip */}
      <div className="z-10 flex w-full items-center justify-between px-6 pt-6">
        <div
          className="flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 shadow-md"
        >
          <FruitfulLogo className="h-6 w-6" />
          <FruitfulWordmark className="text-sm" />
        </div>
        <span
          className="rounded-full px-3 py-1.5 font-display text-[10px] font-black uppercase tracking-[0.25em] text-white"
          style={{ backgroundColor: "var(--coral)" }}
        >
          Self-service · Open
        </span>
      </div>

      {/* Mascot */}
      <div className="z-10 mt-6 flex flex-col items-center px-6">
        <FruitfulLogo className="h-64 w-64 animate-fruitful-bob drop-shadow-[0_30px_60px_rgba(0,0,0,0.35)]" />
      </div>

      {/* Headline */}
      <div className="z-10 mt-2 px-6 text-center">
        <p
          className="font-display text-[11px] font-black uppercase tracking-[0.4em]"
          style={{ color: "color-mix(in oklab, white 92%, transparent)" }}
        >
          Fruitful · Changing · Seeds
        </p>
        <h1
          className="mt-3 font-display text-[64px] font-black leading-[0.9]"
          style={{ color: "white", letterSpacing: "-0.03em" }}
        >
          Welcome.
          <br />
          <span style={{ color: "var(--sun)" }}>Let's grow</span>
          <br />
          something.
        </h1>
      </div>

      {/* Bottom CTA slab */}
      <div className="z-10 mt-auto w-full px-6 pb-8 pt-6">
        <div
          className="animate-fruitful-pulse flex h-24 w-full items-center justify-center gap-4 rounded-3xl font-display text-3xl font-black uppercase tracking-wider"
          style={{
            backgroundColor: "var(--coral)",
            color: "white",
            boxShadow:
              "0 24px 60px -14px rgba(230,57,70,0.65), inset 0 -6px 0 rgba(0,0,0,0.18)",
          }}
        >
          <Hand className="h-8 w-8" />
          Tap to order
        </div>
        <div
          className="mt-4 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.3em]"
          style={{ color: "color-mix(in oklab, white 90%, transparent)" }}
        >
          <span>Support local artisans</span>
          <span>·</span>
          <span>Proudly South African</span>
        </div>
      </div>
    </button>
  );
}
