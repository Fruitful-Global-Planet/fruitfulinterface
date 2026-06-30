import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { computeKidswearPrice, formatRand } from "@/lib/kidswear-pricing";
import type { KidswearRow } from "@/lib/kidswear";

export const Route = createFileRoute("/admin/kidswear")({
  head: () => ({ meta: [{ title: "Fruitful · Kidswear Admin" }] }),
  component: KidswearAdminPage,
});

function KidswearAdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setChecking(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (checking) return <div className="p-8 text-center">Loading…</div>;
  return (
    <>
      <Toaster />
      {!session ? <SignIn /> : <Editor />}
    </>
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
      <form onSubmit={submit} className="mt-4 space-y-3">
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full rounded-lg border border-border bg-background px-4 py-3" />
        <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full rounded-lg border border-border bg-background px-4 py-3" />
        <button type="submit" disabled={busy} className="w-full rounded-lg bg-foreground py-3 font-display font-bold text-background disabled:opacity-50">
          {busy ? "…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}

function Editor() {
  const [rows, setRows] = useState<KidswearRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("bashedi_kidswear")
      .select("*")
      .order("slot_number");
    if (error) toast.error(error.message);
    else setRows((data ?? []) as unknown as KidswearRow[]);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  function patch(id: string, fields: Partial<KidswearRow>) {
    setRows((r) =>
      r.map((x) => {
        if (x.id !== id) return x;
        const next = { ...x, ...fields };
        // Recompute selling price whenever cost / markup / vat changes
        if (
          "cost_price_excl_vat_cents" in fields ||
          "markup_multiplier" in fields ||
          "vat_rate" in fields
        ) {
          const p = computeKidswearPrice(
            next.cost_price_excl_vat_cents,
            next.markup_multiplier,
            next.vat_rate,
          );
          next.price_zar_cents = p.priceInclVatCents;
        }
        return next;
      }),
    );
  }

  async function save(row: KidswearRow) {
    setSavingId(row.id);
    const { error } = await supabase
      .from("bashedi_kidswear")
      .update({
        name: row.name,
        description: row.description,
        long_description: row.long_description,
        item_code: row.item_code,
        sku: row.sku,
        barcode: row.barcode,
        size_label: row.size_label,
        age_range: row.age_range,
        fabric: row.fabric,
        color: row.color,
        image_url: row.image_url,
        cost_price_excl_vat_cents: row.cost_price_excl_vat_cents,
        markup_multiplier: row.markup_multiplier,
        vat_rate: row.vat_rate,
        price_zar_cents: row.price_zar_cents,
        stock: row.stock,
        is_published: row.is_published,
      })
      .eq("id", row.id);
    setSavingId(null);
    if (error) toast.error(error.message);
    else toast.success(`Slot ${row.slot_number} saved`);
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      <header>
        <h2 className="font-display text-2xl font-bold">Bashedi Kidswear</h2>
        <p className="text-sm text-muted-foreground">
          Selling price auto-calculates: <b>cost excl VAT × markup × (1 + VAT)</b>.
        </p>
      </header>

      {loading ? (
        <p className="mt-8">Loading…</p>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {rows.map((row) => {
            const p = computeKidswearPrice(
              row.cost_price_excl_vat_cents,
              row.markup_multiplier,
              row.vat_rate,
            );
            return (
              <article key={row.id} className="overflow-hidden rounded-2xl border border-border bg-card">
                <div className="flex gap-4 p-4">
                  <div className="shrink-0">
                    <img src={row.image_url} alt={row.name} className="h-32 w-32 rounded-lg object-cover" />
                    <input
                      value={row.image_url}
                      onChange={(e) => patch(row.id, { image_url: e.target.value })}
                      placeholder="Image URL"
                      className="mt-2 w-32 rounded border border-border bg-background px-2 py-1 text-[10px]"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Slot #{row.slot_number}
                    </div>
                    <input
                      value={row.name}
                      onChange={(e) => patch(row.id, { name: e.target.value })}
                      placeholder="Name"
                      className="w-full rounded border border-border bg-background px-3 py-2 font-display font-bold"
                    />
                    <input
                      value={row.item_code ?? ""}
                      onChange={(e) => patch(row.id, { item_code: e.target.value })}
                      placeholder="Item code (e.g. BSK-001)"
                      className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
                    />
                    <input
                      value={row.barcode ?? ""}
                      onChange={(e) => patch(row.id, { barcode: e.target.value })}
                      placeholder="Barcode"
                      className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
                    />
                    <textarea
                      value={row.description}
                      onChange={(e) => patch(row.id, { description: e.target.value })}
                      placeholder="Short description"
                      rows={2}
                      className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
                    />
                    <textarea
                      value={row.long_description}
                      onChange={(e) => patch(row.id, { long_description: e.target.value })}
                      placeholder="Long description"
                      rows={3}
                      className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 border-t border-border p-4 text-sm">
                  <Field label="Size" v={row.size_label} on={(v) => patch(row.id, { size_label: v })} />
                  <Field label="Age" v={row.age_range} on={(v) => patch(row.id, { age_range: v })} />
                  <Field label="Fabric" v={row.fabric} on={(v) => patch(row.id, { fabric: v })} />
                  <NumField label="Cost excl (cents)" v={row.cost_price_excl_vat_cents} on={(v) => patch(row.id, { cost_price_excl_vat_cents: v })} />
                  <NumField label="Markup ×" step="0.01" v={row.markup_multiplier} on={(v) => patch(row.id, { markup_multiplier: v })} />
                  <NumField label="VAT" step="0.01" v={row.vat_rate} on={(v) => patch(row.id, { vat_rate: v })} />
                  <NumField label="Stock" v={row.stock} on={(v) => patch(row.id, { stock: v })} />
                </div>
                <div className="border-t border-border bg-secondary px-4 py-3 text-xs">
                  <div className="flex flex-wrap justify-between gap-2 font-display">
                    <span>Cost: <b>{formatRand(p.costExclCents)}</b></span>
                    <span>Excl VAT: <b>{formatRand(p.priceExclVatCents)}</b></span>
                    <span>VAT: <b>{formatRand(p.vatAmountCents)}</b></span>
                    <span style={{ color: "var(--coral)" }}>
                      Sell incl: <b>{formatRand(p.priceInclVatCents)}</b>
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 border-t border-border p-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={row.is_published}
                      onChange={(e) => patch(row.id, { is_published: e.target.checked })}
                    />
                    Published
                  </label>
                  <button
                    onClick={() => save(row)}
                    disabled={savingId === row.id}
                    className="rounded-lg bg-foreground px-4 py-2 font-display text-sm font-bold text-background disabled:opacity-50"
                  >
                    {savingId === row.id ? "Saving…" : "Save"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Field({ label, v, on }: { label: string; v: string; on: (v: string) => void }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <input value={v} onChange={(e) => on(e.target.value)} className="rounded border border-border bg-background px-2 py-1" />
    </label>
  );
}
function NumField({ label, v, on, step }: { label: string; v: number; on: (v: number) => void; step?: string }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <input type="number" step={step} value={v} onChange={(e) => on(+e.target.value)} className="rounded border border-border bg-background px-2 py-1" />
    </label>
  );
}
