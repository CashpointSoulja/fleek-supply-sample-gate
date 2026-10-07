import type { Category, DemandChecklist, Inspection, Supplier } from "./types";

export const CATEGORIES: Category[] = [
  { id: "denim", label: "Y2K denim" },
  { id: "fleece", label: "Sportswear fleece" },
];

export const SUPPLIERS: Supplier[] = [
  { id: "SUP-NGT", name: "Northgate Rag Sort", region: "Synthetic region A", synthetic: true },
  { id: "SUP-HBL", name: "Harbour Lane Vintage Co.", region: "Synthetic region B", synthetic: true },
  { id: "SUP-KST", name: "Kestrel Bale Traders", region: "Synthetic region C", synthetic: true },
];

const demand = (n: number): DemandChecklist => {
  const keys: (keyof DemandChecklist)[] = [
    "buyerSegmentNamed",
    "priceBandMatchesLiveDemand",
    "sellThroughSignal",
    "repeatOrderPathKnown",
    "landedCostKnown",
  ];
  return Object.fromEntries(keys.map((k, idx) => [k, idx < n])) as unknown as DemandChecklist;
};

export const emptyDemand = (): DemandChecklist => demand(0);

/** Three synthetic sample inspections: one pass, one fail, one insufficient evidence. */
export const SEED_INSPECTIONS: Inspection[] = [
  {
    supplierId: "SUP-NGT",
    category: "denim",
    sampleCount: 40,
    passCount: 38,
    failCount: 2,
    photosExpected: 120,
    photosProvided: 118,
    promisedMixPct: 90,
    observedInCategory: 37,
    unitsAvailable: 2400,
    unitsUnit: "pcs",
    piecesPerUnit: null,
    sampleCostGBP: 180,
    inspectorNotes: "Two fails: one broken zip, one heavy fading not shown in listing photos. Sizes skew 28-32 waist.",
    demand: {
      buyerSegmentNamed: true,
      priceBandMatchesLiveDemand: true,
      sellThroughSignal: true,
      repeatOrderPathKnown: true,
      landedCostKnown: true,
    },
  },
  {
    supplierId: "SUP-HBL",
    category: "fleece",
    sampleCount: 40,
    passCount: 26,
    failCount: 14,
    photosExpected: 120,
    photosProvided: 120,
    promisedMixPct: 85,
    observedInCategory: 28,
    unitsAvailable: 5000,
    unitsUnit: "pcs",
    piecesPerUnit: null,
    sampleCostGBP: 220,
    inspectorNotes: "Pilling and stains on 9 pieces; 12 pieces were cotton sweatshirts, not fleece.",
    demand: demand(4),
  },
  {
    supplierId: "SUP-KST",
    category: "denim",
    sampleCount: 12,
    passCount: 11,
    failCount: 1,
    photosExpected: 36,
    photosProvided: 20,
    promisedMixPct: 80,
    observedInCategory: 10,
    unitsAvailable: 40,
    unitsUnit: "bales",
    piecesPerUnit: null,
    sampleCostGBP: 75,
    inspectorNotes: "Good first look but only 12 pieces; back and label photos missing for most. Stock quoted in bales, no pieces per bale.",
    demand: demand(2),
  },
];
