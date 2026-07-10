import markAsset from "@/assets/brand/fruitful-mark.png.asset.json";

export function FruitfulLogo({ className }: { className?: string }) {
  return (
    <img
      src={markAsset.url}
      alt="Fruitful"
      className={className}
      draggable={false}
      style={{ objectFit: "contain" }}
    />
  );
}

export function FruitfulWordmark({ className }: { className?: string }) {
  return (
    <span
      className={`font-display font-bold tracking-tight ${className ?? ""}`}
      style={{ color: "var(--coral)" }}
    >
      fruitful
      <span className="inline-block ml-1 align-middle" style={{ fontSize: "0.75em" }}>™</span>
    </span>
  );
}
