import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "./customerChat.css";

function ProductCard({ item }) {
  return (
    <div className="gnp-card">
      {item.image ? (
        <img src={item.image} alt={item.name} />
      ) : (
        <div className="noimg">No image</div>
      )}
      <div className="info">
        <div className="name">{item.name}</div>
        {"price" in item && (
          <div className="price">
            LKR {Number(item.price).toLocaleString("en-LK")}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CustomerChatbot() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([
    {
      type: "text",
      role: "assistant",
      text:
        "Hi! I can help with products, prices, visit booking, contact info, or greenhouse basics.",
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [msgs, open]);

  async function send(e) {
    e.preventDefault();
    const q = input.trim();
    if (!q || sending) return;

    setMsgs((m) => [...m, { type: "text", role: "user", text: q }]);
    setInput("");
    setSending(true);

    try {
      const res = await fetch("http://localhost:5001/api/customer-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: q }),
      });
      const data = await res.json();

      const newMsgs = [];
      (data.messages || []).forEach((m) => newMsgs.push({ ...m, role: "assistant" }));
      setMsgs((m) => [...m, ...newMsgs]);

      // Optional quick replies from server (not rendered as buttons by default)
      // You could render them as chips if you want.
    } catch (err) {
      setMsgs((m) => [
        ...m,
        {
          type: "text",
          role: "assistant",
          text:
            "Sorry, I couldn’t reach our server just now. Please try again in a moment.",
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  // Quick chips
  const quickPrompts = [
    "View products",
    "Product prices",
    "Book a visit",
    "Contact us",
    "What is a greenhouse?",
  ];

  return (
    <>
      <button
        className="gn-fab"
        onClick={() => setOpen((v) => !v)}
        aria-label="Open customer chat"
        title="Need help?"
      >
        💬
      </button>

      {open && (
        <div className="gn-panel">
          <div className="gn-head">
            <span>GreenNest Help</span>
          </div>

          <div className="gn-body" ref={listRef}>
            {msgs.map((m, i) => {
              if (m.type === "text") {
                return (
                  <div key={i} className={`row ${m.role}`}>
                    <div className="bubble">{m.text}</div>
                  </div>
                );
              }
              if (m.type === "link") {
                const internal = m.href?.startsWith("/");
                return (
                  <div key={i} className="row assistant">
                    <div className="bubble">
                      {internal ? (
                        <Link to={m.href} className="btn-link">
                          {m.label}
                        </Link>
                      ) : (
                        <a href={m.href} className="btn-link">
                          {m.label}
                        </a>
                      )}
                    </div>
                  </div>
                );
              }
              if (m.type === "products") {
                return (
                  <div key={i} className="row assistant">
                    <div className="products">
                      {(m.items || []).map((it) => (
                        <ProductCard key={it.id} item={it} />
                      ))}
                    </div>
                  </div>
                );
              }
              return null;
            })}

            {sending && (
              <div className="row assistant">
                <div className="bubble typing">Typing…</div>
              </div>
            )}
          </div>

          <div className="gn-quick">
            {quickPrompts.map((q) => (
              <button key={q} onClick={() => setInput(q)}>
                {q}
              </button>
            ))}
          </div>

          <form className="gn-form" onSubmit={send}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about products, prices, visits, or contact…"
              aria-label="Ask GreenNest"
            />
            <button type="submit" disabled={sending}>
              {sending ? "…" : "Ask"}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
