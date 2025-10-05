import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE } from "../../../../api";
import "./Viewcontactus.css"; 

const LIST_URL = `${API_BASE}/contact-us`;
const ITEM_URL = (id) => `${API_BASE}/contact-us/${id}`;

const ViewContactUs = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchContacts = async () => {
    try {
      const res = await axios.get(LIST_URL);
      const rows = res?.data?.data ?? res?.data ?? [];
      setContacts(Array.isArray(rows) ? rows : []);
    } catch (error) {
      console.error("Failed to load contacts:", error);
      alert("Failed to load contact messages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const deleteContact = async (id) => {
    if (!id) return;
    if (window.confirm("Are you sure you want to delete this message?")) {
      try {
        await axios.delete(ITEM_URL(id));
        alert("Message deleted successfully");
        fetchContacts();
      } catch (error) {
        console.error("Failed to delete:", error);
        alert("Failed to delete message");
      }
    }
  };

  const markAsReplied = async (id) => {
    if (!id) return;
    try {
      await axios.patch(ITEM_URL(id), { status: "replied" });
      setContacts((prev) =>
        prev.map((c) => (c._id === id ? { ...c, status: "replied" } : c))
      );
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("Failed to update status");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    const d = new Date(dateString);
    return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
  };

  if (loading) return <div className="view-contact-loading">Loading messages...</div>;

  return (
    <div className="view-contact-container">
      <div className="view-contact-header">
        <h1>Contact Messages</h1>
        <p>Total: {contacts.length} messages</p>
      </div>

      {contacts.length === 0 ? (
        <div className="view-contact-empty">No messages found.</div>
      ) : (
        <div className="view-contact-list">
          {contacts.map((contact) => (
            <div key={contact._id} className="view-contact-card">
              <div className="contact-card-header">
                <div className="contact-info">
                  <h3>{contact.name}</h3>
                  <p>{contact.email}</p>
                </div>

                <div className="contact-update-status">
                  <button
                    className={`contact-status-btn ${contact.status || "new"}`}
                    onClick={() => markAsReplied(contact._id)}
                    disabled={(contact.status || "new") === "replied"}
                    title={
                      (contact.status || "new") === "replied"
                        ? "Already marked as replied"
                        : "Mark as replied"
                    }
                  >
                    {contact.status || "new"}
                  </button>

                  <span className="contact-date">{formatDate(contact.createdAt)}</span>
                </div>
              </div>

              <div className="contact-message">
                <p>{contact.message}</p>
              </div>

              <div className="contact-actions">
                <button className="delete-btn" onClick={() => deleteContact(contact._id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ViewContactUs;
