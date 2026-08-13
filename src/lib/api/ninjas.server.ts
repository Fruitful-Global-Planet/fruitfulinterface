import process from "node:process";

const BASE = "https://api.api-ninjas.com/v1";

export type NinjaResult<T> = { ok: true; data: T } | { ok: false; error: string };

function key(): string {
  const k = process.env["API_NINJAS_KEY"];
  if (!k) throw new Error("API_NINJAS_KEY is not configured yet.");
  return k;
}

export async function ninjaJson<T>(path: string): Promise<NinjaResult<T>> {
  try {
    const res = await fetch(`${BASE}/${path}`, { headers: { "X-Api-Key": key() } });
    const text = await res.text();
    if (!res.ok) {
      let msg = text;
      try {
        msg = (JSON.parse(text) as { message?: string; error?: string }).message ?? text;
      } catch { /* raw text */ }
      return { ok: false, error: `${res.status}: ${msg}` };
    }
    return { ok: true, data: JSON.parse(text) as T };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

/** Fetch a binary image endpoint and return it as a data URL. */
export async function ninjaImage(path: string, mime = "image/png"): Promise<NinjaResult<string>> {
  try {
    const res = await fetch(`${BASE}/${path}`, { headers: { "X-Api-Key": key() } });
    if (!res.ok) {
      const text = await res.text();
      let msg = text;
      try {
        msg = (JSON.parse(text) as { message?: string }).message ?? text;
      } catch { /* raw text */ }
      return { ok: false, error: `${res.status}: ${msg}` };
    }
    const buf = new Uint8Array(await res.arrayBuffer());
    let binary = "";
    for (let i = 0; i < buf.length; i++) binary += String.fromCharCode(buf[i]!);
    // Some endpoints return the image already base64-encoded as text.
    const b64 = /^[A-Za-z0-9+/=\s]+$/.test(binary) && binary.trimStart().startsWith("iVBOR")
      ? binary.trim()
      : btoa(binary);
    return { ok: true, data: `data:${mime};base64,${b64}` };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
