# Cloudflare deployment

Repository: https://github.com/belugpt/revenue-monitoring-system

Cloudflare Workers Builds should use `main`, build command `node scripts/build-cloudflare.mjs`, and deploy command `node scripts/deploy-cloudflare.mjs`. Disable preview builds until a separate preview database and OAuth client are configured. The deploy script applies additive migrations to the account-owned D1 database before deploying the verified Worker. The build token needs Workers deployment and D1 migration permissions in this account.

`wrangler.cloudflare.json` owns the independent deployment settings. Its D1 database is separate from the existing Sites deployment; no existing financial records are copied. The build script patches only the generated Cloudflare deployment metadata, preserving the existing Sites publishing path.

## Google sign-in

Register a Google OAuth client of type **Web application**, with redirect URI `https://<production-worker-host>/auth/callback`. Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` as runtime secrets in the Worker settings. Do not commit the secret or place it in a build log. Google consent only requests `openid email profile`. Publish the Google app for external users after the consent screen is configured; a testing app restricts sign-in to its test users.

The Google flow uses a browser-bound one-time state and PKCE. The server exchanges the authorization code and retrieves the verified profile from Google's userinfo endpoint. It stores only hashed opaque session tokens in D1; cookies are Secure, HttpOnly, SameSite=Lax and expire after seven days. Google access tokens are not persisted. Incoming Sites identity headers are stripped on the independent Worker before the verified session identity is introduced. Logout requires a same-origin POST. Missing Google settings disable sign-in while leaving the illustrative dashboard accessible.

## Verification

Run `npm test`, `npm run typecheck`, and `node scripts/build-cloudflare.mjs`. Authentication tests exercise the OAuth callback, state replay, invalid/expired sessions, forged identity headers, and logout against SQLite with mocked Google responses. After adding real Google credentials, verify a real sign-in, create/save/reload a business, and confirm another Google account cannot access it. The OAuth provider flow cannot be considered live-tested until this is complete.
