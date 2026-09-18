/**
 * seedwave-router — Cloudflare Worker
 * Fruitful Proprietary Source License (FPSL) v1.0
 * Copyright (c) 2024-2026 Fruitful Holdings (Pty) Ltd
 * vault@faa.zone | https://faa.zone
 *
 * This is the 20% that makes subnodes real.
 * Routes on url.hostname first, then url.pathname within brand context.
 * Reads brand configs from Cloudflare KV (BRAND_CONFIGS binding).
 *
 * NOTICE: Use of this file constitutes acceptance of FPSL v1.0 terms
 * with immediate effect. See LICENSE and NOTICE.md at repo root.
 */

// ---------------------------------------------------------------------------
// Config loader — reads from KV or falls back to static import
// ---------------------------------------------------------------------------

/**
 * loadBrandConfig
 * @param {string} brand - brand slug e.g. 'toynest', 'banimal'
 * @param {KVNamespace} kv   - Cloudflare KV binding BRAND_CONFIGS
 * @returns {Object|null}    - parsed brand config or null if not found
 */
async function loadBrandConfig(brand, kv) {
  if (!brand) return null;

  // Try KV first (runtime config, hotswappable)
  if (kv) {
    try {
      const raw = await kv.get(`brand:${brand}`, { type: 'json' });
      if (raw) return raw;
    } catch (e) {
      console.error(`KV read failed for brand:${brand}`, e.message);
    }
  }

  // Fallback: known brands hardcoded (extend as subnodes are added)
  const staticConfigs = {
    banimal: {
      brand: 'banimal',
      display_name: 'Banimal',
      domain: 'banimal.faa.zone',
      theme: { primary: '#1A1A2E', secondary: '#16213E' },
      phases: { public_launch: true },
      catalog: { currency: 'ZAR', payment_provider: 'paystack' }
    },
    toynest: {
      brand: 'toynest',
      display_name: 'ToyNest',
      domain: 'toynest.seedwave.faa.zone',
      theme: { primary: '#2D7D46', secondary: '#F5F0E8' },
      phases: { public_launch: false },
      catalog: { currency: 'ZAR', payment_provider: 'paystack' }
    }
  };

  return staticConfigs[brand] || null;
}

// ---------------------------------------------------------------------------
// Brand extraction — hostname -> brand slug
// ---------------------------------------------------------------------------

/**
 * extractBrand
 * Supports:
 *   toynest.seedwave.faa.zone -> 'toynest'
 *   banimal.faa.zone          -> 'banimal'
 *   banimal.seedwave.faa.zone -> 'banimal'
 *   seedwave.faa.zone         -> 'core'
 * @param {string} hostname
 * @returns {string|null}
 */
function extractBrand(hostname) {
  if (!hostname) return null;

  // Core domain
  if (hostname === 'seedwave.faa.zone') return 'core';

  // {brand}.seedwave.faa.zone
  const seedwaveMatch = hostname.match(/^([a-z0-9-]+)\.seedwave\.faa\.zone$/);
  if (seedwaveMatch) return seedwaveMatch[1];

  // {brand}.faa.zone
  const directMatch = hostname.match(/^([a-z0-9-]+)\.faa\.zone$/);
  if (directMatch) return directMatch[1];

  return null;
}

// ---------------------------------------------------------------------------
// Request handlers (per-brand context)
// ---------------------------------------------------------------------------

async function handleWebhookPaystack(request, config, env) {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }
  const body = await request.text();
  const signature = request.headers.get('x-paystack-signature') || '';
  // TODO: verify HMAC signature against env.PAYSTACK_SECRET_KEY
  console.log(`[${config.brand}] Paystack webhook received`, signature.slice(0, 8));
  return new Response(JSON.stringify({ received: true, brand: config.brand }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function handleProductsApi(request, config, env) {
  return new Response(
    JSON.stringify({
      brand: config.brand,
      display_name: config.display_name,
      currency: config.catalog?.currency || 'ZAR',
      products: config.catalog?.products || []
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    }
  );
}

async function handleHealth(config) {
  return new Response(
    JSON.stringify({
      status: 'ok',
      brand: config?.brand || 'unknown',
      domain: config?.domain || 'unknown',
      phases: config?.phases || {}
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

// ---------------------------------------------------------------------------
// Main fetch handler
// ---------------------------------------------------------------------------

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const brand = extractBrand(url.hostname);

    // Unknown hostname — return 404 (covers wildcard DNS typos)
    if (!brand) {
      return new Response(
        JSON.stringify({ error: 'Store not found', hostname: url.hostname }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Load brand config from KV or static fallback
    const config = await loadBrandConfig(brand, env.BRAND_CONFIGS);

    if (!config) {
      return new Response(
        JSON.stringify({ error: 'Brand not configured', brand }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Route on pathname within brand context
    const { pathname } = url;

    if (pathname === '/health') {
      return handleHealth(config);
    }

    if (pathname === '/api/products') {
      return handleProductsApi(request, config, env);
    }

    if (pathname === '/webhooks/paystack') {
      return handleWebhookPaystack(request, config, env);
    }

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }

    // Default: brand splash (serves brand config as JSON)
    // Replace with HTML storefront once catalog_live = true
    if (!config.phases?.catalog_live) {
      return new Response(
        JSON.stringify({
          brand: config.brand,
          display_name: config.display_name,
          status: 'coming_soon',
          phases: config.phases
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response('Not Found', { status: 404 });
  }
};
