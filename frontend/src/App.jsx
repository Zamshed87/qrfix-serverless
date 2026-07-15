import React, { useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

const copy = {
  en: {
    subtitle: "Scan. Report. Resolve.",
    description:
      "A QR-based issue reporting system for apartments, offices, clinics, schools, restaurants, factories and rental properties.",
    reportIssue: "Report an issue",
    dashboard: "Live operations dashboard",
    location: "Site / Location ID",
    asset: "Room / Asset ID",
    category: "Category",
    descriptionLabel: "Problem description",
    name: "Reporter name",
    phone: "Phone",
    image: "Image URL (optional)",
    priority: "Priority",
    submit: "Submit ticket",
    submitting: "Submitting...",
    refresh: "Refresh",
    open: "Open",
    progress: "In progress",
    resolved: "Resolved",
    total: "Total",
    recent: "Recent tickets",
    empty: "No tickets yet. Submit the first issue from the form.",
    qrTitle: "Public reporting QR",
    qrHint: "Print this QR and place it on a room, machine, counter or building.",
    created: "Created",
    markProgress: "Start work",
    markResolved: "Resolve",
    demoWarning:
      "MVP demo: public dashboard and status updates are intentionally unauthenticated. Add Amazon Cognito before production use.",
    apiMissing:
      "Set VITE_API_URL in your .env file or Vercel environment variables."
  },
  bn: {
    subtitle: "স্ক্যান করুন। রিপোর্ট করুন। সমাধান করুন।",
    description:
      "Apartment, office, clinic, school, restaurant, factory ও rental property-এর জন্য QR-based issue reporting system.",
    reportIssue: "সমস্যা রিপোর্ট করুন",
    dashboard: "লাইভ অপারেশন ড্যাশবোর্ড",
    location: "Site / Location ID",
    asset: "Room / Asset ID",
    category: "Category",
    descriptionLabel: "সমস্যার বিবরণ",
    name: "রিপোর্টকারীর নাম",
    phone: "ফোন",
    image: "Image URL (optional)",
    priority: "Priority",
    submit: "Ticket জমা দিন",
    submitting: "জমা হচ্ছে...",
    refresh: "Refresh",
    open: "Open",
    progress: "In progress",
    resolved: "Resolved",
    total: "Total",
    recent: "সাম্প্রতিক Ticket",
    empty: "এখনও কোনো Ticket নেই। Form থেকে প্রথম সমস্যা জমা দিন।",
    qrTitle: "Public reporting QR",
    qrHint: "এই QR room, machine, counter অথবা building-এ print করে লাগানো যাবে।",
    created: "Created",
    markProgress: "কাজ শুরু",
    markResolved: "সমাধান",
    demoWarning:
      "MVP demo: dashboard ও status update এখন authentication ছাড়া রাখা হয়েছে। Production-এর আগে Amazon Cognito যোগ করুন।",
    apiMissing:
      "আপনার .env file অথবা Vercel environment variables-এ VITE_API_URL দিন।"
  }
};

const initialForm = {
  siteId: new URLSearchParams(window.location.search).get("site") || "dhaka-demo-01",
  assetId: new URLSearchParams(window.location.search).get("asset") || "Lobby-AC-01",
  category: "Electrical",
  description: "Air conditioner is not cooling properly.",
  reporterName: "Demo User",
  phone: "",
  imageUrl: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=800&q=80",
  priority: "MEDIUM"
};

function App() {
  const [language, setLanguage] = useState("en");
  const [form, setForm] = useState(initialForm);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const t = copy[language];

  const reportUrl = `${window.location.origin}/?site=${encodeURIComponent(form.siteId)}&asset=${encodeURIComponent(form.assetId)}`;

  const stats = useMemo(() => {
    return {
      total: tickets.length,
      open: tickets.filter((ticket) => ticket.status === "OPEN").length,
      progress: tickets.filter((ticket) => ticket.status === "IN_PROGRESS").length,
      resolved: tickets.filter((ticket) => ticket.status === "RESOLVED").length
    };
  }, [tickets]);

  async function loadTickets() {
    if (!API_URL) return;
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/tickets?siteId=${encodeURIComponent(form.siteId)}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load tickets");
      }

      setTickets(data.items || []);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTickets();
  }, []);

  async function submitTicket(event) {
    event.preventDefault();

    if (!API_URL) {
      setMessage(t.apiMissing);
      return;
    }

    setSubmitting(true);
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/tickets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to create ticket");
      }

      setMessage(`Ticket created: ${data.ticketId}`);
      setForm((current) => ({
        ...current,
        description: "",
        imageUrl: ""
      }));
      await loadTickets();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function updateStatus(ticketId, status) {
    if (!API_URL) return;

    try {
      const response = await fetch(`${API_URL}/tickets/${ticketId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to update ticket");
      }

      setTickets((current) =>
        current.map((ticket) =>
          ticket.ticketId === ticketId ? data : ticket
        )
      );
    } catch (error) {
      setMessage(error.message);
    }
  }

  function field(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  return (
    <main className="page-shell">
      <header className="hero">
        <div>
          <div className="brand-row">
            <div className="logo">QF</div>
            <div>
              <h1>QRFix</h1>
              <p className="tagline">{t.subtitle}</p>
            </div>
          </div>
          <p className="hero-copy">{t.description}</p>
        </div>

        <button
          className="language-button"
          onClick={() => setLanguage(language === "en" ? "bn" : "en")}
        >
          {language === "en" ? "বাংলা" : "English"}
        </button>
      </header>

      <section className="stats-grid">
        <Stat label={t.total} value={stats.total} />
        <Stat label={t.open} value={stats.open} />
        <Stat label={t.progress} value={stats.progress} />
        <Stat label={t.resolved} value={stats.resolved} />
      </section>

      <section className="main-grid">
        <form className="panel report-panel" onSubmit={submitTicket}>
          <div className="panel-heading">
            <div>
              <span className="eyebrow">PUBLIC</span>
              <h2>{t.reportIssue}</h2>
            </div>
          </div>

          <div className="form-grid">
            <Field label={t.location}>
              <input
                value={form.siteId}
                onChange={(event) => field("siteId", event.target.value)}
                required
              />
            </Field>

            <Field label={t.asset}>
              <input
                value={form.assetId}
                onChange={(event) => field("assetId", event.target.value)}
              />
            </Field>

            <Field label={t.category}>
              <select
                value={form.category}
                onChange={(event) => field("category", event.target.value)}
              >
                <option>Electrical</option>
                <option>Plumbing</option>
                <option>Cleaning</option>
                <option>Safety</option>
                <option>IT Support</option>
                <option>Other</option>
              </select>
            </Field>

            <Field label={t.priority}>
              <select
                value={form.priority}
                onChange={(event) => field("priority", event.target.value)}
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
              </select>
            </Field>

            <Field label={t.name}>
              <input
                value={form.reporterName}
                onChange={(event) => field("reporterName", event.target.value)}
              />
            </Field>

            <Field label={t.phone}>
              <input
                value={form.phone}
                onChange={(event) => field("phone", event.target.value)}
                placeholder="+880..."
              />
            </Field>
          </div>

          <Field label={t.descriptionLabel}>
            <textarea
              rows="4"
              value={form.description}
              onChange={(event) => field("description", event.target.value)}
              required
            />
          </Field>

          <Field label={t.image}>
            <input
              type="url"
              value={form.imageUrl}
              onChange={(event) => field("imageUrl", event.target.value)}
              placeholder="https://..."
            />
          </Field>

          <button className="primary-button" disabled={submitting}>
            {submitting ? t.submitting : t.submit}
          </button>

          {message && <p className="message">{message}</p>}
        </form>

        <aside className="panel qr-panel">
          <span className="eyebrow">NO APP REQUIRED</span>
          <h2>{t.qrTitle}</h2>
          <div className="qr-box">
            <QRCodeSVG value={reportUrl} size={190} level="H" />
          </div>
          <p>{t.qrHint}</p>
          <code>{form.assetId || form.siteId}</code>
        </aside>
      </section>

      <section className="panel dashboard-panel">
        <div className="panel-heading dashboard-heading">
          <div>
            <span className="eyebrow">ADMIN DEMO</span>
            <h2>{t.dashboard}</h2>
          </div>
          <button className="secondary-button" onClick={loadTickets}>
            {loading ? "..." : t.refresh}
          </button>
        </div>

        <p className="warning">{t.demoWarning}</p>

        <div className="tickets">
          {tickets.length === 0 && !loading ? (
            <div className="empty-state">{t.empty}</div>
          ) : (
            tickets.map((ticket) => (
              <article className="ticket-card" key={ticket.ticketId}>
                {ticket.imageUrl && (
                  <img
                    src={ticket.imageUrl}
                    alt=""
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                  />
                )}

                <div className="ticket-content">
                  <div className="ticket-topline">
                    <div>
                      <span className={`badge status-${ticket.status.toLowerCase()}`}>
                        {ticket.status.replace("_", " ")}
                      </span>
                      <span className={`badge priority-${ticket.priority.toLowerCase()}`}>
                        {ticket.priority}
                      </span>
                    </div>
                    <strong>{ticket.ticketId}</strong>
                  </div>

                  <h3>{ticket.category}</h3>
                  <p>{ticket.description}</p>

                  <div className="ticket-meta">
                    <span>{ticket.siteId}</span>
                    <span>{ticket.assetId || "No asset ID"}</span>
                    <span>
                      {t.created}: {new Date(ticket.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <div className="ticket-actions">
                    {ticket.status === "OPEN" && (
                      <button
                        onClick={() =>
                          updateStatus(ticket.ticketId, "IN_PROGRESS")
                        }
                      >
                        {t.markProgress}
                      </button>
                    )}
                    {ticket.status !== "RESOLVED" && (
                      <button
                        onClick={() =>
                          updateStatus(ticket.ticketId, "RESOLVED")
                        }
                      >
                        {t.markResolved}
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <footer>
        QRFix MVP · Vercel + Amazon API Gateway + AWS Lambda + DynamoDB
      </footer>
    </main>
  );
}

function Field({ label, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function Stat({ label, value }) {
  return (
    <div className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default App;
