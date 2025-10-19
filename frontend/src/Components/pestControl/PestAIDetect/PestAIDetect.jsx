import React, { useEffect, useRef, useState } from "react";
import * as tf from "@tensorflow/tfjs";
import "./PestAIDetect.css";
import { useNavigate } from "react-router-dom";

export default function PestAIDetect() {
  const navigate = useNavigate();

  const [net, setNet] = useState(null);           // <— the TF.js model
  const [labels, setLabels] = useState([]);       // from metadata.json
  const [inputSize, setInputSize] = useState(224); // default, overwritten by metadata
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [result, setResult] = useState(null);

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const imgRef = useRef(null);

  // ---- load model (LAYERS) + metadata ----
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErr("");

        // make sure a backend is ready
        // (webgl is fastest; fallback to cpu if unavailable)
        try {
          await tf.setBackend("webgl");
        } catch (_) {}
        await tf.ready();

        const base = `${process.env.PUBLIC_URL || ""}/models/pests`;
        const modelUrl = `${base}/model.json`;
        const metaUrl  = `${base}/metadata.json`;

        // ✅ your export is a LAYERS model
        const m = await tf.loadLayersModel(modelUrl);
        setNet(m);

        try {
          const meta = await fetch(metaUrl).then(r => r.json());
          if (Array.isArray(meta?.labels)) setLabels(meta.labels);
          if (meta?.imageSize) setInputSize(Number(meta.imageSize));
        } catch (e) {
          console.warn("[AI] metadata.json load warning:", e);
        }
      } catch (e) {
        console.error(e);
        setErr(e.message || "Failed to load model");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ---- file picker ----
  const pick = (e) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setResult(null);
    setErr("");
    setPreview(f ? URL.createObjectURL(f) : "");
  };

  // ---- inference ----
  const analyze = async () => {
    try {
      setErr("");
      setResult(null);
      if (!net) return setErr("Model not ready yet");
      if (!file || !imgRef.current) return setErr("Choose an image first");

      await new Promise((r) => {
        if (imgRef.current.complete) r();
        else imgRef.current.onload = r;
      });

      const logits = tf.tidy(() => {
        const img = tf.browser.fromPixels(imgRef.current);
        const resized = tf.image.resizeBilinear(img, [inputSize, inputSize], true);
        const norm = resized.toFloat().div(255);
        const batched = norm.expandDims(0); // [1,H,W,3]
        return net.predict(batched);        // -> [1,numClasses]
      });

      const data = await logits.data();
      logits.dispose();

      // top-k (k=5 or numClasses)
      const k = Math.min(5, data.length);
      const pairs = Array.from(data).map((p, i) => ({
        index: i,
        label: labels[i] ?? `class_${i}`,
        confidence: p,
      }));
      pairs.sort((a, b) => b.confidence - a.confidence);

      setResult({
        top: pairs[0],
        alternatives: pairs.slice(1, k),
      });
    } catch (e) {
      console.error(e);
      setErr(e.message || "Analyze failed");
    }
  };

  const pct = (x) => (x != null ? `${(x * 100).toFixed(1)}%` : "—");

  return (
    <div className="ai-full">
      <header className="ai-bar glass">
        <h1 className="ai-title">🌿AI Pest Detection</h1>
        <div className="ai-actions">
          <button className="pd-btn" onClick={() => navigate(-1)}>Back</button>
        </div>
      </header>

      <section className="ai-grid">
        <div className="ai-card glass">
          <h3>1) Provide image</h3>
          <label className="ai-label">Upload a file</label>
          <input type="file" accept="image/*" onChange={pick} />
          {preview && (
            <div className="ai-preview">
              <img ref={imgRef} src={preview} alt="preview" />
            </div>
          )}
          <button className="pd-btn pd-btn--pdf" disabled={loading} onClick={analyze}>
            {loading ? "Loading model…" : "Analyze Image"}
          </button>
          {err && <div className="ai-error">{err}</div>}
        </div>

        <div className="ai-card glass">
          <h3>2) Result</h3>
          {!result && <div className="ai-dim">No result yet.</div>}

          {result && (
            <>
              <div className="ai-top">
                <div>
                  <div className="ai-tag">Top match</div>
                  <h2 className="ai-name">{result.top?.label}</h2>
                  <div className="ai-conf">
                    Confidence: <b>{pct(result.top?.confidence)}</b>
                  </div>
                </div>
                {preview && <img className="ai-thumb" src={preview} alt="query" />}
              </div>

              {result.alternatives?.length > 0 && (
                <>
                  <h4>Alternatives</h4>
                  <ul className="ai-alt">
                    {result.alternatives.map((a, i) => (
                      <li key={i}>{a.label} — {pct(a.confidence)}</li>
                    ))}
                  </ul>
                </>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
