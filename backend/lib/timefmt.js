// "08:05 PM" -> minutes(20*60+5) ; strict-ish parsing
exports.ampmToMinutes = (label) => {
  if (!label) return null;
  const m = String(label)
    .trim()
    .match(/^(\d{1,2}):(\d{2})\s*([aApP][mM])$/);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const ampm = m[3].toUpperCase(); // AM or PM
  if (h < 1 || h > 12 || min < 0 || min > 59) return null;
  if (ampm === "AM") {
    if (h === 12) h = 0;
  } else {
    // PM
    if (h !== 12) h += 12;
  }
  return h * 60 + min;
};

exports.minutesToAMPM = (mins) => {
  if (mins == null) return "";
  let h24 = Math.floor(mins / 60);
  const m = mins % 60;
  const am = h24 < 12;
  if (h24 === 0) h24 = 12;
  else if (h24 > 12) h24 -= 12;
  const HH = String(h24).padStart(2, "0");
  const MM = String(m).padStart(2, "0");
  return `${HH}:${MM} ${am ? "AM" : "PM"}`;
};
