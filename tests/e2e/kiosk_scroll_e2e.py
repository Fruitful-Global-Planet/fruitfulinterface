"""
End-to-end check: kiosk screens must have exactly one vertical scroller
(no nested scroll traps) and the third section must always be reachable,
both by manual scrolling and via the quick-jump anchors.

Run:  python3 tests/e2e/kiosk_scroll_e2e.py [base_url]
"""

import asyncio
import sys
from playwright.async_api import async_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8080"
VIEWPORTS = [
    {"width": 390, "height": 844},    # phone portrait
    {"width": 480, "height": 1280},   # kiosk portrait
    {"width": 1280, "height": 800},   # desktop
]

FIND_SCROLLERS = """
() => {
  const out = [];
  document.querySelectorAll('*').forEach((el) => {
    const s = getComputedStyle(el);
    const scrollable = /(auto|scroll)/.test(s.overflowY);
    if (scrollable && el.scrollHeight > el.clientHeight + 4) {
      out.push({
        tag: el.tagName.toLowerCase(),
        cls: (el.className || '').toString().slice(0, 60),
        key: el.dataset.kioskScroller || null,
      });
    }
  });
  return out;
}
"""


async def check(page, label, failures):
    scrollers = await page.evaluate(FIND_SCROLLERS)
    named = [s for s in scrollers if s["key"]]
    if len(scrollers) != 1 or len(named) != 1:
        failures.append(f"{label}: expected 1 kiosk scroller, found {scrollers}")

    root = page.locator("[data-kiosk-scroller]").first
    sections = await page.locator("[data-kiosk-section]").count()
    if sections < 3:
        failures.append(f"{label}: only {sections} anchored sections")

    # third section reachable by manual scrolling
    await root.evaluate("el => el.scrollTo({ top: el.scrollHeight })")
    await page.wait_for_timeout(250)
    reached = await root.evaluate(
        "el => el.scrollTop + el.clientHeight >= el.scrollHeight - 4"
    )
    if not reached:
        failures.append(f"{label}: could not scroll to the bottom")

    # quick-jump anchor lands the third section below the sticky header
    await root.evaluate("el => el.scrollTo({ top: 0 })")
    await page.wait_for_timeout(150)
    jump = page.locator('[data-jump="products"]')
    if await jump.count() == 0:
        failures.append(f"{label}: missing quick-jump control for products")
        return
    await jump.first.click()
    await page.wait_for_timeout(700)
    ok = await page.evaluate(
        """() => {
          const header = document.querySelector('[data-kiosk-scroller] header');
          const sec = document.querySelector('[data-kiosk-section="products"]');
          if (!sec) return false;
          const hb = header ? header.getBoundingClientRect().bottom : 0;
          return sec.getBoundingClientRect().top >= hb - 2;
        }"""
    )
    if not ok:
        failures.append(f"{label}: products section hidden behind sticky header after jump")


async def main():
    failures = []
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        for vp in VIEWPORTS:
            ctx = await browser.new_context(viewport=vp)
            page = await ctx.new_page()
            await page.goto(BASE, wait_until="domcontentloaded")
            await page.wait_for_timeout(2000)  # allow hydration
            await page.get_by_role("button", name="Tap to start ordering").first.click()
            await page.wait_for_selector('[data-kiosk-scroller="browse"]')
            await page.wait_for_timeout(1200)
            await check(page, f"browse@{vp['width']}x{vp['height']}", failures)
            await ctx.close()
        await browser.close()

    if failures:
        print("FAIL")
        for f in failures:
            print(" -", f)
        sys.exit(1)
    print("PASS: single scroller, third section reachable, no header overlap")


asyncio.run(main())
