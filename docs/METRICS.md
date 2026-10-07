# Metrics

**All metrics are illustrative proposals. No baseline or result below comes from Fleek or any real supplier.** Each metric names its numerator and denominator.

## North star
**First-batch acceptance gap** = (first-batch pass rate) − (sample pass rate), per approved pilot.
Numerator: pieces passing on first-batch inspection ÷ pieces in first batch, minus sample pass ÷ sample pieces. Target: gap closes towards 0 (illustrative target: within 5 pts).

## Decision quality
| Metric | Numerator | Denominator | Illustrative target |
|---|---|---|---|
| Pilots that fail first-batch inspection | pilots whose first batch is below the acceptance threshold | limited pilots logged | < 10% |
| Pilots logged with any gate not passing | entries with selected = LIMITED_PILOT and gaps or failures | limited pilots logged | 0 (enforced by the engine) |
| Evidence requests answered | "more evidence" suppliers who resubmit | "more evidence" decisions | > 60% |
| Rejected suppliers later re-sampled and passing | re-samples reaching a pilot | rejects | tracked, no target |

## Speed
| Metric | Definition | Illustrative target |
|---|---|---|
| Sample-to-call time | time from sample received to logged decision | < 2 working days |
| Calls per inspector-week | decisions logged ÷ inspector weeks | tracked |

## Guardrails
| Metric | Definition | Target |
|---|---|---|
| Pilot spend over ceiling | pilots whose confirmed landed first-order cost exceeds the GBP hard cap ÷ pilots (the in-app sample-cost proxy is not a confirmed cost) | 0 |
| Pilots logged without landed cost known | limited pilots with landed cost unticked ÷ limited pilots | 0 (enforced by the engine) |
| Overrides towards risk | entries where selected is more permissive than recommended ÷ entries | 0 (blocked) |
| Stale decisions acted on | stale log entries acted on without a re-log ÷ stale entries | 0 |

## Instrumentation in this concept
Every log entry already carries timestamp, recommendation, selection, acceptance, confidence, pilot ceiling, gaps, failures and fingerprints, so these metrics can be computed from the CSV/JSON export plus first-batch results.
