// backend/Routes/customerChat.js
require("dotenv").config();
const express = require("express");
const router = express.Router();
const fetch = global.fetch || ((...a) => import("node-fetch").then(({default:f}) => f(...a)));

// ⬇️ Adjust this path if your file is elsewhere
const Product = require("../../../Model/productCatalogue/ProductModel");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-1.5-flash";

// --- intent detection (simple) ---
function detectIntent(q = "") {
  const t = q.toLowerCase();
  if (/(contact|phone|email|reach|support|help|call)/.test(t)) return "contact";
  if (/(visit|book|booking|come|tour)/.test(t)) return "visit";
  if (/(price|cost|how much|rs|lkr)/.test(t)) return "pricing";
  if (/(product|catalog|shop|buy|sell|available|stock|items)/.test(t)) return "products";
  return "general";
}

// quick keyword -> Mongo filter (edit or add more keywords anytime)
function buildKeywordFilter(q = "") {
  const rules = [
    { rx: /strawber/i,  or: [{ productName: /strawber/i }, { tags: /strawber/i }] },
    { rx: /lettuce|leafy/i, or: [{ productName: /lettuce/i }, { type: /Leafy Greens Section/i }] },
    { rx: /tomato/i,     or: [{ productName: /tomato/i },  { type: /Vegetables Section/i }] },
    { rx: /carrot/i,     or: [{ productName: /carrot/i }] },
    { rx: /spinach/i,    or: [{ productName: /spinach/i }] },
    { rx: /kale/i,       or: [{ productName: /kale/i }] },
    { rx: /pepper/i,     or: [{ productName: /pepper/i }] },
    { rx: /jam|syrup|milkshake|parfait|value pack/i, or: [
      { type: /Value-Added Products Section|Special Value Packs/i },
      { productName: /(jam|syrup|milkshake|parfait|pack)/i }
    ]},
  ];
  for (const r of rules) if (r.rx.test(q)) {
    return {$or: r.or.map(c => {
      if (c.productName) return { productName: c.productName };
      if (c.type)        return { type: c.type };      // your “section” is stored in `type`
      if (c.tags)        return { tags: c.tags };
      return {};
    })};
  }
  return null;
}

// payload helpers
const text  = (text) => ({ type: "text", text });
const link  = (label, href) => ({ type: "link", label, href });
const prods = (items) => ({
  type: "products",
  items: items.map(p => ({
    id: String(p._id),
    name: p.productName,
    price: p.basePrice,
    image: Array.isArray(p.images) && p.images[0] ? p.images[0] : ""
  }))
});

// Gemini call for general greenhouse Qs
async function askGemini(message) {
  if (!GEMINI_API_KEY) return "AI answers are disabled until GEMINI_API_KEY is set.";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  const body = {
    contents: [{ role: "user", parts: [{ text: `Answer under 120 words, friendly, for customers.\nQuestion: ${message}` }]}],
    generationConfig: { temperature: 0.4 }
  };
  const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  return j?.candidates?.[0]?.content?.parts?.[0]?.text
      || "Greenhouses control light, temperature and humidity to help plants grow reliably year-round.";
}

// main endpoint
router.post("/", async (req, res) => {
  try {
    const { message = "" } = req.body || {};
    const intent = detectIntent(message);

    if (intent === "visit") {
      return res.json({ intent, messages: [ text("You can book a visit to our greenhouse 🌿"), link("Go to Visit Booking", "/visit/book") ],
        quickReplies: ["View products","Product prices","Contact us","What is a greenhouse?"] });
    }

    if (intent === "contact") {
      return res.json({ intent, messages: [ text("We’d love to help! Reach us here:"), link("Open Contact Us", "/contactus") ],
        quickReplies: ["View products","Product prices","Book a visit","Greenhouse benefits"] });
    }

    if (intent === "products" || intent === "pricing") {
      const base = { isVisible: true, isArchived: false, stockQuantity: { $gt: 0 } };
      const kw   = buildKeywordFilter(message);
      const find = kw ? { ...base, ...kw } : base;

      const list = await Product.find(find)
        .select("productName basePrice images")
        .sort({ productName: 1 })
        .limit(6)
        .lean();

      if (!list.length) {
        return res.json({ intent, messages: [ text("Our catalog is being updated right now."), link("Open Product Catalog", "/catalog") ],
          quickReplies: ["Book a visit","Contact us","What is a greenhouse?"] });
      }

      return res.json({ intent,
        messages: [ text(intent==="pricing"?"Here are some current items and prices:":"Here are a few products customers often ask about:"),
                    prods(list), link("Open Full Catalog","/catalog") ],
        quickReplies: ["Book a visit","Contact us","What is a greenhouse?"] });
    }

    // general
    const reply = await askGemini(message);
    res.json({ intent, messages: [ text(reply), link("Learn more on our site", "/home") ],
      quickReplies: ["View products","Product prices","Book a visit","Contact us"] });

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Chat failed" });
  }
});

module.exports = router;
