import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "./customerChat.css";

function ProductCard({ item }) {
  return (
    <div className="chat-card">
      {item.image ? (
        <img src={item.image} alt={item.name} />
      ) : (
        <div className="chat-noimg">No image</div>
      )}
      <div className="chat-info">
        <div className="chat-name">{item.name}</div>
        {"price" in item && (
          <div className="chat-price">
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
        "Hi! I can help with products, prices, visit booking, contact info, our location, or greenhouse basics.",
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
      (data.messages || []).forEach((m) =>
        newMsgs.push({ ...m, role: "assistant" })
      );
      setMsgs((m) => [...m, ...newMsgs]);
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

  const quickPrompts = [
    "Our location",
    "View products",
    "Product prices",
    "Book a visit",
    "Contact us",
    "What is a greenhouse?",
  ];

  const roleClass = (role) => (role === "user" ? "chat-user" : "chat-assistant");

  return (
    <>
      <button
        className="chat-fab"
        onClick={() => setOpen((v) => !v)}
        aria-label="Open customer chat"
        title="Need help?"
      >
        💬
      </button>

      {open && (
        <div className="chat-panel">
          <div className="chat-head">
            <span>GreenNest Help</span>
          </div>

          <div className="chat-body" ref={listRef}>
            {msgs.map((m, i) => {
              if (m.type === "text") {
                return (
                  <div key={i} className={`chat-row ${roleClass(m.role)}`}>
                    <div className="chat-bubble">{m.text}</div>
                  </div>
                );
              }
              if (m.type === "link") {
                const internal = m.href?.startsWith("/");
                return (
                  <div key={i} className="chat-row chat-assistant">
                    <div className="chat-bubble">
                      {internal ? (
                        <Link to={m.href} className="chat-btn-link">
                          {m.label}
                        </Link>
                      ) : (
                        <a
                          href={m.href}
                          className="chat-btn-link"
                          target="_blank"
                          rel="noreferrer"
                        >
                          {m.label}
                        </a>
                      )}
                    </div>
                  </div>
                );
              }
              if (m.type === "products") {
                return (
                  <div key={i} className="chat-row chat-assistant">
                    <div className="chat-products">
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
              <div className="chat-row chat-assistant">
                <div className="chat-bubble chat-typing">Typing…</div>
              </div>
            )}
          </div>

          <div className="chat-quick">
            {quickPrompts.map((q) => (
              <button key={q} onClick={() => setInput(q)} className="chat-quick-btn">
                {q}
              </button>
            ))}
          </div>

          <form className="chat-form" onSubmit={send}>
            <input
              className="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about products, prices, visits, contact, or our location…"
              aria-label="Ask GreenNest"
            />
            <button className="chat-submit" type="submit" disabled={sending}>
              {sending ? "…" : "Ask"}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
