import React, { useEffect, useMemo, useState } from "react";
import { ProductsAPI } from "../../api";
import "./ProductCatalogCustomer.css";
import Logo from "../../assests/logo-leaf.png";

// tiny debounce to avoid spamming the API when typing
function useDebounced(value, delay = 400) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

function Price({ value }) {
  return <span className="sc-price">LKR {Number(value).toFixed(2)}</span>;
}

function ProductCard({ p, onAdd }) {
  return (
    <div className="sc-card">
      <div className="sc-card-media">
        <img
          src={p.images?.[0] || "https://via.placeholder.com/600x400?text=No+Image"}
          alt={p.productName}
          loading="lazy"
        />
        {p.tags?.length ? (
          <div className="sc-badges">
            {p.tags.slice(0, 2).map((t) => (
              <span key={t} className="sc-badge">{t}</span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="sc-card-body">
        <div className="sc-card-title" title={p.productName}>{p.productName}</div>
        <div className="sc-card-sub">
          <span className="sc-pill">{p.category}</span>
          <span className="sc-dot">•</span>
          <span className="sc-muted">{p.type}</span>
        </div>

        <div className="sc-card-bottom">
          <Price value={p.basePrice} />
          <button
            className="sc-btn sc-btn-primary"
            disabled={p.stockQuantity <= 0}
            onClick={() => onAdd?.(p)}
            aria-label={`Add ${p.productName}`}
          >
            {p.stockQuantity > 0 ? "Add to Cart" : "Out of stock"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CatalogPage() {
  // query params aligned to your backend controller
  const [params, setParams] = useState({
    page: 1,
    limit: 12,
    sortBy: "basePrice",
    sortOrder: "asc",
    category: "",
    type: "",
    tags: [],
    minPrice: "",
    maxPrice: "",
    inStock: "false",
    search: "",
  });

  const debounced = useDebounced({
    ...params,
    // only send defined primitives
    tags: params.tags,
  });

  const [data, setData] = useState({ products: [], pagination: {} });
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ categories: [], types: [], tags: [], priceRange: {minPrice:0,maxPrice:0} });
  const [err, setErr] = useState("");

  // load filter options once
  useEffect(() => {
    (async () => {
      try {
        const f = await ProductsAPI.filters();
        setFilters({
          categories: f.categories || [],
          types: f.types || [],
          tags: f.tags || [],
          priceRange: f.priceRange || { minPrice: 0, maxPrice: 0 },
        });
      } catch {
        // soft fail; UI still works
      }
    })();
  }, []);

  // load products when params change (debounced for search)
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        // build query without empty strings
        const q = { ...debounced };
        Object.keys(q).forEach((k) => {
          const v = q[k];
          if (v === "" || (Array.isArray(v) && v.length === 0)) delete q[k];
        });
        const res = await ProductsAPI.list(q);
        if (!alive) return;
        setData(res || { products: [], pagination: {} });
      } catch (e) {
        if (!alive) return;
        setErr("Couldn’t load products. Please try again.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [JSON.stringify(debounced)]);

  const pag = data?.pagination || {};
  const totalPages = pag.totalPages || 1;

  // helpers
  const setField = (patch) => setParams((p) => ({ ...p, ...patch, page: 1 }));
  const clearFilters = () =>
    setParams((p) => ({
      ...p,
      page: 1,
      category: "",
      type: "",
      tags: [],
      minPrice: "",
      maxPrice: "",
      inStock: "false",
      search: "",
      sortBy: "basePrice",
      sortOrder: "asc",
    }));

  const onAdd = (p) => {
    alert(`Added: ${p.productName} (demo)`);
  };

  // derive min/max from server range
  const minServer = filters.priceRange?.minPrice ?? 0;
  const maxServer = filters.priceRange?.maxPrice ?? 0;

  return (
    <div className="sc-container">
      <header className="sc-header">
        <div className="sc-brand">
          <img
            className="sc-logo"
            src={Logo}
            alt="GreenNest"
            width={56}
            height={56}
            loading="eager"
            decoding="async"
          />
          <div className="sc-brand-text">
            <h1 className="sc-title">GreenNest</h1>
            <p className="sc-sub">Farm-to-table freshness from Nuwara Eliya</p>
          </div>
        </div>

        <div className="sc-toolbar-right">
          <label className="sc-select-wrap">
            <span>Sort</span>
            <select
              value={`${params.sortBy}:${params.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split(":");
                setField({ sortBy, sortOrder });
              }}
            >
              <option value="basePrice:asc">Price: Low → High</option>
              <option value="basePrice:desc">Price: High → Low</option>
              <option value="productName:asc">Name: A → Z</option>
              <option value="productName:desc">Name: Z → A</option>
              <option value="stockQuantity:desc">Stock: High → Low</option>
            </select>
          </label>

          <label className="sc-select-wrap">
            <span>Show</span>
            <select
              value={params.limit}
              onChange={(e) => setField({ limit: Number(e.target.value) })}
            >
              {[12, 24, 36, 48].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>
        </div>
      </header>

      <section className="sc-filters">
        <div className="sc-search">
          <input
            className="sc-input"
            type="search"
            placeholder="Search products…"
            value={params.search}
            onChange={(e) => setField({ search: e.target.value })}
          />
        </div>

        <label className="sc-select-wrap">
          <span>Category</span>
          <select
            value={params.category}
            onChange={(e) => setField({ category: e.target.value })}
          >
            <option value="">All</option>
            {filters.categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>

        <label className="sc-select-wrap">
          <span>Type</span>
          <select
            value={params.type}
            onChange={(e) => setField({ type: e.target.value })}
          >
            <option value="">All</option>
            {filters.types.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>

        <label className="sc-select-wrap">
          <span>In Stock</span>
          <select
            value={params.inStock}
            onChange={(e) => setField({ inStock: e.target.value })}
          >
            <option value="false">All</option>
            <option value="true">Only available</option>
          </select>
        </label>

        <div className="sc-price-range">
          <span>Price</span>
          <div className="sc-price-inputs">
            <input
              className="sc-input"
              type="number"
              min="0"
              step="0.01"
              placeholder={minServer ? String(minServer) : "Min"}
              value={params.minPrice}
              onChange={(e) => setField({ minPrice: e.target.value })}
            />
            <span className="sc-tilde">~</span>
            <input
              className="sc-input"
              type="number"
              min="0"
              step="0.01"
              placeholder={maxServer ? String(maxServer) : "Max"}
              value={params.maxPrice}
              onChange={(e) => setField({ maxPrice: e.target.value })}
            />
          </div>
        </div>

        <div className="sc-tags">
          <span>Tags</span>
          <div className="sc-tags-wrap">
            {filters.tags.slice(0, 10).map((t) => {
              const active = params.tags.includes(t);
              return (
                <button
                  key={t}
                  type="button"
                  className={`sc-chip ${active ? "active" : ""}`}
                  onClick={() => {
                    const next = active
                      ? params.tags.filter((x) => x !== t)
                      : [...params.tags, t];
                    setField({ tags: next });
                  }}
                  aria-pressed={active}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>

        <button className="sc-btn sc-btn-ghost" onClick={clearFilters}>Clear filters</button>
      </section>

      {err ? (
        <div className="sc-card sc-error">{err}</div>
      ) : null}

      {loading ? (
        <div className="sc-grid">
          {Array.from({ length: params.limit }).map((_, i) => (
            <div key={i} className="sc-card skeleton">
              <div className="sk-media" />
              <div className="sk-line" />
              <div className="sk-line short" />
              <div className="sk-footer" />
            </div>
          ))}
        </div>
      ) : data.products?.length ? (
        <div className="sc-grid">
          {data.products.map((p) => (
            <ProductCard key={p._id} p={p} onAdd={onAdd} />
          ))}
        </div>
      ) : (
        <div className="sc-empty">
          <div className="sc-empty-emoji">🍃</div>
          <div className="sc-empty-title">No products found</div>
          <div className="sc-empty-sub">Try adjusting filters or search terms.</div>
          <button className="sc-btn sc-btn-ghost" onClick={clearFilters}>Reset all filters</button>
        </div>
      )}

      <div className="sc-pagination">
        <button
          className="sc-btn sc-btn-ghost"
          disabled={!pag.hasPrev}
          onClick={() => setParams((p) => ({ ...p, page: p.page - 1 }))}
        >
          ← Prev
        </button>
        <div className="sc-page-pill">
          Page {pag.currentPage || 1} / {totalPages}
        </div>
        <button
          className="sc-btn sc-btn-ghost"
          disabled={!pag.hasNext}
          onClick={() => setParams((p) => ({ ...p, page: p.page + 1 }))}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
