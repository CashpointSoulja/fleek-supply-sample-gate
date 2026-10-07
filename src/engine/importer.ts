import { parseCsv } from "./csv";
import { validateInspection } from "./engine";
import { SUPPLIERS, emptyDemand } from "./seeds";
import type { Inspection, UnitKind } from "./types";

export const IMPORT_COLUMNS = [
  "supplier_id",
  "category",
  "sample_count",
  "pass_count",
  "fail_count",
  "photos_expected",
  "photos_provided",
  "promised_mix_pct",
  "observed_in_category",
  "units_available",
  "units_unit",
  "pieces_per_unit",
  "sample_cost_gbp",
  "inspector_notes",
] as const;

export interface ImportResult {
  inspections: Inspection[];
  errors: string[];
}

const INT = /^-?\d+$/;
const NUM = /^-?\d+(\.\d+)?$/;

function parseIntField(raw: string, label: string, row: number, errors: string[]): number {
  const s = raw.trim();
  if (!INT.test(s)) {
    errors.push(`Row ${row}: ${label} "${raw}" is not a whole number.`);
    return NaN;
  }
  return Number(s);
}

function parseOptionalNum(raw: string, label: string, row: number, errors: string[]): number | null {
  const s = raw.trim().replace(/^£/, "");
  if (s === "") return null;
  if (!NUM.test(s)) {
    errors.push(`Row ${row}: ${label} "${raw}" is not a number.`);
    return NaN;
  }
  return Number(s);
}

/** Parses an inspection CSV. All-or-nothing: any error rejects the whole file. */
export function importInspectionsCsv(text: string): ImportResult {
  const { rows, errors: parseErrors } = parseCsv(text);
  if (parseErrors.length) return { inspections: [], errors: parseErrors };
  if (rows.length === 0) return { inspections: [], errors: ["File is empty."] };
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const errors: string[] = [];
  const missingCols = IMPORT_COLUMNS.filter((c) => !header.includes(c));
  if (missingCols.length) errors.push(`Missing columns: ${missingCols.join(", ")}.`);
  const unknown = header.filter((h) => !(IMPORT_COLUMNS as readonly string[]).includes(h));
  if (unknown.length) errors.push(`Unknown columns: ${unknown.join(", ")}.`);
  const dupHeader = header.filter((h, idx) => header.indexOf(h) !== idx);
  if (dupHeader.length) errors.push(`Duplicate columns: ${[...new Set(dupHeader)].join(", ")}.`);
  if (errors.length) return { inspections: [], errors };
  if (rows.length === 1) return { inspections: [], errors: ["File has a header but no inspection rows."] };

  const col = (r: string[], name: (typeof IMPORT_COLUMNS)[number]) => r[header.indexOf(name)] ?? "";
  const out: Inspection[] = [];
  const seen = new Map<string, number>();
  const unitBySupplier = new Map<string, { unit: string; row: number }>();

  rows.slice(1).forEach((r, idx) => {
    const rowNo = idx + 2;
    if (r.length !== header.length) {
      errors.push(`Row ${rowNo}: has ${r.length} fields, expected ${header.length}.`);
      return;
    }
    const rowErrors: string[] = [];
    const supplierId = col(r, "supplier_id").trim();
    if (!SUPPLIERS.some((s) => s.id === supplierId)) rowErrors.push(`Row ${rowNo}: unknown supplier_id "${supplierId}".`);
    const category = col(r, "category").trim().toLowerCase();
    if (category !== "denim" && category !== "fleece") rowErrors.push(`Row ${rowNo}: category "${category}" must be denim or fleece.`);
    const unit = col(r, "units_unit").trim().toLowerCase();
    if (!["pcs", "kg", "bales"].includes(unit)) rowErrors.push(`Row ${rowNo}: units_unit "${unit}" must be pcs, kg or bales.`);
    const key = `${supplierId}|${category}`;
    if (seen.has(key)) rowErrors.push(`Row ${rowNo}: duplicate of row ${seen.get(key)} for ${supplierId} / ${category}.`);
    else seen.set(key, rowNo);
    const prevUnit = unitBySupplier.get(supplierId);
    if (prevUnit && prevUnit.unit !== unit)
      rowErrors.push(`Row ${rowNo}: mixed units for ${supplierId} (${unit} here, ${prevUnit.unit} in row ${prevUnit.row}). Use one unit per supplier.`);
    else if (!prevUnit) unitBySupplier.set(supplierId, { unit, row: rowNo });

    const inspection: Inspection = {
      supplierId,
      category: category as Inspection["category"],
      sampleCount: parseIntField(col(r, "sample_count"), "sample_count", rowNo, rowErrors),
      passCount: parseIntField(col(r, "pass_count"), "pass_count", rowNo, rowErrors),
      failCount: parseIntField(col(r, "fail_count"), "fail_count", rowNo, rowErrors),
      photosExpected: parseIntField(col(r, "photos_expected"), "photos_expected", rowNo, rowErrors),
      photosProvided: parseIntField(col(r, "photos_provided"), "photos_provided", rowNo, rowErrors),
      promisedMixPct: parseOptionalNum(col(r, "promised_mix_pct"), "promised_mix_pct", rowNo, rowErrors) ?? NaN,
      observedInCategory: parseIntField(col(r, "observed_in_category"), "observed_in_category", rowNo, rowErrors),
      unitsAvailable: parseOptionalNum(col(r, "units_available"), "units_available", rowNo, rowErrors),
      unitsUnit: unit as UnitKind,
      piecesPerUnit: parseOptionalNum(col(r, "pieces_per_unit"), "pieces_per_unit", rowNo, rowErrors),
      sampleCostGBP: parseOptionalNum(col(r, "sample_cost_gbp"), "sample_cost_gbp", rowNo, rowErrors),
      inspectorNotes: col(r, "inspector_notes"),
      demand: emptyDemand(),
    };
    if (col(r, "promised_mix_pct").trim() === "") rowErrors.push(`Row ${rowNo}: promised_mix_pct is required.`);
    if (!rowErrors.length) for (const e of validateInspection(inspection)) rowErrors.push(`Row ${rowNo}: ${e}`);
    if (rowErrors.length) errors.push(...rowErrors);
    else out.push(inspection);
  });
  if (errors.length) return { inspections: [], errors };
  return { inspections: out, errors: [] };
}
