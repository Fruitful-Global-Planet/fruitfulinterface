import { useCallback, useEffect, useRef } from "react";

/**
 * Kiosk scroll utilities.
 *
 * - One root vertical scroller per screen (no nested scroll traps).
 * - Sticky header / bottom dock heights are measured and exposed as CSS vars
 *   so content never sits underneath them on any screen size.
 * - Scroll position is remembered per screen key so returning to a screen
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
  /** Restoration is skipped until this is true (e.g. data loaded). */
  ready?: boolean;
};

export function useKioskScroll({ key, ready = true }: Options) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const headerRef = useRef<HTMLElement | null>(null);
  const dockRef = useRef<HTMLElement | null>(null);
  const restored = useRef(false);

  // Measure sticky chrome so content/anchors never hide behind it.
  useEffect(() => {
    const root = scrollRef.current;
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
  }, []);

  // Persist scroll position.
  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    const onScroll = () => positions.set(key, root.scrollTop);
    root.addEventListener("scroll", onScroll, { passive: true });
    // Note: do NOT re-save on cleanup — the element is already being torn down
    // and reports scrollTop 0, which would wipe the position we want to keep.
    return () => root.removeEventListener("scroll", onScroll);
  }, [key]);

  // Restore scroll position once content is ready. Content (images, async
  // lists) can grow after mount, so retry briefly until the target sticks.
  useEffect(() => {
    if (!ready || restored.current) return;
    const root = scrollRef.current;
    if (!root) return;
    const target = positions.get(key) ?? 0;
    if (target <= 0) {
      restored.current = true;
      return;
    }

    let frames = 0;
    let raf = 0;
    const tick = () => {
      frames += 1;
      (window as any).__rlog = ((window as any).__rlog||[]).concat([[frames, root.scrollHeight, root.clientHeight, root.scrollTop]]);
      const max = Math.max(0, root.scrollHeight - root.clientHeight);
      root.scrollTop = Math.min(target, max);
      if (Math.abs(root.scrollTop - target) <= 2) {
        restored.current = true;
        return;
      }
      if (frames < 180) raf = requestAnimationFrame(tick);
      else restored.current = true;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [key, ready]);


  const jumpTo = useCallback((sectionId: string) => {
    const root = scrollRef.current;
    if (!root) return;
    const el = root.querySelector<HTMLElement>(`[data-kiosk-section="${sectionId}"]`);
    if (!el) return;
    const headerH = parseInt(root.style.getPropertyValue("--kiosk-header-h") || "0", 10);
    const top = el.offsetTop - headerH - 12;
    root.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  }, []);

  const jumpToTop = useCallback(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return { scrollRef, headerRef, dockRef, jumpTo, jumpToTop };
}

/** Classes for the single root scroller of every kiosk screen. */
export const KIOSK_SCROLLER_CLASS =
  "relative h-full w-full min-w-0 max-w-full overflow-x-hidden overflow-y-auto overscroll-contain";
