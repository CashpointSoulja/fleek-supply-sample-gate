# Evals

`eval/cases.json` holds 18 synthetic sample inspections, each with the decision an experienced operator would expect under default thresholds. `npm run evals` scores every case with the real engine and writes [eval/results.md](../eval/results.md). The run fails if any case disagrees.

Coverage: the three seeds; quality without demand; zero samples; no photos; a pass rate that straddles the bar; a clear small-sample fail; mix bait-and-switch; too little stock; expensive samples; kg with and without conversion; missing cost; two invalid inputs; a thin supplier that later supplies full evidence; a failed supplier whose re-sample is still off-mix.

Cases are illustrative and hand-written; they test that the logic does what the PRD says, not that the thresholds are right.
