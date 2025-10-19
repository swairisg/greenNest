import { useEffect, useState } from "react";
import "./QualityForm.css";
import { productPresets } from "../qualityControl/config/gradePresets";

const baseForm = {
  batchId: "",
  productName: "",
  variety: "",
  size: "",
  color: "",
  firmness: "",
  cracks: "",
  blemishes: "",
  freshness: "",
  weight: "",
  notes: "",
  humanGrade: "",
};

function toKey(v) {
  return (v || "").toString().trim().toLowerCase();
}

function productOptions() {
  // Build options from productPresets with human labels
  return Object.entries(productPresets).map(([key, preset]) => ({
    value: key,
    label: preset?.label || key.replace(/\./g, " "),
  }));
}

export default function QualityForm({ onSubmit, loading = false, initialData }) {
  const [form, setForm] = useState(baseForm);
  const [fields, setFields] = useState([]);

  // Initialize from initialData (edit mode) and load its preset
  useEffect(() => {
    const merged = { ...baseForm, ...(initialData || {}) };
    if (merged.freshness == null) merged.freshness = "";
    if (merged.weight == null) merged.weight = "";
    setForm(merged);

    const preset = productPresets[toKey(merged.productName)];
    setFields(preset?.fields || []);
  }, [initialData]);

  // If product already selected (create flow returning to form), ensure fields shown
  useEffect(() => {
    if (!form.productName) return;
    const preset = productPresets[toKey(form.productName)];
    setFields(preset?.fields || []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.productName]);

  function handleProductChange(e) {
    const value = e.target.value;
    setForm((f) => ({ ...f, productName: value }));
    const preset = productPresets[toKey(value)];
    setFields(preset?.fields || []);
    // Optional: clear old dynamic values when product changes
    // setForm((f) => ({
    //   ...Object.fromEntries(Object.keys(f).map(k => [k, k in baseForm ? baseForm[k] : ""])),
    //   productName: value,
    //   batchId: f.batchId, // keep batch/variety if you want
    //   variety: f.variety,
    // }));
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  function onKeyDown(e) {
    if (e.key === "Enter" && e.target.tagName !== "TEXTAREA") e.preventDefault();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    await onSubmit(form);
  }

  const options = productOptions().sort((a, b) => a.label.localeCompare(b.label));

  return (
    <form className="card" onSubmit={handleSubmit} onKeyDown={onKeyDown} style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label>Batch ID *</label>
          <input
            name="batchId"
            value={form.batchId}
            onChange={handleChange}
            placeholder="e.g., B001"
            disabled={loading}
          />
        </div>

        <div>
          <label>Product *</label>
          <select
            name="productName"
            value={form.productName}
            onChange={handleProductChange}
            disabled={loading}
          >
            <option value="">Select product</option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label>Variety *</label>
          <input
            name="variety"
            value={form.variety}
            onChange={handleChange}
            placeholder="e.g., Roma"
            disabled={loading}
          />
        </div>
      </div>

      {fields.length > 0 && (
        <div
          className="product-specific-fields"
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
        >
          {fields.map((f) => (
            <div key={f.name}>
              <label>{f.label}</label>
              {f.type === "select" ? (
                <select
                  name={f.name}
                  value={form[f.name] ?? ""}
                  onChange={handleChange}
                  disabled={loading}
                >
                  <option value="">Select {f.label}</option>
                  {f.options.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : (
                <input
                  name={f.name}
                  value={form[f.name] ?? ""}
                  onChange={handleChange}
                  disabled={loading}
                />
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label>Freshness (0–100)</label>
          <input
            type="number"
            min="0"
            max="100"
            name="freshness"
            value={form.freshness}
            onChange={handleChange}
            disabled={loading}
          />
        </div>

        <div>
          <label>Weight (kg)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            name="weight"
            value={form.weight}
            onChange={handleChange}
            disabled={loading}
          />
        </div>
      </div>

      <div>
        <label>Manual Grade (optional)</label>
        <select
          name="humanGrade"
          value={form.humanGrade}
          onChange={handleChange}
          disabled={loading}
        >
          <option value="">(none)</option>
          <option value="A">A</option><option value="B">B</option>
          <option value="C">C</option><option value="D">D</option>
          <option value="E">E</option><option value="F">F</option>
        </select>
      </div>

      <div>
        <label>Notes</label>
        <textarea
          name="notes"
          rows="3"
          value={form.notes}
          onChange={handleChange}
          disabled={loading}
        />
      </div>

      <button className="btn" disabled={loading} type="submit">
        {loading ? "Saving…" : "Save"}
      </button>
    </form>
  );
}