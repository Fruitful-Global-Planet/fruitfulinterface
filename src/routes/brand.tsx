import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/brand")({
  head: () => ({
    meta: [
      { title: "Fruitful™ Brand Fundamentals · Omni-Present Toolkit" },
      {
        name: "description",
        content:
          "The Fruitful brand system: colour, typography, logo lockups, voice, staff badges and template specs for kiosks, posters and signage.",
      },
      { property: "og:title", content: "Fruitful™ Brand Fundamentals" },
      {
        property: "og:description",
        content:
          "Colour, typography, lockups, voice and template specs for the Fruitful Portal ecosystem.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BrandPage,
});

function BrandPage() {
  return (
    <div className="flex h-dvh w-full flex-col bg-ink">
      <header className="flex items-center justify-between gap-3 px-4 py-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-amber">
            Internal reference
          </p>
          <h1 className="font-display text-lg font-black uppercase italic text-cream">
            Brand Fundamentals
          </h1>
        </div>
        <Link
          to="/"
          className="rounded-full bg-cream px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-ink"
        >
          Back to kiosk
        </Link>
      </header>
      <iframe
        title="Fruitful Brand Fundamentals toolkit"
        src="/brand-fundamentals.html"
        className="min-h-0 w-full flex-1 border-0 bg-cream"
      />
    </div>
  );
}
