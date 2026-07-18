import { FruitfulLogo, FruitfulWordmark } from "./FruitfulLogo";

export function AttractorScreen({ onBegin }: { onBegin: () => void }) {
  return (
    <button
      type="button"
      onClick={onBegin}
      className="relative flex h-full w-full flex-col items-center justify-between overflow-hidden text-left"
      style={{ backgroundColor: "var(--mint)" }}
    >
      {/* Soft radial highlight */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 60% at 50% 0%, color-mix(in oklab, white 35%, transparent), transparent 60%)",
        }}
      />
      {/* Secondary portrait — Madiba Tata backdrop */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-0 h-1/2 opacity-25"
        style={{
          backgroundImage: `url(${madibaAsset.url})`,
          backgroundSize: "contain",
          backgroundPosition: "center bottom",
          backgroundRepeat: "no-repeat",
          maskImage: "linear-gradient(transparent, black 40%)",
          WebkitMaskImage: "linear-gradient(transparent, black 40%)",
        }}
      />
      {/* Subtle scanning shine */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute top-0 h-full w-1/3 animate-fruitful-shine"
          style={{
            background:
              "linear-gradient(90deg, transparent, color-mix(in oklab, white 20%, transparent), transparent)",
          }}
        />
      </div>

      {/* Header tagline */}
      <div className="z-10 w-full px-6 pt-10 text-center">
        <p
          className="font-display text-2xl font-bold uppercase tracking-[0.2em]"
          style={{ color: "white" }}
        >
          Fruitful · Changing · Seeds
        </p>
      </div>

      {/* Mascot + headline */}
      <div className="z-10 flex flex-col items-center px-6">
        <FruitfulLogo className="h-52 w-52 animate-fruitful-bob drop-shadow-[0_20px_40px_rgba(0,0,0,0.25)]" />
        <h1
          className="mt-6 text-center font-display text-5xl font-bold leading-[1.05]"
          style={{ color: "white" }}
        >
          The portal that
          <br />
          <span style={{ color: "var(--coral)" }}>changes seeds.</span>
        </h1>
        <p
          className="mt-5 max-w-xs text-center text-base font-medium leading-snug"
          style={{ color: "color-mix(in oklab, white 90%, var(--ink))" }}
        >
          Support local artisans · Crafted in South Africa · Made in the bush
        </p>
      </div>

      {/* CTA */}
      <div className="z-10 mb-12 flex w-full flex-col items-center px-6">
        <div
          className="animate-fruitful-pulse flex h-24 w-full max-w-md items-center justify-center rounded-full font-display text-2xl font-bold uppercase tracking-widest"
          style={{
            backgroundColor: "var(--coral)",
            color: "white",
            boxShadow: "0 20px 50px -12px rgba(230,57,70,0.55)",
          }}
        >
          Tap to begin
        </div>
        <div className="mt-6 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.25em]"
             style={{ color: "color-mix(in oklab, white 85%, transparent)" }}>
          <FruitfulWordmark className="text-base normal-case tracking-tight" />
          <span>·</span>
          <span>Proudly South African</span>
        </div>
      </div>
    </button>
  );
}
