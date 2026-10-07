# Assumptions and source register

All sources accessed **7 October 2026**. Nothing in this repo is Fleek data. No one at Fleek or any supplier was contacted. No interviews were conducted.

## Observed sources
| # | Source | What was observed | Used for |
|---|---|---|---|
| S1 | https://jobs.ashbyhq.com/fleek/73385aca-7753-4722-8408-ec3b855cc230 | Special Projects Lead – Category Expansion role: take category bets from thesis to proven economics; start with supply and test against existing demand; own supplier onboarding and unit economics; make evidence-based scale or kill calls | Problem framing, viability memo |
| S2 | https://joinfleek.com | Home page at 1366 px and 390 px: official black FLEEK wordmark, Montserrat, black / cream / yellow palette, white header with search, category navigation | Brand sheet, visual guide |
| S3 | https://joinfleek.com/category/denim | Category listing UI: breadcrumbs with yellow chevrons, flat white listing cards with grey borders, yellow primary buttons | Card and breadcrumb styling |
| S4 | https://joinfleek.com/_next/static/media/black_logo_transparent_background.1ecc84e6.webp | Official logo asset served by the site | `public/brand/fleek-logo.webp` |

Screenshots of S2 and S3: `docs/brand/observed-*.png`.

## Assumptions (unverified, stated so they can be tested)
| # | Assumption | Why it matters | How to test |
|---|---|---|---|
| A1 | Category bets begin with supply secured for buyers already on the marketplace | Defines the user and the decision | Stated in S1; confirm with the hiring team |
| A2 | First-batch quality drift vs sample is a frequent, costly failure | Core pain | Compare sample vs first-batch grades on past bets |
| A3 | A 95% Wilson lower bound is a reasonable conservative read of pass rate | Main quality gate | Back-test against first-batch outcomes |
| A4 | 30 pieces, 80%, 90% photos, 10 pts mix gap, 500 pcs, £8/pc, 4/5 demand checks, 300 pcs / £2,500 pilot are sensible defaults | All are editable; defaults set behaviour | Calibrate with real sample and batch data |
| A5 | Suppliers often quote kg or bales; pieces per unit varies a lot | Unit gate | Review real quotes |
| A6 | Sample cost per piece is a usable proxy for first-order price; it is shown only as a labelled proxy, never as a verified first-order total | Cost gate, pilot proxy | Compare to landed first-order cost |
| A7 | £5M annual GMV is used as an illustrative size for a category bet | Framing only; never derived from samples | Replace with the real target |
| A8 | Demand-fit evidence (segment, price band, sell-through, repeat path, landed cost) exists elsewhere and is ticked by hand; landed cost is mandatory | Demand gate | Link to real demand data in v2 |

## Synthetic data
Suppliers "Northgate Rag Sort", "Harbour Lane Vintage Co." and "Kestrel Bale Traders" and every number in `src/engine/seeds.ts` and `eval/cases.json` are invented for this concept. Any resemblance to a real business is unintended.
