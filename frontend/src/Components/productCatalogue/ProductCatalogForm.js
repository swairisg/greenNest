// src/Components/productCatalogue/ProductCatalogForm.js
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ProductsAPI, uploadToCloudinary } from "../../api";
import "./ProductCatalogAdmin.css";

const EMPTY = {
  productName: "",
  category: "",
  type: "",
  basePrice: "",
  stockQuantity: "",
  isVisible: true,
  tags: [],
  images: [],
  description: "",
};

// === Schema-enforced enums (from your Mongoose model) ====================
const ENUMS = {
  types: [
    "Flagship Section – Premium Strawberries",
    "Leafy Greens Section",
    "Vegetables Section",
    "Flowering Plants Section",
    "Special Value Packs",
    "Value-Added Products Section",
  ],
  categories: ["Organic", "Seasonal", "Premium", "Regular"],
  tags: ["Organic", "Seasonal", "Limited Edition", "Premium", "Eco-Friendly", "New Arrival"],
};

// fallbacks if /products/filters is empty; but we will still validate against ENUMS
const FALLBACK_CATEGORIES = ENUMS.categories;
const FALLBACK_TYPES = ENUMS.types;

// ============== helpers / validators (mirror your schema) ================
function toStringArray(arr = []) {
  return (arr || [])
    .map((x) => {
      if (typeof x === "string") return x;
      if (x && typeof x === "object") {
        if (x.value != null) return String(x.value);
        if (x.name != null) return String(x.name);
        if (x.code != null) return String(x.code);
        if (x.label != null) return String(x.label);
      }
      return String(x ?? "");
    })
    .map((s) => s.trim())
    .filter(Boolean);
}

const NAME_RE = /^[a-zA-Z0-9\s\-&.,()]+$/;
const IMG_URL_RE = /^(https?:\/\/)[^\s]+?\.(png|jpg|jpeg|gif|webp)(\?.*)?$/i;
const MONEY_RE = /^\d+(\.\d{1,2})?$/;

const isFiniteNum = (v) => Number.isFinite(Number(v));
const isNonNegInteger = (v) =>
  String(v).trim() !== "" && Number.isInteger(Number(v)) && Number(v) >= 0;

const LIMITS = {
  nameMin: 2,
  nameMax: 200,
  descMin: 10,
  descMax: 2000,
  priceMin: 0.01,
  priceMax: 10000,
  stockMin: 0,
  stockMax: 100000,
  imgMax: 10, // UI cap
};

function uniqueNormalized(arr = []) {
  const set = new Set();
  const out = [];
  for (const raw of arr) {
    const t = String(raw || "").trim();
    if (!t) continue;
    const key = t.toLowerCase();
    if (!set.has(key)) {
      set.add(key);
      out.push(t);
    }
  }
  return out;
}

function validate(form) {
  const errors = {};

  const pn = (form.productName || "").trim();
  if (!pn) errors.productName = "Product name is required";
  else if (pn.length < LIMITS.nameMin)
    errors.productName = `Product name must be at least ${LIMITS.nameMin} characters long`;
  else if (pn.length > LIMITS.nameMax)
    errors.productName = `Product name cannot exceed ${LIMITS.nameMax} characters`;
  else if (!NAME_RE.test(pn))
    errors.productName =
      "Product name can only contain letters, numbers, spaces, and basic punctuation (- & . , ( ))";

  const cat = (form.category || "").trim();
  const typ = (form.type || "").trim();
  if (!cat) errors.category = "Product category is required";
  else if (!ENUMS.categories.includes(cat))
    errors.category = "Category must be Organic, Seasonal, Premium, or Regular";

  if (!typ) errors.type = "Product type is required";
  else if (!ENUMS.types.includes(typ))
    errors.type = "Product type must be one of the allowed values";

  const desc = (form.description || "").trim();
  if (!desc) errors.description = "Product description is required";
  else if (desc.length < LIMITS.descMin)
    errors.description = `Description must be at least ${LIMITS.descMin} characters long`;
  else if (desc.length > LIMITS.descMax)
    errors.description = `Description cannot exceed ${LIMITS.descMax} characters`;

  const priceRaw = String(form.basePrice).trim();
  const price = Number(form.basePrice);
  if (priceRaw === "") errors.basePrice = "Base price is required";
  else if (!MONEY_RE.test(priceRaw))
    errors.basePrice = "Price must be a valid number with up to 2 decimal places";
  else if (!isFiniteNum(price) || price < LIMITS.priceMin)
    errors.basePrice = "Price must be greater than 0";
  else if (price > LIMITS.priceMax)
    errors.basePrice = `Price cannot exceed ${LIMITS.priceMax}`;

  const stockRaw = String(form.stockQuantity).trim();
  const stock = Number(form.stockQuantity);
  if (stockRaw === "") errors.stockQuantity = "Stock quantity is required";
  else if (!isNonNegInteger(stock))
    errors.stockQuantity = "Stock quantity must be an integer";
  else if (stock < LIMITS.stockMin)
    errors.stockQuantity = "Stock quantity cannot be negative";
  else if (stock > LIMITS.stockMax)
    errors.stockQuantity = `Stock quantity cannot exceed ${LIMITS.stockMax}`;

  const tags = uniqueNormalized(form.tags);
  const invalidTag = tags.find((t) => !ENUMS.tags.includes(t));
  if (invalidTag) errors.tags = `Invalid tag provided: ${invalidTag}`;

  const images = (form.images || []).map((u) => String(u || "").trim()).filter(Boolean);
  if (images.length === 0) {
    errors.images = "At least one product image is required";
  } else {
    const bad = images.find((u) => !IMG_URL_RE.test(u));
    if (bad) errors.images = "Images must be valid URLs to PNG/JPG/JPEG/GIF/WEBP";
    if (images.length > LIMITS.imgMax)
      errors.images = `Too many images (max ${LIMITS.imgMax})`;
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    normalized: {
      productName: pn,
      description: desc,
      category: cat,
      type: typ,
      tags,
      images,
      basePrice: Number(Number(price).toFixed(2)),
      stockQuantity: stock,
      isVisible: Boolean(form.isVisible),
    },
  };
}

function mapServerErrors(resData) {
  const out = {};
  const e = resData?.errors;
  if (Array.isArray(e)) {
    e.forEach((x) => {
      const k = x.path || x.field || x.key;
      const m = x.msg || x.message || String(x);
      if (k) out[k] = m;
    });
  } else if (e && typeof e === "object") {
    Object.entries(e).forEach(([k, v]) => {
      out[k] = typeof v === "string" ? v : v?.message || String(v);
    });
  }
  return out;
}

export default function ProductCatalogForm() {
  const { id } = useParams(); // "new" or actual _id
  const isEdit = Boolean(id && id !== "new");
  const nav = useNavigate();

  const [form, setForm] = useState(EMPTY);
  const [opts, setOpts] = useState({ categories: [], types: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [fieldErr, setFieldErr] = useState({});

  // chip inputs
  const [tagText, setTagText] = useState("");
  // file uploads
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState("");

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  // Load filter options + (if editing) the product
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);

        // Load filters (normalize + fallback). We still hard-validate against ENUMS.*.
        const raw = await ProductsAPI.filters().catch(() => ({}));
        const cats = toStringArray(raw?.categories);
        const tys = toStringArray(raw?.types);
        const categories = cats.length ? cats : FALLBACK_CATEGORIES;
        const types = tys.length ? tys : FALLBACK_TYPES;

        if (!alive) return;
        setOpts({ categories, types });

        if (isEdit) {
          const p = await ProductsAPI.get(id);
          const data = p?.product || p?.data || p || {};
          if (!alive) return;

          const safeCategory = ENUMS.categories.includes(data.category) ? data.category : "";
          const safeType = ENUMS.types.includes(data.type) ? data.type : "";

          setForm({
            productName: data.productName || "",
            category: safeCategory,
            type: safeType,
            basePrice: data.basePrice ?? "",
            stockQuantity: data.stockQuantity ?? "",
            isVisible: Boolean(data.isVisible ?? true),
            tags: Array.isArray(data.tags) ? uniqueNormalized(data.tags) : [],
            images: Array.isArray(data.images) ? data.images : [],
            description: data.description || "",
          });
        } else {
          setForm((prev) => ({ ...EMPTY, category: "", type: "" }));
        }
        setFieldErr({});
        setErr("");
      } catch (_e) {
        if (!alive) return;
        setErr("Failed to load form data.");
        setOpts({ categories: FALLBACK_CATEGORIES, types: FALLBACK_TYPES });
        if (!isEdit) setForm(EMPTY);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEdit]);

  // Coarse validity to toggle button (fast UX)
  const coarseValid = useMemo(() => {
    if (!form.productName?.trim()) return false;
    if (!form.category?.trim()) return false;
    if (!form.type?.trim()) return false;
    if (String(form.description || "").trim().length < LIMITS.descMin) return false;
    const price = Number(form.basePrice);
    if (!isFiniteNum(price) || price < LIMITS.priceMin) return false;
    const stock = Number(form.stockQuantity);
    if (!isNonNegInteger(stock)) return false;
    if (!form.images?.length) return false;
    return true;
  }, [form]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setFieldErr({});

    const { valid, errors, normalized } = validate(form);
    if (!valid) {
      setFieldErr(errors);
      setErr("Please fix the highlighted fields.");
      return;
    }

    const payload = {
      productName: normalized.productName,
      category: normalized.category,
      type: normalized.type,
      basePrice: normalized.basePrice,
      stockQuantity: normalized.stockQuantity,
      isVisible: normalized.isVisible,
      description: normalized.description,
      tags: normalized.tags,
      images: normalized.images,
    };

    setSaving(true);
    try {
      if (isEdit) {
        await ProductsAPI.update(id, payload);
      } else {
        await ProductsAPI.create(payload);
      }
      nav("/admin/products");
    } catch (e) {
      const status = e?.response?.status;
      const data = e?.response?.data;
      const url = e?.config?.url;
      const method = e?.config?.method?.toUpperCase?.();

      console.log("Products save error →", { method, url, status, data, raw: e });

      if (!e?.response) {
        setErr("Network error — API unreachable. Check API_BASE / CORS / server.");
      } else if (status === 404) {
        setErr(`404 Not Found — ${method} ${url}`);
      } else if (status === 405) {
        setErr(`405 Method Not Allowed — ${method} ${url} (backend route exists but method differs)`);
      } else if (status >= 500) {
        setErr(`Server error ${status} — ${data?.message || "Check backend logs"}`);
      } else {
        const mapped = mapServerErrors(data);
        if (Object.keys(mapped).length) setFieldErr(mapped);
        setErr([data?.message, data?.error].filter(Boolean).join(" — ") || `Failed to save product (${status})`);
      }
    } finally {
      setSaving(false);
    }
  };

  // ----- Cloudinary file uploads (multi) ---------------------------------
  const onPickFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setUploadErr("");
    setUploading(true);
    try {
      for (const f of files) {
        if (!/^image\/(png|jpe?g|gif|webp)$/i.test(f.type)) {
          setUploadErr("Only PNG/JPG/JPEG/GIF/WEBP allowed.");
          continue;
        }
        const { url } = await uploadToCloudinary(f);
        set({ images: [...form.images, url] });
      }
    } catch (err) {
      setUploadErr(err?.response?.data?.error?.message || err.message || "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = ""; // reset so same file can be selected again
    }
  };

  // ----- Tags helpers ----------------------------------------------------
 // const [tagText, setTagText] = useState("");
  const addTag = () => {
    const raw = tagText.trim();
    if (!raw) return;
    if (!ENUMS.tags.includes(raw)) {
      setFieldErr((fe) => ({
        ...fe,
        tags: `Invalid tag. Allowed: ${ENUMS.tags.join(", ")}`,
      }));
      return;
    }
    const next = uniqueNormalized([...form.tags, raw]);
    set({ tags: next });
    setTagText("");
    setFieldErr((fe) => ({ ...fe, tags: undefined }));
  };
  const removeTag = (t) =>
    set({ tags: form.tags.filter((x) => x.toLowerCase() !== t.toLowerCase()) });

  const removeImg = (u) => set({ images: form.images.filter((x) => x !== u) });

  if (loading) {
    return (
      <div className="gn-container">
        <div className="gn-card" style={{ padding: 24 }}>Loading…</div>
      </div>
    );
  }

  const FE = ({ name }) =>
    fieldErr?.[name] ? (
      <div className="gn-field-error" role="alert" style={{ color: "#d33", fontSize: 12, marginTop: 4 }}>
        {fieldErr[name]}
      </div>
    ) : null;

  return (
    <div className="gn-container">
      <div className="flex mb-16" style={{ justifyContent: "space-between" }}>
        <div>
          <div className="gn-title">{isEdit ? "Edit Product" : "New Product"}</div>
          <div className="gn-sub">Catalogue • Admin</div>
        </div>
        <div className="flex" style={{ gap: 8 }}>
          <Link to="/admin/products" className="gn-btn">Back</Link>
          <button className="gn-btn primary" onClick={onSubmit} disabled={!coarseValid || saving || uploading}>
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Product"}
          </button>
        </div>
      </div>

      {err ? (
        <div className="gn-card" style={{ padding: 12, borderLeft: "4px solid #f66" }}>
          {err}
        </div>
      ) : null}

      <form className="gn-card" style={{ padding: 16 }} onSubmit={onSubmit} noValidate>
        <div className="gn-row">
          <div style={{ gridColumn: "span 6" }}>
            <label className="gn-label">Product Name *</label>
            <input
              className={`gn-input ${fieldErr.productName ? "has-error" : ""}`}
              value={form.productName}
              onChange={(e) => {
                set({ productName: e.target.value });
                if (fieldErr.productName) setFieldErr((f) => ({ ...f, productName: undefined }));
              }}
              placeholder="e.g., Fresh Strawberries 250g"
              required
            />
            <FE name="productName" />
          </div>

          {/* Category (schema enum) */}
          <div style={{ gridColumn: "span 3" }}>
            <label className="gn-label">Category *</label>
            <select
              className={`gn-select ${fieldErr.category ? "has-error" : ""}`}
              value={form.category || ""}
              onChange={(e) => {
                set({ category: e.target.value });
                if (fieldErr.category) setFieldErr((f) => ({ ...f, category: undefined }));
              }}
              required
            >
              <option value="">Select…</option>
              {ENUMS.categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <FE name="category" />
          </div>

          {/* Type (schema enum) */}
          <div style={{ gridColumn: "span 3" }}>
            <label className="gn-label">Type *</label>
            <select
              className={`gn-select ${fieldErr.type ? "has-error" : ""}`}
              value={form.type || ""}
              onChange={(e) => {
                set({ type: e.target.value });
                if (fieldErr.type) setFieldErr((f) => ({ ...f, type: undefined }));
              }}
              required
            >
              <option value="">Select…</option>
              {ENUMS.types.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <FE name="type" />
          </div>

          <div style={{ gridColumn: "span 3" }}>
            <label className="gn-label">Base Price (LKR) *</label>
            <input
              type="number"
              min={LIMITS.priceMin}
              max={LIMITS.priceMax}
              step="0.01"
              className={`gn-input ${fieldErr.basePrice ? "has-error" : ""}`}
              value={form.basePrice}
              onChange={(e) => {
                set({ basePrice: e.target.value });
                if (fieldErr.basePrice) setFieldErr((f) => ({ ...f, basePrice: undefined }));
              }}
              placeholder="0.00"
              required
            />
            <FE name="basePrice" />
          </div>

          <div style={{ gridColumn: "span 3" }}>
            <label className="gn-label">Stock Quantity *</label>
            <input
              type="number"
              min={LIMITS.stockMin}
              max={LIMITS.stockMax}
              step="1"
              className={`gn-input ${fieldErr.stockQuantity ? "has-error" : ""}`}
              value={form.stockQuantity}
              onChange={(e) => {
                set({ stockQuantity: e.target.value });
                if (fieldErr.stockQuantity) setFieldErr((f) => ({ ...f, stockQuantity: undefined }));
              }}
              placeholder="0"
              required
            />
            <FE name="stockQuantity" />
          </div>

          <div style={{ gridColumn: "span 3" }}>
            <label className="gn-label">Visible</label>
            <select
              className="gn-select"
              value={String(form.isVisible)}
              onChange={(e) => set({ isVisible: e.target.value === "true" })}
            >
              <option value="true">Yes</option>
              <option value="false">No (hide from customers)</option>
            </select>
          </div>

          <div style={{ gridColumn: "span 12" }}>
            <label className="gn-label">Description *</label>
            <textarea
              className={`gn-input ${fieldErr.description ? "has-error" : ""}`}
              rows={4}
              value={form.description}
              onChange={(e) => {
                set({ description: e.target.value });
                if (fieldErr.description) setFieldErr((f) => ({ ...f, description: undefined }));
              }}
              placeholder="Short description, freshness notes, origin, etc."
              required
            />
            <FE name="description" />
          </div>

          {/* Tags (schema enum) */}
          <div style={{ gridColumn: "span 12" }}>
            <label className="gn-label">Tags (choose from allowed)</label>
            <div className="flex" style={{ gap: 8 }}>
              <input
                list="allowed-tags"
                className={`gn-input ${fieldErr.tags ? "has-error" : ""}`}
                value={tagText}
                onChange={(e) => setTagText(e.target.value)}
                placeholder={`One of: ${ENUMS.tags.join(", ")}`}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
              />
              <datalist id="allowed-tags">
                {ENUMS.tags.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
              <button type="button" className="gn-btn" onClick={addTag}>Add</button>
            </div>
            <FE name="tags" />
            <div className="flex mt-8" style={{ gap: 8, flexWrap: "wrap" }}>
              {form.tags.map((t) => (
                <span key={t} className="pill">
                  {t}
                  <button
                    type="button"
                    className="pill-x"
                    onClick={() => removeTag(t)}
                    aria-label={`remove ${t}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Images (Cloudinary uploads) */}
          <div style={{ gridColumn: "span 12" }}>
            <label className="gn-label">Images *</label>
            <div className="flex" style={{ gap: 8, alignItems: "center" }}>
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                multiple
                onChange={onPickFiles}
              />
              {uploading ? <span className="gn-sub">Uploading…</span> : null}
            </div>
            {uploadErr ? <div className="gn-field-error">{uploadErr}</div> : null}
            <FE name="images" />

            {form.images.length > 0 ? (
              <div className="gn-grid mt-12">
                {form.images.map((u) => (
                  <div key={u} className="gn-card pcard">
                    <img src={u} alt="preview" />
                    <div className="pcard-body">
                      <div className="name" style={{ fontSize: 12, wordBreak: "break-all" }}>
                        {u}
                      </div>
                      <div className="mt-8">
                        <button
                          type="button"
                          className="gn-btn danger"
                          onClick={() => removeImg(u)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="gn-sub mt-8">No images added yet.</div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex mt-24" style={{ justifyContent: "flex-end", gap: 8 }}>
          <Link to="/admin/products" className="gn-btn">Cancel</Link>
          <button className="gn-btn primary" disabled={!coarseValid || saving || uploading}>
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Product"}
          </button>
        </div>
      </form>
    </div>
  );
}
