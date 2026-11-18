"use client";

/* Native images keep authenticated QR endpoints and uploaded image URLs intact. */
/* eslint-disable @next/next/no-img-element */

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  Category,
  ImportResult,
  Product,
  ProductInput,
  TechnicalNote,
} from "@/lib/catalog";
import {
  COMPONENT_TYPES,
  ELB_MODELS,
  PRODUCT_TYPES,
  RAILWAY_ZONES,
  type UnitNumberField,
  activeNumberFields,
  displayDate,
  divisionsForZone,
  isCompleteElb,
  todayInIndia,
  underWarranty,
  warrantyExpiry,
} from "@/lib/railway";
import Papa from "papaparse";

type Section =
  | "Dashboard"
  | "Products"
  | "Categories"
  | "Zones & Divisions"
  | "QR codes"
  | "Import / Export";

type Data = {
  products: Product[];
  total: number;
  categories: Category[];
  stats: { products: number; active: number; categories: number };
  imports: { id: string; kind: string; created_at: string }[];
};

type Editing = ProductInput & { id?: number; sku?: string };

const emptyProduct: ProductInput = {
  name: "",
  category_id: "",
  brand: "GLOBAL",
  model: "",
  description: "",
  images: [],
  manufacturing_date: "",
  website_url: "https://global-website.com",
  product_type: "",
  zone: "",
  division: "",
  station_details: "",
  elb_type: "",
  part_name: "",
  lc_gate_no: "",
  version_no: "",
  machine_no: "",
  pedestal_no: "",
  locking_no: "",
  control_panel_no: "",
  date_of_supply: "",
  date_of_installation: "",
  date_of_commissioning: "",
  date_of_warranty_expiry: "",
  under_warranty: "",
  comments: "",
  service_records: [],
  technical_notes: [],
};

/** Short warranty badge: "Under warranty", "Expired" or nothing when no dates are known. */
function WarrantyBadge({ value }: { value: string }) {
  if (!value) return <span className="muted-text">—</span>;
  return <span className={`status ${value === "Yes" ? "" : "inactive"}`}>{value === "Yes" ? "Under warranty" : "Expired"}</span>;
}

async function api(action: string, body?: unknown) {
  const response = await fetch(
    `/api/catalog/${action}`,
    body
      ? {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      : { cache: "no-store" },
  );
  const data = await response.json().catch(() => {
    throw new Error(
      "The product registry is temporarily unavailable. Please try again.",
    );
  });
  if (!response.ok)
    throw new Error(data.error || "Unable to complete this request.");
  return data;
}

function download(content: BlobPart, name: string, type = "text/csv;charset=utf-8") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function Mark() {
  return (
    <svg
      width="29"
      height="29"
      viewBox="0 0 29 29"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M2 11V2h9M18 2h9v9M27 18v9h-9M11 27H2v-9"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        d="M9 9h4v4H9zM17 9h4v4h-4zM9 17h4v4H9zM17 17h4v4h-4z"
        fill="currentColor"
      />
    </svg>
  );
}

function Icon({ name }: { name: Section }) {
  const paths: Record<Section, string> = {
    Dashboard: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
    Products: "m3 7 9-4 9 4v10l-9 4-9-4V7Zm0 0 9 4 9-4M12 11v10",
    Categories: "M3 7V4h7l3 3h8v13H3V7Z",
    "Zones & Divisions": "M4 19h16M6 15l3-8 3 5 3-3 3 6M9 7V4",
    "QR codes": "M3 3h6v6H3zM15 3h6v6h-6zM3 15h6v6H3zM15 15h3v3h3v3h-6z",
    "Import / Export": "M7 3v13m-4-4 4 4 4-4M17 21V8m-4 4 4-4 4 4",
  };
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}

export default function CatalogAdmin() {
  const [session, setSession] = useState<{
    authenticated: boolean;
    configured: boolean;
  } | null>(null);
  const [section, setSection] = useState<Section>("Dashboard");
  const [data, setData] = useState<Data | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [selected, setSelected] = useState<Product | null>(null);
  const [categoryEdit, setCategoryEdit] = useState<{
    id?: string;
    name: string;
  } | null>(null);

  // Import / Export
  const [kind, setKind] = useState("products");
  const [importFormat, setImportFormat] = useState<"csv" | "xlsx">("xlsx");
  const [csv, setCsv] = useState("");
  const [fileBase64, setFileBase64] = useState("");
  const [filename, setFilename] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const requestVersion = useRef(0);

  const load = useCallback(async () => {
    const version = ++requestVersion.current;
    setLoading(true);
    try {
      const p = new URLSearchParams({
        q: query,
        category,
        status,
        page: String(page),
      });
      const nextData = await api(`data?${p}`);
      if (version === requestVersion.current) setData(nextData);
    } catch (e) {
      if (version === requestVersion.current) {
        setError((e as Error).message);
        if ((e as Error).message === "Please sign in.")
          setSession({ authenticated: false, configured: true });
      }
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  }, [query, category, status, page]);

  useEffect(() => {
    api("session")
      .then(setSession)
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (session?.authenticated) {
      const t = setTimeout(load, 180);
      return () => clearTimeout(t);
    }
  }, [session, load]);

  async function action(work: () => Promise<void>) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await work();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function navigate(next: Section) {
    setSection(next);
    setQuery("");
    setCategory("");
    setStatus("");
    setPage(1);
    setError("");
    setNotice("");
  }

  function addProduct() {
    setError("");
    setEditing({ ...emptyProduct, images: [], service_records: [], technical_notes: [] });
  }

  // Divisions of the zone chosen in the form (the dropdown lists only these).
  const availableDivisions = useMemo(() => divisionsForZone(editing?.zone || ""), [editing?.zone]);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    action(async () => {
      await api("login", {
        email: form.get("email"),
        password: form.get("password"),
        setupToken: form.get("setupToken"),
      });
      setSession({ authenticated: true, configured: true });
      await load();
    });
  }

  /** Uploads images (up to `room` of them) and returns their URLs. */
  async function uploadFiles(files: FileList, room: number): Promise<string[]> {
    const urls: string[] = [];
    for (const file of Array.from(files).slice(0, Math.max(0, room))) {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/catalog/upload", { method: "POST", body: formData });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Image upload failed.");
      urls.push(d.url);
    }
    return urls;
  }

  async function uploadImages(files: FileList | null) {
    if (!files?.length || !editing) return;
    action(async () => {
      const urls = await uploadFiles(files, 8 - editing.images.length);
      setEditing((prev) => (prev ? { ...prev, images: [...prev.images, ...urls] } : prev));
      setNotice("Images uploaded.");
    });
  }

  function updateNote(index: number, patch: Partial<TechnicalNote>) {
    setEditing((prev) =>
      prev
        ? { ...prev, technical_notes: prev.technical_notes.map((n, i) => (i === index ? { ...n, ...patch } : n)) }
        : prev,
    );
  }

  function uploadNoteImages(index: number, files: FileList | null) {
    if (!files?.length || !editing) return;
    action(async () => {
      const urls = await uploadFiles(files, 8 - (editing.technical_notes[index]?.images.length ?? 0));
      setEditing((prev) =>
        prev
          ? {
              ...prev,
              technical_notes: prev.technical_notes.map((n, i) =>
                i === index ? { ...n, images: [...n.images, ...urls] } : n,
              ),
            }
          : prev,
      );
      setNotice("Note images uploaded.");
    });
  }

  async function saveProductForm(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing) return;
    action(async () => {
      const saved = await api("product", editing);
      setEditing(null);
      await load();
      const created = saved.ids?.length ?? 0;
      setNotice(
        editing.id
          ? "Equipment record updated."
          : created > 1
            ? `Complete ELB added: ${created} QR codes created (1 Control Panel, 2 Locking and 2 Pedestal Units).`
            : "Equipment added. Its QR code has been generated.",
      );
    });
  }

  /** Changing the Type of Product clears unit numbers that do not apply to it. */
  function changeProductType(type: string) {
    if (!editing) return;
    const active = activeNumberFields(type);
    const next: Editing = { ...editing, product_type: type };
    for (const field of ["machine_no", "pedestal_no", "locking_no", "control_panel_no"] as UnitNumberField[]) {
      // Units of a Complete ELB keep the machine number they belong to.
      if (!active.includes(field) && !(field === "machine_no" && editing.elb_type)) next[field] = "";
    }
    setEditing(next);
  }

  function unitField(field: UnitNumberField, label: string, placeholder: string, hint?: string) {
    if (!editing) return null;
    const enabled =
      activeNumberFields(editing.product_type).includes(field) ||
      (field === "machine_no" && Boolean(editing.elb_type));
    return (
      <label key={field}>
        {label}
        <input
          disabled={!enabled}
          placeholder={enabled ? placeholder : "Not used for this product"}
          value={editing[field]}
          onChange={(e) => setEditing({ ...editing, [field]: e.target.value })}
        />
        {enabled && hint && <small>{hint}</small>}
      </label>
    );
  }

  function updateServiceRecord(index: number, patch: Partial<{ date: string; details: string }>) {
    if (!editing) return;
    setEditing({
      ...editing,
      service_records: editing.service_records.map((r, i) => (i === index ? { ...r, ...patch } : r)),
    });
  }

  const feedback = (
    <>
      {error && (
        <div className="feedback error" role="alert">
          <span>{error}</span>
          <button onClick={() => setError("")} aria-label="Dismiss error">
            ×
          </button>
        </div>
      )}
      {notice && (
        <div className="feedback success" role="status">
          <span>{notice}</span>
          <button onClick={() => setNotice("")} aria-label="Dismiss message">
            ×
          </button>
        </div>
      )}
    </>
  );

  if (!session?.authenticated)
    return (
      <main className="registry login-shell">
        <div className="login-hero">
          <div className="wordmark">
            <img
              className="registry-logo"
              src="/global-logo.png"
              alt="GLOBAL"
              width={160}
              height={36}
            />
          </div>
          <div>
            <span className="eyebrow">RAILWAY PRODUCT REGISTRY</span>
            <h1>
              Indian Railways ELB.
              <br />
              One Permanent QR Link.
            </h1>
            <p>
              Manage all 19 zones, divisions, electric lifting barrier assets,
              and live scan records.
            </p>
          </div>
          <span className="login-foot">Product QR Code Management System</span>
        </div>
        <form className="login-card" onSubmit={signIn}>
          <span className="eyebrow">ADMIN ACCESS</span>
          <h2>
            {session?.configured ? "Welcome back" : "Set up your registry"}
          </h2>
          <p>
            {session?.configured
              ? "Sign in to manage products and QR codes."
              : "Create your first administrator account to get started."}
          </p>
          {feedback}
          {!session?.configured && (
            <label>
              Setup token
              <input
                name="setupToken"
                type="password"
                required
                autoComplete="off"
              />
              <small>Use ADMIN_SETUP_TOKEN from your .env.local file.</small>
            </label>
          )}
          <label>
            Email address
            <input
              name="email"
              type="email"
              required
              autoComplete="username"
              placeholder="admin@global.com"
            />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              minLength={session?.configured ? 1 : 12}
              maxLength={256}
              required
              autoComplete={
                session?.configured ? "current-password" : "new-password"
              }
            />
            {!session?.configured && <small>Use at least 12 characters.</small>}
          </label>
          <button className="primary" disabled={busy}>
            {busy
              ? "Please wait…"
              : session?.configured
                ? "Sign in →"
                : "Create admin account →"}
          </button>
        </form>
      </main>
    );

  const nav: Section[] = [
    "Dashboard",
    "Products",
    "Categories",
    "Zones & Divisions",
    "QR codes",
    "Import / Export",
  ];

  const subtitles: Record<Section, string> = {
    Dashboard: "A clear view of your railway equipment registry.",
    Products: "Manage the information behind every ELB unit scan.",
    Categories: "Organize equipment lines and component types.",
    "Zones & Divisions": `The ${RAILWAY_ZONES.length} Zonal Railways and their divisions used in every dropdown and in the Excel template.`,
    "QR codes": "Permanent links. Ready for your equipment labels.",
    "Import / Export":
      "Move your registry in and out with the Excel Master Sheet, without duplicates.",
  };

  const productTable = (recent = false) => (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Type of Product</th>
            <th>QR Code Number</th>
            <th>Zonal Railway & Division</th>
            <th>Nearby Station</th>
            <th>Warranty</th>
            <th>Status</th>
            <th>
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {(recent ? data?.products.slice(0, 5) : data?.products)?.map((p) => (
            <tr key={p.id}>
              <td>
                <button className="product-cell" onClick={() => setSelected(p)}>
                  <span className="product-thumb">
                    {p.images[0] ? (
                      <img src={p.images[0]} alt="" />
                    ) : (
                      <Icon name="Products" />
                    )}
                  </span>
                  <span>
                    <strong>{p.name}</strong>
                    <small>
                      {[
                        p.elb_type,
                        p.machine_no && `Machine ${p.machine_no}`,
                        p.pedestal_no && `Pedestal ${p.pedestal_no}`,
                        p.locking_no && `Locking ${p.locking_no}`,
                        p.control_panel_no && `Panel ${p.control_panel_no}`,
                      ]
                        .filter(Boolean)
                        .join(" · ") || p.category}
                    </small>
                  </span>
                </button>
              </td>
              <td>
                <code>{p.sku}</code>
              </td>
              <td>
                <div>
                  <strong>{p.zone || "—"}</strong>
                  <br />
                  <small style={{ color: "var(--muted)" }}>
                    {p.division ? `Div: ${p.division}` : ""}
                  </small>
                </div>
              </td>
              <td>
                <span>
                  {p.station_details || "—"}
                  {p.lc_gate_no ? ` (Gate ${p.lc_gate_no})` : ""}
                </span>
              </td>
              <td>
                <WarrantyBadge value={p.under_warranty} />
                {p.date_of_warranty_expiry && (
                  <small className="muted-text block-text">
                    {p.under_warranty === "Yes" ? "till" : "on"} {displayDate(p.date_of_warranty_expiry)}
                  </small>
                )}
              </td>
              <td>
                <span className={`status ${p.active ? "" : "inactive"}`}>
                  {p.active ? "Active" : "Inactive"}
                </span>
              </td>
              <td>
                <button className="text-button" onClick={() => setSelected(p)}>
                  View ↗
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!data?.products.length && (
        <div className="empty">
          <Icon name="Products" />
          <h3>
            {query || category || status
              ? "No matching equipment found"
              : "Your first railway equipment entry starts here"}
          </h3>
          <p>
            {query || category || status
              ? "Try another search or clear your filters."
              : "Add a product manually or upload your QR Code File.xlsx in Import / Export."}
          </p>
          {!query && !category && !status && (
            <button className="primary" onClick={addProduct}>
              ＋ Add Equipment Record
            </button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="registry admin-shell">
      <aside className="sidebar">
        <a className="wordmark" href="/admin">
          <img
            className="registry-logo"
            src="/global-logo.png"
            alt="GLOBAL"
            width={160}
            height={36}
          />
        </a>
        <div className="workspace-name">
          <span className="workspace-avatar">
            <Icon name="Products" />
          </span>
          <div>
            Railway Registry<small>Admin workspace</small>
          </div>
        </div>
        <span className="nav-caption">Workspace</span>
        <nav aria-label="Registry navigation">
          {nav.map((item) => (
            <button
              key={item}
              className={section === item ? "active" : ""}
              aria-current={section === item ? "page" : undefined}
              onClick={() => navigate(item)}
            >
              <Icon name={item} />
              {item}
              {item === "Products" && (
                <span className="nav-count">{data?.stats.products || 0}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="connected">
            <span />
            {data ? "Registry connected" : "Connecting to registry"}
          </div>
          <a href="/" target="_blank" rel="noreferrer">
            Open main website ↗
          </a>
          <button
            disabled={busy}
            onClick={() =>
              action(async () => {
                await api("logout", {});
                setData(null);
                setSession({ authenticated: false, configured: true });
              })
            }
          >
            Sign out
          </button>
        </div>
      </aside>

      <div className="admin-main">
        <header className="topbar">
          <span>
            Workspace <span className="slash">/</span> <strong>{section}</strong>
          </span>
          <div>
            <span className="admin-badge">ADMIN</span>
            <span className="avatar">A</span>
            <button
              className="text-button mobile-signout"
              disabled={busy}
              onClick={() =>
                action(async () => {
                  await api("logout", {});
                  setData(null);
                  setSession({ authenticated: false, configured: true });
                })
              }
            >
              Sign out
            </button>
          </div>
        </header>

        <main className="admin-content">
          <div className="page-heading">
            <div>
              <span className="eyebrow">PRODUCT REGISTRY</span>
              <h1>{section}</h1>
              <p>{subtitles[section]}</p>
            </div>
            <div className="heading-actions">
              {section === "Categories" ? (
                <button
                  className="primary"
                  onClick={() => setCategoryEdit({ name: "" })}
                >
                  ＋ Add category
                </button>
              ) : section === "Zones & Divisions" ? null : (
                <>
                  <button
                    className="secondary"
                    onClick={() => navigate("Import / Export")}
                  >
                    ↥ Import Excel / CSV
                  </button>
                  <button className="primary" onClick={addProduct}>
                    ＋ Add Equipment / ELB
                  </button>
                </>
              )}
            </div>
          </div>

          {feedback}

          {!data ? (
            <div className="panel empty">Loading your registry…</div>
          ) : (
            <>
              {section === "Dashboard" && (
                <>
                  <div className="stats-grid">
                    {[
                      [
                        "Total equipment",
                        data.stats.products,
                        "Registered Railway Assets",
                        "Products",
                      ],
                      [
                        "Categories",
                        data.stats.categories,
                        "Organized product groups",
                        "Categories",
                      ],
                      [
                        "Active QR Codes",
                        data.stats.products,
                        "One permanent link per asset",
                        "QR codes",
                      ],
                      [
                        "Indian Railway Zones",
                        RAILWAY_ZONES.length,
                        "Zonal Railways with their divisions",
                        "Zones & Divisions",
                      ],
                    ].map(([label, value, caption, icon]) => (
                      <div className="stat-card" key={label}>
                        <div>
                          <span>{label}</span>
                          <Icon name={icon as Section} />
                        </div>
                        <strong>{value}</strong>
                        <small>{caption}</small>
                      </div>
                    ))}
                  </div>
                  <div className="dashboard-grid">
                    <section className="panel recent-panel">
                      <div className="panel-heading">
                        <div>
                          <h2>Recently added equipment</h2>
                          <p>The latest additions to your registry</p>
                        </div>
                        <button
                          className="text-button"
                          onClick={() => navigate("Products")}
                        >
                          View all →
                        </button>
                      </div>
                      {productTable(true)}
                    </section>
                    <aside className="label-panel">
                      <h2>Product label</h2>
                      <p>
                        {data.products[0]
                          ? "Latest equipment asset"
                          : "No equipment yet"}
                      </p>
                      <div className="sample-label">
                        <div className="label-top">
                          <strong>GLOBAL</strong>
                          <span>PRODUCT LABEL</span>
                        </div>
                        {data.products[0] ? (
                          <>
                            <img
                              src={`/api/catalog/qr/${data.products[0].public_id}`}
                              alt="QR code for the latest product"
                            />
                            <strong>{data.products[0].name}</strong>
                            <code>{data.products[0].sku}</code>
                          </>
                        ) : (
                          <>
                            <div className="empty-label">
                              <Mark />
                            </div>
                            <strong>Pedestal Unit</strong>
                            <span>QR assigned on creation</span>
                          </>
                        )}
                        <div className="label-bottom">
                          SCAN FOR PRODUCT INFORMATION ↗
                        </div>
                      </div>
                      <button
                        className="label-action"
                        onClick={() =>
                          data.products[0]
                            ? setSelected(data.products[0])
                            : addProduct()
                        }
                      >
                        {data.products[0]
                          ? "View product record"
                          : "Create your first record"}{" "}
                        →
                      </button>
                      {data.products[0] && (
                        <a
                          className="label-download"
                          href={`/api/catalog/qr/${data.products[0].public_id}?download=1`}
                          download
                        >
                          Download QR PNG
                        </a>
                      )}
                    </aside>
                  </div>
                </>
              )}

              {(section === "Products" || section === "QR codes") && (
                <section className="panel">
                  <div className="filter-bar">
                    <input
                      aria-label="Search products"
                      placeholder="Search QR Code Number, Type, Machine / Pedestal / Locking / Panel No., Zone, Division, Station…"
                      value={query}
                      onChange={(e) => {
                        setQuery(e.target.value);
                        setPage(1);
                      }}
                    />
                    <select
                      aria-label="Filter by category"
                      value={category}
                      onChange={(e) => {
                        setCategory(e.target.value);
                        setPage(1);
                      }}
                    >
                      <option value="">All categories</option>
                      {data.categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <select
                      aria-label="Filter by status"
                      value={status}
                      onChange={(e) => {
                        setStatus(e.target.value);
                        setPage(1);
                      }}
                    >
                      <option value="">All statuses</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                    <span>
                      {loading ? "Updating…" : `${data.total} records`}
                    </span>
                  </div>
                  {section === "Products" ? (
                    productTable()
                  ) : (
                    <div className="qr-grid">
                      {data.products.map((p) => (
                        <article className="qr-card" key={p.id}>
                          <span
                            className={`status ${p.active ? "" : "inactive"}`}
                          >
                            {p.active ? "Active" : "Inactive"}
                          </span>
                          <img
                            src={`/api/catalog/qr/${p.public_id}`}
                            alt={`QR code for ${p.name}`}
                          />
                          <h3>{p.name}</h3>
                          <code>{p.sku}</code>
                          <small style={{ color: "var(--muted)", margin: "4px 0" }}>
                            {p.zone} {p.division ? `(${p.division})` : ""}
                          </small>
                          <div>
                            <a
                              className="secondary"
                              href={`/api/catalog/qr/${p.public_id}?download=1`}
                            >
                              PNG
                            </a>
                            <a
                              className="secondary"
                              href={`/api/catalog/qr/${p.public_id}?download=1&format=plt`}
                              title="HPGL plotter file for engravers / cutters"
                            >
                              PLT
                            </a>
                            <button
                              className="text-button"
                              onClick={() => setSelected(p)}
                            >
                              View / print
                            </button>
                          </div>
                        </article>
                      ))}
                      {!data.products.length && (
                        <div className="empty">
                          <h3>No QR codes to show</h3>
                          <p>Add equipment or adjust your filters.</p>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="pagination">
                    <span>
                      Page {page} of {Math.max(1, Math.ceil(data.total / 20))}
                    </span>
                    <div>
                      <button
                        className="secondary"
                        disabled={page === 1 || loading}
                        onClick={() => setPage((p) => p - 1)}
                      >
                        ← Previous
                      </button>
                      <button
                        className="secondary"
                        disabled={page * 20 >= data.total || loading}
                        onClick={() => setPage((p) => p + 1)}
                      >
                        Next →
                      </button>
                    </div>
                  </div>
                </section>
              )}

              {section === "Categories" && (
                <section className="panel">
                  <div className="filter-bar">
                    <input
                      aria-label="Search categories"
                      placeholder="Search categories…"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                    <span>{data.categories.length} categories</span>
                    <a
                      download
                      className="secondary"
                      href="/api/catalog/export?kind=categories&format=csv"
                    >
                      Export CSV ↧
                    </a>
                  </div>
                  <div className="table-scroll">
                    <table>
                      <thead>
                        <tr>
                          <th>Category name</th>
                          <th>Equipment count</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.categories
                          .filter((c) =>
                            c.name.toLowerCase().includes(query.toLowerCase()),
                          )
                          .map((c) => (
                            <tr key={c.id}>
                              <td>
                                <strong>{c.name}</strong>
                              </td>
                              <td>{c.count}</td>
                              <td>
                                <button
                                  className="text-button"
                                  onClick={() => setCategoryEdit(c)}
                                >
                                  Edit
                                </button>
                                <button
                                  className="text-button danger"
                                  disabled={busy || c.count > 0}
                                  title={
                                    c.count
                                      ? "Reassign products before deletion"
                                      : undefined
                                  }
                                  onClick={() => {
                                    if (
                                      window.confirm(
                                        `Delete category “${c.name}”?`,
                                      )
                                    )
                                      action(async () => {
                                        await api("delete-category", {
                                          id: c.id,
                                        });
                                        await load();
                                        setNotice("Category deleted.");
                                      });
                                  }}
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {section === "Zones & Divisions" && (
                <>
                  <section className="panel">
                    <div className="filter-bar">
                      <input
                        aria-label="Search zones and divisions"
                        placeholder="Search a zone or division…"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                      />
                      <span>
                        {RAILWAY_ZONES.length} zones ·{" "}
                        {RAILWAY_ZONES.reduce((n, z) => n + z.divisions.length, 0)} divisions
                      </span>
                    </div>
                    <div className="table-scroll">
                      <table>
                        <thead>
                          <tr>
                            <th>Zonal Railway</th>
                            <th>Code</th>
                            <th>Divisions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {RAILWAY_ZONES.filter(
                            (z) =>
                              !query ||
                              `${z.zone} ${z.code} ${z.divisions.join(" ")}`
                                .toLowerCase()
                                .includes(query.toLowerCase()),
                          ).map((z) => (
                            <tr key={z.zone}>
                              <td>
                                <strong>{z.zone}</strong>
                              </td>
                              <td>
                                <code>{z.code}</code>
                              </td>
                              <td>{z.divisions.join(", ")}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                  <section className="panel">
                    <div className="panel-heading">
                      <div>
                        <h2>Types of Product</h2>
                        <p>
                          A Complete ELB creates 5 QR codes: 1 Control Panel Unit, 2 Locking Units
                          and 2 Pedestal Units. Individual units create one QR code.
                        </p>
                      </div>
                    </div>
                    <div className="table-scroll">
                      <table>
                        <thead>
                          <tr>
                            <th>Type of Product</th>
                            <th>Numbers recorded</th>
                            <th>QR codes created</th>
                          </tr>
                        </thead>
                        <tbody>
                          {PRODUCT_TYPES.map((t) => (
                            <tr key={t}>
                              <td>
                                <strong>{t}</strong>
                                {isCompleteElb(t) && <small className="muted-text block-text">Complete ELB</small>}
                              </td>
                              <td>
                                {isCompleteElb(t)
                                  ? "Machine, Pedestal (×2), Locking (×2) and Control Panel No."
                                  : `${t.replace(" Unit", "")} No.`}
                              </td>
                              <td>{isCompleteElb(t) ? 5 : 1}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                </>
              )}

              {section === "Import / Export" && (
                <>
                  <div className="import-layout">
                    <section className="panel import-panel">
                      <span className="eyebrow">BULK IMPORT</span>
                      <h2>Upload the Master Sheet (.xlsx or .csv)</h2>
                      <p>
                        Download the Excel template: Type of Product, Zonal Railway
                        and Division are dropdowns (Division lists only the chosen
                        zone&apos;s divisions), and dates are checked as you type. Do
                        not add QR Code Numbers; the registry generates a random
                        16-digit number for every unit, and a Complete ELB gets 5.
                      </p>

                      <div style={{ display: "flex", gap: "10px", margin: "14px 0", flexWrap: "wrap" }}>
                        <a
                          className="secondary"
                          href="/api/catalog/template?kind=products&format=xlsx"
                          download="Master-Sheet-Template.xlsx"
                        >
                          ↧ Download Excel Template (.xlsx)
                        </a>
                        <a
                          className="secondary"
                          href="/api/catalog/template?kind=products&format=csv"
                          download="Master-Sheet-Template.csv"
                        >
                          ↧ Download CSV Template
                        </a>
                      </div>

                      <label className="upload-zone">
                        <span className="upload-icon">↥</span>
                        <strong>
                          {filename || "Choose Excel (.xlsx) or CSV file"}
                        </strong>
                        <span>
                          Master Sheet .xlsx or CSV · Up to 5,000 rows
                        </span>
                        <input
                          key={kind}
                          type="file"
                          accept=".xlsx,.xls,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                          onChange={(e) =>
                            action(async () => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setCsv("");
                              setFileBase64("");
                              setResult(null);
                              setFilename(file.name);

                              const isXlsx =
                                file.name.endsWith(".xlsx") ||
                                file.name.endsWith(".xls");
                              setImportFormat(isXlsx ? "xlsx" : "csv");

                              if (isXlsx) {
                                const buffer = await file.arrayBuffer();
                                const bytes = new Uint8Array(buffer);
                                let binary = "";
                                for (let i = 0; i < bytes.byteLength; i++) {
                                  binary += String.fromCharCode(bytes[i]);
                                }
                                const base64 = btoa(binary);
                                setFileBase64(base64);
                              } else {
                                const text = await file.text();
                                setCsv(text);
                              }
                            })
                          }
                        />
                      </label>

                      <button
                        className="primary"
                        disabled={(!csv && !fileBase64) || busy}
                        onClick={() =>
                          action(async () =>
                            setResult(
                              await api("import", {
                                csv,
                                fileBase64,
                                isBinary: Boolean(fileBase64),
                                kind,
                                commit: false,
                              }),
                            ),
                          )
                        }
                      >
                        {busy ? "Processing file…" : "Validate & Preview Rows →"}
                      </button>
                    </section>

                    <aside className="panel export-panel">
                      <span className="eyebrow">EXPORT DATA</span>
                      <h2>Your equipment registry, ready to download</h2>
                      <p>
                        Download the complete registry with all Railway ELB
                        columns and public QR links.
                      </p>

                      <a
                        download="Railway-Equipment-Export.xlsx"
                        className="export-option"
                        href="/api/catalog/export?kind=products&format=xlsx"
                      >
                        <Icon name="Products" />
                        <span>
                          <strong>Export Excel (.xlsx)</strong>
                          <small>Master Sheet layout with dropdowns, QR Code Numbers and warranty status</small>
                        </span>
                        <span>↧</span>
                      </a>

                      <a
                        download="Railway-Equipment-Export.csv"
                        className="export-option"
                        href="/api/catalog/export?kind=products&format=csv"
                      >
                        <Icon name="Products" />
                        <span>
                          <strong>Export CSV</strong>
                          <small>Universal CSV format</small>
                        </span>
                        <span>↧</span>
                      </a>

                      <a
                        download="Newsletter-Subscribers.csv"
                        className="export-option"
                        href="/api/newsletter?format=csv"
                      >
                        <Icon name="Import / Export" />
                        <span>
                          <strong>Newsletter subscribers (.csv)</strong>
                          <small>Emails collected by the website subscribe form</small>
                        </span>
                        <span>↧</span>
                      </a>

                      <h3>Recent imports</h3>
                      {data.imports.length ? (
                        data.imports.map((i) => (
                          <button
                            className="history-row"
                            key={i.id}
                            onClick={() =>
                              action(async () =>
                                setResult(await api(`import/${i.id}`)),
                              )
                            }
                          >
                            <span>
                              {i.kind}
                              <small>
                                {new Date(i.created_at).toLocaleString()}
                              </small>
                            </span>
                            <span>View →</span>
                          </button>
                        ))
                      ) : (
                        <p className="field-help">
                          Completed imports will appear here.
                        </p>
                      )}
                    </aside>
                  </div>

                  {result && (
                    <section className="panel results-panel">
                      <div className="panel-heading">
                        <div>
                          <h2>
                            {result.id ? "Import completed" : "Import preview"}
                          </h2>
                          <p>
                            {result.total} rows parsed ·{" "}
                            {result.id
                              ? `${result.created} rows added (${result.qrCodes ?? result.created} QR codes)`
                              : `${result.rows.filter((r) => r.status === "new").length} ready (${result.qrCodes ?? 0} QR codes)`}{" "}
                            · {result.duplicates} duplicates · {result.invalid}{" "}
                            invalid
                          </p>
                        </div>
                        <div className="heading-actions">
                          <button
                            className="secondary"
                            onClick={() =>
                              download(
                                Papa.unparse(
                                  result.rows.map((r) => ({
                                    Row: r.row,
                                    Status: r.status,
                                    Reason: r.message,
                                    ...r.data,
                                  })),
                                  { escapeFormulae: true },
                                ),
                                "import-report.csv",
                              )
                            }
                          >
                            Download report
                          </button>
                          {!result.id && (
                            <button
                              className="primary"
                              disabled={
                                busy ||
                                !result.rows.some((r) => r.status === "new")
                              }
                              onClick={() =>
                                action(async () => {
                                  setResult(
                                    await api("import", {
                                      csv,
                                      fileBase64,
                                      isBinary: Boolean(fileBase64),
                                      kind,
                                      commit: true,
                                    }),
                                  );
                                  await load();
                                  setNotice(
                                    "Import completed. Review the results below.",
                                  );
                                })
                              }
                            >
                              Import valid rows
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="table-scroll results-table">
                        <table>
                          <thead>
                            <tr>
                              <th>Row</th>
                              <th>Type of Product</th>
                              <th>Zonal Railway & Division</th>
                              <th>Nearby Station</th>
                              <th>QR codes</th>
                              <th>Status</th>
                              <th>Details</th>
                            </tr>
                          </thead>
                          <tbody>
                            {result.rows.map((r) => (
                              <tr key={r.row}>
                                <td>{r.row}</td>
                                <td>
                                  <strong>
                                    {r.data["Type of Product"] || r.data["Category Name"] || "—"}
                                  </strong>
                                  {r.data["Machine No."] && (
                                    <small className="muted-text block-text">
                                      Machine {r.data["Machine No."]}
                                    </small>
                                  )}
                                </td>
                                <td>
                                  {r.data["Zonal Railway"] || "—"}{" "}
                                  {r.data.Division ? `(${r.data.Division})` : ""}
                                </td>
                                <td>{r.data["Nearby Station"] || "—"}</td>
                                <td>{r.qrCodes || "—"}</td>
                                <td>
                                  <span
                                    className={`status ${r.status === "invalid" ? "invalid" : r.status === "duplicate" ? "inactive" : ""}`}
                                  >
                                    {r.status}
                                  </span>
                                </td>
                                <td>{r.message}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </section>
                  )}
                </>
              )}
            </>
          )}

          <footer className="admin-footer">
            <span>GLOBAL / Railway Product Registry</span>
            <span>All 19 Indian Railway Zones & Divisions Supported.</span>
          </footer>
        </main>
      </div>

      {/* Product Manual Upload / Add / Edit Modal */}
      {editing && (
        <dialog
          open
          aria-modal="true"
          className="modal-backdrop"
          aria-labelledby="edit-title"
          onKeyDown={trapFocus}
        >
          <form className="modal product-form" onSubmit={saveProductForm}>
            <div className="modal-heading">
              <div>
                <span className="eyebrow">EQUIPMENT INFORMATION</span>
                <h2 id="edit-title">
                  {editing.id ? "Edit Railway Equipment" : "Add Railway Equipment"}
                </h2>
              </div>
              <button
                type="button"
                className="close-button"
                disabled={busy}
                onClick={() => setEditing(null)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            {feedback}
            <p className="form-note">
              {editing.id
                ? "The QR Code Number and permanent public scan link of this record never change."
                : "QR Code Numbers are generated automatically as random 16-digit numbers. A Complete ELB creates 5 QR codes: 1 Control Panel Unit, 2 Locking Units and 2 Pedestal Units."}{" "}
              All fields are optional.
            </p>

            <div className="form-grid">
              {editing.id && (
                <label>
                  QR Code Number
                  <input value={editing.sku || ""} readOnly disabled />
                  <small>Generated automatically. It cannot be edited.</small>
                </label>
              )}

              {/* Type of Product (also the product title) */}
              <label className={editing.id ? "" : "full-width"}>
                Type of Product
                <select value={editing.product_type} onChange={(e) => changeProductType(e.target.value)}>
                  <option value="">Select Type of Product</option>
                  {!editing.id && (
                    <optgroup label="Complete ELB (creates 5 QR codes)">
                      {ELB_MODELS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  <optgroup label="Individual units (1 QR code)">
                    {COMPONENT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </optgroup>
                </select>
                {editing.id && editing.elb_type && <small>Part of Complete ELB: {editing.elb_type}</small>}
              </label>

              {unitField("machine_no", "Machine No.", "e.g. MCH-9921")}
              {unitField(
                "pedestal_no",
                "Pedestal No.",
                isCompleteElb(editing.product_type) ? "e.g. PED-01, PED-02" : "e.g. PED-01",
                isCompleteElb(editing.product_type) ? "Enter both Pedestal Numbers, separated by a comma." : undefined,
              )}
              {unitField(
                "locking_no",
                "Locking No.",
                isCompleteElb(editing.product_type) ? "e.g. LCK-01, LCK-02" : "e.g. LCK-01",
                isCompleteElb(editing.product_type) ? "Enter both Locking Numbers, separated by a comma." : undefined,
              )}
              {unitField("control_panel_no", "Control Panel No.", "e.g. CP-101")}

              {/* Zonal Railway */}
              <label>
                Zonal Railway
                <select
                  value={editing.zone}
                  onChange={(e) => setEditing({ ...editing, zone: e.target.value, division: "" })}
                >
                  <option value="">Select Zonal Railway</option>
                  {RAILWAY_ZONES.map((z) => (
                    <option key={z.zone} value={z.zone}>
                      {z.zone}
                    </option>
                  ))}
                </select>
              </label>

              {/* Division (only the chosen zone's divisions) */}
              <label>
                Division
                <select
                  value={editing.division}
                  disabled={!editing.zone}
                  onChange={(e) => setEditing({ ...editing, division: e.target.value })}
                >
                  <option value="">{editing.zone ? "Select Division" : "Select the Zonal Railway first"}</option>
                  {availableDivisions.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                  {editing.division && !availableDivisions.includes(editing.division) && (
                    <option value={editing.division}>{editing.division} (not in this zone)</option>
                  )}
                </select>
              </label>

              <label>
                Nearby Station
                <input
                  placeholder="e.g. Ghaziabad Junction"
                  value={editing.station_details}
                  onChange={(e) => setEditing({ ...editing, station_details: e.target.value })}
                />
              </label>

              <label>
                Version No.
                <input
                  placeholder="e.g. v2.4"
                  value={editing.version_no}
                  onChange={(e) => setEditing({ ...editing, version_no: e.target.value })}
                />
              </label>

              <label>
                Date of Supply
                <input
                  type="date"
                  value={editing.date_of_supply}
                  onChange={(e) => setEditing({ ...editing, date_of_supply: e.target.value })}
                />
              </label>

              <label>
                Date of Installation
                <input
                  type="date"
                  value={editing.date_of_installation}
                  onChange={(e) => setEditing({ ...editing, date_of_installation: e.target.value })}
                />
              </label>

              <label>
                Date of Commissioning
                <input
                  type="date"
                  value={editing.date_of_commissioning}
                  onChange={(e) => setEditing({ ...editing, date_of_commissioning: e.target.value })}
                />
              </label>

              {(() => {
                const expiry = warrantyExpiry(editing.date_of_supply, editing.date_of_installation);
                const status = underWarranty(expiry);
                return (
                  <>
                    <label>
                      Date of Warranty Expiry
                      <input readOnly disabled value={expiry ? displayDate(expiry) : "Calculated from the dates above"} />
                      <small>2 years from supply or 1 year from installation, whichever is earlier.</small>
                    </label>
                    <label>
                      Under Warranty?
                      <input readOnly disabled value={status || "—"} />
                      <small>Checked automatically against today&apos;s date.</small>
                    </label>
                  </>
                );
              })()}

              {/* Service Record: one row per service entry */}
              <fieldset className="full-width service-records">
                <legend>Service Record</legend>
                {editing.service_records.length === 0 && (
                  <p className="field-help">No service entries yet.</p>
                )}
                {editing.service_records.map((record, i) => (
                  <div className="service-row" key={i}>
                    <input
                      type="date"
                      aria-label={`Service date ${i + 1}`}
                      value={record.date}
                      onChange={(e) => updateServiceRecord(i, { date: e.target.value })}
                    />
                    <input
                      aria-label={`Service details ${i + 1}`}
                      placeholder="Work done, parts replaced, engineer…"
                      value={record.details}
                      onChange={(e) => updateServiceRecord(i, { details: e.target.value })}
                    />
                    <button
                      type="button"
                      className="text-button danger"
                      aria-label={`Remove service entry ${i + 1}`}
                      onClick={() =>
                        setEditing({
                          ...editing,
                          service_records: editing.service_records.filter((_, j) => j !== i),
                        })
                      }
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="secondary"
                  onClick={() =>
                    setEditing({
                      ...editing,
                      service_records: [...editing.service_records, { date: "", details: "" }],
                    })
                  }
                >
                  ＋ Add service entry
                </button>
              </fieldset>

              <label>
                LC Gate No.
                <input
                  placeholder="e.g. LC-42"
                  value={editing.lc_gate_no}
                  onChange={(e) => setEditing({ ...editing, lc_gate_no: e.target.value })}
                />
              </label>

              {/* Comments / Technical Notes: separate entries, each with text and images */}
              <fieldset className="full-width tech-notes">
                <legend>Comments / Technical Notes</legend>
                {editing.technical_notes.length === 0 && (
                  <p className="field-help">No notes yet. Add a note to record a comment, inspection remark or photo.</p>
                )}
                {editing.technical_notes.map((note, i) => (
                  <div className="tech-note" key={i}>
                    <div className="tech-note-head">
                      <strong>Note {i + 1}</strong>
                      <input
                        type="date"
                        aria-label={`Note ${i + 1} date`}
                        value={note.date}
                        onChange={(e) => updateNote(i, { date: e.target.value })}
                      />
                      <button
                        type="button"
                        className="text-button danger"
                        aria-label={`Remove note ${i + 1}`}
                        onClick={() =>
                          setEditing({
                            ...editing,
                            technical_notes: editing.technical_notes.filter((_, j) => j !== i),
                          })
                        }
                      >
                        Remove
                      </button>
                    </div>
                    <textarea
                      rows={3}
                      aria-label={`Note ${i + 1} text`}
                      placeholder="Comments, inspection remarks, or RDSO compliance details..."
                      value={note.text}
                      onChange={(e) => updateNote(i, { text: e.target.value })}
                    />
                    <label className="note-upload">
                      Add images to this note
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        multiple
                        disabled={busy || note.images.length >= 8}
                        onChange={(e) => {
                          uploadNoteImages(i, e.target.files);
                          e.target.value = "";
                        }}
                      />
                      <small>Up to 8 images per note. PNG, JPEG, or WebP. Maximum 5 MB each.</small>
                    </label>
                    {note.images.length > 0 && (
                      <div className="image-previews">
                        {note.images.map((src, k) => (
                          <div key={src}>
                            <img src={src} alt={`Note ${i + 1} image ${k + 1}`} />
                            <button
                              type="button"
                              aria-label={`Remove note ${i + 1} image ${k + 1}`}
                              onClick={() => updateNote(i, { images: note.images.filter((s) => s !== src) })}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  className="secondary"
                  onClick={() =>
                    setEditing({
                      ...editing,
                      technical_notes: [...editing.technical_notes, { date: todayInIndia(), text: "", images: [] }],
                    })
                  }
                >
                  ＋ Add note
                </button>
              </fieldset>

              {/* Images */}
              <div className="full-width">
                <label>
                  Equipment Images
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    multiple
                    disabled={busy}
                    onChange={(e) => uploadImages(e.target.files)}
                  />
                  <small>
                    Up to 8 images. PNG, JPEG, or WebP. Maximum 5 MB each.
                  </small>
                </label>
                <div className="image-previews">
                  {editing.images.map((src, i) => (
                    <div key={src}>
                      <img src={src} alt={`Product image ${i + 1}`} />
                      <button
                        type="button"
                        aria-label={`Remove image ${i + 1}`}
                        onClick={() =>
                          setEditing({
                            ...editing,
                            images: editing.images.filter((s) => s !== src),
                          })
                        }
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="secondary"
                disabled={busy}
                onClick={() => setEditing(null)}
              >
                Cancel
              </button>
              <button className="primary" disabled={busy}>
                {busy ? "Saving…" : "Save Equipment Record"}
              </button>
            </div>
          </form>
        </dialog>
      )}

      {/* Category Edit Dialog */}
      {categoryEdit && (
        <dialog
          open
          aria-modal="true"
          className="modal-backdrop"
          aria-labelledby="category-title"
          onKeyDown={trapFocus}
        >
          <form
            className="modal small-modal"
            onSubmit={(e) => {
              e.preventDefault();
              action(async () => {
                await api("category", categoryEdit);
                setCategoryEdit(null);
                await load();
                setNotice("Category saved.");
              });
            }}
          >
            <div className="modal-heading">
              <h2 id="category-title">
                {categoryEdit.id ? "Edit category" : "Add category"}
              </h2>
              <button
                type="button"
                className="close-button"
                disabled={busy}
                onClick={() => setCategoryEdit(null)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            {feedback}
            <label>
              Category name
              <input
                autoFocus
                required
                maxLength={120}
                value={categoryEdit.name}
                onChange={(e) =>
                  setCategoryEdit({ ...categoryEdit, name: e.target.value })
                }
              />
            </label>
            <div className="modal-actions">
              <button
                type="button"
                className="secondary"
                disabled={busy}
                onClick={() => setCategoryEdit(null)}
              >
                Cancel
              </button>
              <button className="primary" disabled={busy}>
                Save category
              </button>
            </div>
          </form>
        </dialog>
      )}

      {/* Product Detail Modal */}
      {selected && (
        <dialog
          open
          aria-modal="true"
          className="modal-backdrop"
          aria-labelledby="detail-title"
          onKeyDown={trapFocus}
        >
          <div className="modal detail-modal">
            <div className="modal-heading no-print">
              <div>
                <span className="eyebrow">EQUIPMENT RECORD</span>
                <h2 id="detail-title">{selected.name}</h2>
              </div>
              <button
                autoFocus
                className="close-button"
                disabled={busy}
                onClick={() => setSelected(null)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            {feedback}
            <div className="detail-layout">
              <div className="no-print">
                <span className={`status ${selected.active ? "" : "inactive"}`}>
                  {selected.active ? "Active" : "Inactive"}
                </span>
                <dl className="product-facts">
                  {[
                    ["QR Code Number", selected.sku],
                    ["Type of Product", selected.product_type || selected.name],
                    ["Part of Complete ELB", selected.elb_type || "—"],
                    ["Machine No.", selected.machine_no || "—"],
                    ["Pedestal No.", selected.pedestal_no || "—"],
                    ["Locking No.", selected.locking_no || "—"],
                    ["Control Panel No.", selected.control_panel_no || "—"],
                    ["Zonal Railway", selected.zone || "—"],
                    ["Division", selected.division || "—"],
                    ["Nearby Station", selected.station_details || "—"],
                    ["Version No.", selected.version_no || "—"],
                    ["LC Gate No.", selected.lc_gate_no || "—"],
                    ["Date of Supply", displayDate(selected.date_of_supply) || "—"],
                    ["Date of Installation", displayDate(selected.date_of_installation) || "—"],
                    ["Date of Commissioning", displayDate(selected.date_of_commissioning) || "—"],
                    ["Date of Warranty Expiry", displayDate(selected.date_of_warranty_expiry) || "—"],
                    ["Under Warranty?", selected.under_warranty || "—"],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <dt>{k}</dt>
                      <dd>{v}</dd>
                    </div>
                  ))}
                </dl>
                {selected.service_records.length > 0 && (
                  <div className="description">
                    <strong>Service Record</strong>
                    <ul className="service-list">
                      {selected.service_records.map((r, i) => (
                        <li key={i}>
                          {r.date && <span>{displayDate(r.date)}</span>} {r.details}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {selected.technical_notes.length > 0 && (
                  <div className="description">
                    <strong>Comments / Technical Notes</strong>
                    <ul className="service-list">
                      {selected.technical_notes.map((n, i) => (
                        <li key={i}>
                          {n.date && <span>{displayDate(n.date)}</span>} {n.text}
                          {n.images.length > 0 && (
                            <div className="image-previews">
                              {n.images.map((src) => (
                                <img src={src} key={src} alt={`Note ${i + 1}`} />
                              ))}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="image-previews">
                  {selected.images.map((src) => (
                    <img src={src} key={src} alt={selected.name} />
                  ))}
                </div>
                <div style={{ marginTop: "16px" }}>
                  <a
                    className="text-button"
                    href={`/p/${selected.public_id}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open Public QR Scan Page ↗
                  </a>
                </div>
              </div>
              <div>
                <div className="sample-label print-label">
                  <div className="label-top">
                    <strong>GLOBAL</strong>
                    <span>PRODUCT LABEL</span>
                  </div>
                  <img
                    src={`/api/catalog/qr/${selected.public_id}`}
                    alt={`QR code for ${selected.name}`}
                  />
                  <strong>{selected.name}</strong>
                  <code>{selected.sku}</code>
                  <div className="label-bottom">
                    SCAN FOR PRODUCT INFORMATION ↗
                  </div>
                </div>
                <div className="qr-actions no-print">
                  <a
                    className="secondary"
                    href={`/api/catalog/qr/${selected.public_id}?download=1`}
                  >
                    PNG ↧
                  </a>
                  <a
                    className="secondary"
                    href={`/api/catalog/qr/${selected.public_id}?download=1&format=svg`}
                  >
                    SVG ↧
                  </a>
                  <a
                    className="secondary"
                    href={`/api/catalog/qr/${selected.public_id}?download=1&format=plt`}
                    title="HPGL plotter file for engravers / cutters"
                  >
                    PLT ↧
                  </a>
                  <button className="secondary" onClick={() => window.print()}>
                    Print
                  </button>
                </div>
              </div>
            </div>
            <div className="modal-actions no-print">
              <button
                className="text-button danger"
                disabled={busy}
                onClick={() => {
                  if (
                    window.confirm(
                      selected.active
                        ? "Deactivate this equipment? Its QR page will display “Product unavailable”."
                        : "Reactivate this equipment?",
                    )
                  )
                    action(async () => {
                      await api("status", {
                        id: selected.id,
                        active: !selected.active,
                      });
                      setSelected({
                        ...selected,
                        active: selected.active ? 0 : 1,
                      });
                      await load();
                    });
                }}
              >
                {selected.active ? "Deactivate record" : "Reactivate record"}
              </button>
              <button
                className="primary"
                onClick={() => {
                  setEditing(selected);
                  setSelected(null);
                }}
              >
                Edit Equipment
              </button>
            </div>
          </div>
        </dialog>
      )}
    </div>
  );
}

function trapFocus(event: React.KeyboardEvent<HTMLDialogElement>) {
  if (event.key !== "Tab") return;
  const elements = Array.from(
    event.currentTarget.querySelectorAll<HTMLElement>(
      "button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled)",
    ),
  );
  const first = elements[0],
    last = elements[elements.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last?.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first?.focus();
  }
}
