import { useState } from "react";
import { updateQualityGrade } from "./api/qualityApi";

const POLICIES = [
  { value: "system_only", label: "System only" },
  { value: "human_only", label: "Human only" },
  { value: "human_overrides", label: "Human overrides (default)" },
  { value: "weighted", label: "Weighted" },
];

const GRADES = ["A", "B", "C", "D", "E", "F"];

export default function AdminGradePanel({ item, onUpdated }) {
  const g = item.grade || {};
  const [mode, setMode] = useState(g.policy === "system_only" && !g.human ? "system" : "human");
  const [humanGrade, setHumanGrade] = useState(g.human || "");
  const [policy, setPolicy] = useState(g.policy || "human_overrides");
  const [weights, setWeights] = useState(g.weights || { system: 0.4, human: 0.6 });
  const [note, setNote] = useState(g.note || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload =
        mode === "system"
          ? { acceptSystem: true, note }
          : {
              acceptSystem: false,
              humanGrade: humanGrade || null,
              policy,
              weights: policy === "weighted" ? weights : undefined,
              note,
            };
      const updated = await updateQualityGrade(item._id, payload);
      onUpdated?.(updated);
      alert("Grade updated.");
    } catch (e) {
      console.error(e);
      alert("Failed to update grade.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card" style={{ display: "grid", gap: 12 }}>
      <h3 style={{ margin: 0 }}>Grading</h3>

      <div style={{ display: "flex", gap: 16 }}>
        <label>
          <input
            type="radio"
            name="mode"
            value="system"
            checked={mode === "system"}
            onChange={() => setMode("system")}
          />{" "}
          Use System Grade ({g.system ?? "-"})
        </label>
        <label>
          <input
            type="radio"
            name="mode"
            value="human"
            checked={mode === "human"}
            onChange={() => setMode("human")}
          />{" "}
          Manual (Human) Grade
        </label>
      </div>

      {mode === "human" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 12, alignItems: "center" }}>
            <label>Human Grade</label>
            <select value={humanGrade} onChange={(e) => setHumanGrade(e.target.value)}>
              <option value="">— Select —</option>
              {GRADES.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>

            <label>Policy</label>
            <select value={policy} onChange={(e) => setPolicy(e.target.value)}>
              {POLICIES.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>

            {policy === "weighted" && (
              <>
                <label>Weights</label>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={weights.system}
                    onChange={(e) => setWeights((w) => ({ ...w, system: Number(e.target.value) }))}
                    style={{ width: 100 }}
                    placeholder="system"
                  />
                  <span>system</span>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={weights.human}
                    onChange={(e) => setWeights((w) => ({ ...w, human: Number(e.target.value) }))}
                    style={{ width: 100 }}
                    placeholder="human"
                  />
                  <span>human</span>
                </div>
              </>
            )}
          </div>
        </>
      )}

      <div>
        <label>Note (optional)</label>
        <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save Grading"}
        </button>
      </div>

      <div style={{ fontSize: 13, color: "#6b7280" }}>
        Current: final=<b>{g.final ?? "-"}</b>, system=<b>{g.system ?? "-"}</b>, human=<b>{g.human ?? "-"}</b>, policy=<b>{g.policy ?? "-"}</b>, decidedBy=<b>{g.decidedBy ?? "-"}</b>
      </div>
    </div>
  );
}