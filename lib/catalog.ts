import { randomInt, randomUUID } from "node:crypto";
import ExcelJS from "exceljs";
import Papa from "papaparse";
import * as xlsx from "xlsx";
import {
  dataDir,
  execute,
  isPostgres,
  query,
  queryOne,
  db,
} from "./catalog-db";
import {
  COMPONENT_NUMBER_FIELD,
  ELB_SET,
  PRODUCT_TYPES,
  RAILWAY_ZONES,
  type ServiceRecord,
  formatServiceRecords,
  isCompleteElb,
  isComponentType,
  isValidIsoDate,
  matchDivision,
  matchProductType,
  matchZone,
  normalizeDate,
  parseServiceRecords,
  splitUnitNumbers,
  underWarranty,
  warrantyExpiry,
} from "./railway";

export { dataDir, db };

export type Category = { id: string; name: string; count: number };

export type ProductInput = {
  name: string;
  category_id: string;
  brand: string;
  model: string;
  description: string;
  images: string[];
  manufacturing_date: string;
  website_url: string;
  // Railway equipment fields
  product_type: string;
  zone: string;
  division: string;
  station_details: string;
  /** The Complete ELB model a component belongs to (empty for standalone units). */
  elb_type: string;
  /** Legacy field from the earlier form; no longer edited. */
  part_name: string;
  lc_gate_no: string;
  version_no: string;
  machine_no: string;
  pedestal_no: string;
  locking_no: string;
  control_panel_no: string;
  date_of_supply: string;
  date_of_installation: string;
  date_of_commissioning: string;
  /** Always calculated: 2 years from supply or 1 year from installation, whichever is earlier. */
  date_of_warranty_expiry: string;
  /** Always calculated against today's date when the record is read. */
  under_warranty: string;
  /** Legacy single comment; new entries go to technical_notes. */
  comments: string;
  service_records: ServiceRecord[];
  /** Comments / Technical Notes: separate entries, each with its own text and images. */
  technical_notes: TechnicalNote[];
};

export type TechnicalNote = { date: string; text: string; images: string[] };

const IMAGE_URL = /^\/api\/catalog\/images\/[a-f0-9-]+\.(png|jpg|webp)$/;

export type Product = ProductInput & {
  id: number;
  public_id: string;
  /** The QR Code Number: a random 16-digit number assigned once, never editable. */
  sku: string;
  serial: string;
  category: string;
  active: number;
  created_at: string;
  updated_at: string;
};

const key = (value: string) => value.trim().toLocaleLowerCase("en-US");
export const serial = (id: number) => `PRD-${String(id).padStart(6, "0")}`;
const DEFAULT_WEBSITE = "https://global-website.com";

const parseJsonArray = (value: unknown): unknown[] => {
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(String(value || "[]"));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const isoTimestamp = (value: unknown) =>
  typeof value === "object" && value ? (value as Date).toISOString() : String(value || "");

/** Stored notes; an older record's single comment is shown as its first note. */
function readNotes(value: unknown, legacyComment: string): TechnicalNote[] {
  const notes = parseJsonArray(value).map((n) => {
    const note = (n ?? {}) as Partial<TechnicalNote>;
    return {
      date: String(note.date ?? ""),
      text: String(note.text ?? ""),
      images: Array.isArray(note.images) ? note.images.filter((u): u is string => typeof u === "string") : [],
    };
  });
  return legacyComment ? [{ date: "", text: legacyComment, images: [] }, ...notes] : notes;
}

const formatNotes = (notes: TechnicalNote[]) =>
  notes.map((n) => [n.date, n.text].filter(Boolean).join(" - ")).join("\n");

function hydrate(row: Record<string, unknown>): Product {
  const text = (k: string) => String(row[k] ?? "");
  const supply = text("date_of_supply");
  const installation = text("date_of_installation");
  const stored = text("date_of_warranty_expiry");
  // Records without supply/installation dates (older entries) keep their stored expiry.
  const expiry = warrantyExpiry(supply, installation) || (isValidIsoDate(stored) ? stored : "");
  return {
    ...(row as unknown as Product),
    id: Number(row.id),
    active: Number(row.active),
    images: parseJsonArray(row.images).filter((u): u is string => typeof u === "string"),
    serial: serial(Number(row.id)),
    sku: text("sku"),
    product_type: text("product_type"),
    zone: text("zone"),
    division: text("division"),
    station_details: text("station_details"),
    elb_type: text("elb_type"),
    part_name: text("part_name"),
    lc_gate_no: text("lc_gate_no"),
    version_no: text("version_no"),
    machine_no: text("machine_no"),
    pedestal_no: text("pedestal_no"),
    locking_no: text("locking_no"),
    control_panel_no: text("control_panel_no"),
    date_of_supply: supply,
    date_of_installation: installation,
    date_of_commissioning: text("date_of_commissioning"),
    date_of_warranty_expiry: expiry,
    under_warranty: underWarranty(expiry),
    comments: text("comments"),
    service_records: parseJsonArray(row.service_records).map((r) => ({
      date: String((r as ServiceRecord)?.date ?? ""),
      details: String((r as ServiceRecord)?.details ?? ""),
    })),
    technical_notes: readNotes(row.technical_notes, text("comments")),
    created_at: isoTimestamp(row.created_at),
    updated_at: isoTimestamp(row.updated_at),
  };
}

// -------------------------------------------------------------
// Categories
// -------------------------------------------------------------
export async function ensureRailwayCategory(): Promise<string> {
  const name = "Railway Equipment";
  const nameKey = key(name);
  const existing = await queryOne<{ id: string }>(
    "SELECT id FROM categories WHERE name_key=$1",
    [nameKey],
  );
  if (existing) return existing.id;
  const id = randomUUID();
  await execute(
    "INSERT INTO categories (id, name, name_key) VALUES ($1, $2, $3)",
    [id, name, nameKey],
  );
  return id;
}

export async function categories(): Promise<Category[]> {
  const rows = await query<{
    id: string;
    name: string;
    count: number | string;
  }>(
    "SELECT c.id, c.name, COUNT(p.id) AS count FROM categories c LEFT JOIN products p ON p.category_id=c.id GROUP BY c.id, c.name ORDER BY c.name",
  );
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    count: Number(r.count || 0),
  }));
}

export async function saveCategory(name: string, id?: string): Promise<void> {
  name = String(name || "").trim();
  if (!name || name.length > 120)
    throw new Error("Category name must contain 1–120 characters.");
  const existing = await queryOne<{ id: string }>(
    "SELECT id FROM categories WHERE name_key=$1 AND id!=$2",
    [key(name), id || ""],
  );
  if (existing) throw new Error("This category already exists.");
  if (id) {
    const row = await queryOne<{ id: string }>(
      "UPDATE categories SET name=$1, name_key=$2 WHERE id=$3 RETURNING id",
      [name, key(name), id],
    );
    if (!row) throw new Error("Category not found.");
  } else {
    await execute(
      "INSERT INTO categories (id, name, name_key) VALUES ($1, $2, $3)",
      [randomUUID(), name, key(name)],
    );
  }
}

export async function deleteCategory(id: string): Promise<void> {
  const product = await queryOne<{ id: number }>(
    "SELECT id FROM products WHERE category_id=$1 LIMIT 1",
    [id],
  );
  if (product)
    throw new Error(
      "Reassign all products, including inactive products, before deleting this category.",
    );
  await execute("DELETE FROM categories WHERE id=$1", [id]);
}

// -------------------------------------------------------------
// QR Code Numbers
// -------------------------------------------------------------
/** A random (not sequential) 16-digit QR Code Number. The first digit is never 0. */
export function generateQrNumber(): string {
  let value = String(randomInt(1, 10));
  for (let i = 0; i < 15; i++) value += String(randomInt(0, 10));
  return value;
}

async function uniqueQrNumber(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = generateQrNumber();
    const taken = await queryOne<{ id: number }>(
      "SELECT id FROM products WHERE sku_key=$1",
      [candidate],
    );
    if (!taken) return candidate;
  }
  throw new Error("Could not allocate a unique QR Code Number. Please try again.");
}

// -------------------------------------------------------------
// Product Validation & Saving
// -------------------------------------------------------------
const TEXT_FIELDS = [
  "name",
  "category_id",
  "brand",
  "model",
  "description",
  "manufacturing_date",
  "website_url",
  "product_type",
  "zone",
  "division",
  "station_details",
  "elb_type",
  "part_name",
  "lc_gate_no",
  "version_no",
  "machine_no",
  "pedestal_no",
  "locking_no",
  "control_panel_no",
  "comments",
] as const;

const DATE_FIELDS = {
  date_of_supply: "Date of Supply",
  date_of_installation: "Date of Installation",
  date_of_commissioning: "Date of Commissioning",
} as const;

/** Validates and normalises a record. Every field is optional. */
export async function validateProduct(
  raw: Partial<Record<keyof ProductInput, unknown>>,
): Promise<ProductInput> {
  const input = {} as ProductInput;
  for (const field of TEXT_FIELDS) {
    input[field] = String(raw[field] ?? "").trim();
    if (input[field].length > (field === "description" || field === "comments" ? 10000 : 2048))
      throw new Error(`${field.replace(/_/g, " ")} is too long.`);
  }

  if (input.product_type) {
    const type = matchProductType(input.product_type);
    if (!type)
      throw new Error(`Unknown Type of Product "${input.product_type}". Choose one from the list.`);
    input.product_type = type;
  }

  if (input.zone) {
    const zone = matchZone(input.zone);
    if (!zone) throw new Error(`Unknown Zonal Railway "${input.zone}". Choose one from the list.`);
    input.zone = zone;
  }
  if (input.division) {
    if (!input.zone)
      throw new Error(`Choose the Zonal Railway for division "${input.division}".`);
    const division = matchDivision(input.zone, input.division);
    if (!division)
      throw new Error(`Division "${input.division}" does not belong to ${input.zone}.`);
    input.division = division;
  }

  for (const [field, label] of Object.entries(DATE_FIELDS) as [keyof typeof DATE_FIELDS, string][]) {
    const value = normalizeDate(raw[field]);
    if (value === null)
      throw new Error(`${label} "${String(raw[field])}" is not a valid date. Use DD-MM-YYYY.`);
    input[field] = value;
  }
  input.date_of_warranty_expiry = warrantyExpiry(input.date_of_supply, input.date_of_installation);
  input.under_warranty = underWarranty(input.date_of_warranty_expiry);

  const records = Array.isArray(raw.service_records) ? raw.service_records : [];
  if (records.length > 500) throw new Error("A record can hold at most 500 service entries.");
  input.service_records = [];
  for (const entry of records as Partial<ServiceRecord>[]) {
    const details = String(entry?.details ?? "").trim();
    const date = normalizeDate(entry?.date ?? "");
    if (date === null) throw new Error(`Service record date "${String(entry?.date)}" is not a valid date.`);
    if (details.length > 2000) throw new Error("Each service record must be under 2,000 characters.");
    if (date || details) input.service_records.push({ date, details });
  }

  // Comments / Technical Notes. The form sends the full list (which already includes any
  // older single comment); imports send a Comments column, which becomes one note.
  const rawNotes = Array.isArray(raw.technical_notes)
    ? (raw.technical_notes as Partial<TechnicalNote>[])
    : input.comments
      ? [{ date: "", text: input.comments, images: [] }]
      : [];
  input.comments = "";
  if (rawNotes.length > 200) throw new Error("A record can hold at most 200 technical notes.");
  input.technical_notes = [];
  for (const note of rawNotes) {
    const text = String(note?.text ?? "").trim();
    const date = normalizeDate(note?.date ?? "");
    const images = Array.isArray(note?.images) ? note.images : [];
    if (date === null) throw new Error(`Technical note date "${String(note?.date)}" is not a valid date.`);
    if (text.length > 10000) throw new Error("Each technical note must be under 10,000 characters.");
    if (images.length > 8 || images.some((u) => typeof u !== "string" || !IMAGE_URL.test(u)))
      throw new Error("Each technical note can have up to eight uploaded images.");
    if (text || images.length) input.technical_notes.push({ date, text, images });
  }

  // The product title is the Type of Product.
  input.name = (input.product_type || input.name || "Railway Equipment").slice(0, 200);

  const category = input.category_id
    ? await queryOne<{ id: string }>("SELECT id FROM categories WHERE id=$1", [input.category_id])
    : undefined;
  if (!category) input.category_id = await ensureRailwayCategory();

  input.brand ||= "GLOBAL";
  input.website_url ||= DEFAULT_WEBSITE;
  let url: URL;
  try {
    url = new URL(input.website_url);
  } catch {
    throw new Error("Enter a valid website URL.");
  }
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password)
    throw new Error("Website URL must use HTTP or HTTPS without credentials.");

  if (input.manufacturing_date && !isValidIsoDate(input.manufacturing_date))
    throw new Error("Manufacturing date must be a valid YYYY-MM-DD date.");

  input.images = Array.isArray(raw.images) ? (raw.images as string[]) : [];
  if (
    input.images.length > 8 ||
    input.images.some(
      (u) => typeof u !== "string" || !/^\/api\/catalog\/images\/[a-f0-9-]+\.(png|jpg|webp)$/.test(u),
    )
  )
    throw new Error("Use up to eight uploaded product images.");

  return input;
}

/**
 * Turns one entry into the records that each get a QR code. A Complete ELB
 * becomes 1 Control Panel Unit, 2 Locking Units and 2 Pedestal Units that
 * share the machine number, location and dates.
 */
export function expandRecords(p: ProductInput): ProductInput[] {
  if (!isCompleteElb(p.product_type)) return [p];
  const pedestals = splitUnitNumbers(p.pedestal_no);
  const lockings = splitUnitNumbers(p.locking_no);
  if (pedestals.length > 2)
    throw new Error("A Complete ELB has 2 Pedestal Units. Enter at most two Pedestal Numbers, separated by a comma.");
  if (lockings.length > 2)
    throw new Error("A Complete ELB has 2 Locking Units. Enter at most two Locking Numbers, separated by a comma.");
  const numbers = { "Pedestal Unit": pedestals, "Locking Unit": lockings, "Control Panel Unit": [p.control_panel_no] };
  return ELB_SET.map(({ type, index }) => ({
    ...p,
    product_type: type,
    name: type,
    elb_type: p.product_type,
    pedestal_no: "",
    locking_no: "",
    control_panel_no: "",
    [COMPONENT_NUMBER_FIELD[type]]: numbers[type][index] ?? "",
  }));
}

const COLUMNS = [
  "name",
  "category_id",
  "brand",
  "model",
  "description",
  "images",
  "manufacturing_date",
  "website_url",
  "zone",
  "division",
  "station_details",
  "elb_type",
  "part_name",
  "lc_gate_no",
  "version_no",
  "machine_no",
  "pedestal_no",
  "locking_no",
  "date_of_supply",
  "date_of_installation",
  "date_of_commissioning",
  "date_of_warranty_expiry",
  "under_warranty",
  "comments",
  "product_type",
  "control_panel_no",
  "service_records",
  "technical_notes",
] as const;

const columnValues = (p: ProductInput) =>
  COLUMNS.map((c) =>
    c === "images" || c === "service_records" || c === "technical_notes" ? JSON.stringify(p[c]) : p[c],
  );

async function insertRecord(p: ProductInput): Promise<number> {
  const n = COLUMNS.length;
  for (let attempt = 0; attempt < 3; attempt++) {
    const qr = await uniqueQrNumber();
    try {
      const row = await queryOne<{ id: number }>(
        `INSERT INTO products (${COLUMNS.join(", ")}, sku, sku_key, public_id)
         VALUES (${COLUMNS.map((_, i) => `$${i + 1}`).join(", ")}, $${n + 1}, $${n + 2}, $${n + 3})
         RETURNING id`,
        [...columnValues(p), qr, qr, randomUUID()],
      );
      if (!row) throw new Error("Failed to insert product.");
      return Number(row.id);
    } catch (e) {
      // Another request took the same number between the check and the insert.
      if (!/unique|duplicate/i.test(String((e as Error).message)) || attempt === 2) throw e;
    }
  }
  throw new Error("Failed to insert product.");
}

/** Creates a new entry. Returns one id per QR code (five for a Complete ELB). */
export async function createProducts(raw: Partial<Record<keyof ProductInput, unknown>>): Promise<number[]> {
  const records = expandRecords(await validateProduct(raw));
  const ids: number[] = [];
  for (const record of records) ids.push(await insertRecord(record));
  return ids;
}

/**
 * Saves a record. Without an id it creates the entry (returning the first id);
 * with an id it updates that record. The QR Code Number is never changed.
 */
export async function saveProduct(
  raw: Partial<Record<keyof ProductInput, unknown>>,
  id?: number,
): Promise<number> {
  if (!id) return (await createProducts(raw))[0];
  const p = await validateProduct(raw);
  if (isCompleteElb(p.product_type))
    throw new Error(
      "A Complete ELB creates 5 QR codes, so it can only be added as a new entry. Choose this record's unit type instead.",
    );
  const values = columnValues(p);
  const row = await queryOne<{ id: number }>(
    `UPDATE products SET ${COLUMNS.map((c, i) => `${c}=$${i + 1}`).join(", ")}, updated_at=NOW()
     WHERE id=$${values.length + 1} RETURNING id`,
    [...values, id],
  );
  if (!row) throw new Error("Product not found.");
  return Number(row.id);
}

const select =
  "SELECT p.*, c.name AS category FROM products p JOIN categories c ON c.id=p.category_id";

export async function getProduct(
  publicId: string,
): Promise<Product | undefined> {
  const row = await queryOne(
    `${select} WHERE p.public_id=$1 OR p.sku=$1 OR p.sku_key=$2`,
    [publicId, key(publicId)],
  );
  return row ? hydrate(row) : undefined;
}

export async function listProducts(
  queryParam = "",
  category = "",
  status = "",
  page = 1,
  limit = 20,
) {
  const searchPattern = `%${queryParam}%`;
  const serialExpr = isPostgres ? "('PRD-' || LPAD(p.id::text, 6, '0'))" : "printf('PRD-%06d', p.id)";
  const searchable = [
    "p.name",
    "p.sku",
    "p.product_type",
    "p.zone",
    "p.division",
    "p.station_details",
    "p.elb_type",
    "p.lc_gate_no",
    "p.machine_no",
    "p.pedestal_no",
    "p.locking_no",
    "p.control_panel_no",
    serialExpr,
  ];
  const where = ` WHERE (${searchable.map((c) => `${c} ILIKE $1`).join(" OR ")})
    AND ($2='' OR p.category_id=$2) AND ($3='' OR p.active=$4)`;
  const activeVal = status === "inactive" ? 0 : 1;
  const args = [searchPattern, category, status, activeVal];

  const countRow = await queryOne<{ total: number | string }>(
    `SELECT COUNT(*) AS total FROM products p${where}`,
    args,
  );
  const total = Number(countRow?.total || 0);

  const offset = (page - 1) * limit;
  const rows = await query(
    `${select}${where} ORDER BY p.id DESC LIMIT $5 OFFSET $6`,
    [...args, limit, offset],
  );

  return {
    products: rows.map(hydrate),
    total,
  };
}

export async function stats() {
  const row = await queryOne<{
    products: number | string;
    active: number | string;
  }>(
    "SELECT COUNT(*) AS products, COALESCE(SUM(active),0) AS active FROM products",
  );
  const cats = await categories();
  return {
    products: Number(row?.products || 0),
    active: Number(row?.active || 0),
    categories: cats.length,
  };
}

export async function getImports() {
  return query<{ id: string; kind: string; created_at: string }>(
    "SELECT id, kind, created_at FROM imports ORDER BY created_at DESC LIMIT 10",
  );
}

export async function getImport(id: string) {
  return queryOne<{ result: string }>(
    "SELECT result FROM imports WHERE id=$1",
    [id],
  );
}

export async function setProductActive(id: number, active: boolean) {
  return execute("UPDATE products SET active=$1, updated_at=NOW() WHERE id=$2", [active ? 1 : 0, id]);
}

// -------------------------------------------------------------
// Excel / CSV
// -------------------------------------------------------------
export type ImportRow = {
  row: number;
  status: "new" | "duplicate" | "invalid" | "created";
  message: string;
  /** QR codes this row creates (or would create): 5 for a Complete ELB, otherwise 1. */
  qrCodes: number;
  data: Record<string, string>;
};

export type ImportResult = {
  id?: string;
  total: number;
  created: number;
  duplicates: number;
  invalid: number;
  /** QR codes created (after import) or to be created (in a preview). */
  qrCodes: number;
  rows: ImportRow[];
};

/** The Master Sheet columns, in the order the client's team maintains them. */
export const MASTER_HEADERS = [
  "Machine No.",
  "Type of Product",
  "Pedestal No.",
  "Locking No.",
  "Control Panel No.",
  "Zonal Railway",
  "Division",
  "Nearby Station",
  "Version No.",
  "Date of Supply",
  "Date of Installation",
  "Date of Commissioning",
  "Date of Warranty Expiry",
  "Service Record",
] as const;

/** Extra columns in exports; ignored when the file is imported again. */
const EXPORT_HEADERS = [
  "QR Code Number",
  "Under Warranty?",
  "ELB Model",
  "LC Gate No.",
  "Comments",
  "Public QR Link",
  "Status",
] as const;

/** Header names from the earlier template, still accepted on import. */
const HEADER_ALIASES: Record<string, string[]> = {
  "Machine No.": ["Machine No", "Machine Number"],
  "Type of Product": ["Product Type", "Type of ELB", "Product Name"],
  "Pedestal No.": ["Pedestal No", "Pedestal Number"],
  "Locking No.": ["Locking No", "Locking Number"],
  "Control Panel No.": ["Control Panel No", "Control Panel Number"],
  "Zonal Railway": ["Zone", "Railway Zone"],
  Division: ["District", "Division / District"],
  "Nearby Station": ["Station Details", "Station", "Near By Station"],
  "Version No.": ["Version No", "Version"],
  "Date of Supply": ["Supply Date"],
  "Date of Installation": ["Installation Date"],
  "Date of Commissioning": ["Commissioning Date"],
  "Service Record": ["Service Records", "Service History"],
  "QR Code Number": ["QR Code No.", "QR Code", "SKU"],
  "LC Gate No.": ["LC Gate No", "Gate No."],
  Comments: ["Comments / Technical Notes", "Remarks"],
};

/** Columns that are calculated or informational; a row containing only these is treated as empty. */
const COMPUTED_HEADERS = new Set(
  ["s.no", "date of warranty expiry", "under warranty?", "under warranty", "public qr link", "status", "qr code number"],
);

function pick(row: Record<string, string>, header: string): string {
  const lookup = new Map(Object.entries(row).map(([k, v]) => [k.trim().toLowerCase(), v]));
  for (const name of [header, ...(HEADER_ALIASES[header] ?? [])]) {
    const value = lookup.get(name.toLowerCase());
    if (value !== undefined && String(value).trim()) return String(value).trim();
  }
  return "";
}

function readImportRow(raw: Record<string, string>) {
  const typeCell = pick(raw, "Type of Product");
  const productType = matchProductType(typeCell);
  const data: Record<string, string> = {};
  for (const h of [...MASTER_HEADERS, "QR Code Number", "LC Gate No.", "Comments"]) data[h] = pick(raw, h);
  return {
    data,
    qrCode: pick(raw, "QR Code Number"),
    input: {
      // Unrecognised types are passed through so validation reports them.
      product_type: productType || typeCell,
      machine_no: data["Machine No."],
      pedestal_no: data["Pedestal No."],
      locking_no: data["Locking No."],
      control_panel_no: data["Control Panel No."],
      zone: data["Zonal Railway"],
      division: data.Division,
      station_details: data["Nearby Station"],
      version_no: data["Version No."],
      date_of_supply: data["Date of Supply"],
      date_of_installation: data["Date of Installation"],
      date_of_commissioning: data["Date of Commissioning"],
      service_records: parseServiceRecords(data["Service Record"]),
      lc_gate_no: data["LC Gate No."],
      comments: data.Comments,
      elb_type: pick(raw, "ELB Model"),
    } satisfies Partial<Record<keyof ProductInput, unknown>>,
  };
}

/** Identifies a unit so the same equipment is not imported twice. */
function identityKey(p: ProductInput): { key: string; sql: string; params: unknown[] } | null {
  if (isCompleteElb(p.product_type) && p.machine_no) {
    return {
      key: `elb|${key(p.machine_no)}`,
      sql: "SELECT id FROM products WHERE elb_type<>'' AND LOWER(machine_no)=$1 LIMIT 1",
      params: [key(p.machine_no)],
    };
  }
  if (isComponentType(p.product_type)) {
    const field = COMPONENT_NUMBER_FIELD[p.product_type];
    const number = p[field];
    if (!number) return null;
    return {
      key: `${p.product_type}|${key(number)}`,
      sql: `SELECT id FROM products WHERE product_type=$1 AND LOWER(${field})=$2 LIMIT 1`,
      params: [p.product_type, key(number)],
    };
  }
  return null;
}

export async function parseSpreadsheetData(
  input: string | Buffer,
  isBinary = false,
): Promise<Record<string, string>[]> {
  if (isBinary || Buffer.isBuffer(input)) {
    const buf = Buffer.isBuffer(input) ? input : Buffer.from(input, "base64");
    const wb = xlsx.read(buf, { type: "buffer" });
    const sheetName = wb.SheetNames.find((n) => n.trim().toLowerCase() === "master sheet") ?? wb.SheetNames[0];
    const rawRows = xlsx.utils.sheet_to_json<unknown[]>(wb.Sheets[sheetName], { header: 1, defval: "" });
    if (!rawRows.length) return [];

    // The header row may follow a few hint rows.
    let headerRowIndex = 0;
    for (let i = 0; i < Math.min(10, rawRows.length); i++) {
      const rowText = (rawRows[i] || []).map((c) => String(c).trim().toLowerCase()).join("|");
      if (
        ["machine no", "type of product", "zonal railway", "qr code", "category name"].some((h) =>
          rowText.includes(h),
        )
      ) {
        headerRowIndex = i;
        break;
      }
    }

    const headers = (rawRows[headerRowIndex] || []).map((h) => String(h).trim());
    const dataRows: Record<string, string>[] = [];
    for (let i = headerRowIndex + 1; i < rawRows.length; i++) {
      const row = rawRows[i];
      if (!row || row.length === 0) continue;
      const rowObj: Record<string, string> = {};
      let hasData = false;
      headers.forEach((h, colIdx) => {
        if (!h) return;
        const val = String(row[colIdx] ?? "").trim();
        rowObj[h] = val;
        if (val && !COMPUTED_HEADERS.has(h.toLowerCase())) hasData = true;
      });
      if (hasData) dataRows.push(rowObj);
    }
    return dataRows;
  }

  const csvText = typeof input === "string" ? input : String(input);
  const parsed = Papa.parse<Record<string, string>>(csvText.replace(/^﻿/, ""), {
    header: true,
    delimiter: ",",
    skipEmptyLines: "greedy",
    transformHeader: (h) => h.trim(),
  });
  return parsed.data;
}

export async function importSpreadsheet(
  input: string | Buffer,
  kind: string,
  commit = false,
  isBinary = false,
): Promise<ImportResult> {
  if (!["products", "categories"].includes(kind))
    throw new Error("Choose products or categories.");

  const rawData = await parseSpreadsheetData(input, isBinary);
  if (rawData.length === 0) throw new Error("No valid data rows found in the uploaded file.");
  if (rawData.length > 5000) throw new Error("Import at most 5,000 rows per file.");

  const headers = Object.keys(rawData[0] || {}).map((k) => k.trim().toLowerCase());
  if (kind === "categories") {
    if (!headers.includes("category name")) throw new Error("Required headers: Category Name.");
  } else {
    const known = MASTER_HEADERS.flatMap((h) => [h, ...(HEADER_ALIASES[h] ?? [])]).map((h) => h.toLowerCase());
    if (!headers.some((h) => known.includes(h)))
      throw new Error(`Use the Excel template. Expected columns: ${MASTER_HEADERS.join(", ")}.`);
  }

  const seen = new Set<string>();
  const rows: ImportRow[] = [];

  for (let index = 0; index < rawData.length; index++) {
    const rawRow = rawData[index];
    const row: ImportRow = { row: index + 1, status: "new", message: "Ready to import", qrCodes: 0, data: rawRow };

    try {
      if (kind === "categories") {
        const name = String(rawRow["Category Name"] || "").trim();
        if (!name || name.length > 120) throw new Error("Category name must contain 1–120 characters.");
        const identity = key(name);
        const existing = await queryOne<{ id: string }>("SELECT id FROM categories WHERE name_key=$1", [identity]);
        if (seen.has(identity) || existing) {
          row.status = "duplicate";
          row.message = "Already exists; skipped.";
        } else {
          seen.add(identity);
          if (commit) {
            await saveCategory(name);
            row.status = "created";
            row.message = "Added successfully.";
          }
        }
        rows.push(row);
        continue;
      }

      const parsed = readImportRow(rawRow);
      row.data = parsed.data;

      // Re-importing an export: rows that already carry a registered QR Code Number are skipped.
      if (parsed.qrCode) {
        const existing = await queryOne<{ id: number }>("SELECT id FROM products WHERE sku_key=$1", [key(parsed.qrCode)]);
        if (existing) {
          row.status = "duplicate";
          row.message = "QR Code Number already registered; skipped.";
          rows.push(row);
          continue;
        }
      }

      const product = await validateProduct(parsed.input);
      const records = expandRecords(product);
      const identity = identityKey(product);
      if (identity) {
        const existing = await queryOne<{ id: number }>(identity.sql, identity.params);
        if (seen.has(identity.key) || existing) {
          row.status = "duplicate";
          row.message = isCompleteElb(product.product_type)
            ? `Machine No. ${product.machine_no} is already registered; skipped.`
            : "This unit number is already registered; skipped.";
          rows.push(row);
          continue;
        }
        seen.add(identity.key);
      }

      row.qrCodes = records.length;
      row.message = records.length > 1 ? `Ready: creates ${records.length} QR codes` : "Ready to import";
      if (commit) {
        for (const record of records) await insertRecord(record);
        row.status = "created";
        row.message = records.length > 1 ? `Added: ${records.length} QR codes created` : "Added successfully.";
      }
    } catch (e) {
      row.status = "invalid";
      row.qrCodes = 0;
      row.message = e instanceof Error ? e.message : "Invalid row.";
    }
    rows.push(row);
  }

  const result: ImportResult = {
    total: rows.length,
    created: rows.filter((r) => r.status === "created").length,
    duplicates: rows.filter((r) => r.status === "duplicate").length,
    invalid: rows.filter((r) => r.status === "invalid").length,
    qrCodes: rows.reduce((sum, r) => sum + (r.status === "invalid" || r.status === "duplicate" ? 0 : r.qrCodes), 0),
    rows,
  };

  if (commit) {
    result.id = randomUUID();
    await execute("INSERT INTO imports (id, kind, result) VALUES ($1, $2, $3)", [
      result.id,
      kind,
      JSON.stringify(result),
    ]);
  }
  return result;
}

export async function importCsv(csv: string, kind: string, commit = false): Promise<ImportResult> {
  return importSpreadsheet(csv, kind, commit, false);
}

/** One export row in Master Sheet order followed by the export-only columns. */
function exportRow(p: Product, origin: string): string[] {
  return [
    p.machine_no,
    p.product_type || p.elb_type,
    p.pedestal_no,
    p.locking_no,
    p.control_panel_no,
    p.zone,
    p.division,
    p.station_details,
    p.version_no,
    p.date_of_supply,
    p.date_of_installation,
    p.date_of_commissioning,
    p.date_of_warranty_expiry,
    formatServiceRecords(p.service_records),
    p.sku,
    p.under_warranty,
    p.product_type ? p.elb_type : "",
    p.lc_gate_no,
    formatNotes(p.technical_notes),
    `${origin}/p/${p.public_id}`,
    p.active ? "Active" : "Inactive",
  ];
}

export async function exportCsv(kind: string, origin: string): Promise<string> {
  if (kind === "categories") {
    const cats = await categories();
    return Papa.unparse({ fields: ["Category Name"], data: cats.map((c) => [c.name]) }, { escapeFormulae: true });
  }
  const products = (await query(`${select} ORDER BY p.id`)).map(hydrate);
  return Papa.unparse(
    { fields: [...MASTER_HEADERS, ...EXPORT_HEADERS], data: products.map((p) => exportRow(p, origin)) },
    { escapeFormulae: true },
  );
}

export async function exportXlsx(kind: string, origin: string): Promise<Buffer> {
  if (kind === "categories") {
    const cats = await categories();
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, xlsx.utils.aoa_to_sheet([["Category Name"], ...cats.map((c) => [c.name])]), "Categories");
    return xlsx.write(wb, { type: "buffer", bookType: "xlsx" });
  }
  const products = (await query(`${select} ORDER BY p.id`)).map(hydrate);
  return buildMasterWorkbook(products, origin);
}

export async function template(kind: string, format = "xlsx"): Promise<string | Buffer> {
  if (kind === "categories") return Papa.unparse([["Category Name"]]);
  if (format === "xlsx") return buildMasterWorkbook([], "");
  return Papa.unparse([[...MASTER_HEADERS]]);
}

// -------------------------------------------------------------
// Master Sheet workbook (template and export)
// -------------------------------------------------------------
const DATE_FORMAT = "dd-mm-yyyy";
const toExcelDate = (value: string) => (isValidIsoDate(value) ? new Date(`${value}T00:00:00Z`) : null);

/**
 * Builds the Master Sheet with dropdowns for Type of Product, Zonal Railway and
 * Division (Division lists only the divisions of the chosen zone), date checks
 * on the date columns, and a formula for the warranty expiry.
 */
async function buildMasterWorkbook(products: Product[], origin: string): Promise<Buffer> {
  const exporting = products.length > 0 || Boolean(origin);
  const headers: string[] = exporting ? [...MASTER_HEADERS, ...EXPORT_HEADERS] : [...MASTER_HEADERS];
  const lastRow = Math.max(1000, products.length + 500) + 1;

  const wb = new ExcelJS.Workbook();
  wb.creator = "GLOBAL Railway Product Registry";
  const ws = wb.addWorksheet("Master Sheet", { views: [{ state: "frozen", ySplit: 1 }] });
  const help = wb.addWorksheet("Instructions");
  const lists = wb.addWorksheet("Lists", { state: "veryHidden" });

  // --- Hidden lists used by the dropdowns ---
  lists.getCell("A1").value = "Type of Product";
  PRODUCT_TYPES.forEach((t, i) => (lists.getCell(i + 2, 1).value = t));
  lists.getCell("B1").value = "Zonal Railway";
  lists.getCell("C1").value = "Division list";
  RAILWAY_ZONES.forEach((z, i) => {
    const name = `DIV_${z.code.toUpperCase()}`;
    const column = lists.getColumn(i + 5);
    lists.getCell(i + 2, 2).value = z.zone;
    lists.getCell(i + 2, 3).value = name;
    column.header = z.code;
    z.divisions.forEach((d, j) => (lists.getCell(j + 2, i + 5).value = d));
    wb.definedNames.add(`'Lists'!$${column.letter}$2:$${column.letter}$${z.divisions.length + 1}`, name);
  });
  const typeRange = `'Lists'!$A$2:$A$${PRODUCT_TYPES.length + 1}`;
  const zoneRange = `'Lists'!$B$2:$B$${RAILWAY_ZONES.length + 1}`;
  const zoneMap = `'Lists'!$B$2:$C$${RAILWAY_ZONES.length + 1}`;

  // --- Columns ---
  const widths: Record<string, number> = {
    "Type of Product": 36,
    "Zonal Railway": 34,
    Division: 24,
    "Nearby Station": 24,
    "Service Record": 48,
    "QR Code Number": 20,
    "ELB Model": 34,
    Comments: 36,
    "Public QR Link": 60,
  };
  ws.columns = headers.map((h) => ({ header: h, key: h, width: widths[h] ?? 18 }));
  const col = (h: string) => ws.getColumn(headers.indexOf(h) + 1).letter;
  const [supply, installation, expiry] = [col("Date of Supply"), col("Date of Installation"), col("Date of Warranty Expiry")];

  const header = ws.getRow(1);
  header.height = 30;
  header.eachCell((cell) => {
    const computed = cell.value === "Date of Warranty Expiry" || cell.value === "Under Warranty?";
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: computed ? "FF6B7280" : "FF111827" } };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  });
  for (const h of ["Machine No.", "Pedestal No.", "Locking No.", "Control Panel No.", "Version No.", "QR Code Number"]) {
    if (headers.includes(h)) ws.getColumn(col(h)).numFmt = "@";
  }
  for (const h of ["Date of Supply", "Date of Installation", "Date of Commissioning", "Date of Warranty Expiry"]) {
    ws.getColumn(col(h)).numFmt = DATE_FORMAT;
  }
  ws.getColumn(col("Service Record")).alignment = { wrapText: true, vertical: "top" };

  // --- Data rows (export) ---
  products.forEach((p, i) => {
    const values = exportRow(p, origin);
    const row = ws.getRow(i + 2);
    headers.forEach((h, c) => {
      const v = values[c];
      row.getCell(c + 1).value = h.startsWith("Date of") && h !== "Date of Warranty Expiry" ? toExcelDate(v) : v || null;
    });
  });

  // --- Formulas, dropdowns and date checks for every usable row ---
  const range = (h: string) => `${col(h)}2:${col(h)}${lastRow}`;
  for (let r = 2; r <= lastRow; r++) {
    const p = products[r - 2];
    const expiryDate = p ? toExcelDate(p.date_of_warranty_expiry) : null;
    const cell = ws.getCell(`${expiry}${r}`);
    cell.value = {
      formula: `IF(AND(${supply}${r}="",${installation}${r}=""),"",IF(${installation}${r}="",EDATE(${supply}${r},24),IF(${supply}${r}="",EDATE(${installation}${r},12),MIN(EDATE(${supply}${r},24),EDATE(${installation}${r},12)))))`,
      ...(p ? { result: expiryDate ?? "" } : {}),
    } as ExcelJS.CellFormulaValue;
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3F4F6" } };
    if (exporting && p) {
      ws.getCell(`${col("Under Warranty?")}${r}`).value = {
        formula: `IF(${expiry}${r}="","",IF(TODAY()<=${expiry}${r},"Yes","No"))`,
        result: p.under_warranty,
      } as ExcelJS.CellFormulaValue;
    }
  }

  // Range-based validations exist at runtime but are missing from exceljs's type definitions.
  const validations = (ws as unknown as {
    dataValidations: { add(range: string, validation: ExcelJS.DataValidation): void };
  }).dataValidations;
  const list = (formula: string, title: string, message: string) => ({
    type: "list" as const,
    allowBlank: true,
    formulae: [formula],
    showErrorMessage: true,
    errorStyle: "stop" as const,
    errorTitle: title,
    error: message,
  });
  validations.add(range("Type of Product"), list(typeRange, "Type of Product", "Choose a Type of Product from the list."));
  validations.add(range("Zonal Railway"), list(zoneRange, "Zonal Railway", "Choose a Zonal Railway from the list."));
  validations.add(
    range("Division"),
    list(
      `INDIRECT(VLOOKUP($${col("Zonal Railway")}2,${zoneMap},2,FALSE))`,
      "Division",
      "Choose the Zonal Railway first, then a Division of that zone.",
    ),
  );
  for (const h of ["Date of Supply", "Date of Installation", "Date of Commissioning"]) {
    validations.add(range(h), {
      type: "date",
      operator: "greaterThan",
      allowBlank: true,
      formulae: [new Date(Date.UTC(1990, 0, 1))],
      showErrorMessage: true,
      errorTitle: h,
      error: "Enter a valid date, for example 15-01-2025.",
      showInputMessage: true,
      promptTitle: h,
      prompt: "Date as DD-MM-YYYY",
    });
  }

  // --- Instructions ---
  help.getColumn(1).width = 110;
  [
    "How to fill the Master Sheet",
    "",
    "• QR Code Numbers are generated automatically by the registry (random 16-digit numbers). Do not add them.",
    "• Choose Type of Product, Zonal Railway and Division from the dropdowns. Pick the Zonal Railway first; the Division list then shows only that zone's divisions.",
    "• A Complete ELB (any of the five ELB models) creates 5 QR codes: 1 Control Panel Unit, 2 Locking Units and 2 Pedestal Units.",
    "   For a Complete ELB, enter both Pedestal Numbers in one cell separated by a comma (e.g. PED-01, PED-02), and the same for Locking Numbers.",
    "• Pedestal Unit, Locking Unit and Control Panel Unit need only their own number.",
    "• Enter dates as DD-MM-YYYY (e.g. 15-01-2025).",
    "• Date of Warranty Expiry is calculated: 2 years from the Date of Supply or 1 year from the Date of Installation, whichever is earlier.",
    "• Service Record: one service entry per line in the cell (press Alt+Enter for a new line), e.g. 15-06-2025 - Annual maintenance done.",
    "• Every column is optional. Rows whose Machine No. or unit number is already registered are skipped.",
  ].forEach((line, i) => {
    const cell = help.getCell(i + 1, 1);
    cell.value = line;
    cell.alignment = { wrapText: true };
    if (i === 0) cell.font = { bold: true, size: 14 };
  });

  return Buffer.from(await wb.xlsx.writeBuffer());
}
