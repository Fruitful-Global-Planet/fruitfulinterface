import { useEffect, useRef, useState } from "react";
import { X, ScanBarcode, Search, History, AlertCircle, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { KidswearRow } from "@/lib/kidswear";
import { rowToProduct, type KidswearProduct } from "@/lib/kidswear";
import {
  clearScanHistory,
  loadScanHistory,
  pushScanHistory,
  type ScanHistoryEntry,
} from "@/lib/scan-history";
import { toast } from "sonner";

type Props = {
  onFound: (p: KidswearProduct) => void;
  onClose: () => void;
};

export function BarcodeLookup({ onFound, onClose }: Props) {
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [notFoundTerm, setNotFoundTerm] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [history, setHistory] = useState<ScanHistoryEntry[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    setHistory(loadScanHistory());
  }, []);

  function accept(product: KidswearProduct) {
    const r = product.row;
    const next = pushScanHistory({
      id: product.id,
      itemCode: r.item_code,
      barcode: r.barcode,
      name: product.name,
      imageUrl: r.image_url,
      at: Date.now(),
    });
    setHistory(next);
    onFound(product);
  }

  async function lookup(value: string) {
    const term = value.trim();
    if (!term) return;
    setBusy(true);
    setErrorMsg(null);
    setNotFoundTerm(null);
    const { data, error } = await supabase
      .from("bashedi_kidswear")
      .select("*")
      .or(`barcode.eq.${term},item_code.eq.${term},sku.eq.${term}`)
      .maybeSingle();
    setBusy(false);
    if (error) {
      setErrorMsg(error.message);
      toast.error(error.message);
      return;
    }
    if (!data) {
      setNotFoundTerm(term);
      return;
    }
    accept(rowToProduct(data as unknown as KidswearRow));
  }

  async function openFromHistory(entry: ScanHistoryEntry) {
    const rawId = entry.id.startsWith("ks-") ? entry.id.slice(3) : entry.id;
    setBusy(true);
    const { data, error } = await supabase
      .from("bashedi_kidswear")
      .select("*")
      .eq("id", rawId)
      .maybeSingle();
    setBusy(false);
    if (error || !data) {
      toast.error("Item no longer available");
      return;
    }
    accept(rowToProduct(data as unknown as KidswearRow));
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 sm:items-center">
      <div className="w-full max-w-md rounded-t-3xl bg-background p-6 sm:rounded-3xl">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-display text-lg font-bold">
            <ScanBarcode className="h-5 w-5" style={{ color: "var(--coral)" }} />
            Barcode lookup
          </h3>
          <button onClick={onClose} aria-label="Close" className="rounded-full p-2 hover:bg-secondary">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Scan or type a barcode, item code, or SKU to jump to the product.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            lookup(q);
          }}
          className="mt-4 flex gap-2"
        >
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setNotFoundTerm(null);
              setErrorMsg(null);
            }}
            placeholder="e.g. BSK-001 or 6009800000010"
            className="flex-1 rounded-xl border border-border bg-background px-4 py-3 font-mono text-sm"
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={busy || !q.trim()}
            className="flex items-center gap-1 rounded-xl px-4 py-3 font-display text-sm font-bold text-white disabled:opacity-40"
            style={{ backgroundColor: "var(--coral)" }}
          >
            <Search className="h-4 w-4" />
            {busy ? "…" : "Find"}
          </button>
        </form>

        {notFoundTerm && (
          <div
            className="mt-3 flex items-start gap-2 rounded-xl border px-3 py-2 text-xs"
            style={{ borderColor: "var(--coral)", backgroundColor: "color-mix(in oklab, var(--coral) 8%, transparent)", color: "var(--ink)" }}
          >
            <AlertCircle className="h-4 w-4 shrink-0" style={{ color: "var(--coral)" }} />
            <div>
              <p className="font-display font-bold">No Kidswear item matches "{notFoundTerm}"</p>
              <p className="mt-0.5 text-muted-foreground">
                Check the item code (BSK-###), the barcode digits, or ask a staff member.
              </p>
            </div>
          </div>
        )}
        {errorMsg && (
          <div className="mt-3 rounded-xl border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
            Lookup error: {errorMsg}
          </div>
        )}

        {/* Recent scans */}
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <p className="flex items-center gap-1.5 font-display text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              <History className="h-3.5 w-3.5" />
              Recent scans
            </p>
            {history.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  clearScanHistory();
                  setHistory([]);
                }}
                className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
              >
                <Trash2 className="h-3 w-3" />
                Clear
              </button>
            )}
          </div>
          {history.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border px-3 py-3 text-center text-xs text-muted-foreground">
              No recent scans yet. Scanned items show up here for quick re-opening.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {history.map((h) => (
                <li key={h.id}>
                  <button
                    type="button"
                    onClick={() => openFromHistory(h)}
                    disabled={busy}
                    className="flex w-full items-center gap-3 rounded-xl border border-border bg-card px-2.5 py-2 text-left transition hover:border-[var(--coral)] disabled:opacity-50"
                  >
                    {h.imageUrl ? (
                      <img src={h.imageUrl} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
                    ) : (
                      <div className="h-10 w-10 shrink-0 rounded-lg bg-secondary" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display text-sm font-bold" style={{ color: "var(--ink)" }}>
                        {h.name}
                      </p>
                      <p className="truncate font-mono text-[10px] text-muted-foreground">
                        {h.itemCode ?? "—"} · {h.barcode ?? "—"}
                      </p>
                    </div>
                    <span className="shrink-0 text-[10px] text-muted-foreground">{relTime(h.at)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function relTime(ts: number) {
  const s = Math.round((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.round(h / 24)}d`;
}
