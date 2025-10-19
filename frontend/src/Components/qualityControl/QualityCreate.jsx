import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createQuality } from "./api/qualityApi";
import QualityForm from "./QualityForm";

export default function QualityCreate() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [saving, setSaving] = useState(false);
  const alive = useRef(true);

  const next = params.get("next") || "/quality";

  useEffect(() => () => { alive.current = false; }, []);

  const toNum = (v) => {
    if (v === "" || v === null || v === undefined) return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };

  async function onSubmit(form) {
    if (saving) return;
    setSaving(true);
    try {
      const {
        batchId,
        productName,
        variety,
        size,
        color,
        freshness,
        weight,
        notes,
        humanGrade,
        ...rest
      } = form || {};

      const payload = {
        batchId: String(batchId || "").trim(),
        productName: String(productName || "").toLowerCase(),
        variety: String(variety || "").trim(),
        size: size || undefined,
        color: color || undefined,
        freshness: toNum(freshness),
        weight: toNum(weight),
        notes: notes || undefined,
        humanGrade: humanGrade || undefined,
        readings: Object.fromEntries(
          Object.entries(rest).map(([k, v]) => {
            const n = toNum(v);
            return [k, n !== undefined ? n : (typeof v === "string" ? v.trim() : v)];
          })
        ),
      };

      if (!payload.batchId || !payload.productName || !payload.variety) {
        alert("Batch ID, Product, and Variety are required.");
        return;
      }

      await createQuality(payload, "farmer");
      nav(next, { replace: true });
    } catch (e) {
      const msg = e?.response?.data?.error || e?.response?.data?.message || e?.message || "Create failed";
      if (e?.response?.status === 409) alert("Batch ID already exists. Please use a unique batchId.");
      else if (e?.response?.status === 422) alert("Grading rules not found for product/variety. Check selections.");
      else if (e?.response?.status === 400) alert(`Validation failed. ${msg}`);
      else alert(`${msg}. Check console for details.`);
      console.error("Create quality failed:", e);
    } finally {
      if (alive.current) setSaving(false);
    }
  }

  return (
    <section>
      <h2 style={{ margin: "12px 0" }}>Add Quality Record</h2>
      <QualityForm onSubmit={onSubmit} loading={saving} />
    </section>
  );
}