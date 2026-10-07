# Test results

Real output from commands run on 7 October 2026 against this commit's code. Re-run with the commands below; output is pasted unedited apart from stripping terminal colour codes.

## Automated: `npm run typecheck`, `npm test` (verbose), `npm run evals`, `npm run build`
```text
== typecheck
typecheck: 0 errors
== test

 RUN  v2.1.9 fleek-supply-sample-gate

 ✓ tests/engine.test.ts > seeded cases > pass case recommends a capped limited pilot
 ✓ tests/engine.test.ts > seeded cases > fail case rejects with quality and mix failures
 ✓ tests/engine.test.ts > seeded cases > thin case requests more evidence and lists every gap
 ✓ tests/engine.test.ts > boundary thresholds > sample count exactly at minimum passes the size gate; one below does not
 ✓ tests/engine.test.ts > boundary thresholds > confidence lower bound exactly at threshold passes
 ✓ tests/engine.test.ts > boundary thresholds > photo completeness exactly at threshold passes; one photo fewer does not
 ✓ tests/engine.test.ts > boundary thresholds > mix gap exactly at maximum passes; above rejects
 ✓ tests/engine.test.ts > boundary thresholds > units exactly at minimum pass; one fewer rejects
 ✓ tests/engine.test.ts > boundary thresholds > cost per piece exactly at max passes; a penny over rejects
 ✓ tests/engine.test.ts > boundary thresholds > demand checks exactly at minimum pass; one fewer blocks the pilot
 ✓ tests/engine.test.ts > quality alone cannot approve scale > perfect quality with zero demand checks does not approve
 ✓ tests/engine.test.ts > quality alone cannot approve scale > pilot is capped by the unit ceiling even with huge supply
 ✓ tests/engine.test.ts > quality alone cannot approve scale > pilot is capped by GBP ceiling
 ✓ tests/engine.test.ts > zero samples, missing photos, invalid inputs, mixed units > zero samples gives no rates, no divide-by-zero and no approval
 ✓ tests/engine.test.ts > zero samples, missing photos, invalid inputs, mixed units > no photos expected or provided counts as missing evidence
 ✓ tests/engine.test.ts > zero samples, missing photos, invalid inputs, mixed units > invalid { sampleCount: -1 } is refused, never scored
 ✓ tests/engine.test.ts > zero samples, missing photos, invalid inputs, mixed units > invalid { passCount: 39 } is refused, never scored
 ✓ tests/engine.test.ts > zero samples, missing photos, invalid inputs, mixed units > invalid { sampleCount: 40.5 } is refused, never scored
 ✓ tests/engine.test.ts > zero samples, missing photos, invalid inputs, mixed units > invalid { passCount: NaN } is refused, never scored
 ✓ tests/engine.test.ts > zero samples, missing photos, invalid inputs, mixed units > invalid { observedInCategory: 41 } is refused, never scored
 ✓ tests/engine.test.ts > zero samples, missing photos, invalid inputs, mixed units > invalid { photosProvided: 121 } is refused, never scored
 ✓ tests/engine.test.ts > zero samples, missing photos, invalid inputs, mixed units > invalid { promisedMixPct: 101 } is refused, never scored
 ✓ tests/engine.test.ts > zero samples, missing photos, invalid inputs, mixed units > invalid { sampleCostGBP: -5 } is refused, never scored
 ✓ tests/engine.test.ts > zero samples, missing photos, invalid inputs, mixed units > invalid { unitsAvailable: Infinity } is refused, never scored
 ✓ tests/engine.test.ts > zero samples, missing photos, invalid inputs, mixed units > invalid { supplierId: '' } is refused, never scored
 ✓ tests/engine.test.ts > zero samples, missing photos, invalid inputs, mixed units > invalid thresholds are refused
 ✓ tests/engine.test.ts > zero samples, missing photos, invalid inputs, mixed units > kg without conversion is missing evidence; with conversion it is converted and flagged
 ✓ tests/engine.test.ts > monotonic: removing evidence never improves the outcome > removing photos
 ✓ tests/engine.test.ts > monotonic: removing evidence never improves the outcome > removing demand
 ✓ tests/engine.test.ts > monotonic: removing evidence never improves the outcome > removing units
 ✓ tests/engine.test.ts > monotonic: removing evidence never improves the outcome > removing cost
 ✓ tests/engine.test.ts > monotonic: removing evidence never improves the outcome > removing samples
 ✓ tests/engine.test.ts > selection guard > reviewer can be more cautious but never more permissive
 ✓ tests/engine.test.ts > selection guard > is deterministic
 ✓ tests/io.test.ts > CSV parser > handles quotes, escaped quotes, commas and CRLF
 ✓ tests/io.test.ts > CSV parser > keeps newlines inside quoted fields
 ✓ tests/io.test.ts > CSV parser > rejects unclosed quotes
 ✓ tests/io.test.ts > CSV parser > rejects stray quotes
 ✓ tests/io.test.ts > CSV parser > round-trips toCsv
 ✓ tests/io.test.ts > inspection import > imports a valid file
 ✓ tests/io.test.ts > inspection import > is all-or-nothing and names the row and field
 ✓ tests/io.test.ts > inspection import > rejects ""
 ✓ tests/io.test.ts > inspection import > rejects "supplier_id,category,sample_count,pass_count,fail_count,photos_expected,photos_provided,promised_mix_pct,observed_in_category,units_available,units_unit,pieces_per_unit,sample_cost_gbp,inspector_notes\n"
 ✓ tests/io.test.ts > inspection import > rejects "supplier_id,category\nSUP-NGT,denim\n"
 ✓ tests/io.test.ts > inspection import > rejects "supplier_id,category,sample_count,pass_count,fail_count,photos_expected,photos_provided,promised_mix_pct,observed_in_category,units_available,units_unit,pieces_per_unit,sample_cost_gbp,inspector_notes,extra\nSUP-NGT,denim,40,38,2,120,118,90,37,2400,pcs,,180,ok,1\n"
 ✓ tests/io.test.ts > inspection import > rejects "supplier_id,category,sample_count,pass_count,fail_count,photos_expected,photos_provided,promised_mix_pct,observed_in_category,units_available,units_unit,pieces_per_unit,sample_cost_gbp,inspector_notes\nSUP-NGT,denim,40,38,2,120,118,90,37,2400,pcs,,180,ok,extra\n"
 ✓ tests/io.test.ts > inspection import > rejects "supplier_id,category,sample_count,pass_count,fail_count,photos_expected,photos_provided,promised_mix_pct,observed_in_category,units_available,units_unit,pieces_per_unit,sample_cost_gbp,inspector_notes\nSUP-REAL,denim,40,38,2,120,118,90,37,2400,pcs,,180,ok\n"
 ✓ tests/io.test.ts > inspection import > rejects "supplier_id,category,sample_count,pass_count,fail_count,photos_expected,photos_provided,promised_mix_pct,observed_in_category,units_available,units_unit,pieces_per_unit,sample_cost_gbp,inspector_notes\nSUP-NGT,shoes,40,38,2,120,118,90,37,2400,pcs,,180,ok\n"
 ✓ tests/io.test.ts > inspection import > rejects "supplier_id,category,sample_count,pass_count,fail_count,photos_expected,photos_provided,promised_mix_pct,observed_in_category,units_available,units_unit,pieces_per_unit,sample_cost_gbp,inspector_notes\nSUP-NGT,denim,40,39,2,120,118,90,37,2400,pcs,,180,ok\n"
 ✓ tests/io.test.ts > inspection import > rejects "supplier_id,category,sample_count,pass_count,fail_count,photos_expected,photos_provided,promised_mix_pct,observed_in_category,units_available,units_unit,pieces_per_unit,sample_cost_gbp,inspector_notes\nSUP-NGT,denim,-3,38,2,120,118,90,37,2400,pcs,,180,ok\n"
 ✓ tests/io.test.ts > inspection import > rejects "supplier_id,category,sample_count,pass_count,fail_count,photos_expected,photos_provided,promised_mix_pct,observed_in_category,units_available,units_unit,pieces_per_unit,sample_cost_gbp,inspector_notes\nSUP-NGT,denim,40,38,2,120,118,90,37,2400,pcs,,12,00,ok\n"
 ✓ tests/io.test.ts > inspection import > rejects "supplier_id,category,sample_count,pass_count,fail_count,photos_expected,photos_provided,promised_mix_pct,observed_in_category,units_available,units_unit,pieces_per_unit,sample_cost_gbp,inspector_notes\nSUP-NGT,denim,40,38,2,120,118,90,37,2400,boxes,,180,ok\n"
 ✓ tests/io.test.ts > inspection import > rejects "supplier_id,category,sample_count,pass_count,fail_count,photos_expected,photos_provided,promised_mix_pct,observed_in_category,units_available,units_unit,pieces_per_unit,sample_cost_gbp,inspector_notes\nSUP-NGT,denim,40,38,2,120,118,90,37,2400,pcs,,180,ok\nSUP-NGT,denim,40,38,2,120,118,90,37,2400,pcs,,180,ok\n"
 ✓ tests/io.test.ts > inspection import > rejects "supplier_id,category,sample_count,pass_count,fail_count,photos_expected,photos_provided,promised_mix_pct,observed_in_category,units_available,units_unit,pieces_per_unit,sample_cost_gbp,inspector_notes\nSUP-NGT,denim,40,38,2,120,118,90,37,2400,pcs,,180,ok\nSUP-NGT,fleece,40,38,2,120,118,90,37,2400,kg,3,180,ok\n"
 ✓ tests/io.test.ts > inspection import > rejects "supplier_id,category,sample_count,pass_count,fail_count,photos_expected,photos_provided,promised_mix_pct,observed_in_category,units_available,units_unit,pieces_per_unit,sample_cost_gbp,inspector_notes\nSUP-NGT,denim,40,38,2,120,118,,37,2400,pcs,,180,ok\n"
 ✓ tests/io.test.ts > inspection import > rejects "supplier_id,category,sample_count,pass_count,fail_count,photos_expected,photos_provided,promised_mix_pct,observed_in_category,units_available,units_unit,pieces_per_unit,sample_cost_gbp,inspector_notes\n\"SUP-NGT,denim\n"
 ✓ tests/io.test.ts > inspection import > accepts a £ prefix on cost and blank optional units
 ✓ tests/io.test.ts > export readback > JSON export reads back identically
 ✓ tests/io.test.ts > export readback > JSON readback rejects tampering and bad fields
 ✓ tests/io.test.ts > export readback > CSV export reads back identically, including commas, quotes and newlines
 ✓ tests/io.test.ts > export readback > CSV readback rejects a wrong header
 ✓ tests/io.test.ts > persisted state > discards invalid saved state with a notice
 ✓ tests/io.test.ts > persisted state > loads valid state

 Test Files  2 passed (2)
      Tests  63 passed (63)
   Start at  08:42:55
   Duration  323ms (transform 147ms, setup 0ms, collect 203ms, tests 61ms, environment 0ms, prepare 97ms)

== evals
PASS E18 Harbour Lane fleece re-sample, still mixed: expected REJECT, got REJECT
18/18 cases matched the expected decision (default thresholds).
== build
transforming...
✓ 11 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                  0.66 kB │ gzip:  0.40 kB
dist/assets/index-DYpWrSvr.css  12.32 kB │ gzip:  3.23 kB
dist/assets/index-BY6jaGML.js   44.28 kB │ gzip: 14.94 kB
✓ built in 217ms
```

Full eval table: [eval/results.md](../eval/results.md).

## UI flow (Playwright script against the local dev server, 1366×900 and 390×844)
Steps: open thin Kestrel case → evidence shows 1 of 7 gates and five missing items; type `abc` into Graded pass → field turns red, evidence hidden, error "Pass count must be a whole number of 0 or more."; restore and log "request more evidence"; open Harbour Lane fleece → two failures, log reject; open Northgate denim → log limited pilot, capped at 300 pcs; load the bad example CSV → "File rejected: 3 problems" (mixed units, unknown supplier, text in number); export JSON and CSV; read the JSON back; raise minimum pieces to 45; enter 0 for minimum pieces; reload; corrupt storage and reload.

Script output:
```text
Export verified: 3 entries, fingerprint b573585e.
stale count 3
log rows after reload 3
notice: Saved data in this browser was invalid, so it was discarded and the synthetic seeds were reloaded. Dismiss
mobile overflow 390
errors []
```
`stale count 3`: all three entries flagged stale after the threshold change. `mobile overflow 390`: page scroll width equals the 390 px viewport (no horizontal scroll). `errors []`: no page errors.
