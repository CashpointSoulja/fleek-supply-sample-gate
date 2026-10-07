import { fingerprint } from "./hash";
import type {
  DemandChecklist,
  Evaluation,
  Gate,
  Inspection,
  Recommendation,
  Selection,
  Thresholds,
} from "./types";

export const DEFAULT_THRESHOLDS: Thresholds = {
  minSamples: 30,
  minAcceptanceLowerBound: 0.8,
  minPhotoCompleteness: 0.9,
  maxMixGapPts: 10,
  minUnitsAvailable: 500,
  maxSampleCostPerPieceGBP: 8,
  minDemandChecks: 4,
  pilotCeilingUnits: 300,
  pilotCeilingGBP: 2500,
};

export const THRESHOLD_LIMITS: Record<keyof Thresholds, { min: number; max: number; integer: boolean; label: string }> = {
  minSamples: { min: 1, max: 1000, integer: true, label: "Minimum pieces inspected" },
  minAcceptanceLowerBound: { min: 0.5, max: 0.99, integer: false, label: "Minimum confidence (lower bound of pass rate)" },
  minPhotoCompleteness: { min: 0.5, max: 1, integer: false, label: "Minimum photo completeness" },
  maxMixGapPts: { min: 0, max: 50, integer: false, label: "Maximum promised vs observed mix gap (pts)" },
  minUnitsAvailable: { min: 1, max: 1_000_000, integer: true, label: "Minimum units available (pcs)" },
  maxSampleCostPerPieceGBP: { min: 0.01, max: 1000, integer: false, label: "Maximum sample cost per piece (GBP)" },
  minDemandChecks: { min: 1, max: 5, integer: true, label: "Minimum demand-fit checks" },
  pilotCeilingUnits: { min: 1, max: 100_000, integer: true, label: "Pilot ceiling (units)" },
  pilotCeilingGBP: { min: 1, max: 1_000_000, integer: false, label: "Pilot ceiling (GBP)" },
};

export const DEMAND_ITEMS: { key: keyof DemandChecklist; label: string }[] = [
  { key: "buyerSegmentNamed", label: "Existing buyer segment named for this category" },
  { key: "priceBandMatchesLiveDemand", label: "Price band matches what those buyers already pay" },
  { key: "sellThroughSignal", label: "Sell-through signal recorded for comparable listings" },
  { key: "repeatOrderPathKnown", label: "Repeat-order path known (restock cadence, volume)" },
  { key: "landedCostKnown", label: "Landed cost known (freight, duties, last mile)" },
];

export const PILOT_DISCLAIMER =
  "Limited pilot is an internal recommendation only. It is not permission to purchase stock or to message any supplier or buyer.";

const Z = 1.959964;

export function wilson(pass: number, n: number): { lower: number; upper: number } | null {
  if (!Number.isFinite(n) || n <= 0) return null;
  const p = pass / n;
  const z2 = Z * Z;
  const denom = 1 + z2 / n;
  const centre = p + z2 / (2 * n);
  const margin = Z * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n));
  return { lower: Math.max(0, (centre - margin) / denom), upper: Math.min(1, (centre + margin) / denom) };
}

const isInt = (v: unknown): v is number => typeof v === "number" && Number.isInteger(v);
const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

export function validateThresholds(t: unknown): string[] {
  const errors: string[] = [];
  if (!t || typeof t !== "object") return ["Thresholds are missing."];
  const obj = t as Record<string, unknown>;
  for (const key of Object.keys(THRESHOLD_LIMITS) as (keyof Thresholds)[]) {
    const lim = THRESHOLD_LIMITS[key];
    const v = obj[key];
    if (!isNum(v)) errors.push(`${lim.label}: must be a number.`);
    else if (lim.integer && !Number.isInteger(v)) errors.push(`${lim.label}: must be a whole number.`);
    else if (v < lim.min || v > lim.max) errors.push(`${lim.label}: must be between ${lim.min} and ${lim.max}.`);
  }
  return errors;
}

export function validateInspection(i: Inspection): string[] {
  const e: string[] = [];
  const intField = (name: string, v: unknown) => {
    if (!isInt(v) || v < 0) e.push(`${name} must be a whole number of 0 or more.`);
  };
  if (!i.supplierId) e.push("Choose a supplier.");
  if (i.category !== "denim" && i.category !== "fleece") e.push("Category must be denim or fleece.");
  intField("Sample count", i.sampleCount);
  intField("Pass count", i.passCount);
  intField("Fail count", i.failCount);
  intField("Photos expected", i.photosExpected);
  intField("Photos provided", i.photosProvided);
  intField("Observed in-category pieces", i.observedInCategory);
  if (isInt(i.sampleCount) && isInt(i.passCount) && isInt(i.failCount) && i.passCount + i.failCount !== i.sampleCount)
    e.push(`Pass (${i.passCount}) + fail (${i.failCount}) must equal sample count (${i.sampleCount}).`);
  if (isInt(i.observedInCategory) && isInt(i.sampleCount) && i.observedInCategory > i.sampleCount)
    e.push("Observed in-category pieces cannot exceed sample count.");
  if (isInt(i.photosProvided) && isInt(i.photosExpected) && i.photosProvided > i.photosExpected)
    e.push("Photos provided cannot exceed photos expected.");
  if (!isNum(i.promisedMixPct) || i.promisedMixPct < 0 || i.promisedMixPct > 100)
    e.push("Promised category mix must be between 0 and 100%.");
  if (i.unitsAvailable !== null && (!isNum(i.unitsAvailable) || i.unitsAvailable < 0))
    e.push("Units available must be 0 or more (or left blank).");
  if (!["pcs", "kg", "bales"].includes(i.unitsUnit)) e.push("Unit must be pcs, kg or bales.");
  if (i.piecesPerUnit !== null && (!isNum(i.piecesPerUnit) || i.piecesPerUnit <= 0))
    e.push("Pieces per unit must be above 0 (or left blank).");
  if (i.sampleCostGBP !== null && (!isNum(i.sampleCostGBP) || i.sampleCostGBP < 0))
    e.push("Sample cost must be 0 or more (or left blank).");
  if (typeof i.inspectorNotes !== "string") e.push("Inspector notes must be text.");
  if (!i.demand || typeof i.demand !== "object") e.push("Demand checklist is missing.");
  else for (const d of DEMAND_ITEMS) if (typeof i.demand[d.key] !== "boolean") e.push(`Demand check "${d.label}" must be yes or no.`);
  return e;
}

const pct = (v: number) => `${(v * 100).toFixed(1)}%`;

export function evaluate(i: Inspection, t: Thresholds): Evaluation {
  const fp = fingerprint({ i, t });
  const errors = [...validateThresholds(t), ...validateInspection(i)];
  const base: Evaluation = {
    valid: false,
    errors,
    warnings: [],
    acceptanceRate: null,
    confidenceLower: null,
    confidenceUpper: null,
    photoCompleteness: null,
    observedMixPct: null,
    mixGapPts: null,
    unitsInPieces: null,
    sampleCostPerPiece: null,
    demandChecks: 0,
    gates: [],
    missingEvidence: [],
    failures: [],
    recommendation: null,
    pilot: null,
    fingerprint: fp,
  };
  if (errors.length) return base;

  const n = i.sampleCount;
  const gates: Gate[] = [];
  const missing: string[] = [];
  const failures: string[] = [];
  const warnings: string[] = [];

  // Sample size
  const enoughSamples = n >= t.minSamples;
  gates.push({
    id: "samples",
    label: "Sample size",
    status: enoughSamples ? "pass" : "missing",
    detail: `${n} of ${t.minSamples} pieces inspected`,
  });
  if (!enoughSamples) missing.push(n === 0 ? `No pieces inspected yet (need ${t.minSamples}).` : `Inspect ${t.minSamples - n} more pieces (have ${n} of ${t.minSamples}).`);

  // Quality: Wilson interval
  const w = wilson(i.passCount, n);
  const acceptance = n > 0 ? i.passCount / n : null;
  let qualityStatus: Gate["status"] = "missing";
  if (w && enoughSamples) {
    if (w.lower >= t.minAcceptanceLowerBound) qualityStatus = "pass";
    else if (w.upper < t.minAcceptanceLowerBound) qualityStatus = "fail";
  } else if (w && w.upper < t.minAcceptanceLowerBound) {
    qualityStatus = "fail";
  }
  gates.push({
    id: "quality",
    label: "Grade pass rate (95% lower bound)",
    status: qualityStatus,
    detail: w
      ? `${i.passCount}/${n} pass (${pct(acceptance!)}); lower bound ${pct(w.lower)} vs ${pct(t.minAcceptanceLowerBound)} needed`
      : "No graded pieces",
  });
  if (qualityStatus === "fail") failures.push(`Even the optimistic pass rate (${pct(w!.upper)}) is below ${pct(t.minAcceptanceLowerBound)}.`);
  else if (qualityStatus === "missing" && w && enoughSamples)
    missing.push(`Pass rate is inconclusive: ${pct(w.lower)}-${pct(w.upper)} straddles ${pct(t.minAcceptanceLowerBound)}. Inspect more pieces.`);

  // Photos
  const photo = i.photosExpected > 0 ? i.photosProvided / i.photosExpected : null;
  const photoOk = photo !== null && photo >= t.minPhotoCompleteness;
  gates.push({
    id: "photos",
    label: "Photo completeness",
    status: photoOk ? "pass" : "missing",
    detail: photo === null ? "No photo set expected or provided" : `${i.photosProvided}/${i.photosExpected} photos (${pct(photo)}) vs ${pct(t.minPhotoCompleteness)}`,
  });
  if (!photoOk)
    missing.push(photo === null ? "Photo evidence missing: no photos expected or provided." : `Photo set incomplete: ${i.photosExpected - i.photosProvided} photos missing.`);

  // Mix
  const observedMix = n > 0 ? (i.observedInCategory / n) * 100 : null;
  const gap = observedMix === null ? null : Math.round(Math.abs(i.promisedMixPct - observedMix) * 10) / 10;
  let mixStatus: Gate["status"] = "missing";
  if (gap !== null && enoughSamples) mixStatus = gap <= t.maxMixGapPts ? "pass" : "fail";
  gates.push({
    id: "mix",
    label: "Promised vs observed category mix",
    status: mixStatus,
    detail: observedMix === null ? `Promised ${i.promisedMixPct}%, nothing observed` : `Promised ${i.promisedMixPct}%, observed ${observedMix.toFixed(1)}% (gap ${gap} pts, max ${t.maxMixGapPts})`,
  });
  if (mixStatus === "fail") failures.push(`Category mix is off by ${gap} pts (max ${t.maxMixGapPts}).`);
  else if (mixStatus === "missing") missing.push("Category mix not yet measured on enough pieces.");

  // Units
  let units: number | null = null;
  if (i.unitsAvailable !== null) {
    if (i.unitsUnit === "pcs") units = Math.floor(i.unitsAvailable);
    else if (i.piecesPerUnit !== null) {
      units = Math.floor(i.unitsAvailable * i.piecesPerUnit);
      warnings.push(`Units converted from ${i.unitsAvailable} ${i.unitsUnit} at ${i.piecesPerUnit} pcs/${i.unitsUnit === "kg" ? "kg" : "bale"} (supplier-stated, unverified).`);
    }
  }
  const unitsOk = units !== null && units >= t.minUnitsAvailable;
  gates.push({
    id: "units",
    label: "Units available",
    status: units === null ? "missing" : unitsOk ? "pass" : "fail",
    detail:
      units === null
        ? i.unitsAvailable === null
          ? "Not stated"
          : `${i.unitsAvailable} ${i.unitsUnit} with no pieces-per-${i.unitsUnit === "kg" ? "kg" : "bale"} conversion`
        : `${units.toLocaleString("en-GB")} pcs vs ${t.minUnitsAvailable.toLocaleString("en-GB")} needed`,
  });
  if (units === null)
    missing.push(i.unitsAvailable === null ? "Units available not stated." : `Units are in ${i.unitsUnit} with no conversion to pieces.`);
  else if (!unitsOk) failures.push(`Only ${units} pcs available (need ${t.minUnitsAvailable}) — not repeatable supply.`);

  // Cost
  const cpp = i.sampleCostGBP !== null && n > 0 ? i.sampleCostGBP / n : null;
  const costOk = cpp !== null && cpp <= t.maxSampleCostPerPieceGBP;
  gates.push({
    id: "cost",
    label: "Sample cost per piece",
    status: cpp === null ? "missing" : costOk ? "pass" : "fail",
    detail: cpp === null ? "Not stated" : `£${cpp.toFixed(2)}/pc vs £${t.maxSampleCostPerPieceGBP.toFixed(2)} max`,
  });
  if (cpp === null) missing.push("Sample cost not stated.");
  else if (!costOk) failures.push(`Sample cost £${cpp.toFixed(2)}/pc is above £${t.maxSampleCostPerPieceGBP.toFixed(2)}.`);

  // Demand fit (quality alone can never approve)
  const demandChecks = DEMAND_ITEMS.filter((d) => i.demand[d.key]).length;
  const demandOk = demandChecks >= t.minDemandChecks;
  gates.push({
    id: "demand",
    label: "Demand-fit checklist",
    status: demandOk ? "pass" : "missing",
    detail: `${demandChecks} of ${DEMAND_ITEMS.length} checks (need ${t.minDemandChecks})`,
  });
  if (!demandOk) missing.push(`Demand fit unproven: ${demandChecks} of ${t.minDemandChecks} required checks ticked.`);

  let recommendation: Recommendation;
  if (failures.length) recommendation = "REJECT";
  else if (missing.length || gates.some((g) => g.status !== "pass")) recommendation = "REQUEST_MORE_EVIDENCE";
  else recommendation = "LIMITED_PILOT";

  let pilot: Evaluation["pilot"] = null;
  if (recommendation === "LIMITED_PILOT" && units !== null && cpp !== null) {
    const byBudget = cpp > 0 ? Math.floor(t.pilotCeilingGBP / cpp) : t.pilotCeilingUnits;
    const capUnits = Math.max(0, Math.min(t.pilotCeilingUnits, units, byBudget));
    const binding = capUnits === t.pilotCeilingUnits ? "unit ceiling" : capUnits === units ? "units available" : "GBP ceiling";
    pilot = {
      units: capUnits,
      spendCapGBP: Math.min(t.pilotCeilingGBP, Math.round(capUnits * cpp * 100) / 100),
      basis: `Lowest of: unit ceiling ${t.pilotCeilingUnits} pcs, ${units.toLocaleString("en-GB")} pcs available, and ${byBudget.toLocaleString("en-GB")} pcs that £${t.pilotCeilingGBP.toLocaleString("en-GB")} buys at the sample's cost per piece. Binding limit: ${binding}.`,
    };
  }

  return {
    ...base,
    valid: true,
    warnings,
    acceptanceRate: acceptance,
    confidenceLower: w ? w.lower : null,
    confidenceUpper: w ? w.upper : null,
    photoCompleteness: photo,
    observedMixPct: observedMix,
    mixGapPts: gap,
    unitsInPieces: units,
    sampleCostPerPiece: cpp,
    demandChecks,
    gates,
    missingEvidence: missing,
    failures,
    recommendation,
    pilot,
  };
}

const RANK: Record<Recommendation, number> = { REJECT: 0, REQUEST_MORE_EVIDENCE: 1, LIMITED_PILOT: 2 };

/** A reviewer may always be more cautious than the engine, never less. */
export function canSelect(evaluation: Evaluation, selection: Selection): { ok: boolean; reason: string } {
  if (!evaluation.valid || !evaluation.recommendation)
    return { ok: false, reason: "Fix the input errors before recording a decision." };
  if (selection === "LIMITED_PILOT" && evaluation.recommendation !== "LIMITED_PILOT")
    return { ok: false, reason: "Limited pilot needs every gate to pass, including demand fit. Resolve the listed gaps first." };
  if (RANK[selection] > RANK[evaluation.recommendation])
    return { ok: false, reason: "A decision cannot be more permissive than the evidence supports." };
  return { ok: true, reason: "" };
}

export const LABELS: Record<Recommendation, string> = {
  REJECT: "Reject",
  REQUEST_MORE_EVIDENCE: "Request more evidence",
  LIMITED_PILOT: "Approve limited pilot",
};
