import { useEffect, useState } from "react";
import "./QualityForm.css";

const initial = {
  batchId: "",
  productName: "",
  variety: "",
  size: "",
  color: "",
  freshness: 0,
  weight: 0,
  notes: "",
  grade: "A",
};

export default function QualityForm({ onSubmit, loading, initialData }) {
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) setForm({ ...initial, ...initialData });
  }, [initialData]);

  function validate() {
    const e = {};
    if (!form.batchId?.trim()) e.batchId = "batchId is required";
    if (!form.productName?.trim()) e.productName = "productName is required";
    if (!form.variety?.trim()) e.variety = "variety is required";
    if (!["A", "B", "C"].includes(form.grade)) e.grade = "grade must be A, B, or C";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleChange(e) {
    const { name, value } = e.target;
    const numeric = name === "freshness" || name === "weight";
    setForm((f) => ({ ...f, [name]: numeric ? Number(value) : value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit(form);
  }

  return (
    <form className="card" onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label>Batch ID *</label>
          <input name="batchId" value={form.batchId} onChange={handleChange} placeholder="e.g., B001" />
          {errors.batchId && <small style={{ color: "#b10000" }}>{errors.batchId}</small>}
        </div>
        <div>
          <label>Product Name *</label>
          <input name="productName" value={form.productName} onChange={handleChange} placeholder="e.g., Tomato" />
          {errors.productName && <small style={{ color: "#b10000" }}>{errors.productName}</small>}
        </div>
        <div>
          <label>Variety *</label>
          <input name="variety" value={form.variety} onChange={handleChange} placeholder="e.g., Roma" />
          {errors.variety && <small style={{ color: "#b10000" }}>{errors.variety}</small>}
        </div>
        <div>
          <label>Size</label>
          <input name="size" value={form.size} onChange={handleChange} placeholder="e.g., Large" />
        </div>
        <div>
          <label>Color</label>
          <input name="color" value={form.color} onChange={handleChange} placeholder="e.g., Bright red" />
        </div>
        <div>
          <label>Freshness (0–100)</label>
          <input type="number" min="0" max="100" name="freshness" value={form.freshness} onChange={handleChange} />
        </div>
        <div>
          <label>Weight (kg)</label>
          <input type="number" min="0" step="0.01" name="weight" value={form.weight} onChange={handleChange} />
        </div>
        <div>
          <label>Grade *</label>
          <select name="grade" value={form.grade} onChange={handleChange}>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
          </select>
          {errors.grade && <small style={{ color: "#b10000" }}>{errors.grade}</small>}
        </div>
      </div>

      <div>
        <label>Notes</label>
        <textarea name="notes" rows="3" value={form.notes} onChange={handleChange} placeholder="Optional notes..." />
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn" disabled={loading} type="submit">
          {loading ? "Saving…" : "Save"}
        </button>
        <button
          className="btn secondary"
          type="button"
          onClick={() => setForm(initialData ? { ...initial, ...initialData } : initial)}
        >
          Reset
        </button>
      </div>
    </form>
  );
}