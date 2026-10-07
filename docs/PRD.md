# PRD: Supply Sample Gate

Independent concept by Ayomide Ahmed. Not an official Fleek product. All suppliers, samples and numbers are synthetic and illustrative.

## Problem
A category bet on a wholesale secondhand marketplace starts with supply for buyers who are already there. The first real risk is the first batch: a supplier whose sample looked fine but whose bales arrive off-mix, under-graded or unphotographed. The operator running the bet needs an evidence gate between "we got a sample" and "we place a first order". A generic CRM tracks conversations; it does not tell you whether 38 good pieces out of 40 is enough, or that "40 bales" is not a unit count.

## User
The person who owns a category bet from thesis to proven economics (for example, a Special Projects Lead on Category Expansion), plus whoever inspects samples for them.

## Goal
Make every sample-to-first-order call explicit, consistent and reviewable, so that:
1. Bad first batches are stopped before money moves.
2. Thin evidence is turned into a specific request, not a gut call.
3. Good suppliers get a **capped** pilot that tests repeatability, not a scale order.

## Non-goals
- Purchasing, ordering, contracts or payments.
- Messaging suppliers or buyers. There is no outreach of any kind.
- Proving that a category is a £5M annual GMV business. A sample can only stop a bad first order or justify a small test.
- Using real suppliers or real marketplace data.

## Workflow
1. **Choose supplier** (three synthetic suppliers, two categories: Y2K denim and sportswear fleece).
2. **Enter the sample**: pieces inspected, pass/fail grades (typed or "+ Pass / + Fail" per piece), photos expected and provided, promised vs observed in-category mix, units available and unit (pcs, kg, bales, with an explicit pieces-per-unit conversion), total sample cost, inspector notes.
3. **Inspect evidence**: seven gates, each Pass, Fail or Missing, with the numbers behind it; separate lists for failures, missing evidence and assumptions.
4. **Decide**: reject, request more evidence or approve a limited pilot. The reviewer can be more cautious than the engine, never less.
5. **Export**: timestamped decision log as CSV or JSON, each entry bound to fingerprints of the inspection and thresholds; exports can be read back and verified.

## Functional requirements
| ID | Requirement | Where |
|---|---|---|
| F1 | Seven gates: sample size, pass-rate lower bound, photo completeness, mix gap, units available, sample cost per piece, demand fit | `src/engine/engine.ts` |
| F2 | Pass rate judged on the 95% Wilson lower bound, not the raw rate | `wilson()` |
| F3 | Missing evidence never passes; a gate is only Fail when even the optimistic reading fails | `evaluate()` |
| F4 | Recommendation: any failure → Reject; else any missing → Request more evidence; else Limited pilot | `evaluate()` |
| F5 | Demand-fit checklist (5 items, need 4 by default) is a gate, so quality alone cannot approve | `DEMAND_ITEMS` |
| F6 | Pilot ceiling = lowest of unit ceiling, units available and GBP ceiling ÷ cost per piece | `evaluate()` |
| F7 | Pilot copy always states it is not permission to purchase or message anyone | `PILOT_DISCLAIMER` |
| F8 | All nine thresholds editable and validated; changes re-score and mark old log entries stale | UI + `validateThresholds()` |
| F9 | Invalid inputs are refused, never scored | `validateInspection()` |
| F10 | kg/bales need an explicit pieces-per-unit conversion; one unit per supplier in imports | engine + importer |
| F11 | CSV import: strict RFC 4180 parse, exact header, all-or-nothing, row-level error messages | `src/engine/importer.ts` |
| F12 | Decision log with ISO timestamps; CSV/JSON export with notice; readback validation and JSON fingerprint | `src/engine/exporter.ts` |
| F13 | Browser-only persistence; invalid saved state discarded with a visible notice | `src/engine/storage.ts` |
| F14 | No sign-in, no network calls, no outreach | whole app |

## Default thresholds (illustrative, editable)
Min 30 pieces · pass-rate lower bound ≥ 80% · photos ≥ 90% · mix gap ≤ 10 pts · ≥ 500 pcs available · ≤ £8 sample cost per piece · ≥ 4 of 5 demand checks · pilot ≤ 300 pcs and ≤ £2,500.

## Seeded cases
| Supplier (synthetic) | Category | Outcome | Why |
|---|---|---|---|
| Northgate Rag Sort | Y2K denim | Limited pilot, 300 pcs / £1,350 | 38/40 pass, 98% photos, mix gap 2.5 pts, 5/5 demand checks |
| Harbour Lane Vintage Co. | Sportswear fleece | Reject | 26/40 pass, mix 15 pts off promise |
| Kestrel Bale Traders | Y2K denim | Request more evidence | 12 pieces, 56% photos, units in bales with no conversion, 2/5 demand checks |

## Success criteria for the concept
See [METRICS.md](METRICS.md). In short: every logged decision is reproducible from its inputs, no limited pilot is logged without all seven gates passing, and the time from sample to a written call drops.
