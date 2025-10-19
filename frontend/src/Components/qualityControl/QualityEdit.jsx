import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getQuality, updateQuality } from "./api/qualityApi";
import QualityForm from "./QualityForm";

export default function QualityEdit() {
  const { id } = useParams();
  const nav = useNavigate();
  const [saving, setSaving] = useState(false);
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    const ctrl = new AbortController();

    (async () => {
      try {
        const rec = await getQuality(id, "admin", { signal: ctrl.signal });
        if (alive.current) setItem(rec ?? null);
      } catch (e) {
        if (e?.name !== "AbortError") {
          console.error("getQuality failed:", e);
          alert(e?.response?.status === 404 ? "Record not found." : "Failed to load record.");
        }
      } finally {
        if (alive.current) setLoading(false);
      }
    })();

    return () => {
      alive.current = false;
      ctrl.abort();
    };
  }, [id]);

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
        batchId, productName, variety, size, color, freshness, weight, notes, readings,
      } = form || {};

      const payload = {
        batchId: batchId?.trim?.(),
        productName: productName ? String(productName).toLowerCase() : undefined,
        variety,
        size,
        color,
        freshness: toNum(freshness),
        weight: toNum(weight),
        notes,
        readings: readings && typeof readings === "object" ? readings : undefined,
      };

      await updateQuality(id, payload, "admin");
      nav(`/quality/${id}`, { replace: true });
    } catch (e) {
      const msg = e?.response?.data?.error || e?.response?.data?.message || e?.message || "Update failed";
      if (e?.response?.status === 422) alert("Grading rules not found for product/variety. Check fields.");
      else if (e?.response?.status === 400) alert(`Validation failed. ${msg}`);
      else if (e?.response?.status === 409) alert("Batch ID already exists. Please use a unique batchId.");
      else alert(`${msg}. See console for details.`);
      console.error("updateQuality failed:", e);
    } finally {
      if (alive.current) setSaving(false);
    }
  }

  if (loading) return <div className="card">Loading…</div>;
  if (!item) return <div className="card">Not found</div>;

  return (
    <section>
      <h2 style={{ margin: "12px 0" }}>Edit Quality Record</h2>
      <QualityForm onSubmit={onSubmit} loading={saving} initialData={item} />
    </section>
  );
}