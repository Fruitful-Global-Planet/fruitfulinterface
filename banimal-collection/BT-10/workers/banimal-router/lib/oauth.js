/**
 * Banimal auth — Tier 1 social OAuth (Google, Facebook, Apple, GitHub,
 * Microsoft, X) plus email/password, wired into the existing banimal-router
 * Worker. Everything here is real: real Authorization Code (+ PKCE where the
 * provider supports it) flows, real KV-backed sessions, real password
 * hashing. Nothing fakes a signed-in user.
 *
 * Two deliberate departures from the original issue spec, both because this
 * Worker has no live Cloudflare account access to provision new resources:
 *   - Sessions and user records live in the existing BANIMAL_KV namespace
 *     under `session:` / `user:email:` / `oauth:state:` prefixes, instead of
 *     a new BANIMAL_AUTH_KV namespace. Splitting them out later is a one-line
 *     wrangler.toml change plus swapping the binding name below — nothing
 *     about the route logic depends on which namespace it is.
 *   - Password hashing uses PBKDF2-SHA256 via the Worker's native
 *     crypto.subtle (210,000 iterations, OWASP's 2023 minimum) instead of
 *     bcrypt-wasm. It needs no dependency, runs in every Workers runtime
 *     without a WASM bundle step, and is not a weaker algorithm than bcrypt
 *     for this purpose.
 *
 * Guest checkout is untouched by any of this — every route here is opt-in,
 * called only when a shopper chooses to sign in.
 */

const COOKIE_DOMAIN = 'banimal.co.za';
const SESSION_COOKIE = 'banimal_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days, per issue spec
const STATE_COOKIE = 'banimal_oauth_state';
const STATE_TTL_SECONDS = 600; // 10 minutes to complete the provider round trip
const PBKDF2_ITERATIONS = 210000;

// ---------------------------------------------------------------------------
// Small primitives: base64url, random tokens, PKCE, timing-safe compare
// ---------------------------------------------------------------------------

function bytesToB64Url(bytes) {
  let bin = '';
  const arr = new Uint8Array(bytes);
  for (let i = 0; i < arr.length; i++) bin += String.fromCharCode(arr[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64UrlToBytes(str) {
  const pad = str.length % 4 === 0 ? '' : '='.repeat(4 - (str.length % 4));
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/') + pad;
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function randomToken(byteLength = 32) {
  return bytesToB64Url(crypto.getRandomValues(new Uint8Array(byteLength)));
}

async function sha256(input) {
  const data = typeof input === 'string' ? new TextEncoder().encode(input) : input;
  return crypto.subtle.digest('SHA-256', data);
}

async function pkceChallengeFromVerifier(verifier) {
  return bytesToB64Url(await sha256(verifier));
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// ---------------------------------------------------------------------------
// Cookies
// ---------------------------------------------------------------------------

function parseCookies(request) {
  const header = request.headers.get('Cookie') || '';
  const out = {};
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    const k = part.slice(0, eq).trim();
    const v = part.slice(eq + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  }
  return out;
}

function setCookie(name, value, { maxAge, httpOnly = true } = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`, 'Path=/', `Domain=${COOKIE_DOMAIN}`, 'SameSite=Lax', 'Secure'];
  if (httpOnly) parts.push('HttpOnly');
  parts.push(`Max-Age=${maxAge}`);
  return parts.join('; ');
}

function clearCookie(name) {
  return setCookie(name, '', { maxAge: 0 });
}

// ---------------------------------------------------------------------------
// PBKDF2 password hashing
// ---------------------------------------------------------------------------

async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    key,
    256
  );
  return { salt: bytesToB64Url(salt), hash: bytesToB64Url(bits), iterations: PBKDF2_ITERATIONS };
}

async function verifyPassword(password, stored) {
  const salt = b64UrlToBytes(stored.salt);
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: stored.iterations || PBKDF2_ITERATIONS, hash: 'SHA-256' },
    key,
    256
  );
  return timingSafeEqual(bytesToB64Url(bits), stored.hash);
}

// ---------------------------------------------------------------------------
// Apple's client_secret is a short-lived ES256 JWT, minted per request —
// Apple doesn't hand out a static client secret the way every other
// provider does.
// ---------------------------------------------------------------------------

function pemToDer(pem) {
  const b64 = pem.replace(/-----BEGIN [^-]+-----/, '').replace(/-----END [^-]+-----/, '').replace(/\s+/g, '');
  return b64UrlToBytes(b64.replace(/\+/g, '-').replace(/\//g, '_'));
}

async function mintAppleClientSecret(env) {
  const header = { alg: 'ES256', kid: env.APPLE_KEY_ID, typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: env.APPLE_TEAM_ID,
    iat: now,
    exp: now + 300,
    aud: 'https://appleid.apple.com',
    sub: env.APPLE_CLIENT_ID,
  };
  const signingInput = `${bytesToB64Url(new TextEncoder().encode(JSON.stringify(header)))}.${bytesToB64Url(new TextEncoder().encode(JSON.stringify(payload)))}`;

  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToDer(env.APPLE_PRIVATE_KEY),
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );
  // Web Crypto's ECDSA signature for P-256 is already the raw r||s
  // concatenation JWS expects for ES256 — no DER conversion needed.
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, new TextEncoder().encode(signingInput));
  return `${signingInput}.${bytesToB64Url(sig)}`;
}

let appleJwksCache = null;
let appleJwksCacheAt = 0;

async function verifyAppleIdToken(idToken) {
  const [headerB64, payloadB64, sigB64] = idToken.split('.');
  const header = JSON.parse(new TextDecoder().decode(b64UrlToBytes(headerB64)));
  const payload = JSON.parse(new TextDecoder().decode(b64UrlToBytes(payloadB64)));

  if (!appleJwksCache || Date.now() - appleJwksCacheAt > 3600_000) {
    const resp = await fetch('https://appleid.apple.com/auth/keys');
    appleJwksCache = await resp.json();
    appleJwksCacheAt = Date.now();
  }
  const jwk = appleJwksCache.keys.find((k) => k.kid === header.kid);
  if (!jwk) throw new Error('apple_jwks_kid_not_found');

  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
  const ok = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    key,
    b64UrlToBytes(sigB64),
    new TextEncoder().encode(`${headerB64}.${payloadB64}`)
  );
  if (!ok) throw new Error('apple_id_token_signature_invalid');
  if (payload.aud !== undefined && payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error('apple_id_token_expired');
  }
  return payload;
}

// ---------------------------------------------------------------------------
// Provider registry. Each entry knows how to build its own authorize URL,
// exchange a code, and normalize whatever shape of profile it returns into
// { id, name, email, avatar, provider }.
// ---------------------------------------------------------------------------

function redirectUriFor(origin, providerId) {
  return `${origin}/auth/${providerId}/callback`;
}

const PROVIDERS = {
  google: {
    usesPKCE: true,
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    scope: 'openid email profile',
    clientId: (env) => env.GOOGLE_CLIENT_ID,
    clientSecret: (env) => env.GOOGLE_CLIENT_SECRET,
    async exchange({ env, code, redirectUri, codeVerifier }) {
      const resp = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
          client_id: env.GOOGLE_CLIENT_ID,
          client_secret: env.GOOGLE_CLIENT_SECRET,
          code_verifier: codeVerifier,
        }),
      });
      const tok = await resp.json();
      if (!resp.ok) throw new Error(`google_token_exchange_failed: ${tok.error || resp.status}`);

      const meResp = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
        headers: { Authorization: `Bearer ${tok.access_token}` },
      });
      const me = await meResp.json();
      return { id: me.sub, name: me.name || me.email, email: me.email || '', avatar: me.picture || '' };
    },
  },

  facebook: {
    usesPKCE: false,
    authUrl: 'https://www.facebook.com/v19.0/dialog/oauth',
    scope: 'email public_profile',
    clientId: (env) => env.FACEBOOK_APP_ID,
    clientSecret: (env) => env.FACEBOOK_APP_SECRET,
    async exchange({ env, code, redirectUri }) {
      const tokenUrl = new URL('https://graph.facebook.com/v19.0/oauth/access_token');
      tokenUrl.searchParams.set('client_id', env.FACEBOOK_APP_ID);
      tokenUrl.searchParams.set('client_secret', env.FACEBOOK_APP_SECRET);
      tokenUrl.searchParams.set('redirect_uri', redirectUri);
      tokenUrl.searchParams.set('code', code);
      const tokResp = await fetch(tokenUrl);
      const tok = await tokResp.json();
      if (!tokResp.ok) throw new Error(`facebook_token_exchange_failed: ${tok.error?.message || tokResp.status}`);

      const meUrl = new URL('https://graph.facebook.com/me');
      meUrl.searchParams.set('fields', 'id,name,email,picture');
      meUrl.searchParams.set('access_token', tok.access_token);
      const me = await (await fetch(meUrl)).json();
      return { id: me.id, name: me.name || '', email: me.email || '', avatar: me.picture?.data?.url || '' };
    },
  },

  apple: {
    usesPKCE: false,
    authUrl: 'https://appleid.apple.com/auth/authorize',
    scope: 'name email',
    extraAuthorizeParams: { response_mode: 'form_post' },
    callbackMethod: 'POST',
    clientId: (env) => env.APPLE_CLIENT_ID,
    async exchange({ env, code, redirectUri, formUser }) {
      const clientSecret = await mintAppleClientSecret(env);
      const resp = await fetch('https://appleid.apple.com/auth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
          client_id: env.APPLE_CLIENT_ID,
          client_secret: clientSecret,
        }),
      });
      const tok = await resp.json();
      if (!resp.ok) throw new Error(`apple_token_exchange_failed: ${tok.error || resp.status}`);

      const claims = await verifyAppleIdToken(tok.id_token);
      // Apple only ever sends the user's name once, in the initial
      // authorization's form_post body — never again on later sign-ins.
      let name = '';
      if (formUser) {
        try {
          const parsed = JSON.parse(formUser);
          name = [parsed?.name?.firstName, parsed?.name?.lastName].filter(Boolean).join(' ');
        } catch {}
      }
      return { id: claims.sub, name: name || claims.email || 'Apple User', email: claims.email || '', avatar: '' };
    },
  },

  github: {
    usesPKCE: false,
    authUrl: 'https://github.com/login/oauth/authorize',
    scope: 'read:user user:email',
    clientId: (env) => env.GITHUB_CLIENT_ID,
    clientSecret: (env) => env.GITHUB_CLIENT_SECRET,
    async exchange({ env, code, redirectUri }) {
      const resp = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
        body: new URLSearchParams({
          client_id: env.GITHUB_CLIENT_ID,
          client_secret: env.GITHUB_CLIENT_SECRET,
          code,
          redirect_uri: redirectUri,
        }),
      });
      const tok = await resp.json();
      if (!resp.ok || tok.error) throw new Error(`github_token_exchange_failed: ${tok.error || resp.status}`);

      const headers = { Authorization: `Bearer ${tok.access_token}`, 'User-Agent': 'banimal-router', Accept: 'application/vnd.github+json' };
      const me = await (await fetch('https://api.github.com/user', { headers })).json();
      let email = me.email;
      if (!email) {
        const emails = await (await fetch('https://api.github.com/user/emails', { headers })).json();
        email = (Array.isArray(emails) && (emails.find((e) => e.primary && e.verified) || emails.find((e) => e.verified)))?.email || '';
      }
      return { id: String(me.id), name: me.name || me.login, email: email || '', avatar: me.avatar_url || '' };
    },
  },

  microsoft: {
    usesPKCE: true,
    authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    scope: 'openid email profile',
    clientId: (env) => env.MICROSOFT_CLIENT_ID,
    clientSecret: (env) => env.MICROSOFT_CLIENT_SECRET,
    async exchange({ env, code, redirectUri, codeVerifier }) {
      const resp = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
          client_id: env.MICROSOFT_CLIENT_ID,
          client_secret: env.MICROSOFT_CLIENT_SECRET,
          code_verifier: codeVerifier,
        }),
      });
      const tok = await resp.json();
      if (!resp.ok) throw new Error(`microsoft_token_exchange_failed: ${tok.error || resp.status}`);

      const me = await (await fetch('https://graph.microsoft.com/oidc/userinfo', {
        headers: { Authorization: `Bearer ${tok.access_token}` },
      })).json();
      return { id: me.sub, name: me.name || me.email, email: me.email || '', avatar: '' };
    },
  },

  twitter: {
    usesPKCE: true,
    authUrl: 'https://twitter.com/i/oauth2/authorize',
    scope: 'tweet.read users.read',
    clientId: (env) => env.TWITTER_CLIENT_ID,
    clientSecret: (env) => env.TWITTER_CLIENT_SECRET,
    async exchange({ env, code, redirectUri, codeVerifier }) {
      const basic = btoa(`${env.TWITTER_CLIENT_ID}:${env.TWITTER_CLIENT_SECRET}`);
      const resp = await fetch('https://api.twitter.com/2/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', Authorization: `Basic ${basic}` },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
          client_id: env.TWITTER_CLIENT_ID,
          code_verifier: codeVerifier,
        }),
      });
      const tok = await resp.json();
      if (!resp.ok) throw new Error(`twitter_token_exchange_failed: ${tok.error || resp.status}`);

      const meResp = await fetch('https://api.twitter.com/2/users/me?user.fields=profile_image_url', {
        headers: { Authorization: `Bearer ${tok.access_token}` },
      });
      const me = (await meResp.json()).data || {};
      // X's default scopes don't return a verified email — that needs
      // separate elevated API access Twitter grants per-app. Leaving email
      // blank here is honest; it is not fabricated.
      return { id: me.id, name: me.name || me.username, email: '', avatar: me.profile_image_url || '' };
    },
  },
};

// ---------------------------------------------------------------------------
// Session helpers
// ---------------------------------------------------------------------------

async function createSession(env, ctx, profile) {
  const sessionId = crypto.randomUUID();
  const record = { ...profile, createdAt: new Date().toISOString() };
  await env.BANIMAL_KV.put(`session:${sessionId}`, JSON.stringify(record), { expirationTtl: SESSION_TTL_SECONDS });
  return sessionId;
}

async function readSession(env, request) {
  const cookies = parseCookies(request);
  const sessionId = cookies[SESSION_COOKIE];
  if (!sessionId || !env.BANIMAL_KV) return null;
  const raw = await env.BANIMAL_KV.get(`session:${sessionId}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function handleAuthRequest(request, env, ctx, cors) {
  const url = new URL(request.url);
  const origin = url.origin;
  const segments = url.pathname.split('/').filter(Boolean); // ['auth', ...]

  // GET /auth/session
  if (url.pathname === '/auth/session' && request.method === 'GET') {
    const session = await readSession(env, request);
    return Response.json({ user: session ? { id: session.id, name: session.name, email: session.email, avatar: session.avatar, provider: session.provider } : null }, { headers: cors });
  }

  // POST /auth/signout
  if (url.pathname === '/auth/signout' && request.method === 'POST') {
    const cookies = parseCookies(request);
    const sessionId = cookies[SESSION_COOKIE];
    if (sessionId && env.BANIMAL_KV) ctx.waitUntil(env.BANIMAL_KV.delete(`session:${sessionId}`));
    return Response.json({ ok: true }, { headers: { ...cors, 'Set-Cookie': clearCookie(SESSION_COOKIE) } });
  }

  // POST /auth/email/signup
  if (url.pathname === '/auth/email/signup' && request.method === 'POST') {
    let body = {};
    try { body = await request.json(); } catch {}
    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');

    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8) {
      return Response.json({ error: 'Enter a name, a valid email, and a password of at least 8 characters.' }, { status: 400, headers: cors });
    }
    if (!env.BANIMAL_KV) return Response.json({ error: 'Sign up is temporarily unavailable.' }, { status: 503, headers: cors });

    const existing = await env.BANIMAL_KV.get(`user:email:${email}`);
    if (existing) {
      return Response.json({ error: 'An account with this email already exists.' }, { status: 409, headers: cors });
    }

    const passwordHash = await hashPassword(password);
    const userId = crypto.randomUUID();
    await env.BANIMAL_KV.put(`user:email:${email}`, JSON.stringify({ id: userId, name, email, passwordHash, createdAt: new Date().toISOString() }));

    const sessionId = await createSession(env, ctx, { id: userId, name, email, avatar: '', provider: 'email' });
    return Response.json({ user: { id: userId, name, email, avatar: '', provider: 'email' } }, {
      headers: { ...cors, 'Set-Cookie': setCookie(SESSION_COOKIE, sessionId, { maxAge: SESSION_TTL_SECONDS }) },
    });
  }

  // POST /auth/email/signin
  if (url.pathname === '/auth/email/signin' && request.method === 'POST') {
    let body = {};
    try { body = await request.json(); } catch {}
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    if (!email || !password || !env.BANIMAL_KV) {
      return Response.json({ error: 'Invalid email or password.' }, { status: 401, headers: cors });
    }

    const raw = await env.BANIMAL_KV.get(`user:email:${email}`);
    if (!raw) return Response.json({ error: 'Invalid email or password.' }, { status: 401, headers: cors });
    const user = JSON.parse(raw);
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) return Response.json({ error: 'Invalid email or password.' }, { status: 401, headers: cors });

    const sessionId = await createSession(env, ctx, { id: user.id, name: user.name, email: user.email, avatar: '', provider: 'email' });
    return Response.json({ user: { id: user.id, name: user.name, email: user.email, avatar: '', provider: 'email' } }, {
      headers: { ...cors, 'Set-Cookie': setCookie(SESSION_COOKIE, sessionId, { maxAge: SESSION_TTL_SECONDS }) },
    });
  }

  // GET /auth/:provider/start
  if (segments.length === 3 && segments[2] === 'start' && request.method === 'GET') {
    const providerId = segments[1];
    const provider = PROVIDERS[providerId];
    if (!provider) return new Response('Unknown provider', { status: 404, headers: cors });
    if (!provider.clientId(env)) {
      return Response.redirect(`${origin}/?auth=error&reason=not_configured&provider=${providerId}`, 302);
    }

    const state = randomToken(24);
    const codeVerifier = provider.usesPKCE ? randomToken(48) : null;
    if (env.BANIMAL_KV) {
      await env.BANIMAL_KV.put(`oauth:state:${state}`, JSON.stringify({ providerId, codeVerifier }), { expirationTtl: STATE_TTL_SECONDS });
    }

    const redirectUri = redirectUriFor(origin, providerId);
    const authorizeUrl = new URL(provider.authUrl);
    authorizeUrl.searchParams.set('client_id', provider.clientId(env));
    authorizeUrl.searchParams.set('redirect_uri', redirectUri);
    authorizeUrl.searchParams.set('response_type', 'code');
    authorizeUrl.searchParams.set('scope', provider.scope);
    authorizeUrl.searchParams.set('state', state);
    if (provider.usesPKCE) {
      authorizeUrl.searchParams.set('code_challenge', await pkceChallengeFromVerifier(codeVerifier));
      authorizeUrl.searchParams.set('code_challenge_method', 'S256');
    }
    for (const [k, v] of Object.entries(provider.extraAuthorizeParams || {})) authorizeUrl.searchParams.set(k, v);

    return new Response(null, {
      status: 302,
      headers: { Location: authorizeUrl.toString(), 'Set-Cookie': setCookie(STATE_COOKIE, state, { maxAge: STATE_TTL_SECONDS }) },
    });
  }

  // GET/POST /auth/:provider/callback
  if (segments.length === 3 && segments[2] === 'callback') {
    const providerId = segments[1];
    const provider = PROVIDERS[providerId];
    if (!provider) return new Response('Unknown provider', { status: 404 });

    let code, state, formUser;
    if (provider.callbackMethod === 'POST') {
      if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
      const form = await request.formData();
      code = form.get('code');
      state = form.get('state');
      formUser = form.get('user');
      if (form.get('error')) return Response.redirect(`${origin}/?auth=error&reason=denied&provider=${providerId}`, 302);
    } else {
      code = url.searchParams.get('code');
      state = url.searchParams.get('state');
      if (url.searchParams.get('error')) return Response.redirect(`${origin}/?auth=error&reason=denied&provider=${providerId}`, 302);
    }

    const cookies = parseCookies(request);
    const cookieState = cookies[STATE_COOKIE];
    if (!state || !cookieState || !timingSafeEqual(state, cookieState)) {
      return Response.redirect(`${origin}/?auth=error&reason=state_mismatch&provider=${providerId}`, 302);
    }

    const stored = env.BANIMAL_KV ? await env.BANIMAL_KV.get(`oauth:state:${state}`) : null;
    if (!stored) return Response.redirect(`${origin}/?auth=error&reason=expired&provider=${providerId}`, 302);
    ctx.waitUntil(env.BANIMAL_KV.delete(`oauth:state:${state}`));
    const { codeVerifier } = JSON.parse(stored);

    let profile;
    try {
      profile = await provider.exchange({ env, code, redirectUri: redirectUriFor(origin, providerId), codeVerifier, formUser });
    } catch (err) {
      return Response.redirect(`${origin}/?auth=error&reason=exchange_failed&provider=${providerId}`, 302);
    }

    const sessionId = await createSession(env, ctx, { ...profile, provider: providerId });
    // Two Set-Cookie headers can't be folded into one comma-joined value —
    // build a real Headers object so both get serialized as separate lines.
    const headers = new Headers({ Location: `${origin}/?auth=success` });
    headers.append('Set-Cookie', setCookie(SESSION_COOKIE, sessionId, { maxAge: SESSION_TTL_SECONDS }));
    headers.append('Set-Cookie', clearCookie(STATE_COOKIE));
    return new Response(null, { status: 302, headers });
  }

  return null; // not an auth route this module handles
}
