import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { computeKidswearPrice } from "@/lib/kidswear-pricing";
import { Upload, Download, FileSpreadsheet } from "lucide-react";

const CSV_HEADERS = [
  "item_code","name","description","long_description","barcode","sku",
  "cost_price_excl_vat_zar","markup","vat_rate",
  "size_label","age_range","fabric","color","gender","brand",
  "image_url","stock","is_published","tags",
];

const TEMPLATE_ROWS = [
  ["BSK-001","Bashedi Bloom Dress","Playful floral dress","Long descriptive text here…","6009800000010","BASHEDI-KIDS-001","400","3.5","0.15","4-5Y","4-5 years","Cotton","Coral","Girls","Bashedi","https://example.com/img.png","10","true","summer;dress"],
];

function toCsv(rows: string[][]): string {
  return rows.map((r) => r.map(csvCell).join(",")).join("\n");
}
function csvCell(v: string): string {
  if (v == null) return "";
  const needsQuote = /[",\n]/.test(v);
  const s = v.replace(/"/g, '""');
  return needsQuote ? `"${s}"` : s;
}
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false;
      } else field += c;
    } else {
      if (c === '"') inQ = true;
      else if (c === ",") { cur.push(field); field = ""; }
      else if (c === "\n") { cur.push(field); rows.push(cur); cur = []; field = ""; }
      else if (c === "\r") { /* skip */ }
      else field += c;
    }
  }
  if (field.length || cur.length) { cur.push(field); rows.push(cur); }
  return rows.filter((r) => r.some((c) => c.trim().length));
}

export type CsvImportResult = {
  total: number;
  inserted: number;
  updated: number;
  errors: { row: number; message: string }[];
};

export function CsvImport({ onImported }: { onImported: () => void }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<CsvImportResult | null>(null);

  function downloadTemplate() {
    const csv = toCsv([CSV_HEADERS, ...TEMPLATE_ROWS]);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "kidswear-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleFile(file: File) {
    setBusy(true);
    setResult(null);
    try {
      const text = await file.text();
      const rows = parseCsv(text);
      if (rows.length < 2) throw new Error("CSV must have a header row and at least one data row");
      const header = rows[0].map((h) => h.trim().toLowerCase());
      const idx = (k: string) => header.indexOf(k);
      const required = ["item_code"];
      for (const req of required) {
        if (idx(req) < 0) throw new Error(`Missing required column: ${req}`);
      }

      // Fetch existing rows once to decide insert vs update by item_code.
      const { data: existing, error: exErr } = await supabase
        .from("bashedi_kidswear")
        .select("id,item_code,slot_number,cost_price_excl_vat_cents,markup_multiplier,vat_rate");
      if (exErr) throw exErr;
      const byCode = new Map<string, typeof existing[number]>();
      let maxSlot = 0;
      (existing ?? []).forEach((r) => {
        if (r.item_code) byCode.set(r.item_code, r);
        if (r.slot_number > maxSlot) maxSlot = r.slot_number;
      });

      const errors: CsvImportResult["errors"] = [];
      let inserted = 0;
      let updated = 0;

      for (let i = 1; i < rows.length; i++) {
        const r = rows[i];
        try {
          const get = (k: string) => (idx(k) >= 0 ? (r[idx(k)] ?? "").trim() : "");
          const item_code = get("item_code");
          if (!item_code) throw new Error("empty item_code");
          const costR = Number(get("cost_price_excl_vat_zar") || "0");
          const markup = Number(get("markup") || "3.5");
          const vat = Number(get("vat_rate") || "0.15");
          const cost_cents = Math.round(costR * 100);
          const pricing = computeKidswearPrice(cost_cents, markup, vat);
          const tagsRaw = get("tags");
          const tags = tagsRaw ? tagsRaw.split(/[;|]/).map((s) => s.trim()).filter(Boolean) : [];
          const publishedRaw = get("is_published").toLowerCase();
          const is_published = publishedRaw === "" ? true : ["true","1","yes","y"].includes(publishedRaw);

          const payload = {
            item_code,
            name: get("name") || item_code,
            description: get("description"),
            long_description: get("long_description"),
            barcode: get("barcode") || null,
            sku: get("sku") || null,
            cost_price_excl_vat_cents: cost_cents,
            markup_multiplier: markup,
            vat_rate: vat,
            price_zar_cents: pricing.priceInclVatCents,
            size_label: get("size_label"),
            age_range: get("age_range"),
            fabric: get("fabric"),
            color: get("color"),
            gender: get("gender"),
            brand: get("brand") || "Bashedi Kidswear",
            image_url: get("image_url"),
            stock: Number(get("stock") || "0"),
            is_published,
            tags,
          };

          const found = byCode.get(item_code);
          if (found) {
            const { error } = await supabase
              .from("bashedi_kidswear")
              .update(payload)
              .eq("id", found.id);
            if (error) throw error;
            updated++;
          } else {
            maxSlot++;
            const { error } = await supabase
              .from("bashedi_kidswear")
              .insert({ ...payload, slot_number: maxSlot });
            if (error) throw error;
            inserted++;
          }
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e);
          errors.push({ row: i + 1, message: msg });
        }
      }

      const res: CsvImportResult = { total: rows.length - 1, inserted, updated, errors };
      setResult(res);
      if (errors.length === 0) toast.success(`Imported ${inserted + updated} rows`);
      else toast.warning(`${inserted + updated} rows imported · ${errors.length} errors`);
      onImported();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-6 rounded-2xl border border-dashed border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 font-display text-base font-bold">
            <FileSpreadsheet className="h-4 w-4" style={{ color: "var(--coral)" }} />
            Bulk CSV import
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Upload a CSV to add or update Kidswear items in one step. Rows are matched by <code>item_code</code>.
            Selling price is recalculated from <code>cost_price_excl_vat_zar × markup × (1 + vat_rate)</code>.
          </p>
        </div>
        <button
          type="button"
          onClick={downloadTemplate}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 font-display text-xs font-bold"
        >
          <Download className="h-3.5 w-3.5" />
          Template
        </button>
      </div>
      <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-3 font-display text-sm font-bold text-white transition hover:opacity-90"
        style={{ backgroundColor: "var(--coral)" }}>
        <Upload className="h-4 w-4" />
        {busy ? "Importing…" : "Choose CSV file"}
        <input
          type="file"
          accept=".csv,text/csv"
          disabled={busy}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
        />
      </label>
      {result && (
        <div className="mt-3 rounded-xl bg-secondary px-3 py-2 text-xs">
          <p className="font-display font-bold">
            {result.inserted} inserted · {result.updated} updated · {result.errors.length} errors
            <span className="ml-1 text-muted-foreground">(of {result.total} rows)</span>
          </p>
          {result.errors.length > 0 && (
            <ul className="mt-2 max-h-32 space-y-0.5 overflow-y-auto text-[11px] text-destructive">
              {result.errors.map((e) => (
                <li key={e.row}>Row {e.row}: {e.message}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
