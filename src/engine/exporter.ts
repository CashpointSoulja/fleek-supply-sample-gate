import { parseCsv, toCsv } from "./csv";
import { fingerprint } from "./hash";
import { PILOT_DISCLAIMER } from "./engine";
import type { DecisionLogEntry, Recommendation, Thresholds } from "./types";

export const EXPORT_SCHEMA = "fleek-supply-sample-gate/decision-log@1";
export const EXPORT_NOTICE =
  "Independent concept by Ayomide Ahmed. Not an official Fleek product. Synthetic suppliers and illustrative numbers only. " +
  PILOT_DISCLAIMER;

export const LOG_COLUMNS = [
  "id",
  "at",
  "supplier_id",
  "supplier_name",
  "category",
  "recommendation",
  "selected",
  "acceptance_rate",
  "confidence_lower",
  "pilot_units",
  "pilot_spend_cap_gbp",
  "missing_evidence",
  "failures",
  "note",
  "inspection_fingerprint",
  "thresholds_fingerprint",
] as const;

export interface DecisionExport {
  schema: typeof EXPORT_SCHEMA;
  notice: string;
  exportedAt: string;
  thresholds: Thresholds;
  entries: DecisionLogEntry[];
  fingerprint: string;
}

export function buildJsonExport(entries: DecisionLogEntry[], thresholds: Thresholds, now = new Date()): DecisionExport {
  return {
    schema: EXPORT_SCHEMA,
    notice: EXPORT_NOTICE,
    exportedAt: now.toISOString(),
    thresholds,
    entries,
    fingerprint: fingerprint({ thresholds, entries }),
  };
}

export function buildCsvExport(entries: DecisionLogEntry[]): string {
  const rows = entries.map((e) => [
    e.id,
    e.at,
    e.supplierId,
    e.supplierName,
    e.category,
    e.recommendation,
    e.selected,
    e.acceptanceRate === null ? "" : e.acceptanceRate.toFixed(4),
    e.confidenceLower === null ? "" : e.confidenceLower.toFixed(4),
    e.pilotUnits ?? "",
    e.pilotSpendCapGBP ?? "",
    e.missingEvidence.join(" | "),
    e.failures.join(" | "),
    e.note,
    e.inspectionFingerprint,
    e.thresholdsFingerprint,
  ]);
  return `# ${EXPORT_NOTICE}\r\n` + toCsv([...LOG_COLUMNS], rows);
}

const RECS: Recommendation[] = ["REJECT", "REQUEST_MORE_EVIDENCE", "LIMITED_PILOT"];
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;

export function validateEntry(e: unknown, where: string): string[] {
  const errs: string[] = [];
  if (!e || typeof e !== "object") return [`${where}: not an object.`];
  const o = e as Record<string, unknown>;
  const str = (k: string) => {
    if (typeof o[k] !== "string") errs.push(`${where}: ${k} must be text.`);
  };
  ["id", "supplierId", "supplierName", "note", "inspectionFingerprint", "thresholdsFingerprint"].forEach(str);
  if (typeof o.at !== "string" || !ISO.test(o.at) || Number.isNaN(Date.parse(o.at))) errs.push(`${where}: at must be an ISO UTC timestamp.`);
  if (o.category !== "denim" && o.category !== "fleece") errs.push(`${where}: category must be denim or fleece.`);
  if (!RECS.includes(o.recommendation as Recommendation)) errs.push(`${where}: unknown recommendation.`);
  if (!RECS.includes(o.selected as Recommendation)) errs.push(`${where}: unknown selected decision.`);
  if (o.selected === "LIMITED_PILOT" && o.recommendation !== "LIMITED_PILOT")
    errs.push(`${where}: limited pilot recorded without a limited-pilot recommendation.`);
  for (const k of ["acceptanceRate", "confidenceLower"]) {
    const v = o[k];
    if (!(v === null || (typeof v === "number" && v >= 0 && v <= 1))) errs.push(`${where}: ${k} must be null or 0-1.`);
  }
  for (const k of ["pilotUnits", "pilotSpendCapGBP"]) {
    const v = o[k];
    if (!(v === null || (typeof v === "number" && Number.isFinite(v) && v >= 0))) errs.push(`${where}: ${k} must be null or 0 or more.`);
  }
  if (o.selected === "LIMITED_PILOT" && (o.pilotUnits === null || o.pilotSpendCapGBP === null))
    errs.push(`${where}: limited pilot must carry its ceiling.`);
  for (const k of ["missingEvidence", "failures"]) {
    const v = o[k];
    if (!Array.isArray(v) || v.some((x) => typeof x !== "string")) errs.push(`${where}: ${k} must be a list of text.`);
  }
  return errs;
}

export function readJsonExport(text: string): { data: DecisionExport | null; errors: string[] } {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { data: null, errors: ["Not valid JSON."] };
  }
  if (!raw || typeof raw !== "object") return { data: null, errors: ["Export must be an object."] };
  const o = raw as Record<string, unknown>;
  const errors: string[] = [];
  if (o.schema !== EXPORT_SCHEMA) errors.push(`Unknown schema (expected ${EXPORT_SCHEMA}).`);
  if (!Array.isArray(o.entries)) errors.push("entries must be a list.");
  else o.entries.forEach((e, idx) => errors.push(...validateEntry(e, `Entry ${idx + 1}`)));
  if (!o.thresholds || typeof o.thresholds !== "object") errors.push("thresholds missing.");
  if (!errors.length && o.fingerprint !== fingerprint({ thresholds: o.thresholds, entries: o.entries }))
    errors.push("Fingerprint does not match contents (file was edited).");
  if (errors.length) return { data: null, errors };
  return { data: o as unknown as DecisionExport, errors: [] };
}

export function readCsvExport(text: string): { entries: DecisionLogEntry[]; errors: string[] } {
  const body = text.split(/\r?\n/).filter((l, idx) => !(idx === 0 && l.startsWith("#"))).join("\n");
  const { rows, errors } = parseCsv(body);
  if (errors.length) return { entries: [], errors };
  if (!rows.length || rows[0].join(",") !== LOG_COLUMNS.join(",")) return { entries: [], errors: ["Header does not match decision-log columns."] };
  const out: DecisionLogEntry[] = [];
  const errs: string[] = [];
  const optNum = (s: string) => (s === "" ? null : Number(s));
  const list = (s: string) => (s === "" ? [] : s.split(" | "));
  rows.slice(1).forEach((r, idx) => {
    if (r.length !== LOG_COLUMNS.length) {
      errs.push(`Row ${idx + 2}: wrong field count.`);
      return;
    }
    const e: DecisionLogEntry = {
      id: r[0],
      at: r[1],
      supplierId: r[2],
      supplierName: r[3],
      category: r[4] as DecisionLogEntry["category"],
      recommendation: r[5] as Recommendation,
      selected: r[6] as Recommendation,
      acceptanceRate: optNum(r[7]),
      confidenceLower: optNum(r[8]),
      pilotUnits: optNum(r[9]),
      pilotSpendCapGBP: optNum(r[10]),
      missingEvidence: list(r[11]),
      failures: list(r[12]),
      note: r[13],
      inspectionFingerprint: r[14],
      thresholdsFingerprint: r[15],
    };
    const v = validateEntry(e, `Row ${idx + 2}`);
    if (v.length) errs.push(...v);
    else out.push(e);
  });
  return errs.length ? { entries: [], errors: errs } : { entries: out, errors: [] };
}
