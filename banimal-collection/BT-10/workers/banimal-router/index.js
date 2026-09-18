/**
 * Banimal Router v5 — Cloudflare Worker
 * banimal.co.za/api/* + banimal.co.za/webhooks/* + banimal.co.za/port/5000/*
 * + banimal.co.za/auth/* (see lib/oauth.js)
 * Payments: Paystack + CapitecPay
 */

import { handleAuthRequest } from './lib/oauth.js';

async function verifyHmac(body, signature, secret) {
  // Fail closed: a webhook with no signature, or arriving while no secret is
  // configured, must be rejected — not treated as pre-verified. The previous
  // `return true` here meant anyone could POST a fake "payment successful"
  // webhook with no signature header and have it processed as real.
  if (!secret || !signature) return false;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-512' }, false, ['verify']
  );
  const sigBytes = new Uint8Array(signature.match(/.{1,2}/g).map(b => parseInt(b, 16)));
  const bodyBytes = enc.encode(body);
  return crypto.subtle.verify('HMAC', key, sigBytes, bodyBytes);
}

async function paystackGet(path, secret) {
  const r = await fetch(`https://api.paystack.co${path}`, {
    headers: { 'Authorization': `Bearer ${secret}` }
  });
  return r.json();
}

async function paystackPost(path, body, secret) {
  const r = await fetch(`https://api.paystack.co${path}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${secret}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return r.json();
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const { pathname } = url;

    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-paystack-signature, x-capitecpay-signature, Authorization',
    };

    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });

    // ── Auth (social + email/password) ──────────────────────────────────────
    if (pathname === '/auth/session' || pathname === '/auth/signout' || pathname.startsWith('/auth/email/') || /^\/auth\/[^/]+\/(start|callback)$/.test(pathname)) {
      const authResponse = await handleAuthRequest(request, env, ctx, cors);
      if (authResponse) return authResponse;
    }

    // ── Health ────────────────────────────────────────────────────────────
    if (pathname === '/health') {
      return Response.json({
        status: 'ok', service: 'banimal-router', version: '5.0',
        features: ['paystack', 'capitecpay', 'giving-loop', 'delivery', 'exchange-rates', 'orders', 'refunds', 'verify'],
        paystack_hmac: !!env.PAYSTACK_SECRET_KEY,
        capitecpay_hmac: !!env.CAPITECPAY_SECRET,
        bobgo_live: !!env.BOBGO_API_KEY,
        ts: Date.now(),
      }, { headers: cors });
    }

    // ── Giving stats ──────────────────────────────────────────────────────
    if (pathname === '/api/giving/stats') {
      const [totalZAR, count, lastUpdated] = await Promise.all([
        env.BANIMAL_KV?.get('giving:total_zar').then(v => parseFloat(v||'0')),
        env.BANIMAL_KV?.get('giving:count').then(v => parseInt(v||'0')),
        env.BANIMAL_KV?.get('giving:last_updated'),
      ]);
      return Response.json({ totalZAR, count, lastUpdated, rate: 0.1501 }, { headers: cors });
    }

    // ── ORDER INIT — React checkout posts here ────────────────────────────
    if ((pathname === '/port/5000/api/orders' || pathname === '/api/orders') && request.method === 'POST') {
      let body = {};
      try { body = await request.json(); } catch {}

      const { customerName, email, currency = 'ZAR', totalZar, totalUsd, itemsJson } = body;

      if (!email || !totalZar) {
        return Response.json({ error: 'missing email or totalZar' }, { status: 400, headers: cors });
      }

      const amountKobo = Math.round(parseFloat(totalZar) * 100);
      const reference = `ban-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      const paystackData = await paystackPost('/transaction/initialize', {
        email,
        amount: amountKobo,
        currency: 'ZAR',
        reference,
        callback_url: 'https://www.banimal.co.za/checkout?paystack_callback=true',
        metadata: {
          custom_fields: [
            { display_name: 'Customer Name', variable_name: 'customer_name', value: customerName || '' },
            { display_name: 'Order Items', variable_name: 'items', value: itemsJson || '' },
          ],
        },
        channels: ['card', 'bank_transfer', 'eft', 'capitec_pay'],
      }, env.PAYSTACK_SECRET_KEY);

      if (!paystackData.status) {
        return Response.json({ error: paystackData.message || 'Paystack init failed' }, { status: 502, headers: cors });
      }

      if (env.BANIMAL_KV) {
        ctx.waitUntil(env.BANIMAL_KV.put(`order:${reference}`, JSON.stringify({
          ref: reference,
          email,
          customerName,
          amount_zar: parseFloat(totalZar),
          giving_zar: Math.round(parseFloat(totalZar) * 0.1501 * 100) / 100,
          items: itemsJson,
          status: 'pending',
          ts: new Date().toISOString(),
        }), { expirationTtl: 7776000 }));
      }

      return Response.json({
        status: true,
        reference,
        authorization_url: paystackData.data.authorization_url,
        access_code: paystackData.data.access_code,
      }, { headers: cors });
    }

    // ── VERIFY TRANSACTION ────────────────────────────────────────────────
    // Called by frontend after Paystack callback redirect
    if ((pathname.startsWith('/api/verify/') || pathname.startsWith('/port/5000/api/verify/')) && request.method === 'GET') {
      const ref = pathname.split('/api/verify/')[1] || pathname.split('/port/5000/api/verify/')[1];
      if (!ref) return Response.json({ error: 'missing reference' }, { status: 400, headers: cors });

      const data = await paystackGet(`/transaction/verify/${encodeURIComponent(ref)}`, env.PAYSTACK_SECRET_KEY);

      if (data.status && data.data?.status === 'success') {
        // Update KV order to paid
        if (env.BANIMAL_KV) {
          const existing = await env.BANIMAL_KV.get(`order:${ref}`);
          const order = existing ? JSON.parse(existing) : {};
          const amountZAR = (data.data.amount || 0) / 100;
          ctx.waitUntil(env.BANIMAL_KV.put(`order:${ref}`, JSON.stringify({
            ...order,
            ref,
            status: 'paid',
            paid_at: data.data.paid_at,
            channel: data.data.channel,
            amount_zar: amountZAR,
            giving_zar: Math.round(amountZAR * 0.1501 * 100) / 100,
            email: data.data.customer?.email || order.email,
            authorization_code: data.data.authorization?.authorization_code,
          }), { expirationTtl: 7776000 }));
        }
        return Response.json({ status: true, paid: true, reference: ref, amount_zar: (data.data.amount||0)/100, channel: data.data.channel }, { headers: cors });
      }

      return Response.json({ status: true, paid: false, reference: ref, paystack_status: data.data?.status }, { headers: cors });
    }

    // ── REFUND ────────────────────────────────────────────────────────────
    if (pathname === '/api/refund' && request.method === 'POST') {
      let body = {};
      try { body = await request.json(); } catch {}
      const { transaction, amount, customer_note, merchant_note } = body;
      if (!transaction) return Response.json({ error: 'missing transaction' }, { status: 400, headers: cors });

      const refundPayload = { transaction };
      if (amount) refundPayload.amount = Math.round(amount * 100);
      if (customer_note) refundPayload.customer_note = customer_note;
      if (merchant_note) refundPayload.merchant_note = merchant_note;

      const data = await paystackPost('/refund', refundPayload, env.PAYSTACK_SECRET_KEY);
      return Response.json(data, { headers: cors });
    }

    // ── Paystack webhook ──────────────────────────────────────────────────
    if (pathname === '/webhooks/paystack' && request.method === 'POST') {
      const rawBody = await request.text();
      const sig = request.headers.get('x-paystack-signature') || '';

      const valid = await verifyHmac(rawBody, sig, env.PAYSTACK_SECRET_KEY);
      if (!valid) return new Response('Unauthorized', { status: 401 });

      let parsed = {};
      try { parsed = JSON.parse(rawBody); } catch {}

      const event = parsed?.event;

      if (event === 'charge.success' && env.BANIMAL_KV) {
        const amountZAR = (parsed.data?.amount || 0) / 100;
        const givingZAR = Math.round(amountZAR * 0.1501 * 100) / 100;
        const ref = parsed.data?.reference || '';
        const meta = parsed.data?.metadata || {};

        const [prev, cnt, existing] = await Promise.all([
          env.BANIMAL_KV.get('giving:total_zar').then(v => parseFloat(v||'0')),
          env.BANIMAL_KV.get('giving:count').then(v => parseInt(v||'0')),
          env.BANIMAL_KV.get(`order:${ref}`),
        ]);

        const order = existing ? JSON.parse(existing) : {};

        ctx.waitUntil(Promise.all([
          env.BANIMAL_KV.put('giving:total_zar', String(Math.round((prev + givingZAR)*100)/100)),
          env.BANIMAL_KV.put('giving:count', String(cnt + 1)),
          env.BANIMAL_KV.put('giving:last_updated', new Date().toISOString()),
          env.BANIMAL_KV.put(`order:${ref}`, JSON.stringify({
            ...order,
            ref, amount_zar: amountZAR, giving_zar: givingZAR,
            email: parsed.data?.customer?.email || order.email,
            channel: parsed.data?.channel,
            paid_at: parsed.data?.paid_at,
            authorization_code: parsed.data?.authorization?.authorization_code,
            ts: new Date().toISOString(),
            meta, status: 'paid',
          }), { expirationTtl: 7776000 }),
        ]));

        // Digital product email delivery
        const productType = meta?.type;
        if (productType === 'digital' && env.RESEND_API_KEY && parsed.data?.customer?.email) {
          const redirectUrl = meta?.redirect_url || '';
          ctx.waitUntil(fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              from: 'Banimal <noreply@banimal.co.za>',
              to: [parsed.data.customer.email],
              subject: `Your Banimal Order — ${ref}`,
              html: `<p>Thank you for your purchase!</p><p>Your digital item is ready: <a href="${redirectUrl}">${redirectUrl}</a></p><p>— The Fruitful Team</p>`,
            }),
          }));
        }
      }

      if (event === 'charge.dispute.create' && env.BANIMAL_KV) {
        const ref = parsed.data?.transaction?.reference || '';
        ctx.waitUntil(env.BANIMAL_KV.put(`dispute:${ref}`, JSON.stringify({ ...parsed.data, ts: new Date().toISOString() }), { expirationTtl: 7776000 }));
      }

      if (event === 'refund.processed' && env.BANIMAL_KV) {
        const ref = parsed.data?.transaction?.reference || parsed.data?.reference || '';
        if (ref) {
          const existing = await env.BANIMAL_KV.get(`order:${ref}`);
          if (existing) {
            const order = JSON.parse(existing);
            ctx.waitUntil(env.BANIMAL_KV.put(`order:${ref}`, JSON.stringify({
              ...order, status: 'refunded', refunded_at: new Date().toISOString(),
            }), { expirationTtl: 7776000 }));
          }
        }
      }

      return Response.json({ received: true }, { headers: cors });
    }

    // ── CapitecPay webhook ────────────────────────────────────────────────
    if (pathname === '/webhooks/capitecpay' && request.method === 'POST') {
      const rawBody = await request.text();
      const sig = request.headers.get('x-capitecpay-signature') || '';

      const valid = await verifyHmac(rawBody, sig, env.CAPITECPAY_SECRET);
      if (!valid) return new Response('Unauthorized', { status: 401 });

      let parsed = {};
      try { parsed = JSON.parse(rawBody); } catch {}

      if ((parsed?.status === 'SUCCESS' || parsed?.paymentStatus === 'SUCCESSFUL') && env.BANIMAL_KV) {
        const amountZAR = (parsed.amount || parsed.totalAmount || 0) / 100;
        const givingZAR = Math.round(amountZAR * 0.1501 * 100) / 100;
        const ref = parsed.merchantReference || parsed.reference || parsed.transactionId || '';

        const [prev, cnt] = await Promise.all([
          env.BANIMAL_KV.get('giving:total_zar').then(v => parseFloat(v||'0')),
          env.BANIMAL_KV.get('giving:count').then(v => parseInt(v||'0')),
        ]);
        ctx.waitUntil(Promise.all([
          env.BANIMAL_KV.put('giving:total_zar', String(Math.round((prev + givingZAR)*100)/100)),
          env.BANIMAL_KV.put('giving:count', String(cnt + 1)),
          env.BANIMAL_KV.put('giving:last_updated', new Date().toISOString()),
          env.BANIMAL_KV.put(`order:cap:${ref}`, JSON.stringify({
            ref, amount_zar: amountZAR, giving_zar: givingZAR,
            provider: 'capitecpay', ts: new Date().toISOString(), raw: parsed, status: 'paid',
          }), { expirationTtl: 7776000 }),
        ]));
      }

      return Response.json({ received: true }, { headers: cors });
    }

    // ── Address callback ──────────────────────────────────────────────────
    if (pathname === '/api/paystack/address-callback' && request.method === 'POST') {
      let body = {};
      try { body = await request.json(); } catch {}
      const ref = body?.reference || '';
      if (env.BANIMAL_KV && ref) {
        ctx.waitUntil(env.BANIMAL_KV.put(`addr:${ref}`, JSON.stringify(body?.data?.shipping_address||{}), { expirationTtl: 86400 }));
      }
      return Response.json({
        redirect_url: `https://banimal.co.za/checkout/order-received/?paystack_ref=${encodeURIComponent(ref)}`
      }, { headers: cors });
    }

    // ── Order lookup ──────────────────────────────────────────────────────
    if ((pathname.startsWith('/api/order/') || pathname.startsWith('/port/5000/api/order/')) && request.method === 'GET') {
      const ref = pathname.includes('/port/5000/') ? pathname.split('/port/5000/api/order/')[1] : pathname.split('/api/order/')[1];
      if (!ref) return Response.json({ error: 'missing ref' }, { status: 400, headers: cors });
      const order = await env.BANIMAL_KV?.get(`order:${ref}`) || await env.BANIMAL_KV?.get(`order:cap:${ref}`);
      if (!order) return Response.json({ error: 'not found' }, { status: 404, headers: cors });
      return Response.json(JSON.parse(order), { headers: cors });
    }

    // ── Delivery rates ────────────────────────────────────────────────────
    // ── Shipping rates (called by the live checkout) ──────────────────────
    // Front-end POSTs { address, city, postal, province, country, itemCount,
    // cartValueZar } and expects { rates: [{ id, name, amountZar, courier,
    // estimatedDays }] }. Free-shipping rule: South Africa free at R500+,
    // International free above R1500 (R1500 and below pays).
    if (pathname === '/api/shipping/rates' && request.method === 'POST') {
      let body = {};
      try { body = await request.json(); } catch {}

      const postal = String(body.postal || body.toPostalCode || '').trim();
      const country = String(body.country || '').trim();
      const cartValueZar = Number(body.cartValueZar ?? body.orderValueZAR ?? 0) || 0;

      const c = country.toLowerCase();
      const isZA = c === '' || c === 'country' || c === 'za' || c === 'rsa'
        || c.includes('south africa') || /^\d{4}$/.test(postal);

      const FREE_THRESHOLD = isZA ? 500 : 1500;
      const free = isZA ? cartValueZar >= FREE_THRESHOLD : cartValueZar > FREE_THRESHOLD;

      // Live BobGo rates for domestic SA orders with a valid 4-digit postal.
      if (env.BOBGO_API_KEY && isZA && /^\d{4}$/.test(postal)) {
        try {
          const bobgoResp = await fetch('https://api.bobgo.co.za/2010-10-01/rates', {
            method: 'POST',
            headers: { 'Authorization': `Basic ${btoa(env.BOBGO_API_KEY + ':')}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to_address: { code: postal, country: 'ZA' },
              from_address: { code: env.BOBGO_FROM_POSTAL || '0044', country: 'ZA' },
              parcels: [{ weight: 1, length: 30, width: 20, height: 10 }],
            }),
          });
          if (bobgoResp.ok) {
            const data = await bobgoResp.json();
            const bobgoRates = data.rates || [];
            if (bobgoRates.length > 0) {
              const prices = bobgoRates.map(x => Math.round(x.rate || x.price || 0));
              const cheapest = Math.min(...prices);
              const rates = bobgoRates.map((r, i) => {
                const realPrice = Math.round(r.rate || r.price || 0);
                return {
                  id: r.service_level_code || r.service || `bobgo-${i}`,
                  name: r.service_level_name || r.service || 'Delivery',
                  amountZar: free && realPrice === cheapest ? 0 : realPrice,
                  courier: r.courier_name || 'BobGo',
                  estimatedDays: r.transit_days ? `${r.transit_days} business days` : 'See tracking',
                };
              });
              return Response.json({ rates, source: 'bobgo', free, free_from: FREE_THRESHOLD, country: isZA ? 'ZA' : 'INTL' }, { headers: cors });
            }
          }
        } catch {}
      }

      // Country-aware fallback. Standard becomes free once the cart qualifies;
      // Express is a paid upgrade.
      const base = isZA
        ? { standard: 85,  express: 145, stdDays: '3–5 business days', expDays: '1–2 business days' }
        : { standard: 350, express: 650, stdDays: '7–14 business days', expDays: '3–7 business days' };

      return Response.json({
        rates: [
          { id: 'standard', name: 'Standard Delivery', amountZar: free ? 0 : base.standard, courier: 'BobGo', estimatedDays: base.stdDays },
          { id: 'express',  name: 'Express Delivery',  amountZar: base.express, courier: 'BobGo', estimatedDays: base.expDays },
        ],
        source: 'fallback', free, free_from: FREE_THRESHOLD, country: isZA ? 'ZA' : 'INTL',
      }, { headers: cors });
    }

    if (pathname === '/api/delivery/rates' && request.method === 'POST') {
      let body = {};
      try { body = await request.json(); } catch {}
      const { toPostalCode, orderValueZAR = 0 } = body;

      if (env.BOBGO_API_KEY && toPostalCode) {
        try {
          const bobgoResp = await fetch('https://api.bobgo.co.za/2010-10-01/rates', {
            method: 'POST',
            headers: { 'Authorization': `Basic ${btoa(env.BOBGO_API_KEY + ':')}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to_address: { code: toPostalCode, country: 'ZA' },
              from_address: { code: env.BOBGO_FROM_POSTAL || '0044', country: 'ZA' },
              parcels: [{ weight: 1, length: 30, width: 20, height: 10 }],
            }),
          });
          if (bobgoResp.ok) {
            const data = await bobgoResp.json();
            const rates = (data.rates||[]).map(r => ({ service: r.service_level_name||r.service, price: Math.round(r.rate||r.price||0), days: r.transit_days ? `${r.transit_days} business days` : 'See tracking' }));
            if (rates.length > 0) return Response.json({ rates, source: 'bobgo' }, { headers: cors });
          }
        } catch {}
      }

      const free = Number(orderValueZAR) >= 500;
      return Response.json({
        rates: [
          { service: 'Standard Delivery', price: free ? 0 : 85, days: '3–5 business days' },
          { service: 'Express Delivery', price: free ? 60 : 145, days: '1–2 business days' },
        ],
        source: 'fallback', free_from: 500,
      }, { headers: cors });
    }

    // ── Exchange rates ────────────────────────────────────────────────────
    if (pathname === '/api/exchange-rates') {
      const base = url.searchParams.get('base') || 'ZAR';
      try {
        const apiKey = env.EXCHANGE_RATE_API_KEY;
        const apiUrl = apiKey ? `https://v6.exchangerate-api.com/v6/${apiKey}/latest/${base}` : `https://open.er-api.com/v6/latest/${base}`;
        const resp = await fetch(apiUrl);
        if (resp.ok) {
          const data = await resp.json();
          return Response.json({ base: data.base_code||base, rates: data.rates||data.conversion_rates, updated: data.time_last_update_utc||new Date().toISOString() }, { headers: { ...cors, 'Cache-Control': 'public, max-age=3600' } });
        }
      } catch {}
      return Response.json({ base: 'ZAR', rates: { ZAR:1, USD:0.054, EUR:0.050, GBP:0.043, NGN:85, GHS:0.80 }, updated: new Date().toISOString(), source: 'fallback' }, { headers: cors });
    }

    // ── FAA Wallet ────────────────────────────────────────────────────────
    if (pathname === '/api/faa-wallet') {
      return Response.json({ wallet_id:'FAA-WALLET-001-HS', node:'GEN-ALPHA-ASIVEREIGER', assets:['ETH','BTC','USDT','XRP','BODCOIN','GRIPTO'], fiat_bridge:['Paystack','CapitecPay','Valr','Stripe'], eth_address:env.FAA_ETH_ADDRESS||null, btc_address:env.FAA_BTC_ADDRESS||null, note:'Set FAA_ETH_ADDRESS etc via wrangler secret' }, { headers: cors });
    }

    // ── Transfer approval ─────────────────────────────────────────────────
    if (pathname === '/webhooks/paystack/transfer-approval' && request.method === 'POST') {
      return Response.json({ status: true }, { headers: cors });
    }


    // ── Bundle patch intercept ────────────────────────────────────────────
    // Vercel deploy webhook stalled; serve patched bundle directly so
    // checkout redirects to Paystack instead of firing a fake test payment.
    if (pathname === '/assets/index-y5YmkyAX.js' && request.method === 'GET') {
      // Fetch from origin bypassing CF cache
      const originResp = await fetch(request, { cf: { cacheEverything: false, cacheTtl: 0 } });
      let js = await originResp.text();

      // Patch 1: z() — return full JSON response (not just .reference)
      js = js.replace(
        '})).json()).reference}catch',
        '})).json())}catch'
      );

      // Patch 2: Q() — replace fake test payment with real Paystack redirect
      js = js.replace(
        'V&&W(V);return}await u4();{p({title:"Test payment",description:"Simulated Paystack TEST charge (ZAR)."});const V=await z("paid");V&&W(V);return}}',
        'V&&W(V.reference);return}{const V=await z("pending");if(V&&V.authorization_url){window.location.href=V.authorization_url}else if(V){W(V.reference)}else{S(!1)}return}}'
      );

      const patched = js.includes('authorization_url');
      return new Response(js, {
        status: 200,
        headers: {
          'Content-Type': 'application/javascript; charset=utf-8',
          'Cache-Control': 'no-store',
          'X-Bundle-Patched': patched ? 'true' : 'patch-failed',
        },
      });
    }

    return fetch(request);
  },
};
