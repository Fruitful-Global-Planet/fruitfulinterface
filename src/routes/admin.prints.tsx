import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/admin/prints")({
  head: () => ({ meta: [{ title: "Fruitful · SamFox Admin" }] }),
  component: AdminPage,
});

type Row = {
  id: string;
  slot_number: number;
  image_url: string;
  name: string;
  description: string;
  price_zar_cents: number;
  price_usd_cents: number;
  stock: number;
  is_published: boolean;
};

function AdminPage() {
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
    <div className="min-h-svh bg-background text-foreground">
      <Toaster />
      {!session ? <SignIn /> : <PrintEditor onSignOut={() => supabase.auth.signOut()} />}
    </div>
  );
}

function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const fn =
      mode === "signin"
        ? supabase.auth.signInWithPassword({ email, password })
        : supabase.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: `${window.location.origin}/admin` },
          });
    const { error } = await fn;
    setBusy(false);
    if (error) toast.error(error.message);
    else if (mode === "signup") toast.success("Account created — you are signed in.");
  }

  return (
    <div className="mx-auto max-w-md p-8">
      <h1 className="font-display text-3xl font-bold">SamFox Admin</h1>
      <p className="mt-1 text-sm text-muted-foreground">Sign in to edit prints.</p>
      <form onSubmit={submit} className="mt-6 space-y-3">
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
          minLength={6}
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
          {busy ? "…" : mode === "signin" ? "Sign in" : "Create account"}
        </button>
        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="w-full text-center text-sm text-muted-foreground underline"
        >
          {mode === "signin" ? "Need an account? Sign up" : "Have an account? Sign in"}
        </button>
      </form>
    </div>
  );
}

function PrintEditor({ onSignOut }: { onSignOut: () => void }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("samfox_prints")
      .select("*")
      .order("slot_number");
    if (error) toast.error(error.message);
    else setRows((data ?? []) as Row[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function patch(id: string, fields: Partial<Row>) {
    setRows((r) => r.map((x) => (x.id === id ? { ...x, ...fields } : x)));
  }

  async function save(row: Row) {
    setSavingId(row.id);
    const { error } = await supabase
      .from("samfox_prints")
      .update({
        name: row.name,
        description: row.description,
        price_zar_cents: row.price_zar_cents,
        price_usd_cents: row.price_usd_cents,
        stock: row.stock,
        is_published: row.is_published,
      })
      .eq("id", row.id);
    setSavingId(null);
    if (error) toast.error(error.message);
    else toast.success(`Print ${row.slot_number} saved`);
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">SamFox Prints</h1>
          <p className="text-sm text-muted-foreground">
            Edit name, description, price and stock. Changes appear on the kiosk immediately.
          </p>
        </div>
        <button onClick={onSignOut} className="rounded-lg border border-border px-4 py-2 text-sm">
          Sign out
        </button>
      </header>

      {loading ? (
        <p className="mt-8">Loading…</p>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {rows.map((row) => (
            <article
              key={row.id}
              className="overflow-hidden rounded-2xl border border-border bg-card"
            >
              <div className="flex gap-4 p-4">
                <img
                  src={row.image_url}
                  alt={row.name}
                  className="h-32 w-32 shrink-0 rounded-lg object-cover"
                />
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
                  <textarea
                    value={row.description}
                    onChange={(e) => patch(row.id, { description: e.target.value })}
                    placeholder="Short description (one sentence)"
                    rows={2}
                    className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 border-t border-border p-4 text-sm">
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">ZAR (cents)</span>
                  <input
                    type="number"
                    value={row.price_zar_cents}
                    onChange={(e) => patch(row.id, { price_zar_cents: +e.target.value })}
                    className="rounded border border-border bg-background px-2 py-1"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">USD (cents)</span>
                  <input
                    type="number"
                    value={row.price_usd_cents}
                    onChange={(e) => patch(row.id, { price_usd_cents: +e.target.value })}
                    className="rounded border border-border bg-background px-2 py-1"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">Stock</span>
                  <input
                    type="number"
                    value={row.stock}
                    onChange={(e) => patch(row.id, { stock: +e.target.value })}
                    className="rounded border border-border bg-background px-2 py-1"
                  />
                </label>
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
          ))}
        </div>
      )}
    </div>
  );
}
