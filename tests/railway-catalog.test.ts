import { test, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import * as xlsx from "xlsx";

const dir = mkdtempSync(path.join(tmpdir(), "railway-test-"));
process.env.CATALOG_DATA_DIR = dir;
process.env.DATABASE_URL = "";

test("zones and divisions are mapped correctly", async () => {
  const { RAILWAY_ZONES, divisionsForZone, matchZone, matchDivision } = await import("../lib/railway");

  assert.equal(RAILWAY_ZONES.length, 19);
  assert.equal(RAILWAY_ZONES.reduce((n, z) => n + z.divisions.length, 0), 72);
  assert.deepEqual(divisionsForZone("Central Railway (CR)"), ["Mumbai", "Bhusawal", "Nagpur", "Pune", "Solapur"]);
  // South Coast Railway reorganisation.
  assert.deepEqual(divisionsForZone("South Coast Railway (SCoR)"), ["Visakhapatnam", "Vijayawada", "Guntur", "Guntakal"]);
  assert.deepEqual(divisionsForZone("South Central Railway (SCR)"), ["Secunderabad", "Hyderabad", "Nanded"]);
  assert.deepEqual(divisionsForZone("East Coast Railway (ECoR)"), ["Khurda Road", "Sambalpur", "Rayagada"]);

  // Within one zone no division repeats; across zones only genuinely shared names
  // (Lucknow: NR and NER; Nagpur: CR and SECR) appear twice.
  const seen = new Map<string, string[]>();
  for (const z of RAILWAY_ZONES) {
    assert.equal(new Set(z.divisions).size, z.divisions.length, z.zone);
    for (const d of z.divisions) seen.set(d, [...(seen.get(d) ?? []), z.code]);
  }
  const shared = [...seen].filter(([, zones]) => zones.length > 1).map(([d]) => d).sort();
  assert.deepEqual(shared, ["Lucknow", "Nagpur"]);

  assert.equal(matchZone("NR"), "Northern Railway (NR)");
  assert.equal(matchZone("northern railway"), "Northern Railway (NR)");
  assert.equal(matchZone("Metro Railway, Kolkata"), "Metro Railway Kolkata");
  assert.equal(matchZone("Atlantis Railway"), "");
  assert.equal(matchDivision("Northern Railway (NR)", "Delhi Division"), "Delhi");
  assert.equal(matchDivision("South Western Railway (SWR)", "Bangalore"), "Bengaluru");
  assert.equal(matchDivision("Northern Railway (NR)", "Mumbai"), "");
});

test("warranty is 2 years from supply or 1 year from installation, whichever is earlier", async () => {
  const { warrantyExpiry, underWarranty, addMonths, normalizeDate } = await import("../lib/railway");

  assert.equal(warrantyExpiry("2025-01-15", "2025-03-01"), "2026-03-01"); // installation + 1y is earlier
  assert.equal(warrantyExpiry("2025-01-15", "2026-06-01"), "2027-01-15"); // supply + 2y is earlier
  assert.equal(warrantyExpiry("2025-01-15", ""), "2027-01-15");
  assert.equal(warrantyExpiry("", "2025-03-01"), "2026-03-01");
  assert.equal(warrantyExpiry("", ""), "");
  assert.equal(addMonths("2024-02-29", 12), "2025-02-28");

  assert.equal(underWarranty("2026-03-01", "2026-03-01"), "Yes");
  assert.equal(underWarranty("2026-03-01", "2026-03-02"), "No");
  assert.equal(underWarranty(""), "");

  // Excel serials, Indian day-first dates and month names.
  assert.equal(normalizeDate(45672), "2025-01-15");
  assert.equal(normalizeDate("45672"), "2025-01-15");
  assert.equal(normalizeDate("15/01/2025"), "2025-01-15");
  assert.equal(normalizeDate("15-01-2025"), "2025-01-15");
  assert.equal(normalizeDate("15.1.25"), "2025-01-15");
  assert.equal(normalizeDate("15-Jan-2025"), "2025-01-15");
  assert.equal(normalizeDate("2025-01-15"), "2025-01-15");
  assert.equal(normalizeDate(""), "");
  assert.equal(normalizeDate("31/02/2025"), null);
  assert.equal(normalizeDate("next week"), null);
});

test("registry: random QR numbers, Complete ELB sets, validation and Excel round trip", async () => {
  const { ensureDb } = await import("../lib/catalog-db");
  await ensureDb();
  const catalog = await import("../lib/catalog");
  const { db, createProducts, saveProduct, getProduct, listProducts, importSpreadsheet, template, exportXlsx, exportCsv } =
    catalog;
  after(() => {
    if (db) db.close();
    rmSync(dir, { recursive: true, force: true });
  });

  // Every field is optional.
  const [blankId] = await createProducts({});
  const blank = (await listProducts()).products.find((p) => p.id === blankId)!;
  assert.equal(blank.name, "Railway Equipment");

  // QR Code Numbers are random 16-digit numbers and cannot be supplied or edited.
  const [unitId] = await createProducts({
    product_type: "Pedestal Unit",
    sku: "MY-OWN-CODE",
    pedestal_no: "PED-77",
    zone: "NR",
    division: "Delhi Division",
    station_details: "Ghaziabad",
    date_of_supply: "15/01/2025",
    date_of_installation: "2025-03-01",
  } as never);
  let unit = (await listProducts("PED-77")).products[0];
  assert.equal(unit.id, unitId);
  assert.match(unit.sku, /^[1-9]\d{15}$/);
  assert.notEqual(unit.sku, "MY-OWN-CODE");
  assert.equal(unit.name, "Pedestal Unit");
  assert.equal(unit.zone, "Northern Railway (NR)");
  assert.equal(unit.division, "Delhi");
  assert.equal(unit.date_of_supply, "2025-01-15");
  assert.equal(unit.date_of_warranty_expiry, "2026-03-01");

  const originalQr = unit.sku;
  await saveProduct({ ...unit, sku: "1111111111111111", station_details: "Meerut" } as never, unitId);
  unit = (await getProduct(unit.public_id))!;
  assert.equal(unit.sku, originalQr, "QR Code Number never changes on edit");
  assert.equal(unit.station_details, "Meerut");
  assert.equal((await getProduct(originalQr))?.id, unitId, "lookup by QR Code Number works");

  // Comments / Technical Notes: separate entries, each with its own images.
  const img = "/api/catalog/images/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.png";
  await saveProduct(
    {
      ...unit,
      technical_notes: [
        { date: "2025-04-01", text: "Boom alignment checked", images: [img] },
        { date: "", text: "", images: [] }, // empty entries are dropped
        { date: "05/04/2025", text: "Cable gland replaced", images: [] },
      ],
    },
    unitId,
  );
  unit = (await getProduct(unit.public_id))!;
  assert.deepEqual(unit.technical_notes, [
    { date: "2025-04-01", text: "Boom alignment checked", images: [img] },
    { date: "2025-04-05", text: "Cable gland replaced", images: [] },
  ]);
  await assert.rejects(
    saveProduct({ ...unit, technical_notes: [{ date: "", text: "x", images: ["https://evil.example/a.png"] }] }, unitId),
    /up to eight uploaded images/,
  );

  // An older record's single comment appears as the first note and is not duplicated on save.
  const { execute } = await import("../lib/catalog-db");
  await execute("UPDATE products SET comments=$1 WHERE id=$2", ["Legacy remark", unitId]);
  unit = (await getProduct(unit.public_id))!;
  assert.deepEqual(unit.technical_notes.map((n) => n.text), ["Legacy remark", "Boom alignment checked", "Cable gland replaced"]);
  await saveProduct(unit, unitId);
  unit = (await getProduct(unit.public_id))!;
  assert.equal(unit.comments, "");
  assert.deepEqual(unit.technical_notes.map((n) => n.text), ["Legacy remark", "Boom alignment checked", "Cable gland replaced"]);

  // Validation of the dropdown values and dates.
  await assert.rejects(createProducts({ zone: "Atlantis" }), /Unknown Zonal Railway/);
  await assert.rejects(createProducts({ zone: "Northern Railway (NR)", division: "Mumbai" }), /does not belong/);
  await assert.rejects(createProducts({ product_type: "Boom Arm" }), /Unknown Type of Product/);
  await assert.rejects(createProducts({ date_of_supply: "31/02/2025" }), /not a valid date/);

  // A Complete ELB creates 5 QR codes: 1 Control Panel, 2 Locking and 2 Pedestal Units.
  const ids = await createProducts({
    product_type: "ELB 110 V AC",
    machine_no: "MCH-1",
    pedestal_no: "PED-1, PED-2",
    locking_no: "LCK-1; LCK-2",
    control_panel_no: "CP-1",
    zone: "South Coast Railway (SCoR)",
    division: "Guntur",
    date_of_installation: "2025-02-01",
    service_records: [{ date: "2025-06-01", details: "Quarterly check" }],
  });
  assert.equal(ids.length, 5);
  const set = (await listProducts("MCH-1")).products;
  assert.equal(set.length, 5);
  assert.deepEqual(set.map((p) => p.product_type).sort(), [
    "Control Panel Unit",
    "Locking Unit",
    "Locking Unit",
    "Pedestal Unit",
    "Pedestal Unit",
  ]);
  assert.ok(set.every((p) => p.elb_type === "ELB 110 V AC" && p.machine_no === "MCH-1" && p.division === "Guntur"));
  assert.deepEqual(set.filter((p) => p.pedestal_no).map((p) => p.pedestal_no).sort(), ["PED-1", "PED-2"]);
  assert.deepEqual(set.filter((p) => p.locking_no).map((p) => p.locking_no).sort(), ["LCK-1", "LCK-2"]);
  assert.equal(set.find((p) => p.product_type === "Control Panel Unit")?.control_panel_no, "CP-1");
  assert.equal(new Set(set.map((p) => p.sku)).size, 5);
  assert.deepEqual(set[0].service_records, [{ date: "2025-06-01", details: "Quarterly check" }]);
  // Random, not sequential.
  const numbers = set.map((p) => BigInt(p.sku)).sort((a, b) => (a < b ? -1 : 1));
  assert.ok(numbers.some((n, i) => i > 0 && n - numbers[i - 1] !== BigInt(1)));
  await assert.rejects(
    createProducts({ product_type: "ELB 110 V AC", pedestal_no: "A, B, C" }),
    /at most two Pedestal Numbers/,
  );

  // Unit numbers that contain "/" (the client's format) are not split on it.
  const slashIds = await createProducts({
    product_type: "ELB 110 V AC",
    machine_no: "GD/HLB/1126/001",
    pedestal_no: "GD/HLB-PD/1126/001 , GD/HLB-PD/1126/002",
    locking_no: "GD/HLB-UL/1126/001 , GD/HLB-UL/1126/002",
    control_panel_no: "GD/HLB-CP/1126/001",
  });
  assert.equal(slashIds.length, 5);
  const slashSet = (await listProducts("GD/HLB/1126/001")).products;
  assert.deepEqual(slashSet.map((p) => p.pedestal_no).filter(Boolean).sort(), [
    "GD/HLB-PD/1126/001",
    "GD/HLB-PD/1126/002",
  ]);
  assert.deepEqual(slashSet.map((p) => p.locking_no).filter(Boolean).sort(), [
    "GD/HLB-UL/1126/001",
    "GD/HLB-UL/1126/002",
  ]);
  assert.equal(slashSet.find((p) => p.control_panel_no)?.control_panel_no, "GD/HLB-CP/1126/001");
  await assert.rejects(saveProduct({ product_type: "ELB 110 V AC" }, unitId), /only be added as a new entry/);

  // The template has dropdowns and no data rows.
  const tpl = (await template("products", "xlsx")) as Buffer;
  const tplBook = xlsx.read(tpl, { type: "buffer" });
  assert.deepEqual(tplBook.SheetNames, ["Master Sheet", "Instructions", "Lists"]);
  assert.deepEqual(xlsx.utils.sheet_to_json<string[]>(tplBook.Sheets["Master Sheet"], { header: 1 })[0], [
    ...catalog.MASTER_HEADERS,
  ]);
  await assert.rejects(importSpreadsheet(tpl, "products", false, true), /No valid data rows/);

  // Import: Excel dates as serial numbers and text, a Complete ELB row, duplicates and invalid rows.
  const sheet = xlsx.utils.aoa_to_sheet([
    [...catalog.MASTER_HEADERS],
    ["MCH-2", "ELB 24 V DC With Hand Generator", "P-21, P-22", "L-21, L-22", "C-21", "Central Railway (CR)", "Pune", "Lonavala", "v2", 45672, "15/02/2025", "", "", "10-03-2025 - Installed and tested\nGeneral check"],
    ["", "Locking Unit", "", "L-99", "", "WR", "Vadodara", "", "", "2025-01-15", "", "", "", ""],
    ["", "Locking Unit", "", "L-99", "", "WR", "Vadodara", "", "", "", "", "", "", ""],
    ["MCH-1", "ELB 110 V AC", "", "", "", "", "", "", "", "", "", "", "", ""],
    ["", "Control Panel Unit", "", "", "C-5", "Northern Railway (NR)", "Pune", "", "", "", "", "", "", ""],
    ["", "Control Panel Unit", "", "", "C-6", "", "", "", "", "32/13/2025", "", "", "", ""],
  ]);
  const book = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(book, sheet, "Master Sheet");
  const file = xlsx.write(book, { type: "buffer", bookType: "xlsx" }) as Buffer;

  const preview = await importSpreadsheet(file, "products", false, true);
  assert.deepEqual(preview.rows.map((r) => r.status), ["new", "new", "duplicate", "duplicate", "invalid", "invalid"]);
  assert.equal(preview.qrCodes, 6);
  assert.match(preview.rows[4].message, /does not belong/);
  assert.match(preview.rows[5].message, /not a valid date/);

  const before = (await listProducts()).total;
  const imported = await importSpreadsheet(file, "products", true, true);
  assert.equal(imported.created, 2);
  assert.equal(imported.qrCodes, 6);
  assert.equal((await listProducts()).total, before + 6);
  const elb2 = (await listProducts("MCH-2")).products;
  assert.equal(elb2.length, 5);
  assert.equal(elb2[0].date_of_supply, "2025-01-15");
  assert.equal(elb2[0].date_of_installation, "2025-02-15");
  assert.equal(elb2[0].date_of_warranty_expiry, "2026-02-15");
  assert.deepEqual(elb2[0].service_records, [
    { date: "2025-03-10", details: "Installed and tested" },
    { date: "", details: "General check" },
  ]);
  assert.ok(elb2.every((p) => /^[1-9]\d{15}$/.test(p.sku)));

  // A Comments column becomes the record's first technical note.
  await catalog.importCsv("Type of Product,Control Panel No.,Comments\nControl Panel Unit,C-77,Fitted at site", "products", true);
  const c77 = (await listProducts("C-77")).products[0];
  assert.deepEqual(c77.technical_notes, [{ date: "", text: "Fitted at site", images: [] }]);
  assert.equal(c77.comments, "");

  // Re-importing the export skips everything already registered.
  const exported = await exportXlsx("products", "http://localhost:3000");
  const again = await importSpreadsheet(exported, "products", false, true);
  assert.equal(again.rows.filter((r) => r.status === "new").length, 0);
  const csv = await exportCsv("products", "http://localhost:3000");
  assert.ok(csv.startsWith("Machine No.,Type of Product,Pedestal No.,Locking No.,Control Panel No.,Zonal Railway,Division"));
  assert.ok(csv.includes("ELB 24 V DC With Hand Generator"));
});
