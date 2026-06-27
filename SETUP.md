# Poker Tracker — Subscription Setup

App now requires **Google login**, gives a **30-day free trial**, then gates new
data entry behind a **10₪/month** Grow (משולם) subscription.

Backend: Supabase project **family-calendar** (`cvhrlwixrsfvspmxgkjv`), tables
prefixed `poker_`. Frontend env in `.env`.

What's already built & deployed:
- Tables `poker_profiles`, `poker_entries`, `poker_settings` (+ RLS).
- `poker_has_access()` gate: writes allowed only during trial or active sub.
- Edge functions `grow-create-payment` (JWT) and `grow-webhook` (public).
- Frontend: login wall, trial banner, paywall, Supabase-backed data.

You still need to do the steps below before it works end-to-end.

---

## 1. Enable Google login (Supabase Dashboard)

1. **Google Cloud Console** → APIs & Services → Credentials → *Create OAuth client ID* → Web application.
2. Authorized redirect URI:
   `https://cvhrlwixrsfvspmxgkjv.supabase.co/auth/v1/callback`
3. Copy **Client ID** + **Client secret**.
4. **Supabase Dashboard** → Authentication → Providers → **Google** → enable, paste
   Client ID + secret → Save.
5. Authentication → URL Configuration → set **Site URL** to your deployed frontend
   (e.g. `https://poker.example.com`) and add it to **Redirect URLs**
   (also add `http://localhost:5173` for local dev).

## 2. Set edge-function secrets (Grow / משולם)

Supabase Dashboard → Edge Functions → **Secrets** (or `supabase secrets set`):

| Secret | Value |
|---|---|
| `GROW_BASE_URL` | `https://secure.meshulam.co.il/api/light/server/1.0/` (prod) or sandbox URL |
| `GROW_PAGE_CODE` | from Grow dashboard |
| `GROW_API_KEY` | from Grow dashboard |
| `PUBLIC_SITE_URL` | deployed frontend origin, e.g. `https://poker.example.com` |

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` are auto-injected.

## 3. Configure the Grow page

- Create the payment page as a **recurring / direct-debit (הוראת קבע)** page so Grow
  charges 10₪ automatically each month.
- Set the page's **server callback (notifyUrl)** to:
  `https://cvhrlwixrsfvspmxgkjv.supabase.co/functions/v1/grow-webhook`
- Verify the callback field names against your Grow docs and adjust
  `grow-webhook/index.ts` if they differ (current code reads `cField1`,
  `status`/`transactionStatus`/`statusCode`, `transactionId`/`asmachta`,
  `cardToken`/`token`). **Add signature verification per Grow's spec before launch.**

## 4. Run locally

```bash
npm install
npm run dev        # http://localhost:5173
```

`.env` already points at the Supabase project (publishable key — safe to ship).

## 5. Deploy frontend

Any static host (Vercel/Netlify). Build: `npm run build` → serve `dist/`.
Set the same env vars on the host and update `PUBLIC_SITE_URL` + Supabase Site URL
to the production domain.

---

## How the gate works

- First login → `poker_profiles` row created, `trial_started_at = now()` (forced
  server-side; cannot be backdated by the client).
- During trial OR active sub → full app (`poker_has_access()` = true).
- Trial expired & no sub → **read-only**: history/CSV still visible, but inserting
  or editing entries is blocked by RLS *and* the UI shows the paywall.
- Pay via Grow → `grow-webhook` flips `sub_status = active`, sets
  `current_period_end`. Each monthly recurring charge re-fires the webhook and
  pushes `current_period_end` forward. If charges stop, access lapses
  automatically when `current_period_end` passes.

## Trial length

30 days, defined in **two** places — keep them in sync:
- DB: `poker_has_access()` (`interval '30 days'`)
- Frontend: `VITE_TRIAL_DAYS` in `.env`
