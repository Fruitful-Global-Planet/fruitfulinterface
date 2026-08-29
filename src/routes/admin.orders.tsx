import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { format } from "date-fns";
import { formatZAR } from "@/lib/catalog";
import { ChevronDown, Package, ReceiptText, ShoppingBag } from "lucide-react";

export const Route = createFileRoute("/admin/orders")({
  head: () => ({ meta: [{ title: "Fruitful · Orders" }] }),
  component: OrdersPage,
});

type OrderLine = {
  productId: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  unitPriceCents: number;
  qty: number;
  lineTotalCents: number;
};

type OrderRow = {
  id: string;
  order_ref: string;
  status: "pending" | "paid" | "failed" | "cancelled";
  currency: string;
  total_cents: number;
  payment_provider: string;
  payment_reference: string | null;
  lines: OrderLine[];
  created_at: string;
};

// Minimal typed surface for the new `orders` table (auto-generated Database
// types will include it after the migration is applied + types regenerated).
type OrdersTable = {
  from: (table: "orders") => {
    select: (columns: "*") => {
      order: (
        column: "created_at",
        options: { ascending: boolean },
      ) => Promise<{
        data: OrderRow[] | null;
        error: { message: string } | null;
      }>;
    };
  };
};

const STATUS_STYLES: Record<OrderRow["status"], { label: string; bg: string }> = {
  paid: { label: "Paid", bg: "var(--mint)" },
  pending: { label: "Pending", bg: "var(--sun)" },
  failed: { label: "Failed", bg: "var(--coral)" },
  cancelled: { label: "Cancelled", bg: "var(--cream)" },
};

function OrdersPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setChecking(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  async function load() {
    setLoading(true);
    const { data, error } = await (supabase as unknown as OrdersTable)
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setRows(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    if (session) void load();
  }, [session]);

  if (checking) return <div className="p-8 text-center">Loading…</div>;
  return (
    <div className="min-h-svh bg-background text-foreground">
      <Toaster />
      {!session ? (
        <SignIn />
      ) : (
        <OrderList
          rows={rows}
          loading={loading}
          expanded={expanded}
          setExpanded={setExpanded}
          onRefresh={load}
        />
      )}
    </div>
  );
}

function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) toast.error(error.message);
  }
  return (
    <div className="mx-auto max-w-md p-8">
      <h2 className="font-display text-2xl font-bold">Sign in</h2>
      <p className="mt-1 text-sm text-muted-foreground">Sign in to view kiosk orders.</p>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full rounded-lg border border-border bg-background px-4 py-3"
        />
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full rounded-lg border border-border bg-background px-4 py-3"
        />
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-foreground py-3 font-display font-bold text-background disabled:opacity-50"
        >
          {busy ? "…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}

function OrderList({
  rows,
  loading,
  expanded,
  setExpanded,
  onRefresh,
}: {
  rows: OrderRow[];
  loading: boolean;
  expanded: string | null;
  setExpanded: (id: string | null) => void;
  onRefresh: () => void;
}) {
  const paidTotal = rows.reduce((sum, r) => (r.status === "paid" ? sum + r.total_cents : sum), 0);
  const paidCount = rows.filter((r) => r.status === "paid").length;

  return (
    <div className="mx-auto max-w-5xl p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Kiosk Orders</h1>
          <p className="text-sm text-muted-foreground">
            Sales recorded by the kiosk after successful payment.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-border bg-card px-4 py-2 text-sm">
            <span className="text-muted-foreground">Paid </span>
            <b>{paidCount}</b>
            <span className="mx-2 text-muted-foreground">·</span>
            <span className="text-muted-foreground">Total </span>
            <b>{formatZAR(paidTotal)}</b>
          </div>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="rounded-lg border border-border px-4 py-2 text-sm disabled:opacity-50"
          >
            {loading ? "Loading…" : "Refresh"}
          </button>
        </div>
      </header>

      {loading && rows.length === 0 ? (
        <p className="mt-8">Loading…</p>
      ) : rows.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center">
          <ReceiptText className="h-8 w-8 text-muted-foreground" />
          <p className="font-display font-bold">No orders yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Orders appear here once a shopper completes payment on the kiosk (real Paystack or demo
            mode).
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {rows.map((row) => {
            const style = STATUS_STYLES[row.status] ?? STATUS_STYLES.pending;
            const isOpen = expanded === row.id;
            return (
              <li key={row.id} className="overflow-hidden rounded-2xl border border-border bg-card">
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : row.id)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left"
                >
                  <span
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-secondary"
                    style={{ color: "var(--ink)" }}
                  >
                    <ShoppingBag className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-mono text-sm font-bold">
                      {row.order_ref}
                    </span>
                    <span className="block text-[11px] text-muted-foreground">
                      {format(new Date(row.created_at), "dd MMM yyyy · HH:mm")}
                    </span>
                  </span>
                  <span
                    className="hidden sm:block rounded-full px-3 py-1 font-display text-[10px] font-black uppercase tracking-wider"
                    style={{ backgroundColor: style.bg }}
                  >
                    {style.label}
                  </span>
                  <span
                    className="rounded-full px-2.5 py-1 font-mono text-[10px] uppercase"
                    style={{ backgroundColor: "var(--cream)" }}
                  >
                    {row.payment_provider}
                  </span>
                  <span className="font-display text-base font-bold">
                    {formatZAR(row.total_cents)}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {isOpen && (
                  <div className="border-t border-border px-4 py-3 text-sm">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>
                        Payment ref: <b className="font-mono">{row.payment_reference ?? "—"}</b>
                      </span>
                      <span>
                        Currency: <b>{row.currency}</b>
                      </span>
                      <span>
                        Status: <b>{row.status}</b>
                      </span>
                    </div>
                    <ul className="mt-3 space-y-1.5">
                      {Array.isArray(row.lines) && row.lines.length > 0 ? (
                        row.lines.map((l, i) => (
                          <li
                            key={i}
                            className="flex items-center justify-between gap-3 rounded-xl bg-secondary px-3 py-2"
                          >
                            <span className="flex min-w-0 items-center gap-2">
                              <Package className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                              <span className="truncate font-semibold">{l.name}</span>
                              <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                                {l.sku ?? l.productId}
                              </span>
                            </span>
                            <span className="shrink-0 font-mono text-xs">
                              {l.qty} × {formatZAR(l.unitPriceCents)} ={" "}
                              {formatZAR(l.lineTotalCents)}
                            </span>
                          </li>
                        ))
                      ) : (
                        <li className="text-xs text-muted-foreground">No line items recorded.</li>
                      )}
                    </ul>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
