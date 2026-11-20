/**
 * Railway reference data and business rules shared by the admin dashboard,
 * the server-side registry, the Excel template, and the public scan page.
 *
 * Kept free of Node-only imports so client components can use it.
 */

// -------------------------------------------------------------
// Zonal Railways and their Divisions
// -------------------------------------------------------------
// Source of truth for the Zonal Railway / Division dropdowns. Reflects the
// South Coast Railway (SCoR) reorganisation: Waltair division was split into
// Visakhapatnam (SCoR) and Rayagada (ECoR), and Vijayawada, Guntur and
// Guntakal moved from South Central Railway to SCoR.
export type RailwayZone = { zone: string; code: string; divisions: string[] };

export const RAILWAY_ZONES: RailwayZone[] = [
  { zone: "Central Railway (CR)", code: "CR", divisions: ["Mumbai", "Bhusawal", "Nagpur", "Pune", "Solapur"] },
  { zone: "Eastern Railway (ER)", code: "ER", divisions: ["Howrah", "Sealdah", "Asansol", "Malda"] },
  {
    zone: "East Central Railway (ECR)",
    code: "ECR",
    divisions: ["Danapur", "Dhanbad", "Pt. Deen Dayal Upadhyaya", "Samastipur", "Sonpur"],
  },
  { zone: "East Coast Railway (ECoR)", code: "ECoR", divisions: ["Khurda Road", "Sambalpur", "Rayagada"] },
  { zone: "Northern Railway (NR)", code: "NR", divisions: ["Delhi", "Ambala", "Firozpur", "Lucknow", "Moradabad"] },
  { zone: "North Central Railway (NCR)", code: "NCR", divisions: ["Prayagraj", "Agra", "Jhansi"] },
  { zone: "North Eastern Railway (NER)", code: "NER", divisions: ["Izzatnagar", "Lucknow", "Varanasi"] },
  {
    zone: "Northeast Frontier Railway (NFR)",
    code: "NFR",
    divisions: ["Alipurduar", "Katihar", "Lumding", "Rangiya", "Tinsukia"],
  },
  { zone: "North Western Railway (NWR)", code: "NWR", divisions: ["Ajmer", "Bikaner", "Jaipur", "Jodhpur"] },
  {
    zone: "Southern Railway (SR)",
    code: "SR",
    divisions: ["Chennai", "Madurai", "Palakkad", "Salem", "Tiruchirappalli", "Thiruvananthapuram"],
  },
  { zone: "South Central Railway (SCR)", code: "SCR", divisions: ["Secunderabad", "Hyderabad", "Nanded"] },
  { zone: "South Coast Railway (SCoR)", code: "SCoR", divisions: ["Visakhapatnam", "Vijayawada", "Guntur", "Guntakal"] },
  { zone: "South Eastern Railway (SER)", code: "SER", divisions: ["Adra", "Chakradharpur", "Kharagpur", "Ranchi"] },
  { zone: "South East Central Railway (SECR)", code: "SECR", divisions: ["Bilaspur", "Nagpur", "Raipur"] },
  { zone: "South Western Railway (SWR)", code: "SWR", divisions: ["Bengaluru", "Hubballi", "Mysuru"] },
  {
    zone: "Western Railway (WR)",
    code: "WR",
    divisions: ["Mumbai Central", "Ahmedabad", "Bhavnagar", "Rajkot", "Ratlam", "Vadodara"],
  },
  { zone: "West Central Railway (WCR)", code: "WCR", divisions: ["Bhopal", "Jabalpur", "Kota"] },
  { zone: "Metro Railway Kolkata", code: "MTP", divisions: ["Kolkata Metro"] },
  { zone: "Konkan Railway (KR)", code: "KR", divisions: ["Ratnagiri", "Karwar"] },
];

/** Older or alternative spellings accepted on import, mapped to the canonical division name. */
const DIVISION_ALIASES: Record<string, string> = {
  "mumbai (csmt)": "Mumbai",
  csmt: "Mumbai",
  allahabad: "Prayagraj",
  "prayagraj (allahabad)": "Prayagraj",
  hubli: "Hubballi",
  "hubballi (hubli)": "Hubballi",
  bangalore: "Bengaluru",
  "bengaluru (bangalore)": "Bengaluru",
  mysore: "Mysuru",
  "mysuru (mysore)": "Mysuru",
  tiruchchirappalli: "Tiruchirappalli",
  trichy: "Tiruchirappalli",
  trivandrum: "Thiruvananthapuram",
  ddu: "Pt. Deen Dayal Upadhyaya",
  mughalsarai: "Pt. Deen Dayal Upadhyaya",
  "pt. deen dayal upadhyay (ddu)": "Pt. Deen Dayal Upadhyaya",
  "pt. deen dayal upadhyay": "Pt. Deen Dayal Upadhyaya",
  waltair: "Visakhapatnam",
  vizag: "Visakhapatnam",
  "nagpur (secr)": "Nagpur",
  "lucknow (nr)": "Lucknow",
  "lucknow (ner)": "Lucknow",
  khurda: "Khurda Road",
  ferozpur: "Firozpur",
  "kolkata metro railway": "Kolkata Metro",
};

const ZONE_ALIASES: Record<string, string> = {
  "metro railway, kolkata": "Metro Railway Kolkata",
  "kolkata metro": "Metro Railway Kolkata",
  "metro railway": "Metro Railway Kolkata",
};

const clean = (value: unknown) => String(value ?? "").trim().replace(/\s+/g, " ").toLowerCase();

/** Resolves a zone typed as its full name, its name without the code, or its code. Returns "" if unknown. */
export function matchZone(input: unknown): string {
  const value = clean(input);
  if (!value) return "";
  if (ZONE_ALIASES[value]) return ZONE_ALIASES[value];
  const found = RAILWAY_ZONES.find(
    (z) =>
      clean(z.zone) === value ||
      clean(z.code) === value ||
      clean(z.zone.replace(/\s*\([^)]*\)\s*$/, "")) === value,
  );
  return found?.zone ?? "";
}

export function divisionsForZone(zone: string): string[] {
  return RAILWAY_ZONES.find((z) => z.zone === zone)?.divisions ?? [];
}

/** Resolves a division name within a zone (accepts aliases and a trailing "Division"). Returns "" if it does not belong to the zone. */
export function matchDivision(zone: string, input: unknown): string {
  let value = clean(input).replace(/\s+division$/, "");
  if (!value) return "";
  value = clean(DIVISION_ALIASES[value] ?? value);
  return divisionsForZone(zone).find((d) => clean(d) === value) ?? "";
}

// -------------------------------------------------------------
// Types of Product
// -------------------------------------------------------------
/** The five Complete ELB models. Adding one creates five QR-coded component records. */
export const ELB_MODELS = [
  "ELB 24 V DC With Hand Generator",
  "ELB 24 V DC Without Hand Generator",
  "ELB 110 V DC With Hand Generator",
  "ELB 110 V DC Without Hand Generator",
  "ELB 110 V AC",
] as const;

export const COMPONENT_TYPES = ["Pedestal Unit", "Locking Unit", "Control Panel Unit"] as const;

/** All eight selectable Types of Product. */
export const PRODUCT_TYPES: string[] = [...ELB_MODELS, ...COMPONENT_TYPES];

export type UnitNumberField = "machine_no" | "pedestal_no" | "locking_no" | "control_panel_no";

/** The unit number that identifies each component type. */
export const COMPONENT_NUMBER_FIELD: Record<(typeof COMPONENT_TYPES)[number], UnitNumberField> = {
  "Pedestal Unit": "pedestal_no",
  "Locking Unit": "locking_no",
  "Control Panel Unit": "control_panel_no",
};

/** A Complete ELB is supplied as 1 Control Panel, 2 Locking Units and 2 Pedestal Units: five QR codes. */
export const ELB_SET: { type: (typeof COMPONENT_TYPES)[number]; index: number }[] = [
  { type: "Control Panel Unit", index: 0 },
  { type: "Locking Unit", index: 0 },
  { type: "Locking Unit", index: 1 },
  { type: "Pedestal Unit", index: 0 },
  { type: "Pedestal Unit", index: 1 },
];

export const isCompleteElb = (type: string) => (ELB_MODELS as readonly string[]).includes(type);
export const isComponentType = (type: string): type is (typeof COMPONENT_TYPES)[number] =>
  (COMPONENT_TYPES as readonly string[]).includes(type);

export function matchProductType(input: unknown): string {
  const value = clean(input).replace(/\s+/g, "");
  if (!value) return "";
  return PRODUCT_TYPES.find((t) => clean(t).replace(/\s+/g, "") === value) ?? "";
}

/** Which unit number fields apply to a Type of Product. A Complete ELB activates all of them. */
export function activeNumberFields(type: string): UnitNumberField[] {
  if (isComponentType(type)) return [COMPONENT_NUMBER_FIELD[type]];
  return ["machine_no", "pedestal_no", "locking_no", "control_panel_no"];
}

/**
 * Splits "PED-01, PED-02" into the individual unit numbers. Only a comma, semicolon
 * or new line separates numbers: "/" and "&" are common inside numbers such as
 * "GD/HLB-PD/1126/001", so they are never treated as separators.
 */
export function splitUnitNumbers(value: string): string[] {
  return String(value || "")
    .split(/[,;\n]/)
    .map((v) => v.trim())
    .filter(Boolean);
}

// -------------------------------------------------------------
// Dates and Warranty
// -------------------------------------------------------------
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isValidIsoDate(value: string): boolean {
  const m = ISO_DATE.exec(value);
  if (!m) return false;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3];
}

const iso = (y: number, m: number, d: number) =>
  `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

/** Adds calendar months like Excel's EDATE: 31 Jan + 1 month = 28/29 Feb. */
export function addMonths(isoDate: string, months: number): string {
  const m = ISO_DATE.exec(isoDate);
  if (!m) return "";
  const total = +m[1] * 12 + (+m[2] - 1) + months;
  const year = Math.floor(total / 12);
  const month = (total % 12) + 1;
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return iso(year, month, Math.min(+m[3], lastDay));
}

/** Warranty expires 2 years after supply or 1 year after installation, whichever is earlier. */
export function warrantyExpiry(dateOfSupply: string, dateOfInstallation: string): string {
  const candidates = [
    isValidIsoDate(dateOfSupply) ? addMonths(dateOfSupply, 24) : "",
    isValidIsoDate(dateOfInstallation) ? addMonths(dateOfInstallation, 12) : "",
  ].filter(Boolean);
  return candidates.sort()[0] ?? "";
}

/** Today's date in India (YYYY-MM-DD). */
export function todayInIndia(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(now);
}

/** "Yes" while today is on or before the expiry date, "No" after it, "" when there is no warranty date. */
export function underWarranty(expiry: string, today = todayInIndia()): "Yes" | "No" | "" {
  if (!isValidIsoDate(expiry)) return "";
  return today <= expiry ? "Yes" : "No";
}

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

/**
 * Normalises a date from Excel/CSV to YYYY-MM-DD.
 * Accepts Excel serial numbers, JS Dates, YYYY-MM-DD, DD/MM/YYYY (also with "-" or "."),
 * and month names such as "15-Jan-2025" or "Jan 15, 2025".
 * Returns "" for an empty value and null when the value is not a valid date.
 */
export function normalizeDate(value: unknown): string | null {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) {
    return Number.isNaN(value.getTime())
      ? null
      : iso(value.getUTCFullYear(), value.getUTCMonth() + 1, value.getUTCDate());
  }
  if (typeof value === "number") return fromExcelSerial(value);

  const text = String(value).trim();
  if (!text) return "";
  if (/^\d{5}(\.\d+)?$/.test(text)) return fromExcelSerial(Number(text));

  const valid = (y: number, m: number, d: number) => {
    if (y < 100) y += 2000;
    const out = iso(y, m, d);
    return isValidIsoDate(out) ? out : null;
  };

  let m = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:[ T].*)?$/.exec(text);
  if (m) return valid(+m[1], +m[2], +m[3]);
  // Indian format: day first.
  m = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2}|\d{4})$/.exec(text);
  if (m) return valid(+m[3], +m[2], +m[1]);
  m = /^(\d{1,2})[-/. ]([a-z]{3,9})[-/., ]+(\d{2}|\d{4})$/i.exec(text);
  if (m) {
    const month = MONTHS.indexOf(m[2].slice(0, 3).toLowerCase());
    return month < 0 ? null : valid(+m[3], month + 1, +m[1]);
  }
  m = /^([a-z]{3,9})[ -](\d{1,2}),?[ -](\d{2}|\d{4})$/i.exec(text);
  if (m) {
    const month = MONTHS.indexOf(m[1].slice(0, 3).toLowerCase());
    return month < 0 ? null : valid(+m[3], month + 1, +m[2]);
  }
  return null;
}

function fromExcelSerial(serial: number): string | null {
  // Excel day 1 = 1900-01-01; serials are days since 1899-12-30 for all modern dates.
  if (!Number.isFinite(serial) || serial < 1 || serial > 2958465) return null;
  const d = new Date(Date.UTC(1899, 11, 30) + Math.floor(serial) * 86400000);
  return iso(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
}

// -------------------------------------------------------------
// Service records
// -------------------------------------------------------------
export type ServiceRecord = { date: string; details: string };

/** Reads the Excel "Service Record" cell: one service entry per line, optionally starting with a date. */
export function parseServiceRecords(text: string): ServiceRecord[] {
  return String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const m = /^(\S+(?:\s[a-z]{3,9}\s\d{2,4})?)\s*[-:–]\s*(.*)$/i.exec(line);
      const date = m ? normalizeDate(m[1]) : null;
      return date ? { date, details: m![2].trim() } : { date: "", details: line };
    });
}

export function formatServiceRecords(records: ServiceRecord[]): string {
  return records.map((r) => [r.date, r.details].filter(Boolean).join(" - ")).join("\n");
}

/** Displays YYYY-MM-DD as DD-MM-YYYY. */
export function displayDate(value: string): string {
  const m = ISO_DATE.exec(value || "");
  return m ? `${m[3]}-${m[2]}-${m[1]}` : value || "";
}
