// Shared date helpers so every page in the system displays and enters dates in
// a single consistent format: dd/mm/yyyy (Gregorian, zero-padded).

function pad2(n) {
  return String(n).padStart(2, "0");
}

// Accepts a Date, an ISO date/timestamp string, or null/undefined.
// Returns "dd/mm/yyyy" or "" if there's nothing valid to show.
export function formatDMY(value) {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return "";
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
}

// Same as formatDMY but also appends the time as HH:mm (for timestamps like
// stock_updated_at / created_at).
export function formatDMYTime(value) {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return "";
  return `${formatDMY(d)} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

// Converts an ISO date string ("yyyy-mm-dd" or a full timestamp) into
// "dd/mm/yyyy" for pre-filling text inputs. Alias of formatDMY kept for
// readability at call sites that specifically deal with stored ISO dates.
export function isoToDMY(isoValue) {
  return formatDMY(isoValue);
}

// Parses a "dd/mm/yyyy" string typed by the user into an ISO "yyyy-mm-dd"
// string suitable for a Postgres DATE column. Returns null if the text is
// empty, and throws an Error with a Thai message if it's non-empty but
// doesn't parse as a valid date, so callers can surface it directly.
export function parseDMYToISO(text) {
  const trimmed = String(text || "").trim();
  if (!trimmed) return null;

  const match = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) {
    throw new Error(`รูปแบบวันที่ไม่ถูกต้อง (${trimmed}) — กรุณากรอกเป็น dd/mm/yyyy`);
  }

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const d = new Date(year, month - 1, day);

  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) {
    throw new Error(`วันที่ไม่ถูกต้อง (${trimmed})`);
  }

  return `${year}-${pad2(month)}-${pad2(day)}`;
}

// Whole days between "today" (local midnight) and the given date. Positive =
// days remaining, negative = days past. Returns null if value is empty/invalid.
export function daysUntil(value) {
  if (!value) return null;
  const target = value instanceof Date ? value : new Date(value);
  if (isNaN(target.getTime())) return null;

  const today = new Date();
  const todayMid = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const targetMid = new Date(target.getFullYear(), target.getMonth(), target.getDate());

  return Math.round((targetMid - todayMid) / 86400000);
}
