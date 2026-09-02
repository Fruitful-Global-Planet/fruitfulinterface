import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Check, CheckSquare, Clock, Plus, X } from "lucide-react";
import { formatRand, nextApprovalRef, type ApprovalRequest } from "@/lib/nexus";

export const Route = createFileRoute("/nexus/approvals")({
  head: () => ({
    meta: [
      { title: "HotStack Nexus · Approval Center" },
      {
        name: "description",
        content:
          "Willie's Approval Center — rapid approval gateway for store credit limits and consignment restocking.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ApprovalCenterPage,
});

type ApprovalsTable = {
  from: (table: "nexus_approval_requests") => {
    select: (columns: "*") => {
      order: (
        column: "created_at",
        options: { ascending: boolean },
      ) => Promise<{ data: ApprovalRequest[] | null; error: { message: string } | null }>;
    };
    insert: (
      row: Record<string, unknown>,
    ) => Promise<{ error: { message: string } | null }>;
    update: (row: Record<string, unknown>) => {
      eq: (
        column: "id",
        value: string,
      ) => Promise<{ error: { message: string } | null }>;
    };
  };
};

const db = () => supabase as unknown as ApprovalsTable;

const STATUS_STYLE: Record<ApprovalRequest["status"], { bg: string; fg: string; label: string }> = {
  pending: { bg: "#e29a00", fg: "#fff", label: "Pending" },
  approved: { bg: "#28a745", fg: "#fff", label: "Approved" },
  rejected: { bg: "#c0392b", fg: "#fff", label: "Rejected" },
};

function ApprovalCenterPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);
  const [rows, setRows] = useState<ApprovalRequest[]>([]);
  const [filter, setFilter] = useState<"pending" | "all">("pending");
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  // form state
  const [storeName, setStoreName] = useState("");
  const [phone, setPhone] = useState("");
  const [reqType, setReqType] = useState<"credit_limit" | "consignment_restock">("credit_limit");
  const [amount, setAmount] = useState("");
  const [qty, setQty] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setChecking(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const load = useCallback(async () => {
    const { data, error } = await db()
      .from("nexus_approval_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows(data ?? []);
  }, []);

  useEffect(() => {
    if (session) load();
  }, [session, load]);

  async function decide(row: ApprovalRequest, status: "approved" | "rejected") {
    setBusy(row.id);
    const { error } = await db()
      .from("nexus_approval_requests")
      .update({ status, decided_by: session?.user.id, decided_at: new Date().toISOString() })
      .eq("id", row.id);
    setBusy(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`${row.ref} ${status}`);
    load();
  }

  async function submitRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!storeName.trim()) {
      toast.error("Store name is required");
      return;
    }
    const { error } = await db().from("nexus_approval_requests").insert({
      ref: nextApprovalRef(rows.length),
      request_type: reqType,
      store_name: storeName.trim(),
      contact_phone: phone.trim(),
      channel: "field",
      amount_zar_cents: Math.round(parseFloat(amount || "0") * 100),
      qty: parseInt(qty || "0", 10),
      notes: notes.trim(),
      created_by: session?.user.id,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Request lodged");
    setShowForm(false);
    setStoreName("");
    setPhone("");
    setAmount("");
    setQty("");
    setNotes("");
    load();
  }

  if (checking) {
    return <main className="mx-auto max-w-6xl px-5 py-10 text-sm text-black/50">Loading…</main>;
  }

  if (!session) {
    return (
      <main className="mx-auto max-w-6xl px-5 py-10">
        <Toaster />
        <div className="rounded-2xl border border-black/10 bg-white p-8 text-center">
          <CheckSquare className="mx-auto h-10 w-10 text-[#0056b3]" />
          <h1 className="mt-3 font-display text-2xl font-black uppercase italic">
            Willie's Approval Center
          </h1>
          <p className="mt-2 text-sm text-black/60">
            Sign in via the admin area to lodge and decide credit-limit and restock requests.
          </p>
        </div>
      </main>
    );
  }

  const visible = filter === "pending" ? rows.filter((r) => r.status === "pending") : rows;
  const pendingCount = rows.filter((r) => r.status === "pending").length;

  return (
    <main className="mx-auto max-w-6xl px-5 py-6">
      <Toaster />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-black uppercase italic">
            Willie's Approval Center
          </h1>
          <p className="text-sm text-black/60">
            {pendingCount} pending · credit limits &amp; consignment restocking
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex rounded-full border border-black/15 bg-white p-1">
            {(["pending", "all"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className="rounded-full px-3 py-1.5 font-display text-xs font-bold uppercase tracking-wider"
                style={{
                  backgroundColor: filter === f ? "#0056b3" : "transparent",
                  color: filter === f ? "#fff" : "#212529",
                }}
              >
                {f}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-1.5 rounded-full px-4 py-2 font-display text-xs font-bold uppercase tracking-wider text-white"
            style={{ backgroundColor: "#28a745" }}
          >
            <Plus className="h-4 w-4" /> New request
          </button>
        </div>
      </div>

      {showForm && (
        <form
          onSubmit={submitRequest}
          className="mt-4 grid gap-3 rounded-2xl border border-black/10 bg-white p-4 sm:grid-cols-2"
        >
          <label className="text-xs font-semibold text-black/60">
            Store name *
            <input
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="mt-1 h-10 w-full rounded-xl border border-black/15 px-3 text-sm outline-none focus:border-[#0056b3]"
              placeholder="Soshanguve Hardware"
            />
          </label>
          <label className="text-xs font-semibold text-black/60">
            Contact phone (WhatsApp)
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 h-10 w-full rounded-xl border border-black/15 px-3 text-sm outline-none focus:border-[#0056b3]"
              placeholder="+27 …"
            />
          </label>
          <label className="text-xs font-semibold text-black/60">
            Request type
            <select
              value={reqType}
              onChange={(e) => setReqType(e.target.value as typeof reqType)}
              className="mt-1 h-10 w-full rounded-xl border border-black/15 bg-white px-3 text-sm outline-none focus:border-[#0056b3]"
            >
              <option value="credit_limit">Credit limit</option>
              <option value="consignment_restock">Consignment restock</option>
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs font-semibold text-black/60">
              Amount (ZAR)
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                inputMode="decimal"
                className="mt-1 h-10 w-full rounded-xl border border-black/15 px-3 text-sm outline-none focus:border-[#0056b3]"
                placeholder="0.00"
              />
            </label>
            <label className="text-xs font-semibold text-black/60">
              Qty (units)
              <input
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                inputMode="numeric"
                className="mt-1 h-10 w-full rounded-xl border border-black/15 px-3 text-sm outline-none focus:border-[#0056b3]"
                placeholder="0"
              />
            </label>
          </div>
          <label className="text-xs font-semibold text-black/60 sm:col-span-2">
            Notes
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm outline-none focus:border-[#0056b3]"
              placeholder="Field context, store history…"
            />
          </label>
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="rounded-full px-5 py-2.5 font-display text-xs font-bold uppercase tracking-wider text-white"
              style={{ backgroundColor: "#0056b3" }}
            >
              Lodge request
            </button>
          </div>
        </form>
      )}

      <div className="mt-5 space-y-2">
        {visible.length === 0 && (
          <div className="rounded-2xl border border-black/10 bg-white p-8 text-center">
            <Clock className="mx-auto h-8 w-8 text-black/25" />
            <p className="mt-2 text-sm text-black/55">
              {filter === "pending" ? "No pending requests — queue is clear." : "No requests yet."}
            </p>
          </div>
        )}
        {visible.map((r) => {
          const s = STATUS_STYLE[r.status];
          return (
            <article
              key={r.id}
              className="flex flex-wrap items-center gap-3 rounded-2xl border border-black/10 bg-white p-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[11px] font-bold text-[#0056b3]">{r.ref}</span>
                  <span
                    className="rounded-full px-2 py-0.5 font-display text-[10px] font-black uppercase tracking-wider"
                    style={{ backgroundColor: s.bg, color: s.fg }}
                  >
                    {s.label}
                  </span>
                  <span className="rounded-full bg-black/[0.06] px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-black/60">
                    {r.request_type === "credit_limit" ? "Credit limit" : "Restock"}
                  </span>
                </div>
                <p className="mt-1 font-display text-base font-black">{r.store_name}</p>
                <p className="text-xs text-black/55">
                  {r.amount_zar_cents > 0 && <>{formatRand(r.amount_zar_cents)} · </>}
                  {r.qty > 0 && <>{r.qty} units · </>}
                  {new Date(r.created_at).toLocaleString("en-ZA")}
                  {r.contact_phone && <> · {r.contact_phone}</>}
                </p>
                {r.notes && <p className="mt-1 text-xs italic text-black/50">{r.notes}</p>}
              </div>
              {r.status === "pending" && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={busy === r.id}
                    onClick={() => decide(r, "approved")}
                    className="flex h-12 items-center gap-1.5 rounded-2xl px-4 font-display text-sm font-black uppercase text-white transition-transform active:scale-95 disabled:opacity-50"
                    style={{ backgroundColor: "#28a745" }}
                  >
                    <Check className="h-5 w-5" /> Approve
                  </button>
                  <button
                    type="button"
                    disabled={busy === r.id}
                    onClick={() => decide(r, "rejected")}
                    className="flex h-12 items-center gap-1.5 rounded-2xl px-4 font-display text-sm font-black uppercase text-white transition-transform active:scale-95 disabled:opacity-50"
                    style={{ backgroundColor: "#c0392b" }}
                  >
                    <X className="h-5 w-5" /> Reject
                  </button>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </main>
  );
}
