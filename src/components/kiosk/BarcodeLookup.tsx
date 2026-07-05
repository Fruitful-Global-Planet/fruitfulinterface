import { useEffect, useRef, useState } from "react";
import { X, ScanBarcode, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { KidswearRow } from "@/lib/kidswear";
import { rowToProduct, type KidswearProduct } from "@/lib/kidswear";
import { toast } from "sonner";

type Props = {
  onFound: (p: KidswearProduct) => void;
  onClose: () => void;
};

export function BarcodeLookup({ onFound, onClose }: Props) {
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function lookup(value: string) {
    const term = value.trim();
    if (!term) return;
    setBusy(true);
    const { data, error } = await supabase
      .from("bashedi_kidswear")
      .select("*")
      .or(`barcode.eq.${term},item_code.eq.${term},sku.eq.${term}`)
      .maybeSingle();
    setBusy(false);
    if (error || !data) {
      toast.error(`No match for "${term}"`);
      return;
    }
    onFound(rowToProduct(data as unknown as KidswearRow));
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
            onChange={(e) => setQ(e.target.value)}
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
      </div>
    </div>
  );
}
