import "./style.css";
import { DEFAULT_THRESHOLDS, DEMAND_ITEMS, REQUIRED_DEMAND, LABELS, PILOT_DISCLAIMER, THRESHOLD_LIMITS, canSelect, evaluate } from "./engine/engine";
import { fingerprint } from "./engine/hash";
import { IMPORT_COLUMNS, importInspectionsCsv } from "./engine/importer";
import { buildCsvExport, buildJsonExport, readCsvExport, readJsonExport } from "./engine/exporter";
import { CATEGORIES, SEED_INSPECTIONS, SUPPLIERS, emptyDemand } from "./engine/seeds";
import { STORAGE_KEY, loadState } from "./engine/storage";
import type { CategoryId, DecisionLogEntry, Evaluation, Inspection, Recommendation, Thresholds } from "./engine/types";

const DOCS_URL = "https://github.com/CashpointSoulja/fleek-supply-sample-gate/tree/main/docs";
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));
const keyOf = (i: { supplierId: string; category: string }) => `${i.supplierId}|${i.category}`;
const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const pct = (v: number | null) => (v === null ? "—" : `${(v * 100).toFixed(1)}%`);
const gbp = (v: number | null) => (v === null ? "—" : `£${v.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
const supplierName = (id: string) => SUPPLIERS.find((s) => s.id === id)?.name ?? id;
const categoryLabel = (id: string) => CATEGORIES.find((c) => c.id === id)?.label ?? id;

interface State {
  thresholds: Thresholds;
  inspections: Inspection[];
  log: DecisionLogEntry[];
  selected: string | null;
  raw: Record<string, Record<string, string>>;
  notice: string | null;
  importErrors: string[];
  importOk: string | null;
  decisionMsg: { kind: "ok" | "err"; text: string } | null;
  lastExport: { kind: "CSV" | "JSON"; text: string; readback: string; ok: boolean } | null;
  readbackMsg: { ok: boolean; text: string } | null;
}

function initialState(): State {
  let stored: ReturnType<typeof loadState> = { state: null, notice: null };
  try {
    stored = loadState(localStorage.getItem(STORAGE_KEY));
  } catch {
    stored = { state: null, notice: null };
  }
  const s = stored.state;
  const inspections = s ? s.inspections : clone(SEED_INSPECTIONS);
  return {
    thresholds: s ? s.thresholds : { ...DEFAULT_THRESHOLDS },
    inspections,
    log: s ? s.log : [],
    selected: inspections[0] ? keyOf(inspections[0]) : null,
    raw: {},
    notice: stored.notice,
    importErrors: [],
    importOk: null,
    decisionMsg: null,
    lastExport: null,
    readbackMsg: null,
  };
}

const state = initialState();
const evalOf = (i: Inspection) => evaluate(i, state.thresholds);
const current = () => state.inspections.find((i) => keyOf(i) === state.selected) ?? null;

function save() {
  const allValid = state.inspections.every((i) => evalOf(i).valid) && evaluate(SEED_INSPECTIONS[0], state.thresholds).valid;
  const el = document.getElementById("save-state");
  if (!allValid) {
    if (el) el.textContent = "Not saved: fix the errors first";
    return;
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, thresholds: state.thresholds, inspections: state.inspections, log: state.log }));
    if (el) el.textContent = "Saved in this browser only";
  } catch {
    if (el) el.textContent = "Browser storage unavailable";
  }
}

const REC_CLASS: Record<Recommendation, string> = { REJECT: "c-rej", REQUEST_MORE_EVIDENCE: "c-more", LIMITED_PILOT: "c-pilot" };
const REC_SHORT: Record<Recommendation, string> = { REJECT: "REJECT", REQUEST_MORE_EVIDENCE: "MORE EVIDENCE", LIMITED_PILOT: "LIMITED PILOT" };
const chip = (e: Evaluation) =>
  e.valid && e.recommendation
    ? `<span class="chip ${REC_CLASS[e.recommendation]}">${REC_SHORT[e.recommendation]}</span>`
    : `<span class="chip c-invalid">FIX INPUTS</span>`;
const initials = (name: string) => name.split(/\s+/).filter((w) => /^[A-Z]/.test(w)).slice(0, 2).map((w) => w[0]).join("");

function shell() {
  document.getElementById("app")!.innerHTML = `
  <div class="strip">Synthetic suppliers and illustrative numbers only · No outreach, purchasing or supplier contact happens from this desk</div>
  <header class="top">
    <a class="logo" href="./" aria-label="Fleek logo, home of this concept"><img src="./brand/fleek-logo.webp" alt="Fleek" width="88" height="28" /></a>
    <span class="product">Supply Sample Gate</span>
    <nav class="nav" aria-label="Sections">
      <a href="#desk">Desk</a><a href="#thresholds">Thresholds</a><a href="#log">Decision log</a><a href="${DOCS_URL}" target="_blank" rel="noopener">Docs</a>
    </nav>
    <div class="top-actions"><span id="save-state" class="save-state"></span><a class="btn btn-black btn-sm" href="#import">Import CSV</a><a class="btn btn-yellow btn-sm" href="#log">Export</a></div>
  </header>
  <section class="hero">
    <div class="wrap">
      <div class="crumbs"><span>Category bet</span><i>›</i><span>New supply</span><i>›</i><b>Sample to first order</b></div>
      <h1>Prove the sample before you <em>scale the supplier</em></h1>
      <p class="lede">A new category bet could be worth <b>£5M annual GMV</b> (illustrative target) because buyers already on the marketplace want the stock. The risk is the first batch. This desk turns a supplier's sample into a capped, evidence-backed call: <b>reject</b>, <b>request more evidence</b> or <b>approve a limited pilot</b>. A handful of samples cannot prove a £5M business; it can stop a bad first order.</p>
      <ol class="steps"><li>Choose supplier</li><li>Enter sample</li><li>Inspect evidence</li><li>Decide</li><li>Export</li></ol>
    </div>
  </section>
  <div id="notice"></div>
  <main class="wrap desk" id="desk">
    <aside class="col-left">
      <section class="panel" aria-labelledby="sup-h"><div class="panel-h"><h2 id="sup-h">Supplier samples</h2><span class="tag">3 synthetic suppliers · 2 categories</span></div><div id="suppliers"></div>
        <div class="newinsp">
          <label>Supplier<select id="new-sup">${SUPPLIERS.map((s) => `<option value="${s.id}">${esc(s.name)}</option>`).join("")}</select></label>
          <label>Category<select id="new-cat">${CATEGORIES.map((c) => `<option value="${c.id}">${esc(c.label)}</option>`).join("")}</select></label>
          <button class="btn btn-outline" id="add-insp" type="button">Start a new sample</button>
        </div>
      </section>
      <section class="panel" id="import" aria-labelledby="imp-h"><div class="panel-h"><h2 id="imp-h">Import inspections (CSV)</h2></div><div id="importer"></div></section>
    </aside>
    <section class="col-mid">
      <div class="panel" id="form-panel"></div>
      <div class="panel" id="evidence"></div>
    </section>
    <aside class="col-right">
      <div class="panel sticky" id="decision"></div>
      <div class="panel" id="thresholds"></div>
    </aside>
  </main>
  <section class="wrap" id="log"></section>
  <footer class="foot"><div class="wrap"><p>independent concept by Ayomide Ahmed</p><p>Not an official Fleek product</p></div></footer>`;
}

function renderNotice() {
  document.getElementById("notice")!.innerHTML = state.notice
    ? `<div class="wrap"><div class="alert warn" role="status">${esc(state.notice)} <button class="link" data-act="dismiss">Dismiss</button></div></div>`
    : "";
}

function renderSuppliers() {
  const el = document.getElementById("suppliers")!;
  if (!state.inspections.length) {
    el.innerHTML = `<div class="empty"><b>No samples yet.</b><p>Start a new sample below or import a CSV of inspections.</p></div>`;
    return;
  }
  el.innerHTML = state.inspections
    .map((i) => {
      const e = evalOf(i);
      const sel = keyOf(i) === state.selected;
      return `<button class="card ${sel ? "sel" : ""}" data-select="${esc(keyOf(i))}" aria-pressed="${sel}">
        <span class="tile t-${esc(i.supplierId)}">${esc(initials(supplierName(i.supplierId)))}</span>
        <span class="card-body"><span class="card-t">${esc(supplierName(i.supplierId))}</span>
        <span class="card-price">${e.unitsInPieces !== null ? `${e.unitsInPieces.toLocaleString("en-GB")} pcs` : i.unitsAvailable !== null ? `${i.unitsAvailable} ${esc(i.unitsUnit)}` : "Units unknown"}</span>
        <span class="card-sub">${e.sampleCostPerPiece !== null ? `${gbp(e.sampleCostPerPiece)}/pc sample` : "Sample cost unknown"} · ${Number.isFinite(i.sampleCount) ? i.sampleCount : "?"} inspected</span>
        <span class="card-tags"><span class="tag">${esc(categoryLabel(i.category))}</span><span class="tag syn">SYNTHETIC</span>${chip(e)}</span></span></button>`;
    })
    .join("");
}

const NUM_FIELDS: { k: keyof Inspection; label: string; nullable?: boolean; step?: string; suffix?: string }[] = [
  { k: "sampleCount", label: "Pieces in sample" },
  { k: "passCount", label: "Graded pass" },
  { k: "failCount", label: "Graded fail" },
  { k: "photosExpected", label: "Photos expected" },
  { k: "photosProvided", label: "Photos provided" },
  { k: "promisedMixPct", label: "Promised mix", step: "0.1", suffix: "%" },
  { k: "observedInCategory", label: "Observed in-category" },
  { k: "unitsAvailable", label: "Units available", nullable: true, step: "any" },
  { k: "piecesPerUnit", label: "Pieces per unit", nullable: true, step: "any" },
  { k: "sampleCostGBP", label: "Sample cost total (£)", nullable: true, step: "0.01" },
];

function fieldValue(i: Inspection, k: keyof Inspection) {
  const raw = state.raw[keyOf(i)]?.[k as string];
  if (raw !== undefined) return raw;
  const v = i[k] as number | null;
  return v === null || !Number.isFinite(v) ? "" : String(v);
}

function renderForm() {
  const el = document.getElementById("form-panel")!;
  const i = current();
  if (!i) {
    el.innerHTML = `<div class="empty big"><b>Pick a supplier sample to start.</b><p>Choose one on the left, or start a new sample for a synthetic supplier.</p></div>`;
    return;
  }
  el.innerHTML = `<div class="panel-h"><div><span class="eyebrow">Sample inspection</span><h2>${esc(supplierName(i.supplierId))} · ${esc(categoryLabel(i.category))}</h2></div>
    <div class="grade-btns"><span class="mini">Grade a piece</span><button class="btn btn-pass" data-grade="pass" type="button">+ Pass</button><button class="btn btn-fail" data-grade="fail" type="button">+ Fail</button></div></div>
    <form id="insp-form" class="grid-form" novalidate>
      ${NUM_FIELDS.map(
        (f) => `<label class="fld" data-field="${f.k}"><span>${f.label}</span><span class="inp"><input inputmode="decimal" name="${f.k}" value="${esc(fieldValue(i, f.k))}" ${f.nullable ? 'placeholder="not stated"' : ""} />${f.suffix ? `<i>${f.suffix}</i>` : ""}</span></label>`,
      ).join("")}
      <label class="fld" data-field="unitsUnit"><span>Unit</span><span class="inp"><select name="unitsUnit">${["pcs", "kg", "bales"].map((u) => `<option ${i.unitsUnit === u ? "selected" : ""}>${u}</option>`).join("")}</select></span></label>
      <label class="fld wide" data-field="inspectorNotes"><span>Inspector notes</span><textarea name="inspectorNotes" rows="3" placeholder="What did the pieces actually look like?">${esc(i.inspectorNotes)}</textarea></label>
    </form>
    <fieldset class="demand" id="demand"><legend>Demand-fit checklist <span class="mini">quality alone never approves · landed cost required</span></legend>
      ${DEMAND_ITEMS.map((d) => `<label class="check"><input type="checkbox" data-demand="${d.key}" ${i.demand[d.key] ? "checked" : ""}/> <span>${esc(d.label)}${d.key === REQUIRED_DEMAND ? ' <b class="req">required</b>' : ""}</span></label>`).join("")}
    </fieldset>
    <div id="form-errors"></div>`;
}

function renderFormErrors(e: Evaluation) {
  const el = document.getElementById("form-errors");
  if (!el) return;
  el.innerHTML = e.errors.length
    ? `<div class="alert err" role="alert"><b>Can't evaluate this sample yet</b><ul>${e.errors.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>`
    : "";
}

function renderEvidence() {
  const el = document.getElementById("evidence")!;
  const i = current();
  if (!i) {
    el.innerHTML = "";
    return;
  }
  const e = evalOf(i);
  renderFormErrors(e);
  if (!e.valid) {
    el.innerHTML = `<div class="panel-h"><h2>Evidence</h2></div><div class="empty"><b>Evidence is hidden until the inputs are valid.</b><p>Fix the highlighted fields above; nothing is scored from broken numbers.</p></div>`;
    return;
  }
  const passed = e.gates.filter((g) => g.status === "pass").length;
  el.innerHTML = `<div class="panel-h"><h2>Evidence</h2><span class="tag">${passed} of ${e.gates.length} gates evidenced</span></div>
    <table class="gates"><thead><tr><th>Gate</th><th>Evidence</th><th>Status</th></tr></thead><tbody>
    ${e.gates.map((g) => `<tr data-gate="${g.id}"><td>${esc(g.label)}</td><td>${esc(g.detail)}</td><td><span class="st st-${g.status}">${g.status === "pass" ? "Pass" : g.status === "fail" ? "Fail" : "Missing"}</span></td></tr>`).join("")}
    </tbody></table>
    ${e.failures.length ? `<div class="box rej" id="failures"><b>Failures</b><ul>${e.failures.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>` : ""}
    ${e.missingEvidence.length ? `<div class="box more" id="missing"><b>Missing evidence</b><ul>${e.missingEvidence.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>` : ""}
    ${e.warnings.length ? `<div class="box note"><b>Assumptions</b><ul>${e.warnings.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>` : ""}
    <div class="notes"><span class="eyebrow">Inspector notes</span><p>${i.inspectorNotes ? esc(i.inspectorNotes) : '<span class="muted">No notes yet.</span>'}</p></div>`;
}

function renderDecision() {
  const el = document.getElementById("decision")!;
  const i = current();
  if (!i) {
    el.innerHTML = `<div class="empty"><b>No sample selected.</b></div>`;
    return;
  }
  const e = evalOf(i);
  const btn = (sel: Recommendation, cls: string) => {
    const c = canSelect(e, sel);
    return `<button class="btn ${cls}" data-decide="${sel}" type="button" ${c.ok ? "" : "disabled"} title="${esc(c.reason)}">${LABELS[sel]}</button>`;
  };
  const recText = e.valid && e.recommendation ? LABELS[e.recommendation] : "No decision: inputs invalid";
  const blockers = e.valid && e.recommendation !== "LIMITED_PILOT" ? canSelect(e, "LIMITED_PILOT").reason : "";
  el.innerHTML = `<span class="eyebrow">Decision</span>
    <div class="rec ${e.valid && e.recommendation ? REC_CLASS[e.recommendation] : "c-invalid"}" id="rec"><span>Engine recommends</span><b>${esc(recText)}</b></div>
    <div class="kpis">
      <div class="kpi"><span>Acceptance</span><b>${pct(e.acceptanceRate)}</b><i>${e.valid ? `${i.passCount}/${i.sampleCount} pass` : "—"}</i></div>
      <div class="kpi"><span>Confidence</span><b>${pct(e.confidenceLower)}</b><i>95% lower bound</i></div>
      <div class="kpi"><span>Coverage</span><b>${e.valid ? `${e.gates.filter((g) => g.status === "pass").length}/${e.gates.length}` : "—"}</b><i>gates evidenced</i></div>
    </div>
    ${
      e.pilot
        ? `<div class="pilot" id="pilot"><b>Pilot ceiling: ${e.pilot.units.toLocaleString("en-GB")} pcs · hard cap ${gbp(e.pilot.ceilingGBP)}</b><p>${esc(e.pilot.basis)}</p><p class="proxy" id="proxy"><b>Sample-cost proxy: ${gbp(e.pilot.sampleCostProxyGBP)}</b> = ${e.pilot.units.toLocaleString("en-GB")} pcs × the sample's cost per piece. Proxy only: not a quote and not a verified first-order total. Confirm landed first-order cost separately; the hard cap still applies.</p><p class="disc">${esc(PILOT_DISCLAIMER)}</p><p class="mini">The ${gbp(e.pilot.ceilingGBP)} hard cap is ${((e.pilot.ceilingGBP / 5_000_000) * 100).toFixed(2)}% of an illustrative £5M annual GMV bet. This is a test, not proof.</p></div>`
        : `<div class="pilot off"><b>No pilot ceiling</b><p>${esc(blockers || "Inputs are invalid.")}</p></div>`
    }
    <label class="fld wide"><span>Decision note (goes in the log)</span><textarea id="decision-note" rows="2" placeholder="Why this call?"></textarea></label>
    <div class="decide">${btn("REJECT", "btn-rej")}${btn("REQUEST_MORE_EVIDENCE", "btn-more")}${btn("LIMITED_PILOT", "btn-pilot")}</div>
    <p class="mini">You can always be more cautious than the engine, never less. Recording a decision only writes to the log below.</p>
    ${state.decisionMsg ? `<div class="alert ${state.decisionMsg.kind === "ok" ? "ok" : "err"}" role="status">${esc(state.decisionMsg.text)}</div>` : ""}`;
}

function renderThresholds() {
  const el = document.getElementById("thresholds")!;
  const raw = state.raw.__thresholds ?? {};
  el.innerHTML = `<div class="panel-h"><h2>Decision thresholds</h2><button class="link" data-act="reset-thresholds">Reset</button></div>
    <p class="mini">Editable. Every change re-scores all samples and marks older log entries as stale.</p>
    <form id="thr-form" class="thr" novalidate>${(Object.keys(THRESHOLD_LIMITS) as (keyof Thresholds)[])
      .map((k) => {
        const lim = THRESHOLD_LIMITS[k];
        const v = raw[k] ?? String(state.thresholds[k]);
        return `<label class="fld row" data-thr="${k}"><span>${esc(lim.label)}</span><input name="${k}" inputmode="decimal" value="${esc(v)}" /></label>`;
      })
      .join("")}</form><div id="thr-errors"></div>`;
  renderThrErrors();
}

function renderThrErrors() {
  const e = evaluate(SEED_INSPECTIONS[0], state.thresholds);
  const errs = e.errors.filter((x) => Object.values(THRESHOLD_LIMITS).some((l) => x.startsWith(l.label)));
  const el = document.getElementById("thr-errors");
  if (el) el.innerHTML = errs.length ? `<div class="alert err" role="alert"><ul>${errs.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>` : "";
}

function renderImporter() {
  const el = document.getElementById("importer")!;
  el.innerHTML = `<p class="mini">One row per supplier sample. All-or-nothing: any bad row rejects the file. Demand checks are not imported and start unticked.</p>
    <textarea id="csv-text" rows="4" spellcheck="false" placeholder="Paste CSV with header: ${IMPORT_COLUMNS.join(",")}"></textarea>
    <div class="row-btns"><button class="btn btn-black btn-sm" data-act="import" type="button">Validate and import</button>
    <label class="btn btn-outline btn-sm file">Choose file<input type="file" id="csv-file" accept=".csv,text/csv" /></label>
    <button class="link" data-act="example-bad" type="button">Load an example with errors</button>
    <button class="link" data-act="template" type="button">Download template</button></div>
    ${state.importErrors.length ? `<div class="alert err" role="alert" id="import-errors"><b>File rejected: ${state.importErrors.length} problem${state.importErrors.length > 1 ? "s" : ""}</b><ul>${state.importErrors.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>` : ""}
    ${state.importOk ? `<div class="alert ok" role="status">${esc(state.importOk)}</div>` : ""}`;
}

function renderLog() {
  const el = document.getElementById("log")!;
  const rows = state.log
    .slice()
    .reverse()
    .map((d) => {
      const insp = state.inspections.find((i) => i.supplierId === d.supplierId && i.category === d.category);
      const stale = !insp || fingerprint(insp) !== d.inspectionFingerprint || fingerprint(state.thresholds) !== d.thresholdsFingerprint;
      return `<tr><td class="mono">${esc(d.at.replace("T", " ").slice(0, 19))} UTC</td><td>${esc(d.supplierName)}<br><span class="muted">${esc(categoryLabel(d.category))}</span></td>
      <td><span class="chip ${REC_CLASS[d.selected]}">${REC_SHORT[d.selected]}</span>${d.selected !== d.recommendation ? `<br><span class="mini">engine said ${esc(LABELS[d.recommendation])}</span>` : ""}</td>
      <td>${pct(d.acceptanceRate)} / ${pct(d.confidenceLower)}</td><td>${d.pilotUnits !== null ? `${d.pilotUnits} pcs · cap ${gbp(d.pilotCeilingGBP)}<br><span class="mini">proxy ${gbp(d.pilotSampleCostProxyGBP)}</span>` : "—"}</td>
      <td>${d.missingEvidence.length + d.failures.length ? esc([...d.failures, ...d.missingEvidence].join(" · ")) : "—"}</td><td>${esc(d.note) || '<span class="muted">—</span>'}</td>
      <td>${stale ? '<span class="st st-missing">Stale</span>' : '<span class="st st-pass">Current</span>'}</td></tr>`;
    })
    .join("");
  const ex = state.lastExport;
  el.innerHTML = `<div class="panel"><div class="panel-h"><div><span class="eyebrow">Audit trail</span><h2>Decision log</h2></div>
    <div class="row-btns"><button class="btn btn-yellow btn-sm" data-act="export-csv" type="button" ${state.log.length ? "" : "disabled"}>Export CSV</button><button class="btn btn-black btn-sm" data-act="export-json" type="button" ${state.log.length ? "" : "disabled"}>Export JSON</button>
    <label class="btn btn-outline btn-sm file">Read back an export<input type="file" id="readback-file" accept=".csv,.json" /></label></div></div>
    ${
      state.log.length
        ? `<div class="tablewrap"><table class="logt"><thead><tr><th>Timestamp</th><th>Supplier</th><th>Decision</th><th>Acceptance / confidence</th><th>Pilot ceiling</th><th>Gaps and failures</th><th>Note</th><th>Evidence</th></tr></thead><tbody>${rows}</tbody></table></div>`
        : `<div class="empty"><b>No decisions recorded yet.</b><p>Pick a sample, read the evidence, then record reject, more evidence or a limited pilot. Each call is timestamped here and can be exported.</p></div>`
    }
    ${ex ? `<div class="export" id="export-preview"><div class="export-h"><b>Exported ${ex.kind}</b><span class="st ${ex.ok ? "st-pass" : "st-fail"}">${esc(ex.readback)}</span></div><pre>${esc(ex.text.length > 1400 ? ex.text.slice(0, 1400) + "\n…" : ex.text)}</pre></div>` : ""}
    ${state.readbackMsg ? `<div class="alert ${state.readbackMsg.ok ? "ok" : "err"}" role="status">${esc(state.readbackMsg.text)}</div>` : ""}
    <p class="mini">Exports carry the notice: synthetic suppliers, illustrative numbers, and a limited pilot is not permission to purchase stock or message anyone.</p></div>`;
}

function renderAll() {
  renderNotice();
  renderSuppliers();
  renderForm();
  renderEvidence();
  renderDecision();
  renderThresholds();
  renderImporter();
  renderLog();
  save();
}

function refreshScores() {
  renderSuppliers();
  renderEvidence();
  renderDecision();
  renderLog();
  markFieldErrors();
  save();
}

function markFieldErrors() {
  const i = current();
  if (!i) return;
  const errs = evalOf(i).errors.join(" ").toLowerCase();
  const words: Record<string, string[]> = {
    sampleCount: ["sample count"], passCount: ["pass count", "pass ("], failCount: ["fail count", "fail ("],
    photosExpected: ["photos expected"], photosProvided: ["photos provided"], promisedMixPct: ["promised category mix"],
    observedInCategory: ["observed in-category"], unitsAvailable: ["units available"], piecesPerUnit: ["pieces per unit"], sampleCostGBP: ["sample cost"],
  };
  document.querySelectorAll<HTMLElement>("#insp-form [data-field]").forEach((l) => {
    const w = words[l.dataset.field!] ?? [];
    l.classList.toggle("bad", w.some((x) => errs.includes(x)));
  });
}

function parseNum(s: string, nullable: boolean): number | null {
  const t = s.trim().replace(/^£/, "");
  if (t === "") return nullable ? null : Number.NaN;
  return /^-?\d+(\.\d+)?$/.test(t) ? Number(t) : Number.NaN;
}

function download(name: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const BAD_EXAMPLE = `${IMPORT_COLUMNS.join(",")}
SUP-KST,denim,40,37,3,120,116,80,33,40,bales,60,250,"Re-sample, labels photographed"
SUP-KST,fleece,20,18,1,60,60,80,15,900,kg,,140,Pass + fail does not add up
SUP-ZZZ,denim,40,40,0,120,120,90,36,1000,pcs,,200,Unknown supplier
SUP-NGT,denim,forty,38,2,120,118,90,37,2400,pcs,,180,Text in a number field
`;

function importText(text: string) {
  const r = importInspectionsCsv(text);
  state.importErrors = r.errors;
  state.importOk = null;
  if (!r.errors.length) {
    for (const insp of r.inspections) {
      const idx = state.inspections.findIndex((x) => keyOf(x) === keyOf(insp));
      if (idx >= 0) state.inspections[idx] = insp;
      else state.inspections.push(insp);
      delete state.raw[keyOf(insp)];
    }
    state.selected = keyOf(r.inspections[0]);
    state.importOk = `Imported ${r.inspections.length} sample${r.inspections.length > 1 ? "s" : ""}. Demand checks start unticked: confirm them by hand.`;
  }
  renderAll();
}

function exportNow(kind: "CSV" | "JSON") {
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  if (kind === "CSV") {
    const text = buildCsvExport(state.log);
    const back = readCsvExport(text);
    state.lastExport = { kind, text, ok: !back.errors.length && back.entries.length === state.log.length, readback: back.errors.length ? `Readback failed: ${back.errors[0]}` : `Read back: ${back.entries.length} of ${state.log.length} entries verified` };
    download(`supply-sample-decisions-${stamp}.csv`, text, "text/csv");
  } else {
    const text = JSON.stringify(buildJsonExport(state.log, state.thresholds), null, 2);
    const back = readJsonExport(text);
    state.lastExport = { kind, text, ok: !back.errors.length, readback: back.errors.length ? `Readback failed: ${back.errors[0]}` : `Read back: ${back.data!.entries.length} entries, fingerprint ${back.data!.fingerprint} verified` };
    download(`supply-sample-decisions-${stamp}.json`, text, "application/json");
  }
  renderLog();
}

function bind() {
  const app = document.getElementById("app")!;
  app.addEventListener("click", (ev) => {
    const t = ev.target as HTMLElement;
    const sel = t.closest<HTMLElement>("[data-select]");
    if (sel) {
      state.selected = sel.dataset.select!;
      state.decisionMsg = null;
      renderSuppliers();
      renderForm();
      renderEvidence();
      renderDecision();
      markFieldErrors();
      return;
    }
    const grade = t.closest<HTMLElement>("[data-grade]");
    if (grade) {
      const i = current();
      if (!i) return;
      const k = keyOf(i);
      delete state.raw[k];
      i.sampleCount = (Number.isFinite(i.sampleCount) ? i.sampleCount : 0) + 1;
      if (grade.dataset.grade === "pass") i.passCount = (Number.isFinite(i.passCount) ? i.passCount : 0) + 1;
      else i.failCount = (Number.isFinite(i.failCount) ? i.failCount : 0) + 1;
      renderForm();
      refreshScores();
      return;
    }
    const decide = t.closest<HTMLButtonElement>("[data-decide]");
    if (decide) {
      const i = current();
      if (!i) return;
      const e = evalOf(i);
      const selection = decide.dataset.decide as Recommendation;
      const c = canSelect(e, selection);
      if (!c.ok) {
        state.decisionMsg = { kind: "err", text: c.reason };
        renderDecision();
        return;
      }
      const note = (document.getElementById("decision-note") as HTMLTextAreaElement | null)?.value.trim() ?? "";
      state.log.push({
        id: `D-${String(state.log.length + 1).padStart(3, "0")}`,
        at: new Date().toISOString(),
        supplierId: i.supplierId,
        supplierName: supplierName(i.supplierId),
        category: i.category,
        recommendation: e.recommendation!,
        selected: selection,
        acceptanceRate: e.acceptanceRate,
        confidenceLower: e.confidenceLower,
        pilotUnits: selection === "LIMITED_PILOT" ? e.pilot!.units : null,
        pilotCeilingGBP: selection === "LIMITED_PILOT" ? e.pilot!.ceilingGBP : null,
        pilotSampleCostProxyGBP: selection === "LIMITED_PILOT" ? e.pilot!.sampleCostProxyGBP : null,
        missingEvidence: e.missingEvidence,
        failures: e.failures,
        note,
        inspectionFingerprint: fingerprint(i),
        thresholdsFingerprint: fingerprint(state.thresholds),
      });
      state.decisionMsg = {
        kind: "ok",
        text: selection === "LIMITED_PILOT" ? `Logged: limited pilot, capped at ${e.pilot!.units} pcs. Nothing was bought or sent.` : `Logged: ${LABELS[selection].toLowerCase()}. Nothing was sent to anyone.`,
      };
      renderDecision();
      renderLog();
      save();
      return;
    }
    const act = t.closest<HTMLElement>("[data-act]")?.dataset.act;
    if (!act) return;
    if (act === "dismiss") {
      state.notice = null;
      renderNotice();
    } else if (act === "reset-thresholds") {
      state.thresholds = { ...DEFAULT_THRESHOLDS };
      delete state.raw.__thresholds;
      renderThresholds();
      refreshScores();
    } else if (act === "import") {
      importText((document.getElementById("csv-text") as HTMLTextAreaElement).value);
    } else if (act === "example-bad") {
      state.importErrors = [];
      state.importOk = null;
      renderImporter();
      (document.getElementById("csv-text") as HTMLTextAreaElement).value = BAD_EXAMPLE;
    } else if (act === "template") {
      download("inspection-template.csv", IMPORT_COLUMNS.join(",") + "\r\n", "text/csv");
    } else if (act === "export-csv") exportNow("CSV");
    else if (act === "export-json") exportNow("JSON");
  });

  app.addEventListener("input", (ev) => {
    const t = ev.target as HTMLInputElement;
    const i = current();
    if (t.closest("#insp-form") && i) {
      const k = t.name as keyof Inspection;
      if (k === "inspectorNotes") i.inspectorNotes = t.value;
      else if (k === "unitsUnit") i.unitsUnit = t.value as Inspection["unitsUnit"];
      else {
        const f = NUM_FIELDS.find((x) => x.k === k)!;
        (state.raw[keyOf(i)] ??= {})[k] = t.value;
        (i as unknown as Record<string, number | null>)[k] = parseNum(t.value, !!f.nullable);
      }
      refreshScores();
    } else if (t.dataset.demand && i) {
      i.demand[t.dataset.demand as keyof Inspection["demand"]] = t.checked;
      refreshScores();
    } else if (t.closest("#thr-form")) {
      const k = t.name as keyof Thresholds;
      (state.raw.__thresholds ??= {})[k] = t.value;
      state.thresholds = { ...state.thresholds, [k]: parseNum(t.value, false) ?? Number.NaN };
      document.querySelector(`[data-thr="${k}"]`)?.classList.toggle("bad", !Number.isFinite(state.thresholds[k]));
      renderThrErrors();
      refreshScores();
    }
  });

  app.addEventListener("change", async (ev) => {
    const t = ev.target as HTMLInputElement;
    if (t.id === "csv-file" && t.files?.[0]) importText(await t.files[0].text());
    if (t.id === "readback-file" && t.files?.[0]) {
      const text = await t.files[0].text();
      if (text.trim().startsWith("{")) {
        const r = readJsonExport(text);
        state.readbackMsg = r.errors.length ? { ok: false, text: `Export rejected: ${r.errors.join(" ")}` } : { ok: true, text: `Export verified: ${r.data!.entries.length} entries, fingerprint ${r.data!.fingerprint}.` };
      } else {
        const r = readCsvExport(text);
        state.readbackMsg = r.errors.length ? { ok: false, text: `Export rejected: ${r.errors.join(" ")}` } : { ok: true, text: `Export verified: ${r.entries.length} entries parsed and validated.` };
      }
      renderLog();
    }
  });

  document.getElementById("add-insp")!.addEventListener("click", () => {
    const supplierId = (document.getElementById("new-sup") as HTMLSelectElement).value;
    const category = (document.getElementById("new-cat") as HTMLSelectElement).value as CategoryId;
    const k = `${supplierId}|${category}`;
    if (!state.inspections.some((x) => keyOf(x) === k)) {
      state.inspections.push({
        supplierId, category, sampleCount: 0, passCount: 0, failCount: 0, photosExpected: 0, photosProvided: 0,
        promisedMixPct: 0, observedInCategory: 0, unitsAvailable: null, unitsUnit: "pcs", piecesPerUnit: null,
        sampleCostGBP: null, inspectorNotes: "", demand: emptyDemand(),
      });
    }
    state.selected = k;
    state.decisionMsg = null;
    renderSuppliers();
    renderForm();
    refreshScores();
  });
}

shell();
bind();
renderAll();
markFieldErrors();
