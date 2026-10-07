export type CategoryId = "denim" | "fleece";
export type UnitKind = "pcs" | "kg" | "bales";
export type Recommendation = "REJECT" | "REQUEST_MORE_EVIDENCE" | "LIMITED_PILOT";
export type Selection = Recommendation;

export interface Category {
  id: CategoryId;
  label: string;
}

export interface Supplier {
  id: string;
  name: string;
  region: string;
  synthetic: true;
}

export interface DemandChecklist {
  buyerSegmentNamed: boolean;
  priceBandMatchesLiveDemand: boolean;
  sellThroughSignal: boolean;
  repeatOrderPathKnown: boolean;
  landedCostKnown: boolean;
}

export interface Inspection {
  supplierId: string;
  category: CategoryId;
  sampleCount: number;
  passCount: number;
  failCount: number;
  photosExpected: number;
  photosProvided: number;
  promisedMixPct: number;
  observedInCategory: number;
  unitsAvailable: number | null;
  unitsUnit: UnitKind;
  piecesPerUnit: number | null;
  sampleCostGBP: number | null;
  inspectorNotes: string;
  demand: DemandChecklist;
}

export interface Thresholds {
  minSamples: number;
  minAcceptanceLowerBound: number;
  minPhotoCompleteness: number;
  maxMixGapPts: number;
  minUnitsAvailable: number;
  maxSampleCostPerPieceGBP: number;
  minDemandChecks: number;
  pilotCeilingUnits: number;
  pilotCeilingGBP: number;
}

export type GateStatus = "pass" | "fail" | "missing";

export interface Gate {
  id: string;
  label: string;
  status: GateStatus;
  detail: string;
}

export interface Evaluation {
  valid: boolean;
  errors: string[];
  warnings: string[];
  acceptanceRate: number | null;
  confidenceLower: number | null;
  confidenceUpper: number | null;
  photoCompleteness: number | null;
  observedMixPct: number | null;
  mixGapPts: number | null;
  unitsInPieces: number | null;
  sampleCostPerPiece: number | null;
  demandChecks: number;
  gates: Gate[];
  missingEvidence: string[];
  failures: string[];
  recommendation: Recommendation | null;
  pilot: { units: number; ceilingGBP: number; sampleCostProxyGBP: number; basis: string } | null;
  fingerprint: string;
}

export interface DecisionLogEntry {
  id: string;
  at: string;
  supplierId: string;
  supplierName: string;
  category: CategoryId;
  recommendation: Recommendation;
  selected: Selection;
  acceptanceRate: number | null;
  confidenceLower: number | null;
  pilotUnits: number | null;
  pilotCeilingGBP: number | null;
  pilotSampleCostProxyGBP: number | null;
  missingEvidence: string[];
  failures: string[];
  note: string;
  inspectionFingerprint: string;
  thresholdsFingerprint: string;
}
