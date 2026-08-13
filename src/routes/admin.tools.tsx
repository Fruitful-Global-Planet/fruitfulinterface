import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { KeyRound, QrCode, Barcode, ReceiptText, LineChart, Globe } from "lucide-react";

import {
  generateBarcode,
  generatePassword,
  generateQrCode,
  getUnemployment,
  lookupIp,
  validateVat,
} from "@/lib/api/ninjas.functions";

export const Route = createFileRoute("/admin/tools")({
  head: () => ({
    meta: [
      { title: "Fruitful Admin · Data Tools" },
      { name: "description", content: "QR codes, barcodes, VAT validation, IP lookup and password tools for Fruitful kiosk staff." },
      { property: "og:title", content: "Fruitful Admin · Data Tools" },
      { property: "og:description", content: "Kiosk staff utilities: QR + barcode generation, VAT validation, unemployment data and IP lookup." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ToolsPage,
});

function Card({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <h2 className="flex items-center gap-2 font-display text-base font-bold">
        <span style={{ color: "var(--coral)" }}>{icon}</span>
        {title}
      </h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}

const inputCls = "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm";
const btnCls =
  "rounded-xl px-4 py-2 font-display text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-40";

function Pre({ value }: { value: unknown }) {
  if (value == null) return null;
  return (
    <pre className="max-h-56 overflow-auto rounded-xl bg-secondary p-3 font-mono text-[11px]">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

function ToolsPage() {
  const password = useServerFn(generatePassword);
  const qr = useServerFn(generateQrCode);
  const bar = useServerFn(generateBarcode);
  const vat = useServerFn(validateVat);
  const unemployment = useServerFn(getUnemployment);
  const ip = useServerFn(lookupIp);

  const [busy, setBusy] = useState<string | null>(null);

  const [pwLen, setPwLen] = useState(16);
  const [pwNoSpecial, setPwNoSpecial] = useState(false);
  const [pwOut, setPwOut] = useState<string | null>(null);

  const [qrText, setQrText] = useState("https://fruitfulinterface.lovable.app");
  const [qrImg, setQrImg] = useState<string | null>(null);

  const [barValue, setBarValue] = useState("6009800000010");
  const [barImg, setBarImg] = useState<string | null>(null);

  const [vatNo, setVatNo] = useState("SE556656688001");
  const [vatOut, setVatOut] = useState<unknown>(null);

  const [country, setCountry] = useState("south africa");
  const [unOut, setUnOut] = useState<unknown>(null);

  const [ipAddr, setIpAddr] = useState("8.8.8.8");
  const [ipOut, setIpOut] = useState<unknown>(null);

  async function run<T>(tag: string, fn: () => Promise<{ ok: true; data: T } | { ok: false; error: string }>, onOk: (d: T) => void) {
    setBusy(tag);
    try {
      const res = await fn();
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      onOk(res.data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-6">
      <h1 className="font-display text-2xl font-bold">Data tools</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Powered by API Ninjas. All calls run on the server — the API key never reaches the browser.
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Card title="Password generator" icon={<KeyRound className="h-4 w-4" />}>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={6}
              max={64}
              value={pwLen}
              onChange={(e) => setPwLen(Number(e.target.value))}
              className={inputCls}
            />
            <label className="flex shrink-0 items-center gap-1.5 text-xs">
              <input type="checkbox" checked={pwNoSpecial} onChange={(e) => setPwNoSpecial(e.target.checked)} />
              No symbols
            </label>
          </div>
          <button
            className={btnCls}
            style={{ backgroundColor: "var(--coral)" }}
            disabled={busy === "pw"}
            onClick={() =>
              run("pw", () => password({ data: { length: pwLen, excludeSpecialChars: pwNoSpecial } }), (d) =>
                setPwOut(d.random_password),
              )
            }
          >
            {busy === "pw" ? "Generating…" : "Generate"}
          </button>
          {pwOut && (
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(pwOut);
                toast.success("Copied");
              }}
              className="w-full rounded-xl bg-secondary px-3 py-2 text-left font-mono text-sm"
            >
              {pwOut}
            </button>
          )}
        </Card>

        <Card title="QR code" icon={<QrCode className="h-4 w-4" />}>
          <input value={qrText} onChange={(e) => setQrText(e.target.value)} className={inputCls} placeholder="URL or text" />
          <button
            className={btnCls}
            style={{ backgroundColor: "var(--coral)" }}
            disabled={busy === "qr" || !qrText.trim()}
            onClick={() => run("qr", () => qr({ data: { data: qrText, fgColor: "000000", bgColor: "ffffff" } }), setQrImg)}
          >
            {busy === "qr" ? "Generating…" : "Generate QR"}
          </button>
          {qrImg && <img src={qrImg} alt="Generated QR code" className="h-40 w-40 rounded-xl border border-border bg-white p-2" />}
        </Card>

        <Card title="Barcode" icon={<Barcode className="h-4 w-4" />}>
          <input value={barValue} onChange={(e) => setBarValue(e.target.value)} className={inputCls} placeholder="Barcode digits" />
          <button
            className={btnCls}
            style={{ backgroundColor: "var(--coral)" }}
            disabled={busy === "bar" || !barValue.trim()}
            onClick={() => run("bar", () => bar({ data: { value: barValue } }), setBarImg)}
          >
            {busy === "bar" ? "Generating…" : "Generate barcode"}
          </button>
          {barImg && <img src={barImg} alt="Generated barcode" className="w-full rounded-xl border border-border bg-white p-2" />}
        </Card>

        <Card title="VAT validation" icon={<ReceiptText className="h-4 w-4" />}>
          <input value={vatNo} onChange={(e) => setVatNo(e.target.value)} className={inputCls} placeholder="EU VAT number" />
          <button
            className={btnCls}
            style={{ backgroundColor: "var(--coral)" }}
            disabled={busy === "vat" || !vatNo.trim()}
            onClick={() => run("vat", () => vat({ data: { vat: vatNo } }), setVatOut)}
          >
            {busy === "vat" ? "Checking…" : "Validate"}
          </button>
          <Pre value={vatOut} />
        </Card>

        <Card title="Unemployment data" icon={<LineChart className="h-4 w-4" />}>
          <input value={country} onChange={(e) => setCountry(e.target.value)} className={inputCls} placeholder="Country" />
          <button
            className={btnCls}
            style={{ backgroundColor: "var(--coral)" }}
            disabled={busy === "un" || !country.trim()}
            onClick={() => run("un", () => unemployment({ data: { country } }), setUnOut)}
          >
            {busy === "un" ? "Loading…" : "Fetch"}
          </button>
          <Pre value={unOut} />
        </Card>

        <Card title="IP lookup" icon={<Globe className="h-4 w-4" />}>
          <input value={ipAddr} onChange={(e) => setIpAddr(e.target.value)} className={inputCls} placeholder="IP address" />
          <button
            className={btnCls}
            style={{ backgroundColor: "var(--coral)" }}
            disabled={busy === "ip" || !ipAddr.trim()}
            onClick={() => run("ip", () => ip({ data: { address: ipAddr } }), setIpOut)}
          >
            {busy === "ip" ? "Looking up…" : "Look up"}
          </button>
          <Pre value={ipOut} />
        </Card>
      </div>
    </div>
  );
}
