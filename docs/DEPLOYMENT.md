# Deployment (Cloudflare free tier)

The app is a static build (`dist/`) with no backend, secrets or paid services.

## Option A: Workers static assets via Wrangler
`wrangler.toml` is in the repo.
```bash
npm install
npm run build
npx wrangler login      # one-time, opens a browser
npx wrangler deploy     # serves dist/ on <name>.<account>.workers.dev
```

## Option B: Cloudflare Pages connected to GitHub
Dashboard → Workers & Pages → Create → Pages → Connect to Git → `CashpointSoulja/fleek-supply-sample-gate`.
- Framework preset: None (or Vite)
- Build command: `npm run build`
- Build output directory: `dist`
- Node version: 20 or later (`NODE_VERSION=20` if needed)

Both stay within the free tier: static assets only, no Workers code, no KV, no paid add-ons.

## Status
Not yet deployed: the Cloudflare account is not connected to the build environment (`wrangler whoami` → "You are not authenticated. Please run `wrangler login`."). No other host has been used.
