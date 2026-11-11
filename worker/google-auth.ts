type AuthEnv = { DB?: D1Database; GOOGLE_CLIENT_ID?: string; GOOGLE_CLIENT_SECRET?: string };
const SESSION = '__Host-rms_session';
const STATE = '__Host-rms_oauth';
const encoder = new TextEncoder();
const random = () => Array.from(crypto.getRandomValues(new Uint8Array(32)), n => n.toString(16).padStart(2, '0')).join('');
export const digest = async (value: string) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value))), n => n.toString(16).padStart(2, '0')).join('');
function cookie(request: Request, name: string) {
  return request.headers.get('cookie')?.split(';').map(s => s.trim()).find(s => s.startsWith(name + '='))?.slice(name.length + 1) ?? '';
}
const setCookie = (name: string, value: string, age: number) => `${name}=${value}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=${age}`;
const redirect = (location: string, cookies: string[] = []) => {
  const headers = new Headers({ Location: location, 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' });
  for (const value of cookies) headers.append('Set-Cookie', value);
  return new Response(null, { status: 303, headers });
};
function message(text: string, status = 400) {
  return new Response(`<!doctype html><html><head><meta name="viewport" content="width=device-width"><title>Revenue Monitoring System</title></head><body style="font:18px system-ui;max-width:600px;margin:15vh auto;padding:24px"><h1>Revenue Monitoring System</h1><p>${text}</p><a href="/">Return to dashboard</a></body></html>`, { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'", 'Referrer-Policy': 'no-referrer' } });
}

// Only this wrapper may introduce identity headers on an independent Worker.
// Raw client headers never become authentication.
export async function authenticateGoogle(request: Request, env: AuthEnv): Promise<Request | Response> {
  const url = new URL(request.url);
  const headers = new Headers(request.headers);
  for (const key of Array.from(headers.keys())) if (key.startsWith('oai-authenticated-')) headers.delete(key);
  const now = Date.now();
  const isLogin = ['/auth/google', '/signin-with-chatgpt'].includes(url.pathname);
  const isCallback = url.pathname === '/auth/callback';
  const isLogout = ['/auth/logout', '/signout-with-chatgpt'].includes(url.pathname);
  if (isLogin || isCallback) {
    if (request.method !== 'GET') return message('Method not allowed.', 405);
    if (!env.DB || !env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) return message('Google sign-in is being configured. You can explore the demo while setup is completed.', 503);
    if (isLogin) {
      const state = random(), verifier = random();
      const challenge = btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(verifier))))).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
      await env.DB.prepare('INSERT INTO oauth_states (state_hash, verifier, expires_at) VALUES (?, ?, ?)').bind(await digest(state), verifier, now + 600000).run();
      await env.DB.prepare('DELETE FROM oauth_states WHERE expires_at < ?').bind(now).run();
      const target = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      target.search = new URLSearchParams({ client_id: env.GOOGLE_CLIENT_ID, redirect_uri: url.origin + '/auth/callback', response_type: 'code', scope: 'openid email profile', state, code_challenge: challenge, code_challenge_method: 'S256', prompt: 'select_account' }).toString();
      return redirect(target.href, [setCookie(STATE, state, 600)]);
    }
    const state = url.searchParams.get('state');
    if (!state || state.length !== 64 || state !== cookie(request, STATE)) return message('Sign-in expired or could not be verified. Please start again.');
    const pending = await env.DB.prepare('DELETE FROM oauth_states WHERE state_hash = ? AND expires_at > ? RETURNING verifier').bind(await digest(state), now).first<{ verifier: string }>();
    if (!pending || !url.searchParams.get('code') || url.searchParams.has('error')) return message('Sign-in was cancelled or expired. Please start again.');
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ code: url.searchParams.get('code')!, client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET, redirect_uri: url.origin + '/auth/callback', grant_type: 'authorization_code', code_verifier: pending.verifier }), signal: AbortSignal.timeout(15000) });
    if (!tokenResponse.ok) return message('Google could not complete sign-in. Please try again.');
    const tokens = await tokenResponse.json() as { access_token?: string };
    if (!tokens.access_token) return message('Google could not complete sign-in.');
    const profileResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', { headers: { Authorization: 'Bearer ' + tokens.access_token }, signal: AbortSignal.timeout(15000) });
    if (!profileResponse.ok) return message('Google could not verify this account.');
    const profile = await profileResponse.json() as { sub?: string; email?: string; email_verified?: boolean; name?: string };
    if (!profile.sub || !profile.email || profile.email_verified !== true) return message('Please use a verified Google email address.');
    const token = random();
    await env.DB.prepare('INSERT INTO auth_sessions (token_hash, owner_id, email, name, expires_at) VALUES (?, ?, ?, ?, ?)').bind(await digest(token), 'google:' + profile.sub, profile.email, profile.name ?? profile.email, now + 604800000).run();
    await env.DB.prepare('DELETE FROM auth_sessions WHERE expires_at < ?').bind(now).run();
    return redirect('/', [setCookie(SESSION, token, 604800), setCookie(STATE, '', 0)]);
  }
  if (isLogout) {
    if (request.method === 'GET') return new Response('<!doctype html><title>Sign out</title><form method="post" action="/auth/logout"><p>Sign out of Revenue Monitoring System?</p><button>Sign out</button></form>', { headers: { 'Content-Type': 'text/html', 'Cache-Control': 'no-store', 'Content-Security-Policy': "default-src 'none'; form-action 'self'; frame-ancestors 'none'" } });
    if (request.method !== 'POST' || request.headers.get('origin') !== url.origin) return message('Invalid request.', 403);
    const token = cookie(request, SESSION);
    if (token && env.DB) await env.DB.prepare('DELETE FROM auth_sessions WHERE token_hash = ?').bind(await digest(token)).run();
    return redirect('/', [setCookie(SESSION, '', 0)]);
  }
  const token = cookie(request, SESSION);
  if (token && /^[a-f0-9]{64}$/.test(token) && env.DB) {
    const session = await env.DB.prepare('SELECT owner_id, email, name FROM auth_sessions WHERE token_hash = ? AND expires_at > ?').bind(await digest(token), now).first<{ owner_id: string; email: string; name: string }>();
    if (session) {
      headers.set('oai-authenticated-user-id', session.owner_id);
      headers.set('oai-authenticated-user-email', session.email);
      headers.set('oai-authenticated-user-full-name', encodeURIComponent(session.name));
      headers.set('oai-authenticated-user-full-name-encoding', 'percent-encoded-utf-8');
    }
  }
  return new Request(request, { headers });
}
