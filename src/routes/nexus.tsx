import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";

export const Route = createFileRoute("/nexus")({
  head: () => ({
    meta: [
      { title: "HotStack Nexus · Ashcorp" },
      {
        name: "description",
        content:
          "HotStack Nexus — the Ashcorp 1.5m Cornice Saver operating system: item master, unit economics and Willie's Approval Center.",
      },
      { property: "og:title", content: "HotStack Nexus · Ashcorp" },
      {
        property: "og:description",
        content: "1.5m Cornice Saver / BlockBox ERP: item master, approvals, consignment.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NexusLayout,
});

const NEXUS_BLUE = "#0056b3";
const NEXUS_GREEN = "#28a745";

function NexusLayout() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const tabs = [
    { to: "/nexus", label: "Overview", exact: true },
    { to: "/nexus/items", label: "Item Master", exact: false },
    { to: "/nexus/approvals", label: "Approval Center", exact: false },
  ];
  return (
    <div className="min-h-svh" style={{ backgroundColor: "#f4f6f8", color: "#212529" }}>
      <div style={{ backgroundColor: NEXUS_BLUE }}>
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-5 py-3">
          <div className="flex items-center gap-2">
            <div
              className="grid h-9 w-9 place-items-center rounded-lg font-display text-sm font-black text-white"
              style={{ backgroundColor: NEXUS_GREEN }}
            >
              1.5
            </div>
            <div>
              <p className="font-display text-base font-black uppercase italic leading-none text-white">
                HotStack Nexus
              </p>
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/70">
                Ashcorp · Cornice Saver OS
              </p>
            </div>
          </div>
          <nav className="ml-auto flex flex-wrap gap-1">
            {tabs.map((t) => {
              const active = t.exact ? path === t.to : path.startsWith(t.to);
              return (
                <Link
                  key={t.to}
                  to={t.to}
                  className="rounded-full px-3 py-1.5 font-display text-sm font-bold"
                  style={{
                    backgroundColor: active ? NEXUS_GREEN : "rgba(255,255,255,0.12)",
                    color: "white",
                  }}
                >
                  {t.label}
                </Link>
              );
            })}
            <Link
              to="/"
              className="rounded-full px-3 py-1.5 font-display text-sm font-bold text-white/70"
            >
              Kiosk →
            </Link>
          </nav>
        </div>
      </div>
      <Outlet />
    </div>
  );
}
