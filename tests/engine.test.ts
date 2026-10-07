import { describe, expect, it } from "vitest";
import { DEFAULT_THRESHOLDS, canSelect, evaluate, wilson } from "../src/engine/engine";
import { SEED_INSPECTIONS } from "../src/engine/seeds";
import type { Inspection, Thresholds } from "../src/engine/types";

const T: Thresholds = { ...DEFAULT_THRESHOLDS };
const pass = SEED_INSPECTIONS[0];
const fail = SEED_INSPECTIONS[1];
const thin = SEED_INSPECTIONS[2];
const w = (o: Partial<Inspection>): Inspection => ({ ...pass, demand: { ...pass.demand }, ...o });

describe("seeded cases", () => {
  it("pass case recommends a capped limited pilot", () => {
    const e = evaluate(pass, T);
    expect(e.recommendation).toBe("LIMITED_PILOT");
    expect(e.pilot).not.toBeNull();
    expect(e.pilot!.units).toBeLessThanOrEqual(T.pilotCeilingUnits);
    expect(e.pilot!.ceilingGBP).toBe(T.pilotCeilingGBP);
    expect(e.pilot!.sampleCostProxyGBP).toBe(1350);
    expect(e.pilot!.sampleCostProxyGBP).toBeLessThanOrEqual(e.pilot!.ceilingGBP);
  });
  it("fail case rejects with quality and mix failures", () => {
    const e = evaluate(fail, T);
    expect(e.recommendation).toBe("REJECT");
    expect(e.failures.join(" ")).toMatch(/pass rate/);
    expect(e.failures.join(" ")).toMatch(/mix/);
  });
  it("thin case requests more evidence and lists every gap", () => {
    const e = evaluate(thin, T);
    expect(e.recommendation).toBe("REQUEST_MORE_EVIDENCE");
    const m = e.missingEvidence.join(" ");
    expect(m).toMatch(/18 more pieces/);
    expect(m).toMatch(/Photo set incomplete/);
    expect(m).toMatch(/bales with no conversion/);
    expect(m).toMatch(/Demand fit/);
  });
});

describe("boundary thresholds", () => {
  it("sample count exactly at minimum passes the size gate; one below does not", () => {
    expect(evaluate(w({ sampleCount: 30, passCount: 30, failCount: 0, observedInCategory: 27, sampleCostGBP: 135 }), T).gates.find((g) => g.id === "samples")!.status).toBe("pass");
    const below = evaluate(w({ sampleCount: 29, passCount: 29, failCount: 0, observedInCategory: 26, sampleCostGBP: 130 }), T);
    expect(below.gates.find((g) => g.id === "samples")!.status).toBe("missing");
    expect(below.recommendation).toBe("REQUEST_MORE_EVIDENCE");
  });
  it("confidence lower bound exactly at threshold passes", () => {
    const lb = wilson(38, 40)!.lower;
    expect(evaluate(pass, { ...T, minAcceptanceLowerBound: lb }).gates.find((g) => g.id === "quality")!.status).toBe("pass");
    expect(evaluate(pass, { ...T, minAcceptanceLowerBound: lb + 1e-9 }).gates.find((g) => g.id === "quality")!.status).not.toBe("pass");
  });
  it("photo completeness exactly at threshold passes; one photo fewer does not", () => {
    expect(evaluate(w({ photosProvided: 108 }), T).gates.find((g) => g.id === "photos")!.status).toBe("pass");
    expect(evaluate(w({ photosProvided: 107 }), T).gates.find((g) => g.id === "photos")!.status).toBe("missing");
  });
  it("mix gap exactly at maximum passes; above rejects", () => {
    expect(evaluate(w({ promisedMixPct: 82.5 }), T).gates.find((g) => g.id === "mix")!.status).toBe("pass");
    const e = evaluate(w({ promisedMixPct: 82.5, observedInCategory: 32 }), { ...T, maxMixGapPts: 2.4 });
    expect(e.recommendation).toBe("REJECT");
  });
  it("units exactly at minimum pass; one fewer rejects", () => {
    expect(evaluate(w({ unitsAvailable: 500 }), T).gates.find((g) => g.id === "units")!.status).toBe("pass");
    expect(evaluate(w({ unitsAvailable: 499 }), T).recommendation).toBe("REJECT");
  });
  it("cost per piece exactly at max passes; a penny over rejects", () => {
    expect(evaluate(w({ sampleCostGBP: 320 }), T).gates.find((g) => g.id === "cost")!.status).toBe("pass");
    expect(evaluate(w({ sampleCostGBP: 320.4 }), T).recommendation).toBe("REJECT");
  });
  it("demand checks exactly at minimum pass (landed cost known); one fewer blocks the pilot", () => {
    expect(evaluate(w({ demand: { ...pass.demand, repeatOrderPathKnown: false } }), T).recommendation).toBe("LIMITED_PILOT");
    expect(evaluate(w({ demand: { ...pass.demand, repeatOrderPathKnown: false, sellThroughSignal: false } }), T).recommendation).toBe("REQUEST_MORE_EVIDENCE");
  });
  it("seed pass explicitly ticks landed cost", () => {
    expect(pass.demand.landedCostKnown).toBe(true);
  });
  it("regression: every other check ticked but landed cost missing blocks the pilot", () => {
    const e = evaluate(w({ demand: { ...pass.demand, landedCostKnown: false } }), T);
    expect(e.demandChecks).toBe(4);
    expect(e.recommendation).toBe("REQUEST_MORE_EVIDENCE");
    expect(e.pilot).toBeNull();
    expect(e.gates.find((g) => g.id === "demand")!.status).toBe("missing");
    expect(e.missingEvidence.some((m) => m.startsWith("Landed cost unknown"))).toBe(true);
    expect(canSelect(e, "LIMITED_PILOT").ok).toBe(false);
  });
  it("landed cost stays mandatory even if the count threshold is lowered to 1", () => {
    expect(evaluate(w({ demand: { ...pass.demand, landedCostKnown: false } }), { ...T, minDemandChecks: 1 }).recommendation).toBe("REQUEST_MORE_EVIDENCE");
  });
});

describe("quality alone cannot approve scale", () => {
  it("perfect quality with zero demand checks does not approve", () => {
    const e = evaluate(w({ passCount: 40, failCount: 0, demand: { buyerSegmentNamed: false, priceBandMatchesLiveDemand: false, sellThroughSignal: false, repeatOrderPathKnown: false, landedCostKnown: false } }), T);
    expect(e.recommendation).toBe("REQUEST_MORE_EVIDENCE");
    expect(canSelect(e, "LIMITED_PILOT").ok).toBe(false);
  });
  it("pilot is capped by the unit ceiling even with huge supply", () => {
    const e = evaluate(w({ unitsAvailable: 1_000_000 }), T);
    expect(e.pilot!.units).toBe(300);
  });
  it("pilot is capped by GBP ceiling", () => {
    const e = evaluate(pass, { ...T, pilotCeilingGBP: 450 });
    expect(e.pilot!.units).toBe(100);
    expect(e.pilot!.ceilingGBP).toBe(450);
    expect(e.pilot!.sampleCostProxyGBP).toBeLessThanOrEqual(450);
  });
});

describe("zero samples, missing photos, invalid inputs, mixed units", () => {
  it("zero samples gives no rates, no divide-by-zero and no approval", () => {
    const e = evaluate(w({ sampleCount: 0, passCount: 0, failCount: 0, observedInCategory: 0 }), T);
    expect(e.valid).toBe(true);
    expect(e.acceptanceRate).toBeNull();
    expect(e.confidenceLower).toBeNull();
    expect(e.sampleCostPerPiece).toBeNull();
    expect(e.recommendation).toBe("REQUEST_MORE_EVIDENCE");
    expect(e.missingEvidence[0]).toMatch(/No pieces inspected/);
  });
  it("no photos expected or provided counts as missing evidence", () => {
    const e = evaluate(w({ photosExpected: 0, photosProvided: 0 }), T);
    expect(e.recommendation).toBe("REQUEST_MORE_EVIDENCE");
    expect(e.missingEvidence.join(" ")).toMatch(/Photo evidence missing/);
  });
  it.each([
    [{ sampleCount: -1 }, /Sample count/],
    [{ passCount: 39 }, /must equal sample count/],
    [{ sampleCount: 40.5 }, /Sample count/],
    [{ passCount: Number.NaN }, /Pass count/],
    [{ observedInCategory: 41 }, /cannot exceed sample count/],
    [{ photosProvided: 121 }, /cannot exceed photos expected/],
    [{ promisedMixPct: 101 }, /between 0 and 100/],
    [{ sampleCostGBP: -5 }, /Sample cost/],
    [{ unitsAvailable: Number.POSITIVE_INFINITY }, /Units available/],
    [{ supplierId: "" }, /Choose a supplier/],
  ] as [Partial<Inspection>, RegExp][])("invalid %o is refused, never scored", (o, re) => {
    const e = evaluate(w(o), T);
    expect(e.valid).toBe(false);
    expect(e.recommendation).toBeNull();
    expect(e.errors.join(" ")).toMatch(re);
    expect(canSelect(e, "REJECT").ok).toBe(false);
  });
  it("invalid thresholds are refused", () => {
    const e = evaluate(pass, { ...T, minSamples: 0 });
    expect(e.valid).toBe(false);
    expect(evaluate(pass, { ...T, minDemandChecks: 2.5 }).valid).toBe(false);
  });
  it("kg without conversion is missing evidence; with conversion it is converted and flagged", () => {
    expect(evaluate(w({ unitsUnit: "kg", unitsAvailable: 800 }), T).missingEvidence.join(" ")).toMatch(/kg with no conversion/);
    const conv = evaluate(w({ unitsUnit: "kg", unitsAvailable: 800, piecesPerUnit: 2.5 }), T);
    expect(conv.unitsInPieces).toBe(2000);
    expect(conv.warnings.join(" ")).toMatch(/unverified/);
  });
});

describe("monotonic: removing evidence never improves the outcome", () => {
  const rank = { REJECT: 0, REQUEST_MORE_EVIDENCE: 1, LIMITED_PILOT: 2 } as const;
  it.each([
    ["photos", { photosProvided: 60 }],
    ["demand", { demand: { ...pass.demand, buyerSegmentNamed: false, sellThroughSignal: false } }],
    ["units", { unitsAvailable: null }],
    ["cost", { sampleCostGBP: null }],
    ["samples", { sampleCount: 10, passCount: 10, failCount: 0, observedInCategory: 9 }],
  ] as [string, Partial<Inspection>][])("removing %s", (_n, o) => {
    const before = evaluate(pass, T).recommendation!;
    const after = evaluate(w(o), T).recommendation!;
    expect(rank[after]).toBeLessThanOrEqual(rank[before]);
  });
});

describe("selection guard", () => {
  it("reviewer can be more cautious but never more permissive", () => {
    const thinE = evaluate(thin, T);
    expect(canSelect(thinE, "LIMITED_PILOT").ok).toBe(false);
    expect(canSelect(thinE, "REJECT").ok).toBe(true);
    const failE = evaluate(fail, T);
    expect(canSelect(failE, "REQUEST_MORE_EVIDENCE").ok).toBe(false);
    const passE = evaluate(pass, T);
    expect(canSelect(passE, "LIMITED_PILOT").ok).toBe(true);
    expect(canSelect(passE, "REJECT").ok).toBe(true);
  });
  it("is deterministic", () => {
    expect(evaluate(pass, T)).toEqual(evaluate(pass, T));
  });
});
