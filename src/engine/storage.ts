import { validateInspection, validateThresholds } from "./engine";
import { validateEntry } from "./exporter";
import type { DecisionLogEntry, Inspection, Thresholds } from "./types";

export const STORAGE_KEY = "fssg-state-v1";

export interface PersistedState {
  version: 1;
  thresholds: Thresholds;
  inspections: Inspection[];
  log: DecisionLogEntry[];
}

/** Validates every field; any problem discards the whole saved state. */
export function loadState(raw: string | null): { state: PersistedState | null; notice: string | null } {
  if (raw === null) return { state: null, notice: null };
  try {
    const o = JSON.parse(raw) as Record<string, unknown>;
    if (!o || o.version !== 1) throw new Error("version");
    if (validateThresholds(o.thresholds).length) throw new Error("thresholds");
    if (!Array.isArray(o.inspections) || o.inspections.some((i) => !i || typeof i !== "object" || validateInspection(i as Inspection).length))
      throw new Error("inspections");
    if (!Array.isArray(o.log) || o.log.some((e, idx) => validateEntry(e, `#${idx}`).length)) throw new Error("log");
    return { state: o as unknown as PersistedState, notice: null };
  } catch {
    return { state: null, notice: "Saved data in this browser was invalid, so it was discarded and the synthetic seeds were reloaded." };
  }
}
