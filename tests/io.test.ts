import { describe, expect, it } from "vitest";
import { parseCsv, toCsv } from "../src/engine/csv";
import { DEFAULT_THRESHOLDS, evaluate } from "../src/engine/engine";
import { buildCsvExport, buildJsonExport, readCsvExport, readJsonExport, validateEntry } from "../src/engine/exporter";
import { IMPORT_COLUMNS, importInspectionsCsv } from "../src/engine/importer";
import { SEED_INSPECTIONS } from "../src/engine/seeds";
import { loadState } from "../src/engine/storage";
import type { DecisionLogEntry } from "../src/engine/types";

const H = IMPORT_COLUMNS.join(",");
const row = (o: Partial<Record<(typeof IMPORT_COLUMNS)[number], string>> = {}) => {
  const d: Record<string, string> = {
    supplier_id: "SUP-NGT", category: "denim", sample_count: "40", pass_count: "38", fail_count: "2",
    photos_expected: "120", photos_provided: "118", promised_mix_pct: "90", observed_in_category: "37",
    units_available: "2400", units_unit: "pcs", pieces_per_unit: "", sample_cost_gbp: "180", inspector_notes: "ok",
    ...o,
  };
  return IMPORT_COLUMNS.map((c) => d[c]).join(",");
};

describe("CSV parser", () => {
  it("handles quotes, escaped quotes, commas and CRLF", () => {
    const r = parseCsv('a,b\r\n"x, y","he said ""hi"""\r\n');
    expect(r.errors).toEqual([]);
    expect(r.rows).toEqual([["a", "b"], ["x, y", 'he said "hi"']]);
  });
  it("keeps newlines inside quoted fields", () => {
    expect(parseCsv('a\n"line1\nline2"\n').rows[1]).toEqual(["line1\nline2"]);
  });
  it("rejects unclosed quotes", () => {
    expect(parseCsv('a,b\n"open,1\n').errors[0]).toMatch(/never closed/);
  });
  it("rejects stray quotes", () => {
    expect(parseCsv('a,b\nx"y,1\n').errors[0]).toMatch(/unexpected quote/);
    expect(parseCsv('a\n"x"y\n').errors[0]).toMatch(/after a closing quote/);
  });
  it("round-trips toCsv", () => {
    const rows = [["a,b", 'q"q', " lead", "multi\nline"]];
    expect(parseCsv(toCsv(["h1", "h2", "h3", "h4"], rows)).rows.slice(1)).toEqual(rows);
  });
});

describe("inspection import", () => {
  it("imports a valid file", () => {
    const r = importInspectionsCsv(`${H}\n${row()}\n${row({ supplier_id: "SUP-HBL", category: "fleece", inspector_notes: '"pilling, stains"' })}\n`);
    expect(r.errors).toEqual([]);
    expect(r.inspections).toHaveLength(2);
    expect(r.inspections[1].inspectorNotes).toBe("pilling, stains");
    expect(evaluate(r.inspections[0], DEFAULT_THRESHOLDS).recommendation).toBe("REQUEST_MORE_EVIDENCE"); // demand unknown on import
  });
  it("is all-or-nothing and names the row and field", () => {
    const r = importInspectionsCsv(`${H}\n${row()}\n${row({ supplier_id: "SUP-KST", pass_count: "abc" })}\n`);
    expect(r.inspections).toEqual([]);
    expect(r.errors.join(" ")).toMatch(/Row 3: pass_count "abc" is not a whole number/);
  });
  it.each([
    ["", /empty/],
    [`${H}\n`, /no inspection rows/],
    ["supplier_id,category\nSUP-NGT,denim\n", /Missing columns/],
    [`${H},extra\n${row()},1\n`, /Unknown columns/],
    [`${H}\n${row()},extra\n`, /fields, expected/],
    [`${H}\n${row({ supplier_id: "SUP-REAL" })}\n`, /unknown supplier_id/],
    [`${H}\n${row({ category: "shoes" })}\n`, /must be denim or fleece/],
    [`${H}\n${row({ pass_count: "39" })}\n`, /must equal sample count/],
    [`${H}\n${row({ sample_count: "-3" })}\n`, /Sample count/],
    [`${H}\n${row({ sample_cost_gbp: "12,00" })}\n`, /fields, expected/],
    [`${H}\n${row({ units_unit: "boxes" })}\n`, /must be pcs, kg or bales/],
    [`${H}\n${row()}\n${row()}\n`, /duplicate of row 2/],
    [`${H}\n${row()}\n${row({ category: "fleece", units_unit: "kg", pieces_per_unit: "3" })}\n`, /mixed units for SUP-NGT/],
    [`${H}\n${row({ promised_mix_pct: "" })}\n`, /promised_mix_pct is required/],
    [`${H}\n"SUP-NGT,denim\n`, /never closed/],
  ])("rejects %j", (text, re) => {
    const r = importInspectionsCsv(text as string);
    expect(r.inspections).toEqual([]);
    expect(r.errors.join(" ")).toMatch(re as RegExp);
  });
  it("accepts a £ prefix on cost and blank optional units", () => {
    const r = importInspectionsCsv(`${H}\n${row({ sample_cost_gbp: "£180", units_available: "" })}\n`);
    expect(r.errors).toEqual([]);
    expect(r.inspections[0].sampleCostGBP).toBe(180);
    expect(r.inspections[0].unitsAvailable).toBeNull();
  });
});

const entry = (o: Partial<DecisionLogEntry> = {}): DecisionLogEntry => ({
  id: "D-1", at: "2026-10-07T09:00:00.000Z", supplierId: "SUP-NGT", supplierName: "Northgate Rag Sort",
  category: "denim", recommendation: "LIMITED_PILOT", selected: "LIMITED_PILOT", acceptanceRate: 0.95,
  confidenceLower: 0.835, pilotUnits: 300, pilotCeilingGBP: 2500, pilotSampleCostProxyGBP: 1350, missingEvidence: [],
  failures: [], note: 'Cap at 300, "check zips"', inspectionFingerprint: "abcd1234", thresholdsFingerprint: "beef0001",
  ...o,
});

describe("export readback", () => {
  const entries = [entry(), entry({ id: "D-2", supplierId: "SUP-KST", supplierName: "Kestrel Bale Traders", recommendation: "REQUEST_MORE_EVIDENCE", selected: "REQUEST_MORE_EVIDENCE", pilotUnits: null, pilotCeilingGBP: null, pilotSampleCostProxyGBP: null, missingEvidence: ["Inspect 18 more pieces.", "Units in bales"], note: "line1\nline2" })];
  it("a limited pilot without its true GBP ceiling is rejected on readback", () => {
    expect(validateEntry(entry({ pilotCeilingGBP: null }), "E").join(" ")).toMatch(/must carry its ceiling/);
  });
  it("JSON export reads back identically", () => {
    const json = JSON.stringify(buildJsonExport(entries, DEFAULT_THRESHOLDS, new Date("2026-10-07T10:00:00Z")));
    const r = readJsonExport(json);
    expect(r.errors).toEqual([]);
    expect(r.data!.entries).toEqual(entries);
    expect(r.data!.notice).toMatch(/not permission to purchase/);
  });
  it("JSON readback rejects tampering and bad fields", () => {
    const ex = buildJsonExport(entries, DEFAULT_THRESHOLDS);
    expect(readJsonExport(JSON.stringify({ ...ex, entries: [{ ...entries[0], pilotUnits: 9000 }, entries[1]] })).errors.join(" ")).toMatch(/Fingerprint/);
    expect(readJsonExport(JSON.stringify({ ...ex, schema: "other" })).errors.join(" ")).toMatch(/schema/);
    expect(readJsonExport("{bad").errors[0]).toMatch(/Not valid JSON/);
    expect(readJsonExport(JSON.stringify({ ...ex, entries: [entry({ recommendation: "REQUEST_MORE_EVIDENCE" })] })).errors.join(" ")).toMatch(/without a limited-pilot recommendation/);
    expect(readJsonExport(JSON.stringify({ ...ex, entries: [entry({ at: "yesterday" })] })).errors.join(" ")).toMatch(/ISO/);
  });
  it("CSV export reads back identically, including commas, quotes and newlines", () => {
    const csv = buildCsvExport(entries);
    expect(csv.startsWith("# Independent concept by Ayomide Ahmed")).toBe(true);
    const r = readCsvExport(csv);
    expect(r.errors).toEqual([]);
    expect(r.entries.map((e) => ({ ...e, acceptanceRate: e.acceptanceRate, confidenceLower: e.confidenceLower }))).toEqual(
      entries.map((e) => ({ ...e, acceptanceRate: e.acceptanceRate === null ? null : Number(e.acceptanceRate.toFixed(4)), confidenceLower: e.confidenceLower === null ? null : Number(e.confidenceLower.toFixed(4)) })),
    );
  });
  it("CSV readback rejects a wrong header", () => {
    expect(readCsvExport("a,b\n1,2\n").errors[0]).toMatch(/Header/);
  });
});

describe("persisted state", () => {
  it("discards invalid saved state with a notice", () => {
    expect(loadState("{oops").notice).toMatch(/discarded/);
    expect(loadState(JSON.stringify({ version: 1, thresholds: DEFAULT_THRESHOLDS, inspections: [{ ...SEED_INSPECTIONS[0], passCount: 99 }], log: [] })).state).toBeNull();
    expect(loadState(JSON.stringify({ version: 1, thresholds: DEFAULT_THRESHOLDS, inspections: SEED_INSPECTIONS, log: [entry({ selected: "LIMITED_PILOT", recommendation: "REJECT" })] })).state).toBeNull();
  });
  it("loads valid state", () => {
    expect(loadState(JSON.stringify({ version: 1, thresholds: DEFAULT_THRESHOLDS, inspections: SEED_INSPECTIONS, log: [entry()] })).state).not.toBeNull();
    expect(loadState(null)).toEqual({ state: null, notice: null });
  });
});
