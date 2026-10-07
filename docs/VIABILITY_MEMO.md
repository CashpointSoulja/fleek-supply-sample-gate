# Viability memo: why this tool fits the Category Expansion seat

Independent concept by Ayomide Ahmed. Not an official Fleek product. Numbers are illustrative.

## The seat
The Special Projects Lead – Category Expansion role (source S1, accessed 7 October 2026) owns category bets end to end: from thesis to proven economics, starting with supply and testing it against demand that already exists on the marketplace, then deciding whether to scale or kill. That makes the first supplier decision the moment where the most money and credibility can be lost cheaply, or saved cheaply.

## What the tool changes
| Without a gate | With Supply Sample Gate |
|---|---|
| "Sample looked good" in a message thread | 7 gates, each Pass / Fail / Missing, with numbers |
| 9/10 read as 90% | 9/10 read as "lower bound 60%, not enough" |
| "40 bales" accepted as volume | Missing until a pieces-per-bale figure is given |
| Strong quality pushes the bet forward | Demand fit is a separate gate quality cannot override |
| First order sized by enthusiasm | Pilot capped at the lowest of units, pieces and £ ceilings |
| Hard to explain a call later | Timestamped log, fingerprints, stale flag, CSV/JSON export |

## Illustrative economics (not a forecast)
- A bad first order of 300 pieces at about £4.50 per piece is roughly **£1,350** at risk, plus buyer trust. The default pilot ceiling keeps any single supplier test at or below **£2,500**.
- Against an illustrative **£5M annual GMV** target, one pilot is about **0.03%** of the target. A pilot tests repeatability; it proves nothing about the £5M. The app prints this ratio next to the ceiling so no one confuses the two.
- The tool costs nothing to run: a static site, no backend, no paid APIs.

## Why build vs buy
Generic CRMs and supplier portals track contacts and orders. The value here is the narrow decision logic (confidence bounds, missing-is-not-passing, demand gate, ceiling) and the audit trail. That logic is about 300 lines and is fully tested, so it can move into whatever internal stack exists.

## Risks
- Defaults are uncalibrated (A4). Mitigation: all thresholds are editable, and v2 back-tests against real batch outcomes.
- Demand checks are ticked by hand (A8). Mitigation: v2 links them to marketplace data.
- People may read "limited pilot" as approval to buy. Mitigation: every pilot surface and export repeats that it is not permission to purchase or message anyone.

## Recommendation
Pilot the gate on the next two category bets, logging every sample call, and compare first-batch acceptance against sample acceptance. Keep it if the gap closes and calls get faster; drop it if inspectors route around it.
