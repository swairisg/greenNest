// backend/data/pestKb.js
module.exports = {
  "aphid": {
    display: "Aphids (Aphidoidea)",
    overview: "Small sap-sucking insects; cause curling leaves and sticky honeydew.",
    lifecycle: ["Nymphs and adults feed on sap", "Multiple generations per season"],
    symptoms: [
      "Curled/distorted leaves",
      "Honeydew and sooty mold",
      "Clusters on stems and undersides of leaves"
    ],
    organic_controls: [
      "Strong water spray to dislodge",
      "Introduce ladybugs/lacewings",
      "Neem oil 0.5–1% every 7–10 days"
    ],
    chemical_controls: [
      "Imidacloprid as per label",
      "Pyrethroids if heavy infestation (rotate modes)"
    ],
    safety: "Always read labels; observe PHI/REI; avoid spraying during bloom."
  },
  "whitefly": {
    display: "Whiteflies (Aleyrodidae)",
    overview: "Tiny white moth-like insects; cause yellowing and leaf drop.",
    lifecycle: ["Eggs on leaf undersides", "Nymphs and adults feed on sap"],
    symptoms: [
      "Leaf yellowing and wilting",
      "Tiny white adults fly up when disturbed",
      "Sooty mold from honeydew"
    ],
    organic_controls: ["Yellow sticky traps", "Neem oil or insecticidal soap weekly"],
    chemical_controls: [
      "Buprofezin or spirotetramat per label",
      "Rotate IRAC groups to prevent resistance"
    ],
    safety: "Target undersides; avoid heat stress hours."
  },
  "thrips": {
    display: "Thrips (Thysanoptera)",
    overview: "Slender insects scraping tissues; silvery streaks/scarring.",
    lifecycle: ["Larvae feed on young tissues", "Adults disperse readily"],
    symptoms: [
      "Silvery streaks, bronzing",
      "Black specks (frass)",
      "Distorted new growth/flowers"
    ],
    organic_controls: ["Blue/yellow sticky traps", "Neem oil 0.5–1%; Spinosad as per label"],
    chemical_controls: ["Abamectin, spinetoram, cyantraniliprole (rotate)"],
    safety: "Avoid spraying open flowers; follow bee-protection advisories."
  },
  "leaf miner": {
    display: "Leaf Miners (var.)",
    overview: "Larvae burrow between leaf layers creating winding mines.",
    lifecycle: ["Adult lays egg inside leaf", "Larva tunnels; pupates in soil/leaf"],
    symptoms: ["Winding mines in leaves", "Blotches/transparent patches"],
    organic_controls: ["Remove mined leaves early", "Neem oil to deter oviposition"],
    chemical_controls: ["Abamectin or spinosad per label"],
    safety: "Do not remove >30% foliage; monitor new flush."
  },
  "spider mite": {
    display: "Spider Mites (Tetranychidae)",
    overview: "Tiny arachnids causing stippling; fine webbing in heavy cases.",
    lifecycle: ["Explode in hot, dry weather", "Rapid multi-generation cycles"],
    symptoms: ["Stippling/yellow speckling", "Fine webbing", "Leaf bronzing"],
    organic_controls: ["Increase humidity; water jet", "Horticultural oil 1–2% or neem"],
    chemical_controls: ["Abamectin, spiromesifen, bifenazate (rotate acaricides)"],
    safety: "Never oil + sulfur within 14 days; avoid heat waves."
  }
};
