import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createQuality } from "./api/qualityApi";
import QualityForm from "./QualityForm";

export default function QualityCreate() {
  const nav = useNavigate();
  const [saving, setSaving] = useState(false);

  async function onSubmit(form) {
    setSaving(true);
    try {
      await createQuality(form);
      nav("/quality");
    } catch (e) {
      console.error(e);
      alert("Create failed. Check console.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section>
      <h2 style={{ margin: "12px 0" }}>Add Quality Record</h2>
      <QualityForm onSubmit={onSubmit} loading={saving} />
    </section>
  );
}