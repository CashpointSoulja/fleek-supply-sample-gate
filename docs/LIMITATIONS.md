# Limitations

- **Synthetic only.** Three invented suppliers, two categories, hand-written numbers. Nothing here is Fleek data, and no supplier or Fleek employee was contacted or interviewed.
- **Uncalibrated thresholds.** Defaults are reasoned guesses (see assumptions A3–A4). They are editable, not validated.
- **A sample is not a business case.** Passing every gate justifies a capped test of repeatability. It does not show that a category can reach the illustrative £5M annual GMV.
- **Statistics are simple.** Wilson 95% interval on pass rate; mix judged with a ±1-piece optimistic/pessimistic band; no sequential testing, no grade tiers, no per-defect weighting.
- **Demand fit is self-reported.** The checklist is ticked by hand and not linked to marketplace data.
- **Cost proxy.** Sample cost per piece stands in for first-order price; freight, duty and last-mile only appear as a checklist item.
- **Single browser, single user.** State lives in localStorage; no accounts, sharing, roles or server audit log. Clearing the browser clears the log; export to keep it.
- **Fingerprints are integrity checks, not security.** FNV-1a detects accidental edits to exports; it does not stop deliberate forgery.
- **Imports skip demand checks** on purpose; they start unticked and must be confirmed by hand.
- **No outreach, ordering or payments**, by design.
- **Accessibility** checked by keyboard and contrast review only; no screen-reader audit.
