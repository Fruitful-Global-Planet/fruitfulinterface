const KEY = "fruitful.scanHistory.v1";
const MAX = 8;

export type ScanHistoryEntry = {
  id: string;
  itemCode: string | null;
  barcode: string | null;
  name: string;
  imageUrl?: string;
  at: number; // epoch ms
};

export function loadScanHistory(): ScanHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, MAX) : [];
  } catch {
    return [];
  }
}

export function pushScanHistory(entry: ScanHistoryEntry): ScanHistoryEntry[] {
  const current = loadScanHistory().filter((e) => e.id !== entry.id);
  const next = [entry, ...current].slice(0, MAX);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // ignore quota errors
  }
  return next;
}

export function clearScanHistory() {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
