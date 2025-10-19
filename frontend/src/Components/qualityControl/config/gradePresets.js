// gradePresets.js
export const productPresets = {
  tomato: {
    label: "Tomato",
    fields: [
      { name: "color", label: "Color", type: "select", options: ["uniform red", "slightly red", "greenish", "mixed"] },
      { name: "firmness", label: "Firmness", type: "select", options: ["firm", "slightly soft", "soft"] },
      { name: "cracks", label: "Cracks", type: "select", options: ["none", "minor", "major"] },
      { name: "blemishes", label: "Blemishes", type: "select", options: ["none", "few", "many"] },
    ],
  },

  strawberry: {
    label: "Strawberry",
    fields: [
      { name: "color", label: "Color", type: "select", options: ["bright red", "red", "pale red"] },
      { name: "firmness", label: "Firmness", type: "select", options: ["firm", "slightly soft", "soft"] },
      { name: "size", label: "Size", type: "select", options: ["large", "medium", "small"] },
      { name: "bruising", label: "Bruising", type: "select", options: ["none", "minor", "major"] },
      { name: "mold", label: "Mold", type: "select", options: ["none", "trace", "present"] },
    ],
  },

  lettuce: {
    label: "Lettuce",
    fields: [
      { name: "headCompactness", label: "Head Compactness", type: "select", options: ["tight", "moderate", "loose"] },
      { name: "color", label: "Color", type: "select", options: ["fresh green", "pale", "yellowing"] },
      { name: "edges", label: "Edges", type: "select", options: ["clean", "slightly browned", "browned"] },
      { name: "pestDamage", label: "Pest Damage", type: "select", options: ["none", "minor", "visible"] },
      { name: "slime", label: "Slime", type: "select", options: ["none", "trace", "present"] },
    ],
  },

  "leafy.greens": {
    label: "Leafy Greens",
    fields: [
      { name: "color", label: "Color", type: "select", options: ["vibrant green", "moderate green", "yellowing"] },
      { name: "crispness", label: "Crispness", type: "select", options: ["crisp", "slightly limp", "limp"] },
      { name: "leafIntegrity", label: "Leaf Integrity", type: "select", options: ["intact", "minor tears", "torn"] },
      { name: "pestDamage", label: "Pest Damage", type: "select", options: ["none", "minor", "visible"] },
      { name: "wilting", label: "Wilting", type: "select", options: ["none", "slight", "severe"] },
    ],
  },

  eggplant: {
    label: "Eggplant",
    fields: [
      { name: "color", label: "Color", type: "select", options: ["deep purple", "light purple", "brownish"] },
      { name: "firmness", label: "Firmness", type: "select", options: ["firm", "slightly soft", "soft"] },
      { name: "gloss", label: "Gloss", type: "select", options: ["shiny", "slightly dull", "dull"] },
      { name: "wrinkles", label: "Wrinkles", type: "select", options: ["none", "minor", "visible"] },
    ],
  },

  carrot: {
    label: "Carrot",
    fields: [
      { name: "size", label: "Size", type: "select", options: ["large", "medium", "small"] },
      { name: "color", label: "Color", type: "select", options: ["bright", "moderate", "dull"] },
      { name: "straightness", label: "Straightness", type: "select", options: ["straight", "slightly curved", "curved"] },
      { name: "cracks", label: "Cracks", type: "select", options: ["none", "minor", "major"] },
      { name: "freshness", label: "Freshness", type: "select", options: ["fresh", "ok", "stale"] },
    ],
  },

  cabbage: {
    label: "Cabbage",
    fields: [
      { name: "compactness", label: "Compactness", type: "select", options: ["tight", "moderate", "loose"] },
      { name: "color", label: "Color", type: "select", options: ["fresh green", "pale", "yellowing"] },
      { name: "pestDamage", label: "Pest Damage", type: "select", options: ["none", "minor", "visible"] },
      { name: "freshness", label: "Freshness", type: "select", options: ["fresh", "ok", "stale"] },
    ],
  },

  bellpepper: {
    label: "Bell Pepper",
    fields: [
      { name: "color", label: "Color", type: "select", options: ["bright", "slightly dull", "dull"] },
      { name: "shape", label: "Shape", type: "select", options: ["uniform", "minor deformities", "deformed"] },
      { name: "firmness", label: "Firmness", type: "select", options: ["firm", "slightly soft", "soft"] },
      { name: "skin", label: "Skin", type: "select", options: ["smooth", "slightly rough", "rough"] },
    ],
  },
};