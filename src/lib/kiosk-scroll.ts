import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Kiosk scroll utilities.
 *
 * - One root vertical scroller per screen (no nested scroll traps).
 * - Sticky header / bottom dock heights are measured and exposed as CSS vars
 *   plus scroll-padding, so anchors and content never hide behind them.
 * - Scroll position is remembered per screen key, so returning to a screen
 *   lands you exactly where you left off.
 */

const positions = new Map<string, number>();

export function getSavedScroll(key: string) {
  return positions.get(key) ?? 0;
}

export function clearSavedScroll(key: string) {
  positions.delete(key);
}

type Options = {
  /** Unique key per kiosk screen, e.g. "browse" or "cart". */
  key: string;
  /** Restoration waits until this is true (e.g. data loaded). */
  ready?: boolean;
};

export function useKioskScroll({ key, ready = true }: Options) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [root, setRoot] = useState<HTMLDivElement | null>(null);
  const headerRef = useRef<HTMLElement | null>(null);
  const dockRef = useRef<HTMLElement | null>(null);
  const restored = useRef(false);

  const scrollRef = useCallback((node: HTMLDivElement | null) => {
    rootRef.current = node;
    setRoot(node);
  }, []);

  const onScroll = useCallback(() => {
    const el = rootRef.current;
    if (el) positions.set(key, el.scrollTop);
  }, [key]);

  // Measure sticky chrome so content/anchors never sit under it.
  useEffect(() => {
    if (!root) return;
    const sync = () => {
      const h = headerRef.current?.getBoundingClientRect().height ?? 0;
      const d = dockRef.current?.getBoundingClientRect().height ?? 0;
      root.style.setProperty("--kiosk-header-h", `${Math.round(h)}px`);
      root.style.setProperty("--kiosk-dock-h", `${Math.round(d)}px`);
      root.style.scrollPaddingTop = `${Math.round(h) + 12}px`;
      root.style.scrollPaddingBottom = `${Math.round(d) + 12}px`;
    };
    sync();
    const ro = new ResizeObserver(sync);
    if (headerRef.current) ro.observe(headerRef.current);
    if (dockRef.current) ro.observe(dockRef.current);
    ro.observe(root);
    window.addEventListener("resize", sync);
    window.addEventListener("orientationchange", sync);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", sync);
      window.removeEventListener("orientationchange", sync);
    };
  }, [root]);

  // Restore scroll position once content is ready. Content (images, async
  // lists) can grow after mount, so retry briefly until the target sticks.
  useEffect(() => {
    if (!root || !ready || restored.current) return;
    const target = positions.get(key) ?? 0;
    if (target <= 0) {
      restored.current = true;
      return;
    }
    let frames = 0;
    let raf = 0;
    const tick = () => {
      frames += 1;
      const max = Math.max(0, root.scrollHeight - root.clientHeight);
      root.scrollTop = Math.min(target, max);
      if (Math.abs(root.scrollTop - target) <= 2 || frames >= 180) {
        restored.current = true;
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [root, key, ready]);

  const jumpTo = useCallback((sectionId: string) => {
    const el = rootRef.current;
    if (!el) return;
    const target = el.querySelector<HTMLElement>(`[data-kiosk-section="${sectionId}"]`);
    if (!target) return;
    const headerH = parseInt(el.style.getPropertyValue("--kiosk-header-h") || "0", 10);
    el.scrollTo({ top: Math.max(0, target.offsetTop - headerH - 12), behavior: "smooth" });
  }, []);

  const jumpToTop = useCallback(() => {
    rootRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return { scrollRef, onScroll, headerRef, dockRef, jumpTo, jumpToTop };
}

/** Classes for the single root scroller of every kiosk screen. */
export const KIOSK_SCROLLER_CLASS =
  "relative h-full w-full min-w-0 max-w-full overflow-x-hidden overflow-y-auto overscroll-contain";
