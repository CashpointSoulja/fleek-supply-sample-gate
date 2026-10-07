# Deployment (Cloudflare free tier)

The app is a static build (`dist/`) with no backend, secrets or paid services.

## Live
https://fleek-supply-sample-gate.pages.dev/

Cloudflare Pages, connected to `CashpointSoulja/fleek-supply-sample-gate`. A normal push to `main` triggers a new build and deploy. No force pushes.

- Build command: `npm run build`
- Build output directory: `dist`
- Node version: 20 or later (`NODE_VERSION=20` if needed)

Free tier only: static assets, no Workers code, no KV, no paid add-ons, no secrets.

## Alternative: Workers static assets via Wrangler
`wrangler.toml` is in the repo for a manual deploy from a machine logged in to the same account.
```bash
npm install
npm run build
npx wrangler login
npx wrangler deploy
```
