import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Fruitful · Admin" }] }),
  component: AdminLayout,
});

function AdminLayout() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const tabs = [
    { to: "/admin/orders", label: "Orders" },
    { to: "/admin/prints", label: "SamFox Prints" },
    { to: "/admin/kidswear", label: "Bashedi Kidswear" },
    { to: "/admin/tools", label: "Data Tools" },
  ];
  return (
    <div className="min-h-svh bg-background text-foreground">
      <div className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center gap-2 px-6 py-3">
          <h1 className="font-display text-lg font-bold">Fruitful Admin</h1>
          <nav className="ml-4 flex gap-1">
            {tabs.map((t) => {
              const active = path.startsWith(t.to);
              return (
                <Link
                  key={t.to}
                  to={t.to}
                  className="rounded-full px-3 py-1.5 font-display text-sm font-bold"
                  style={{
                    backgroundColor: active ? "var(--coral)" : "transparent",
                    color: active ? "white" : "var(--ink)",
                  }}
                >
                  {t.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
      <Outlet />
    </div>
  );
}
