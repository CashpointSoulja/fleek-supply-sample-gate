# Test plan

## Layers
| Layer | Tool | Command | Files |
|---|---|---|---|
| Types | TypeScript strict | `npm run typecheck` | all `src`, `tests`, `eval` |
| Unit: engine | Vitest | `npm test` | `tests/engine.test.ts` |
| Unit: CSV, import, export, storage | Vitest | `npm test` | `tests/io.test.ts` |
| Decision evals | tsx script | `npm run evals` | `eval/cases.json` → `eval/results.md` |
| Build | Vite | `npm run build` | `dist/` |
| UI flow | Playwright script against the dev server, plus screenshots at 1366 px and 390 px | manual run | see TEST_RESULTS.md |

## Required coverage (from the brief)
| Area | Tests |
|---|---|
| Boundary thresholds | Exactly-at and one-past for sample size, confidence bound, photos, mix gap, units, cost per piece, demand checks (count, with landed cost known) |
| Zero samples | No rates, no division by zero, "No pieces inspected" first in missing evidence, no approval |
| Missing photos | Zero expected/provided → missing; one below threshold → missing |
| Invalid inputs | Negative, fractional, NaN, infinite, pass + fail ≠ total, observed > sample, photos > expected, mix > 100, blank supplier, invalid thresholds |
| Mixed units | kg/bales without conversion → missing; with conversion → converted + warning; importer rejects two units for one supplier |
| Export readback | JSON and CSV round-trip identically (commas, quotes, newlines); tampered fingerprint, wrong schema, bad JSON, bad timestamp, pilot without pilot recommendation, wrong CSV header all rejected |

## Additional safety tests
- Quality alone cannot approve: 40/40 pass with zero demand checks → more evidence, and the pilot button is refused.
- Landed cost is mandatory: the seed pass ticks it explicitly; with every other check ticked but landed cost missing the result is more evidence (also when the count threshold is lowered to 1), and the pilot button is refused.
- The pilot carries the true GBP hard cap and a separate sample-cost proxy; readback rejects a pilot entry without its ceiling.
- Monotonic: removing photos, demand checks, units, cost or samples never improves the outcome.
- Selection guard: reviewer can choose a more cautious option, never a more permissive one.
- Pilot ceilings bind on units and on GBP.
- Saved state with any invalid field is discarded with a visible notice.
- Determinism: same inputs give deep-equal evaluations.

## UI checks
Seeded pass, fail and thin cases; typing text into a number field shows a field-level error and hides evidence; recording three decisions; importing a CSV with errors; exporting CSV and JSON and reading the JSON back; editing a threshold marks entries stale; an invalid threshold shows an error; reload keeps the log; corrupted storage shows the discard notice; no horizontal scroll at 390 px.
