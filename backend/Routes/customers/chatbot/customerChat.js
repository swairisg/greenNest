// backend/Routes/customers/chatbot/customerChat.js
require("dotenv").config();
const express = require("express");
const router = express.Router();
const fetch =
  global.fetch ||
  ((...a) => import("node-fetch").then(({ default: f }) => f(...a)));

// Products
const Product = require("../../../Model/productCatalogue/ProductModel");

// Yield (optional, auto-handled if present)
const YieldModel = (() => {
  try {
    return require("../../../Model/harvestManagement/YieldModel");
  } catch {
    return null;
  }
})();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-1.5-flash";

// ---- GreenNest links ----
const LINKS = {
  catalog: "/catalog",
  visit: "/visit/book",
  contact: "/contactus",
  about: "/Aboutus",
  home: "/home",
  map: "https://maps.app.goo.gl/75b9XoNatophwFRP9", // Nuwara Eliya
};

// ------------ Intent detection ------------
function detectIntent(q = "") {
  const t = (q || "").toLowerCase();

  if (/(where|location|address|map|google\s*maps|direction|nuwara\s*eliya)/i.test(t)) return "location";
  if (/(harvest|yield|production|produce|output|crop\s*yield|per\s*(day|week|month)|last\s*month|weekly|monthly)/i.test(t)) return "harvest";
  if (/(buy|purchase|order|retail|wholesale|bulk|stock|in\s*bulk|minimum\s*order)/i.test(t)) return "commerce";
  if (/(contact|phone|email|reach|support|help|call)/i.test(t)) return "contact";
  if (/(visit|book|booking|come|tour)/i.test(t)) return "visit";
  if (/(product|catalog|shop|available|items)/i.test(t)) return "products";
  if (/(price|cost|rs|lkr|rupees|charge|fee)/i.test(t)) return "pricing";
  if (/how much/i.test(t) && /(item|product|kg|pack|box|per\s*(kg|unit|pack))/i.test(t)) return "pricing";
  if (/(what\s*is\s*a?\s*greenhouse|greenhouse\s*benefits|hydroponic|controlled\s*environment|why\s*greenhouse)/i.test(t)) return "knowledge";
  if (/(about|who\s*are\s*you|what\s*is\s*greennest|company|services|mission|operations|how\s*you\s*work|green\s*house\s*operations?)/i.test(t)) return "about";

  return "general";
}

/* =========================
   DB → live facts snapshot
   ========================= */
async function getOperationalFacts() {
  const facts = {
    totalProducts: 0,
    visibleProducts: 0,
    price: { min: null, max: null },
    sections: [],
    tags: [],
    retail: true,
    wholesale: false,
    yield: { hasData: false, avgPerWeek: null, last30DaysTotal: null, unit: "kg" },
  };

  // --- Products snapshot ---
  try {
    const matchVisible = { isVisible: true, isArchived: false, stockQuantity: { $gte: 0 } };

    const [counts, priceAgg, sectionAgg, tagAgg] = await Promise.all([
      Product.countDocuments({}),
      Product.aggregate([
        { $match: matchVisible },
        { $group: { _id: null, min: { $min: "$basePrice" }, max: { $max: "$basePrice" }, visibleCount: { $sum: 1 } } },
      ]),
      Product.aggregate([
        { $match: matchVisible },
        { $group: { _id: "$type", c: { $sum: 1 } } },
        { $sort: { c: -1 } },
        { $limit: 10 },
      ]),
      Product.aggregate([
        { $match: matchVisible },
        { $unwind: { path: "$tags", preserveNullAndEmptyArrays: true } },
        { $group: { _id: "$tags", c: { $sum: 1 } } },
        { $sort: { c: -1 } },
        { $limit: 12 },
      ]),
    ]);

    facts.totalProducts = counts || 0;

    const p = priceAgg?.[0];
    if (p) {
      facts.price.min = p.min ?? null;
      facts.price.max = p.max ?? null;
      facts.visibleProducts = p.visibleCount ?? 0;
    }

    facts.sections = (sectionAgg || [])
      .filter((x) => x?._id)
      .map((x) => String(x._id))
      .slice(0, 8);

    facts.tags = (tagAgg || [])
      .filter((x) => x?._id)
      .map((x) => String(x._id))
      .slice(0, 12);

    const hasValuePacks = facts.sections.some((s) => /Special Value Packs/i.test(s));
    const hasValueAdded = facts.sections.some((s) => /Value-Added/i.test(s));
    facts.wholesale = !!(hasValuePacks || hasValueAdded);
    facts.retail = (facts.visibleProducts || 0) > 0;
  } catch (e) {
    console.warn("[facts] product snapshot failed:", e?.message);
  }

  // --- Yield snapshot (auto-detect fields, with fallbacks & numeric casts) ---
  if (YieldModel) {
    try {
      const schema = YieldModel.schema;
      const dateCandidates = ["createdAt", "date", "harvestDate", "recordedAt", "timestamp"];
      const qtyCandidates  = ["quantity", "yield", "totalKg", "weightKg", "amountKg", "amount"];

      const dateField = dateCandidates.find((k) => schema.path(k)) || "createdAt";
      const qtyField  = qtyCandidates.find((k) => schema.path(k)) || "quantity";

      const now = new Date();
      const d30 = new Date(now); d30.setDate(d30.getDate() - 30);
      const w12 = new Date(now); w12.setDate(w12.getDate() - 84);

      // Sum helper with $toDouble (handles strings/null)
      const sumBetween = async (from) => {
        const out = await YieldModel.aggregate([
          { $match: { [dateField]: { $gte: from } } },
          {
            $group: {
              _id: null,
              total: {
                $sum: { $toDouble: { $ifNull: [ `$${qtyField}`, 0 ] } }
              }
            }
          },
        ]);
        return out?.[0]?.total ?? null;
      };

      const [total30, total12w] = await Promise.all([ sumBetween(d30), sumBetween(w12) ]);

      const isNum = (v) => typeof v === "number" && Number.isFinite(v);

      facts.yield.hasData = isNum(total30) || isNum(total12w);
      facts.yield.last30DaysTotal = isNum(total30) ? total30 : null;
      facts.yield.avgPerWeek = isNum(total12w) ? Math.round((total12w / 12) * 100) / 100 : null;

      // If last 12 weeks are empty but there is older data, compute all-time average/week
      if (!isNum(facts.yield.avgPerWeek)) {
        const [oldest, newest, totalAllAgg] = await Promise.all([
          YieldModel.findOne({}).sort({ [dateField]: 1 }).lean(),
          YieldModel.findOne({}).sort({ [dateField]: -1 }).lean(),
          YieldModel.aggregate([
            {
              $group: {
                _id: null,
                total: { $sum: { $toDouble: { $ifNull: [ `$${qtyField}`, 0 ] } } }
              }
            },
          ]),
        ]);

        const sumAll = totalAllAgg?.[0]?.total ?? null;
        if (oldest && newest && isNum(sumAll)) {
          const weeks = Math.max(
            1,
            Math.ceil((new Date(newest[dateField]) - new Date(oldest[dateField])) / (1000 * 60 * 60 * 24 * 7))
          );
          facts.yield.avgPerWeek = Math.round((sumAll / weeks) * 100) / 100;
          facts.yield.hasData = true;
        }
      }

      facts.yield.unit =
        (schema.path(qtyField)?.options?.unit && String(schema.path(qtyField).options.unit)) || "kg";

      // Dev log (comment out if noisy)
      console.log("[yield] using fields:", {
        dateField, qtyField,
        last30: facts.yield.last30DaysTotal,
        avgPerWeek: facts.yield.avgPerWeek
      });
    } catch (e) {
      console.warn("[facts] yield snapshot failed:", e?.message);
    }
  }

  return facts;
}

/* =========================
   Gemini calls
   ========================= */
function compactFacts(facts = {}) { try { return JSON.stringify(facts); } catch { return "{}"; } }

async function askGemini(message) {
  if (!GEMINI_API_KEY) return "AI answers are disabled until GEMINI_API_KEY is set.";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  const body = {
    contents: [{ role: "user", parts: [{ text: `Answer under 120 words, friendly, for customers.\nQuestion: ${message}` }] }],
    generationConfig: { temperature: 0.35 },
  };
  const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  return j?.candidates?.[0]?.content?.parts?.[0]?.text
    || "Greenhouses control light, temperature and humidity to help plants grow reliably year-round.";
}

async function askGeminiWithFacts(message, facts) {
  if (!GEMINI_API_KEY) return "We’re GreenNest in Nuwara Eliya. Visit our About page to learn more.";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  const system =
    `You are the GreenNest Customer Assistant.\n` +
    `Use ONLY the factual data provided in FACTS for numbers (yields, prices, availability). ` +
    `Do NOT invent numbers. If a specific number isn't present, say you don't have that exact number.\n\n` +
    `Routes: Catalog ${LINKS.catalog} • Visit ${LINKS.visit} • Contact ${LINKS.contact} • About ${LINKS.about}\n` +
    `Location: Nuwara Eliya, Sri Lanka (Maps: ${LINKS.map}).\n` +
    `Keep answers ≤ 120 words, friendly, and customer-facing.`;

  const prompt =
    `FACTS (JSON):\n${compactFacts(facts)}\n\n` +
    `USER QUESTION:\n${message}\n\n` +
    `INSTRUCTIONS:\n- Summarize operations from sections/tags/products.\n` +
    `- For yields, use avgPerWeek or last30DaysTotal + unit (or state it’s not available).\n` +
    `- For retail vs wholesale/bulk, use 'retail'/'wholesale' flags and mention seasonality.\n` +
    `- For prices/availability, use visibleProducts and price.min/max and suggest the catalog.\n` +
    `- Do not show raw JSON.`;

  const body = {
    contents: [{ role: "user", parts: [{ text: `${system}\n\n${prompt}` }] }],
    generationConfig: { temperature: 0.3 },
  };

  try {
    const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    const txt = j?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (txt) return txt;
    console.warn("[gemini] empty response", JSON.stringify(j)?.slice(0, 400));
  } catch (err) {
    console.error("[gemini] request failed:", err?.message);
  }
  return "I don’t have the exact figure in my notes, but I can share typical ranges and current availability if you’d like. You can open the catalog, contact us, or book a visit for a detailed walkthrough.";
}

/* =========================
   Mongo keyword filter
   ========================= */
function buildKeywordFilter(q = "") {
  const rules = [
    { rx: /strawber/i, or: [{ productName: /strawber/i }, { tags: /strawber/i }] },
    { rx: /lettuce|leafy/i, or: [{ productName: /lettuce/i }, { type: /Leafy Greens Section/i }] },
    { rx: /tomato/i, or: [{ productName: /tomato/i }, { type: /Vegetables Section/i }] },
    { rx: /carrot/i, or: [{ productName: /carrot/i }] },
    { rx: /spinach/i, or: [{ productName: /spinach/i }] },
    { rx: /kale/i, or: [{ productName: /kale/i }] },
    { rx: /pepper/i, or: [{ productName: /pepper/i }] },
    {
      rx: /jam|syrup|milkshake|parfait|value pack/i,
      or: [
        { type: /Value-Added Products Section|Special Value Packs/i },
        { productName: /(jam|syrup|milkshake|parfait|pack)/i },
      ],
    },
  ];
  for (const r of rules) if (r.rx.test(q)) {
    return {
      $or: r.or.map((c) => {
        if (c.productName) return { productName: c.productName };
        if (c.type) return { type: c.type };
        if (c.tags) return { tags: c.tags };
        return {};
      }),
    };
  }
  return null;
}

// payload helpers
const text = (text) => ({ type: "text", text });
const link = (label, href) => ({ type: "link", label, href });
const prods = (items) => ({
  type: "products",
  items: items.map((p) => ({
    id: String(p._id),
    name: p.productName,
    price: p.basePrice,
    image: Array.isArray(p.images) && p.images[0] ? p.images[0] : "",
  })),
});

// Format helper for numbers
const fmt = (n) => Number(n).toLocaleString("en-LK", { maximumFractionDigits: 2 });

/* =========================
   Main endpoint
   ========================= */
router.post("/", async (req, res) => {
  try {
    const { message = "" } = req.body || {};
    const intent = detectIntent(message);

    // location → Google Maps
    if (intent === "location") {
      return res.json({
        intent,
        messages: [
          text("We’re based in Nuwara Eliya. Tap below for directions."),
          link("Open in Google Maps", LINKS.map),
        ],
        quickReplies: ["Book a visit", "Contact us", "View products"],
      });
    }

    // harvest / yield
    if (intent === "harvest") {
      const facts = await getOperationalFacts();

      const avgOk = typeof facts?.yield?.avgPerWeek === "number" && Number.isFinite(facts.yield.avgPerWeek);
      const last30Ok = typeof facts?.yield?.last30DaysTotal === "number" && Number.isFinite(facts.yield.last30DaysTotal);

      if (facts?.yield?.hasData && (avgOk || last30Ok)) {
        const parts = [];
        if (avgOk) parts.push(`~${fmt(facts.yield.avgPerWeek)} ${facts.yield.unit} per week (avg)`);
        if (last30Ok) parts.push(`${fmt(facts.yield.last30DaysTotal)} ${facts.yield.unit} in the last 30 days`);
        const line = `Recent harvest levels: ${parts.join(" • ")}. Availability varies by crop and season.`;

        return res.json({
          intent,
          messages: [
            text(line),
            link("Contact us", LINKS.contact),
            link("Book a visit", LINKS.visit),
          ],
          quickReplies: ["View products", "Product prices", "Our location"],
        });
      }

      const reply = await askGeminiWithFacts(message, facts);
      return res.json({
        intent,
        messages: [
          text(reply),
          link("Contact us", LINKS.contact),
          link("Book a visit", LINKS.visit),
        ],
        quickReplies: ["View products", "Product prices", "Our location"],
      });
    }

    // commerce (retail/wholesale/bulk)
    if (intent === "commerce") {
      const facts = await getOperationalFacts();
      const reply = await askGeminiWithFacts(message, facts);
      return res.json({
        intent,
        messages: [
          text(reply),
          link("Open Product Catalog", LINKS.catalog),
          link("Contact us", LINKS.contact),
        ],
        quickReplies: ["Product prices", "Book a visit", "Our location"],
      });
    }

    if (intent === "visit") {
      return res.json({
        intent,
        messages: [text("You can book a visit to our greenhouse 🌿"), link("Go to Visit Booking", LINKS.visit)],
        quickReplies: ["View products", "Product prices", "Contact us", "What is a greenhouse?"],
      });
    }

    if (intent === "contact") {
      return res.json({
        intent,
        messages: [text("We’d love to help! Reach us here:"), link("Open Contact Us", LINKS.contact)],
        quickReplies: ["View products", "Product prices", "Book a visit", "Greenhouse benefits"],
      });
    }

    if (intent === "products" || intent === "pricing") {
      const base = { isVisible: true, isArchived: false, stockQuantity: { $gt: 0 } };
      const kw = buildKeywordFilter(message);
      const find = kw ? { ...base, ...kw } : base;

      const list = await Product.find(find)
        .select("productName basePrice images")
        .sort({ productName: 1 })
        .limit(6)
        .lean();

      if (!list.length) {
        return res.json({
          intent,
          messages: [text("Our catalog is being updated right now."), link("Open Product Catalog", LINKS.catalog)],
          quickReplies: ["Book a visit", "Contact us", "What is a greenhouse?"],
        });
      }

      return res.json({
        intent,
        messages: [
          text(intent === "pricing" ? "Here are some current items and prices:" : "Here are a few popular items:"),
          prods(list),
          link("Open Full Catalog", LINKS.catalog),
        ],
        quickReplies: ["Book a visit", "Contact us", "What is a greenhouse?"],
      });
    }

    // generic greenhouse knowledge (no company facts needed)
    if (intent === "knowledge") {
      const reply = await askGemini(message);
      return res.json({
        intent,
        messages: [text(reply), link("Learn more on our site", LINKS.about)],
        quickReplies: ["View products", "Book a visit", "Contact us"],
      });
    }

    // about / operations → Gemini with DB facts
    if (intent === "about") {
      const facts = await getOperationalFacts();
      const reply = await askGeminiWithFacts(message, facts);
      return res.json({
        intent,
        messages: [
          text(reply),
          link("About GreenNest", LINKS.about),
          link("Open in Google Maps", LINKS.map),
        ],
        quickReplies: ["View products", "Book a visit", "Contact us"],
      });
    }

    // general → use DB facts first (ops/faq)
    {
      const facts = await getOperationalFacts();
      const reply = await askGeminiWithFacts(message, facts);
      return res.json({
        intent,
        messages: [text(reply), link("Learn more on our site", LINKS.about)],
        quickReplies: ["View products", "Product prices", "Book a visit", "Contact us"],
      });
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Chat failed" });
  }
});

module.exports = router;
