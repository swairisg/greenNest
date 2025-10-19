import React from "react";
export default function StageForecastBadge({ stage }) {
  return <span className={`badge ${stage || "none"}`}>{stage || "none"}</span>;
}
