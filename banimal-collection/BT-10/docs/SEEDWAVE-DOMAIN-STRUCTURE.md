![Fruitful Banner](../fruitful-banner.png)

# Seedwave Domain Structure

**Status: Architecture document. DNS and configs are in place. Worker host-routing is the outstanding piece.**

---

## Overview

The Fruitful Ecosystem operates on a two-tier domain model:

```
Tier 1 — Core
  seedwave.faa.zone

Tier 2 — Subnodes
  {brand}.seedwave.faa.zone

Tier 3 — Direct brand domains (optional)
  {brand}.faa.zone
```

ToyNest is the first concrete named subnode:
```
  toynest.seedwave.faa.zone
```

---

## DNS Strategy

### Option A — Wildcard (recommended for scale)
```
*.seedwave.faa.zone  CNAME  seedwave-router.faa.zone
```
A single wildcard record routes all subnode hostnames to the same Cloudflare Worker entry point. The worker then resolves the brand from the hostname.

**Pros:** Zero DNS changes when adding new subnodes.
**Cons:** Any typo subdomain also resolves (handled by worker returning 404 for unknown brands).

### Option B — Per-record (explicit, current state)
```
toynest.seedwave.faa.zone  CNAME  seedwave-router.faa.zone
banimal.seedwave.faa.zone  CNAME  seedwave-router.faa.zone
```
**Pros:** Explicit, auditable.
**Cons:** Manual addition per brand.

**Recommendation:** Start with per-record, migrate to wildcard at 5+ subnodes.

---

## The Routing Gap (the 20%)

The current `workers/banimal-router/index.js` routes on **path** only:
```js
// Current: path-only routing
if (url.pathname === '/webhooks/paystack') { ... }
if (url.pathname === '/api/products') { ... }
```

This means every subnode hostname falls through identically. To make `toynest.seedwave.faa.zone` resolve to its own store instead of Banimal's, the worker must branch on `url.hostname`:
```js
// Required: hostname-first routing
const brand = extractBrand(url.hostname); // 'toynest', 'banimal', etc.
const config = await loadBrandConfig(brand, env.BRAND_CONFIGS);
if (!config) return new Response('Store not found', { status: 404 });
// ... route on path within brand context
```

See `workers/seedwave-router/index.js` for the full implementation.

---

## Subnode Inventory

| Brand    | Domain                          | Config file                        | Status      |
|----------|---------------------------------|------------------------------------|-------------|
| (core)   | seedwave.faa.zone               | —                                  | DNS pending |
| ToyNest  | toynest.seedwave.faa.zone       | configs/toynest.seedwave.json      | Draft       |
| Banimal  | banimal.faa.zone                | catalog/products.json              | Active      |
| {brand}  | {brand}.seedwave.faa.zone       | configs/{brand}.seedwave.json      | Template    |

---

## Adding a New Subnode

1. Copy `configs/_template.json` to `configs/{brand}.seedwave.json`
2. Fill in brand name, colors, catalog, phases
3. Add DNS record: `{brand}.seedwave.faa.zone CNAME seedwave-router.faa.zone`
4. Add brand to KV namespace in Cloudflare (`BRAND_CONFIGS`)
5. Worker auto-loads config on next request

---

## Three Things That Make Subnodes Real

1. **DNS** — `{brand}.seedwave.faa.zone` resolves to the worker entry point
2. **Worker host routing** — worker reads `url.hostname`, extracts brand, loads its config
3. **Per-brand catalog config** — `configs/{brand}.seedwave.json` with products, theme, phases

DNS (#1) and configs (#3) are the easy 80%. Worker host routing (#2) is the piece in `workers/seedwave-router/index.js`.

---

*FPSL v1.0 — Fruitful Holdings (Pty) Ltd — vault@faa.zone*
