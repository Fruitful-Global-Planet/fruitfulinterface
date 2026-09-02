import { createFileRoute, Link } from "@tanstack/react-router";
import { Boxes, CheckSquare, TrendingUp, Truck } from "lucide-react";
import { NEXUS_ECONOMICS, formatRand } from "@/lib/nexus";

export const Route = createFileRoute("/nexus/")({
  head: () => ({
    meta: [
      { title: "HotStack Nexus · Overview" },
      {
        name: "description",
        content:
          "Locked unit economics for the 1.5m Cornice Saver: R1,050 variable cost, R1,650 selling price, R600 contribution, 128-unit break-even.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NexusOverview,
});

const E = NEXUS_ECONOMICS;

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-black/50">{label}</p>
      <p className="mt-1 font-display text-2xl font-black" style={{ color: accent }}>
        {value}
      </p>
      <p className="mt-1 text-xs text-black/60">{sub}</p>
    </div>
  );
}

function NexusOverview() {
  return (
    <main className="mx-auto max-w-6xl px-5 py-6">
      <div
        className="rounded-3xl p-6 text-white"
        style={{ background: "linear-gradient(120deg, #0056b3 0%, #003d82 100%)" }}
      >
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/70">
          FAA™ Enterprise · Pretoria, Gauteng
        </p>
        <h1 className="mt-2 font-display text-3xl font-black uppercase italic leading-tight sm:text-4xl">
          The 1.5m Cornice Saver standard
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-white/85">
          Bypassing the bakkie barrier: car-boot transportable, single-operator ladder installs
          (40% faster, R300/day labour), and 3PL/FBA-ready packaging — moving the industry off
          legacy 2.0m/2.5m EPS lengths.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            to="/nexus/items"
            className="flex items-center gap-2 rounded-full px-4 py-2 font-display text-sm font-bold text-white"
            style={{ backgroundColor: "#28a745" }}
          >
            <Boxes className="h-4 w-4" /> Item Master
          </Link>
          <Link
            to="/nexus/approvals"
            className="flex items-center gap-2 rounded-full bg-white px-4 py-2 font-display text-sm font-bold"
            style={{ color: "#0056b3" }}
          >
            <CheckSquare className="h-4 w-4" /> Willie's Approval Center
          </Link>
        </div>
      </div>

      <h2 className="mt-6 font-display text-lg font-black uppercase italic">
        Unit economics · SKU-001 (locked)
      </h2>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="COGS / unit" value={formatRand(E.unitCostCents)} sub="Excl. VAT" accent="#0056b3" />
        <StatCard label="Logistics / unit" value={formatRand(E.unitLogisticsCents)} sub="Warehouse allocation" accent="#0056b3" />
        <StatCard label="Variable cost" value={formatRand(E.unitVariableCents)} sub="Cost + logistics" accent="#c0392b" />
        <StatCard label="Sell price" value={formatRand(E.unitSellCents)} sub="Excl. VAT" accent="#28a745" />
        <StatCard label="Contribution" value={formatRand(E.contributionCents)} sub="Per unit margin" accent="#28a745" />
        <StatCard label="Break-even" value={`${E.breakEvenUnits} units`} sub={`vs ${formatRand(E.fixedOverheadCents)} overhead`} accent="#212529" />
      </div>

      <div className="mt-6 grid gap-3 lg:grid-cols-3">
        <div className="rounded-2xl border border-black/10 bg-white p-5">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" style={{ color: "#28a745" }} />
            <h3 className="font-display text-base font-black uppercase italic">Scale projection</h3>
          </div>
          <ul className="mt-3 space-y-2 text-sm text-black/75">
            <li>50 units/day → 1,500 units/month</li>
            <li>18,000 units annualised</li>
            <li>
              ≈ <strong>{formatRand(E.contributionCents * 1500)}</strong> contribution / month
            </li>
            <li>
              ≈ <strong>R9.88m</strong> annualised net output
            </li>
          </ul>
        </div>
        <div className="rounded-2xl border border-black/10 bg-white p-5">
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5" style={{ color: "#0056b3" }} />
            <h3 className="font-display text-base font-black uppercase italic">Channel strategy</h3>
          </div>
          <ul className="mt-3 space-y-2 text-sm text-black/75">
            <li>8,000+ independent township hardware stores</li>
            <li>Zero-upfront consignment model · 40% retailer margin</li>
            <li>Soshanguve &amp; Mamelodi pilot deployment</li>
            <li>WhatsApp Business field orders + Xero sync</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-black/10 bg-white p-5">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5" style={{ color: "#0056b3" }} />
            <h3 className="font-display text-base font-black uppercase italic">Approval protocol</h3>
          </div>
          <ul className="mt-3 space-y-2 text-sm text-black/75">
            <li>High-density rapid approval — McDonald's-style UX</li>
            <li>Credit limits &amp; consignment restocking gateway</li>
            <li>Every decision logged with decider + timestamp</li>
          </ul>
          <Link
            to="/nexus/approvals"
            className="mt-4 inline-block rounded-full px-4 py-2 font-display text-xs font-bold uppercase tracking-wider text-white"
            style={{ backgroundColor: "#0056b3" }}
          >
            Open Approval Center
          </Link>
        </div>
      </div>
    </main>
  );
}
