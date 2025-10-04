import React, { useEffect, useState } from "react";
import { ProductsAPI } from "../../api";

const FALLBACK_CATEGORIES = [
  "fruit", "vegetable", "herb", "floriculture", "value-added", "processed", "nursery",
];
const FALLBACK_TYPES = [
  "fresh", "cut-flowers", "ready-to-eat", "jarred", "seedlings", "dried",
];

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

export default function ProductFilters({ value, onChange }) {
  const [opts, setOpts] = useState({ categories: [], types: [], tags: [], priceRange: {} });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const raw = await ProductsAPI.filters().catch(() => ({}));
        const categories = toStringArray(raw?.categories);
        const types = toStringArray(raw?.types);
        const tags = toStringArray(raw?.tags);

        const safe = {
          categories: categories.length ? categories : FALLBACK_CATEGORIES,
          types: types.length ? types : FALLBACK_TYPES,
          tags,
          priceRange: raw?.priceRange || {},
        };
        if (alive) setOpts(safe);
      } catch {
        if (alive) {
          setOpts({
            categories: FALLBACK_CATEGORIES,
            types: FALLBACK_TYPES,
            tags: [],
            priceRange: {},
          });
        }
      }
    })();
    return () => { alive = false; };
  }, []);

  const v = value || {};
  const set = (patch) => onChange?.({ ...v, ...patch });

  return (
    <div className="gn-card" style={{ padding: 16, marginBottom: 16 }}>
      <div className="gn-row">
        <div style={{ gridColumn: "span 6" }}>
          <label className="gn-label">Search</label>
          <input
            className="gn-input"
            value={v.search || ""}
            placeholder="Search products"
            onChange={(e) => set({ search: e.target.value, page: 1 })}
          />
        </div>

        <div style={{ gridColumn: "span 3" }}>
          <label className="gn-label">Category</label>
          <select
            className="gn-select"
            value={v.category || ""}
            onChange={(e) => set({ category: e.target.value || undefined, page: 1 })}
          >
            <option value="">All</option>
            {opts.categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div style={{ gridColumn: "span 3" }}>
          <label className="gn-label">Type</label>
          <select
            className="gn-select"
            value={v.type || ""}
            onChange={(e) => set({ type: e.target.value || undefined, page: 1 })}
          >
            <option value="">All</option>
            {opts.types.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div style={{ gridColumn: "span 3" }}>
          <label className="gn-label">Min Price</label>
          <input
            type="number"
            className="gn-input"
            value={v.minPrice || ""}
            onChange={(e) => set({ minPrice: e.target.value || undefined, page: 1 })}
          />
        </div>

        <div style={{ gridColumn: "span 3" }}>
          <label className="gn-label">Max Price</label>
          <input
            type="number"
            className="gn-input"
            value={v.maxPrice || ""}
            onChange={(e) => set({ maxPrice: e.target.value || undefined, page: 1 })}
          />
        </div>

        <div style={{ gridColumn: "span 3" }}>
          <label className="gn-label">In Stock</label>
          <select
            className="gn-select"
            value={v.inStock || ""}
            onChange={(e) => set({ inStock: e.target.value || undefined, page: 1 })}
          >
            <option value="">All</option>
            <option value="true">Yes</option>
          </select>
        </div>

        <div style={{ gridColumn: "span 3" }}>
          <label className="gn-label">Sort</label>
          <select
            className="gn-select"
            value={v.sortBy || "basePrice"}
            onChange={(e) => set({ sortBy: e.target.value })}
          >
            <option value="basePrice">Price</option>
            <option value="createdAt">Newest</option>
            <option value="productName">Name</option>
          </select>
        </div>

        <div style={{ gridColumn: "span 3" }}>
          <label className="gn-label">Order</label>
          <select
            className="gn-select"
            value={v.sortOrder || "asc"}
            onChange={(e) => set({ sortOrder: e.target.value })}
          >
            <option value="asc">Asc</option>
            <option value="desc">Desc</option>
          </select>
        </div>
      </div>
    </div>
  );
}
