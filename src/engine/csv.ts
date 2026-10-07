export interface CsvParseResult {
  rows: string[][];
  errors: string[];
}

/** RFC 4180 parser: quoted fields, escaped quotes, CRLF/LF, rejects unclosed quotes and stray quotes. */
export function parseCsv(text: string): CsvParseResult {
  const rows: string[][] = [];
  const errors: string[] = [];
  if (typeof text !== "string") return { rows, errors: ["Input is not text."] };
  const src = text.replace(/^\uFEFF/, "");
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let fieldWasQuoted = false;
  let line = 1;
  let quoteStartLine = 1;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        if (c === "\n") line++;
        field += c;
      }
      continue;
    }
    if (c === '"') {
      if (field.length > 0 || fieldWasQuoted) {
        errors.push(`Line ${line}: unexpected quote inside an unquoted field.`);
        return { rows: [], errors };
      }
      inQuotes = true;
      fieldWasQuoted = true;
      quoteStartLine = line;
    } else if (c === ",") {
      row.push(field);
      field = "";
      fieldWasQuoted = false;
    } else if (c === "\r") {
      if (src[i + 1] !== "\n") {
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
        fieldWasQuoted = false;
        line++;
      }
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      fieldWasQuoted = false;
      line++;
    } else {
      if (fieldWasQuoted) {
        errors.push(`Line ${line}: text after a closing quote.`);
        return { rows: [], errors };
      }
      field += c;
    }
  }
  if (inQuotes) {
    errors.push(`Line ${quoteStartLine}: quoted field is never closed.`);
    return { rows: [], errors };
  }
  if (field.length > 0 || fieldWasQuoted || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  const nonEmpty = rows.filter((r) => !(r.length === 1 && r[0].trim() === ""));
  return { rows: nonEmpty, errors };
}

export function csvEscape(value: string | number | boolean | null | undefined): string {
  const s = value === null || value === undefined ? "" : String(value);
  if (/[",\r\n]/.test(s) || /^\s|\s$/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function toCsv(header: string[], rows: (string | number | boolean | null | undefined)[][]): string {
  return [header, ...rows].map((r) => r.map(csvEscape).join(",")).join("\r\n") + "\r\n";
}
