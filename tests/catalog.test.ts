import { test, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { Worker } from "node:worker_threads";
import Papa from "papaparse";

const dir = mkdtempSync(path.join(tmpdir(), "catalog-test-"));
process.env.CATALOG_DATA_DIR = dir;
process.env.DATABASE_URL = "";

test("catalog identity, imports, edits, deactivation, exports, and simultaneous allocation", async () => {
  const catalog = await import("../lib/catalog");
  await (await import("../lib/catalog-db")).ensureDb();
  const {
    db,
    saveCategory,
    categories,
    saveProduct,
    listProducts,
    getProduct,
    importCsv,
    exportCsv,
    deleteCategory,
    setProductActive,
  } = catalog;

  after(() => {
    if (db) db.close();
    rmSync(dir, { recursive: true, force: true });
  });

  await saveCategory(" Smart Home ");
  await assert.rejects(
    async () => await saveCategory("smart home"),
    /already exists/,
  );

  const category = (await categories())[0];
  await saveCategory("Renamed category", category.id);
  assert.equal((await categories())[0].name, "Renamed category");
  await saveCategory("Smart Home", category.id);
  await assert.rejects(saveCategory("Missing", "missing-id"), /not found/);

  const { saveImage, getImage } = await import("../lib/catalog-images");
  const imageName = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.png";
  const imageBytes = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  await saveImage(imageName, imageBytes);
  assert.deepEqual(await getImage(imageName), imageBytes);
  assert.equal(await getImage("../../.env.local"), undefined);
  assert.equal(
    await getImage("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb.png"),
    undefined,
  );
  const input = {
    product_type: "Control Panel Unit",
    control_panel_no: "CP-001",
    category_id: category.id,
    website_url: "https://example.com/bulb",
    brand: "ABC",
  };

  const id = await saveProduct(input);
  assert.equal(id, 1);

  let p = (await listProducts()).products[0];
  assert.equal(p.serial, "PRD-000001");
  assert.match(p.sku, /^[1-9]\d{15}$/);
  const publicId = p.public_id;
  const qr = p.sku;

  await saveProduct({ ...input, control_panel_no: "CP-002" }, id);
  p = (await getProduct(publicId))!;
  assert.equal(p.control_panel_no, "CP-002");
  assert.equal(p.serial, "PRD-000001");
  assert.equal(p.sku, qr);

  await assert.rejects(
    async () => await deleteCategory(category.id),
    /Reassign/,
  );
  await assert.rejects(
    async () =>
      await saveProduct({
        ...input,
        manufacturing_date: "2026-02-30",
      }),
    /valid YYYY-MM-DD/,
  );
  await assert.rejects(
    async () =>
      await saveProduct({
        ...input,
        website_url: "javascript:alert(1)",
      }),
    /HTTP or HTTPS/,
  );

  // Master Sheet CSV import: duplicates in the file and the database are skipped.
  const csv =
    "Type of Product,Control Panel No.,Zonal Railway,Division\nControl Panel Unit,CP-002,,\nControl Panel Unit,CP-100,NR,Delhi\nControl Panel Unit,cp-100,NR,Delhi\nControl Panel Unit,CP-101,Nowhere,\nLocking Unit,,,";
  const preview = await importCsv(csv, "products");
  assert.equal(preview.total, 5);
  assert.equal(preview.created, 0);
  assert.equal(preview.duplicates, 2);
  assert.equal(preview.invalid, 1);
  assert.equal((await listProducts()).total, 1);

  const result = await importCsv(csv, "products", true);
  assert.equal(result.created, 2);
  assert.equal(result.duplicates, 2);
  assert.equal(result.invalid, 1);
  assert.ok(result.id);
  assert.equal((await listProducts()).total, 3);

  await setProductActive(id, false);
  assert.equal((await getProduct(publicId))?.active, 0);

  assert.equal(
    (
      await importCsv(
        "Category Name\nsmart home\nAccessories\nACCESSORIES",
        "categories",
        true,
      )
    ).created,
    1,
  );
  assert.equal((await categories()).length, 3);

  await assert.rejects(
    async () => await importCsv("Product Code\nX", "products"),
    /Expected columns/,
  );

  assert.equal((await listProducts("PRD-000001")).total, 1);

  const safeId = await saveProduct({
    ...input,
    product_type: "",
    name: "=SUM(1,1)",
  });
  const exported = Papa.parse<Record<string, string>>(
    await exportCsv("products", "https://registry.example"),
    { header: true },
  );
  const formula = exported.data.find((r) => r["Control Panel No."] === "CP-001" && r["Type of Product"] === "")!;
  assert.ok(formula, "record without a type is exported");
  assert.ok(exported.data.every((r) => !r["Type of Product"].startsWith("=")));
  assert.ok(formula["Public QR Link"].startsWith("https://registry.example/p/"));
  assert.ok((await listProducts("SUM")).products.some((x) => x.id === safeId));
  // Independent database connections contend for the sequence.
  const workerCode = `const {parentPort,workerData}=require('node:worker_threads'); const {DatabaseSync}=require('node:sqlite');const {randomUUID}=require('node:crypto');const db=new DatabaseSync(workerData.file);db.exec('PRAGMA busy_timeout=10000');db.exec('PRAGMA foreign_keys=ON');const ids=[];for(let i=0;i<20;i++){const sku=workerData.prefix+i;ids.push(Number(db.prepare('INSERT INTO products (public_id,name,sku,sku_key,category_id,website_url) VALUES (?,?,?,?,?,?)').run(randomUUID(),sku,sku,sku,workerData.category,'https://example.com').lastInsertRowid));}db.close();parentPort.postMessage(ids);`;
  const work = (prefix: string) =>
    new Promise<number[]>((resolve, reject) => {
      const worker = new Worker(workerCode, {
        eval: true,
        workerData: {
          file: path.join(dir, "catalog.sqlite"),
          category: category.id,
          prefix,
        },
      });
      worker.once("message", resolve);
      worker.once("error", reject);
    });
  const ids = (await Promise.all([work("A-"), work("B-")])).flat();
  assert.equal(new Set(ids).size, 40);
  assert.ok(ids.every((n) => n > safeId));
});
