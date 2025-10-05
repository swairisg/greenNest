import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getQuality, updateQuality } from "./api/qualityApi";
import QualityForm from "./QualityForm";

export default function QualityEdit() {
  const { id } = useParams();
  const nav = useNavigate();
  const [saving, setSaving] = useState(false);
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await getQuality(id);
        setItem(data);
      } catch (e) {
        console.error(e);
        alert("Failed to load record");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  async function onSubmit(form) {
    setSaving(true);
    try {
      await updateQuality(id, form);
      nav(`/quality/${id}`);
    } catch (e) {
      console.error(e);
      alert("Update failed");
    } finally {
      setSaving(false);
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