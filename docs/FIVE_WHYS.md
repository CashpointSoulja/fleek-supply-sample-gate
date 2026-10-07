# Five Whys

Problem statement (hypothesis, not observed data): **a category bet loses money and buyer trust on its first supplier batch.**

1. **Why did the first batch go wrong?** The delivered stock did not match the sample: lower grade, off-mix, fewer usable pieces.
2. **Why didn't the sample catch it?** The sample was small and judged by its raw pass rate. 9 of 10 good looks like 90%, but the honest range on 10 pieces runs from roughly 60% to 98%.
3. **Why was a small sample accepted?** There was no explicit minimum, and missing photos or a missing unit conversion ("40 bales") were treated as "probably fine" rather than as missing evidence.
4. **Why were gaps treated as fine?** Pressure to show progress on the bet, and a quality score that looked good on its own, with no separate check that existing buyers want this stock at this price.
5. **Why was there no separate demand check or size limit?** Sample review lived in messages and spreadsheets, so each call was ad hoc, unlogged and not capped.

**Root cause:** no shared, explicit evidence gate between "sample received" and "first order", and no ceiling on what a good sample can unlock.

**Countermeasure in this concept:** seven explicit gates with editable thresholds, missing-is-not-passing, a demand-fit gate that quality cannot override, a hard pilot ceiling, and a timestamped, exportable decision log.
