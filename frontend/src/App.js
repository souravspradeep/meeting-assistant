import { useState, useRef, useEffect } from "react";
import {
  Upload, FileText, Zap, Mail, MessageSquare, Download, Clock,
  CheckSquare, Lightbulb, X, Send, Loader2, BookOpen,
  Copy, Check, ArrowLeft, Search, Hash,
  Calendar, Users, LayoutDashboard
} from "lucide-react";

/* ─── Design tokens ─────────────────────────────── */
const C = {
  bg:      "#0b0d14",
  surface: "#12151f",
  card:    "#181c29",
  border:  "#252a3d",
  accent:  "#f59e0b",
  accentD: "#d97706",
  accentBg:"#1c1508",
  text:    "#dde3f0",
  muted:   "#60698a",
  success: "#34d399",
  successBg:"#051a12",
  info:    "#60a5fa",
  infoBg:  "#071628",
  danger:  "#f87171",
  dangerBg:"#1a0707",
};

const s = {
  app:    { background: C.bg, minHeight: "100vh", fontFamily: "'DM Sans', system-ui, sans-serif", color: C.text },
  card:   { background: C.card, border: `1px solid ${C.border}`, borderRadius: 12 },
  input:  { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, outline: "none", fontFamily: "inherit" },
  btn:    { background: C.accent, color: "#0b0d14", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
  btnGhost: { background: "transparent", border: `1px solid ${C.border}`, borderRadius: 8, color: C.muted, cursor: "pointer", fontFamily: "inherit" },
  tag:    { background: C.accentBg, color: C.accent, borderRadius: 6, fontSize: 11, fontWeight: 600, padding: "3px 8px", display: "inline-block", letterSpacing: "0.04em", textTransform: "uppercase" },
};

/* ─── API Base URL ───────────────────────────────── */
// In development: points to Flask server at localhost:5001
// In production: points to your deployed backend URL
const API_BASE = process.env.REACT_APP_API_BASE || "https://meeting-assistant-vdfu.onrender.com/api";

/* ─── Backend API helpers ────────────────────────── */

// Analyze a meeting transcript
async function analyzeTranscript(text) {
  const res = await fetch(`${API_BASE}/meetings/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transcript: text }),
  });
  if (!res.ok) throw new Error("API " + res.status);
  return res.json(); // returns parsed JSON meeting data
}

// Generate follow-up email
async function generateEmailAPI(meeting) {
  const res = await fetch(`${API_BASE}/meetings/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ meeting }),
  });
  if (!res.ok) throw new Error("API " + res.status);
  const d = await res.json();
  return d.email;
}

// Chat with meeting data
async function sendChatAPI(messages, transcript, meetingData) {
  const res = await fetch(`${API_BASE}/chat/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, transcript, meetingData }),
  });
  if (!res.ok) throw new Error("API " + res.status);
  const d = await res.json();
  return d.reply;
}

// Get all saved meetings from MongoDB (with optional search query)
async function getSavedMeetings(query = "") {
  const res = await fetch(`${API_BASE}/meetings?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error("API " + res.status);
  return res.json();
}

// Delete a saved meeting
async function deleteMeetingAPI(id) {
  const res = await fetch(`${API_BASE}/meetings/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("API " + res.status);
  return res.json();
}

/* ─── Sample transcript ──────────────────────────── */
const SAMPLE = `Product Team Sync — June 12, 2025
Attendees: Sarah Chen (PM), Marcus Webb (Eng Lead), Priya Nair (Design), Tom Okafor (QA)

Sarah opened the meeting by reviewing Q2 OKRs. The team is at 78% completion with 3 weeks remaining.

Marcus mentioned the payment gateway refactor is blocked on the third-party API documentation. He'll reach out to Stripe support by EOD today and expects a response within 48 hours.

Priya shared the new onboarding flow designs. After discussion, the team decided to simplify Step 3 by removing the optional fields. Priya will update the Figma prototype by Wednesday and share with the team for review.

Tom reported 3 critical bugs in the checkout flow: cart persistence on refresh, coupon code validation, and the mobile keyboard overlay issue. He asked Marcus to prioritize the cart bug as it's blocking QA sign-off.

Marcus agreed and will assign the cart bug to Lisa Huang today. Lisa should have a fix by Thursday.

Sarah announced the Q3 roadmap review is scheduled for June 20. Everyone should submit their team updates to Sarah by June 18.

Decisions made:
- Remove optional fields from onboarding Step 3
- Postpone dark mode feature to Q4 to focus on checkout stability
- Weekly bug triage meetings will start next Monday at 10am

Next steps were confirmed. Sarah will send calendar invites for the triage meetings.`;

/* ─── Components ─────────────────────────────────── */

function Pill({ color = "accent", children }) {
  const colors = {
    accent:  { bg: C.accentBg, text: C.accent },
    success: { bg: C.successBg, text: C.success },
    info:    { bg: C.infoBg, text: C.info },
    muted:   { bg: C.surface, text: C.muted },
  };
  const { bg, text: tc } = colors[color] || colors.accent;
  return (
    <span style={{ background: bg, color: tc, borderRadius: 6, fontSize: 11, fontWeight: 700,
      padding: "2px 8px", letterSpacing: "0.05em", textTransform: "uppercase", display: "inline-flex", alignItems: "center", gap: 4 }}>
      {children}
    </span>
  );
}

function Avatar({ name, size = 32 }) {
  const initials = name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "?";
  const colors = ["#7c3aed","#0891b2","#059669","#dc2626","#d97706","#2563eb"];
  const hue = colors[name?.charCodeAt(0) % colors.length] || colors[0];
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: hue + "30",
      border: `1.5px solid ${hue}60`, display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.36, fontWeight: 600, color: hue, flexShrink: 0 }}>
      {initials}
    </div>
  );
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      style={{ ...s.btnGhost, padding: "6px 12px", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
      {copied ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy</>}
    </button>
  );
}

/* ─── Input Screen ───────────────────────────────── */
function InputScreen({ onProcess, onShowSaved, savedCount }) {
  const [text, setText] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const fileRef = useRef();

  const handleFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => setText(e.target.result);
    reader.readAsText(file);
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const process = async () => {
    if (!text.trim()) return;
    setProcessing(true); setError(null);
    try {
      // ── CHANGED: now calls Flask backend instead of Groq directly ──
      const data = await analyzeTranscript(text);
      onProcess(data, text);
    } catch (e) {
      setError("Processing failed. Make sure the backend server is running and try again.");
    } finally { setProcessing(false); }
  };

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "48px 24px" }}>
      {/* Header */}
      <div style={{ marginBottom: 40, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: C.accentBg, border: `1px solid ${C.accent}40`,
              display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Zap size={22} color={C.accent} />
            </div>
            <span style={{ fontSize: 22, color: C.muted, fontWeight: 800, letterSpacing: "0.02em"}}>Meeting Assistant</span>
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 700, margin: 0, color: C.text, lineHeight: 1.2 }}>
            Turn meeting chaos<br />into clear action
          </h1>
          <p style={{ fontSize: 15, color: C.muted, marginTop: 10, marginBottom: 0 }}>
            Paste notes or upload a transcript — AI extracts summaries, tasks, and decisions instantly.
          </p>
        </div>
        {savedCount > 0 && (
          <button onClick={onShowSaved} style={{ ...s.btnGhost, padding: "8px 16px", fontSize: 13,
            display: "flex", alignItems: "center", gap: 8, flexShrink: 0, marginTop: 4 }}>
            <BookOpen size={14} /> {savedCount} saved
          </button>
        )}
      </div>

      {/* Drop zone + textarea */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        style={{ ...s.card, padding: 0, overflow: "hidden",
          boxShadow: dragOver ? `0 0 0 2px ${C.accent}` : `0 0 0 1px ${C.border}`,
          border: dragOver ? `1px solid ${C.accent}` : `1px solid ${C.border}`, transition: "all 0.15s" }}>
        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", gap: 8, alignItems: "center" }}>
          <FileText size={14} color={C.muted} />
          <span style={{ fontSize: 13, color: C.muted }}>Meeting notes / transcript</span>
          <div style={{ flex: 1 }} />
          <button onClick={() => fileRef.current.click()}
            style={{ ...s.btnGhost, padding: "5px 12px", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
            <Upload size={12} /> Upload .txt / .vtt
          </button>
          <button onClick={() => setText(SAMPLE)}
            style={{ ...s.btnGhost, padding: "5px 12px", fontSize: 12, display: "flex", alignItems: "center", gap: 6, color: C.accent, borderColor: C.accent + "50" }}>
            Try sample
          </button>
          <input ref={fileRef} type="file" accept=".txt,.vtt" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
        </div>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder={"Paste meeting notes, chat export, or .vtt transcript here...\n\nOr drag & drop a .txt / .vtt file above."}
          style={{ ...s.input, width: "100%", minHeight: 280, padding: "16px", fontSize: 14, resize: "vertical",
            lineHeight: 1.65, background: "transparent", border: "none", borderRadius: 0, boxSizing: "border-box", color: C.text }}
        />
        <div style={{ padding: "12px 16px", borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 12, color: C.muted }}>{text.trim() ? `${text.split(/\s+/).filter(Boolean).length} words` : "No content yet"}</span>
          {text.trim() && <button onClick={() => setText("")} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", padding: "4px 8px", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}><X size={12}/> Clear</button>}
        </div>
      </div>

      {error && (
        <div style={{ background: C.dangerBg, border: `1px solid ${C.danger}30`, borderRadius: 8, padding: "12px 16px", marginTop: 12, fontSize: 13, color: C.danger }}>
          {error}
        </div>
      )}

      <button onClick={process} disabled={!text.trim() || processing}
        style={{ ...s.btn, padding: "14px 28px", fontSize: 15, marginTop: 16, width: "100%",
          opacity: (!text.trim() || processing) ? 0.5 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          transition: "opacity 0.15s" }}>
        {processing ? <><Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> Analyzing meeting…</> : <><Zap size={18} /> Analyze Meeting</>}
      </button>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Feature pills */}
      <div style={{ display: "flex", gap: 8, marginTop: 20, flexWrap: "wrap" }}>
        {["Summary", "Action items + owners", "Key decisions", "Follow-up email", "AI chat", "Markdown export"].map(f => (
          <span key={f} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, padding: "5px 12px", fontSize: 12, color: C.muted }}>
            {f}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── Dashboard Screen ───────────────────────────── */
function DashboardScreen({ data, rawText, onChat, onBack, onExport }) {
  const [email, setEmail] = useState(null);
  const [genEmail, setGenEmail] = useState(false);
  const [activeSection, setActiveSection] = useState("summary");

  const generateEmail = async () => {
    setGenEmail(true);
    try {
      // ── CHANGED: now calls Flask backend instead of Groq directly ──
      const result = await generateEmailAPI(data);
      setEmail(result);
    } catch { setEmail("Failed to generate email. Please try again."); }
    finally { setGenEmail(false); }
  };

  const sections = [
    { id: "summary", label: "Summary", icon: LayoutDashboard },
    { id: "actions", label: "Actions", count: data.action_items?.length, icon: CheckSquare },
    { id: "decisions", label: "Decisions", count: data.decisions?.length, icon: Lightbulb },
    { id: "email", label: "Email", icon: Mail },
  ];

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "32px 24px" }}>
      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
        <button onClick={onBack} style={{ ...s.btnGhost, padding: "7px 12px", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
          <ArrowLeft size={14} /> New
        </button>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: C.text }}>{data.meeting_title || "Meeting Results"}</h2>
          <div style={{ display: "flex", gap: 12, marginTop: 4, alignItems: "center" }}>
            {data.meeting_date && <span style={{ fontSize: 12, color: C.muted, display: "flex", alignItems: "center", gap: 4 }}><Calendar size={11}/>{data.meeting_date}</span>}
            {data.participants?.length > 0 && <span style={{ fontSize: 12, color: C.muted, display: "flex", alignItems: "center", gap: 4 }}><Users size={11}/>{data.participants.slice(0,3).join(", ")}{data.participants.length > 3 ? ` +${data.participants.length - 3}` : ""}</span>}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onChat} style={{ ...s.btnGhost, padding: "8px 16px", fontSize: 13, display: "flex", alignItems: "center", gap: 7, color: C.info, borderColor: C.info + "40" }}>
            <MessageSquare size={14} /> Chat
          </button>
          <button onClick={onExport} style={{ ...s.btnGhost, padding: "8px 16px", fontSize: 13, display: "flex", alignItems: "center", gap: 7 }}>
            <Download size={14} /> Export .md
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 24 }}>
        {[
          { label: "Action items", value: data.action_items?.length || 0, icon: CheckSquare, color: C.accent },
          { label: "Decisions", value: data.decisions?.length || 0, icon: Lightbulb, color: C.info },
          { label: "Participants", value: data.participants?.length || 0, icon: Users, color: C.success },
          { label: "Topics covered", value: data.key_topics?.length || 0, icon: Hash, color: "#a78bfa" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} style={{ ...s.card, padding: "14px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <Icon size={14} color={color} />
              <span style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>{label}</span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: C.text, lineHeight: 1 }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Nav tabs */}
      <div style={{ display: "flex", gap: 2, marginBottom: 20, background: C.surface, borderRadius: 10, padding: 4, border: `1px solid ${C.border}` }}>
        {sections.map(({ id, label, count, icon: Icon }) => (
          <button key={id} onClick={() => setActiveSection(id)}
            style={{ flex: 1, padding: "8px 12px", borderRadius: 7, border: "none", cursor: "pointer", fontFamily: "inherit",
              background: activeSection === id ? C.card : "transparent",
              color: activeSection === id ? C.text : C.muted,
              fontWeight: activeSection === id ? 600 : 400, fontSize: 13,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              boxShadow: activeSection === id ? `0 0 0 1px ${C.border}` : "none",
              transition: "all 0.15s" }}>
            <Icon size={13} />
            {label}
            {count > 0 && <span style={{ background: C.accentBg, color: C.accent, borderRadius: 10, fontSize: 10, padding: "1px 6px", fontWeight: 700 }}>{count}</span>}
          </button>
        ))}
      </div>

      {/* Content panels */}
      {activeSection === "summary" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ ...s.card, padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <Pill color="info">Summary</Pill>
              <CopyButton text={data.summary} />
            </div>
            <p style={{ fontSize: 15, color: C.text, lineHeight: 1.75, margin: 0 }}>{data.summary}</p>
          </div>
          {data.key_topics?.length > 0 && (
            <div style={{ ...s.card, padding: 20 }}>
              <Pill color="muted">Key topics</Pill>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                {data.key_topics.map(t => (
                  <span key={t} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, padding: "5px 12px", fontSize: 13, color: C.text }}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
          {data.participants?.length > 0 && (
            <div style={{ ...s.card, padding: 20 }}>
              <Pill color="muted">Participants</Pill>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 14 }}>
                {data.participants.map(p => (
                  <div key={p} style={{ display: "flex", alignItems: "center", gap: 8, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 12px" }}>
                    <Avatar name={p} size={28} />
                    <span style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>{p}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeSection === "actions" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {data.action_items?.length === 0 && (
            <div style={{ ...s.card, padding: 32, textAlign: "center", color: C.muted }}>No action items extracted</div>
          )}
          {data.action_items?.map((item, i) => (
            <div key={i} style={{ ...s.card, padding: 16, display: "flex", gap: 14, alignItems: "flex-start",
              borderLeft: `3px solid ${item.assignee === "Unassigned" ? C.muted : C.accent}` }}>
              <div style={{ width: 22, height: 22, borderRadius: 6, border: `1.5px solid ${C.border}`, flexShrink: 0, marginTop: 1 }} />
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 14, color: C.text, lineHeight: 1.5, fontWeight: 500 }}>{item.description}</p>
                <div style={{ display: "flex", gap: 12, marginTop: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Avatar name={item.assignee} size={20} />
                    <span style={{ fontSize: 12, color: item.assignee === "Unassigned" ? C.muted : C.text, fontWeight: 500 }}>
                      {item.assignee}
                      {item.assignee === "Unassigned" && <span style={{ color: C.danger, marginLeft: 4 }}>⚠ No owner</span>}
                    </span>
                  </div>
                  {item.deadline && (
                    <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: C.muted }}>
                      <Clock size={11} /> {item.deadline}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
          {data.action_items?.some(a => a.assignee === "Unassigned") && (
            <div style={{ background: C.dangerBg, border: `1px solid ${C.danger}25`, borderRadius: 8, padding: "10px 14px", fontSize: 12, color: C.danger, display: "flex", gap: 8 }}>
              ⚠ Some items have no clear assignee — review and assign manually before sending the follow-up.
            </div>
          )}
        </div>
      )}

      {activeSection === "decisions" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {data.decisions?.length === 0 && (
            <div style={{ ...s.card, padding: 32, textAlign: "center", color: C.muted }}>No decisions extracted</div>
          )}
          {data.decisions?.map((d, i) => (
            <div key={i} style={{ ...s.card, padding: 16, display: "flex", gap: 14, alignItems: "flex-start",
              borderLeft: `3px solid ${C.info}` }}>
              <Lightbulb size={16} color={C.info} style={{ flexShrink: 0, marginTop: 2 }} />
              <p style={{ margin: 0, fontSize: 14, color: C.text, lineHeight: 1.6 }}>{d}</p>
            </div>
          ))}
        </div>
      )}

      {activeSection === "email" && (
        <div>
          {!email && (
            <div style={{ ...s.card, padding: 32, textAlign: "center" }}>
              <Mail size={32} color={C.muted} style={{ marginBottom: 12 }} />
              <p style={{ color: C.muted, marginBottom: 20, fontSize: 14 }}>Generate a professional follow-up email based on this meeting</p>
              <button onClick={generateEmail} disabled={genEmail}
                style={{ ...s.btn, padding: "12px 24px", fontSize: 14, display: "inline-flex", alignItems: "center", gap: 8, opacity: genEmail ? 0.6 : 1 }}>
                {genEmail ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Generating…</> : <><Mail size={16} /> Generate Follow-up Email</>}
              </button>
            </div>
          )}
          {email && (
            <div style={{ ...s.card, padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <Pill color="info">Follow-up email</Pill>
                <div style={{ display: "flex", gap: 8 }}>
                  <CopyButton text={email} />
                  <button onClick={generateEmail} disabled={genEmail}
                    style={{ ...s.btnGhost, padding: "6px 12px", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
                    {genEmail ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> : null} Regenerate
                  </button>
                </div>
              </div>
              <pre style={{ fontFamily: "inherit", fontSize: 13.5, color: C.text, lineHeight: 1.75, whiteSpace: "pre-wrap", margin: 0,
                background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 16 }}>
                {email}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Chat Screen ────────────────────────────────── */
function ChatScreen({ data, rawText, onBack }) {
  const [msgs, setMsgs] = useState([{
    role: "assistant",
    content: `Hi! I have full context on ${data.meeting_title || "this meeting"}. I can answer questions about decisions, explain action items, find details, or help you think through next steps.`
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef();

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", content: input };
    const newMsgs = [...msgs, userMsg];
    setMsgs(newMsgs);
    setInput("");
    setLoading(true);
    try {
      // ── CHANGED: now calls Flask backend instead of Groq directly ──
      // Only send user/assistant messages (not the initial greeting)
      const apiMsgs = newMsgs
        .filter(m => !(m.role === "assistant" && newMsgs.indexOf(m) === 0))
        .map(m => ({ role: m.role, content: m.content }));
      const reply = await sendChatAPI(apiMsgs, rawText, data);
      setMsgs([...newMsgs, { role: "assistant", content: reply }]);
    } catch {
      setMsgs([...newMsgs, { role: "assistant", content: "Sorry, something went wrong. Please try again." }]);
    } finally { setLoading(false); }
  };

  const suggestions = [
    "Who has the most action items?",
    "What was the most important decision?",
    "Draft a Slack update about this meeting",
    "What's blocking the team?",
  ];

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "0", display: "flex", flexDirection: "column", height: "100vh" }}>
      {/* Header */}
      <div style={{ padding: "16px 24px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 12, background: C.bg, flexShrink: 0 }}>
        <button onClick={onBack} style={{ ...s.btnGhost, padding: "7px 12px", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
          <ArrowLeft size={14} /> Results
        </button>
        <div>
          <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Chat with meeting</span>
          <div style={{ fontSize: 11, color: C.muted }}>{data.meeting_title || "Meeting"}</div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ display: "flex", gap: 12, flexDirection: m.role === "user" ? "row-reverse" : "row" }}>
            {m.role === "assistant" && (
              <div style={{ width: 30, height: 30, borderRadius: 8, background: C.accentBg, border: `1px solid ${C.accent}40`,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Zap size={14} color={C.accent} />
              </div>
            )}
            <div style={{ maxWidth: "80%", background: m.role === "user" ? C.accent : C.card,
              color: m.role === "user" ? "#0b0d14" : C.text, borderRadius: m.role === "user" ? "14px 14px 4px 14px" : "4px 14px 14px 14px",
              padding: "12px 16px", fontSize: 14, lineHeight: 1.65, border: m.role === "assistant" ? `1px solid ${C.border}` : "none",
              whiteSpace: "pre-wrap" }}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: C.accentBg, border: `1px solid ${C.accent}40`,
              display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Zap size={14} color={C.accent} />
            </div>
            <div style={{ ...s.card, padding: "12px 16px", display: "flex", gap: 6, alignItems: "center" }}>
              {[0,1,2].map(j => (
                <div key={j} style={{ width: 6, height: 6, borderRadius: "50%", background: C.muted, animation: `bounce 1.2s ${j*0.2}s infinite` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {msgs.length < 3 && (
        <div style={{ padding: "0 24px 12px", display: "flex", gap: 8, flexWrap: "wrap" }}>
          {suggestions.map(sg => (
            <button key={sg} onClick={() => setInput(sg)}
              style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, padding: "6px 14px",
                fontSize: 12, color: C.muted, cursor: "pointer", fontFamily: "inherit" }}>
              {sg}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{ padding: "12px 24px 20px", borderTop: `1px solid ${C.border}`, background: C.bg, flexShrink: 0 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
          <textarea value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Ask anything about this meeting…"
            rows={1}
            style={{ ...s.input, flex: 1, padding: "10px 14px", fontSize: 14, resize: "none", lineHeight: 1.5, minHeight: 42 }} />
          <button onClick={send} disabled={!input.trim() || loading}
            style={{ ...s.btn, padding: "10px 16px", opacity: (!input.trim() || loading) ? 0.5 : 1, display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            <Send size={15} />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes bounce { 0%,80%,100% { transform: scale(0.6); opacity: 0.4 } 40% { transform: scale(1); opacity: 1 } }
      `}</style>
    </div>
  );
}

/* ─── Saved Meetings Panel ───────────────────────── */
// ── CHANGED: now loads meetings from MongoDB via Flask backend ──
function SavedPanel({ onSelect, onClose }) {
  const [search, setSearch] = useState("");
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load meetings from backend when panel opens
  useEffect(() => {
    loadMeetings();
  }, []);

  // Search meetings when query changes
  useEffect(() => {
    const timer = setTimeout(() => loadMeetings(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const loadMeetings = async (query = "") => {
    setLoading(true);
    try {
      const data = await getSavedMeetings(query);
      setMeetings(data);
    } catch {
      setMeetings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      await deleteMeetingAPI(id);
      setMeetings(prev => prev.filter(m => m._id !== id));
    } catch {
      alert("Failed to delete meeting.");
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex" }}>
      <div onClick={onClose} style={{ flex: 1, background: "rgba(0,0,0,0.6)" }} />
      <div style={{ width: 360, background: C.surface, borderLeft: `1px solid ${C.border}`, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "20px 20px 12px", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontWeight: 600, fontSize: 15 }}>Saved meetings</span>
            <button onClick={onClose} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer" }}><X size={18} /></button>
          </div>
          <div style={{ position: "relative" }}>
            <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.muted }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search meetings…"
              style={{ ...s.input, width: "100%", padding: "8px 12px 8px 30px", fontSize: 13, boxSizing: "border-box" }} />
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
          {loading && <div style={{ textAlign: "center", color: C.muted, padding: 32, fontSize: 13 }}>Loading...</div>}
          {!loading && meetings.length === 0 && <div style={{ textAlign: "center", color: C.muted, padding: 32, fontSize: 13 }}>No meetings found</div>}
          {meetings.map(m => (
            <div key={m._id} onClick={() => { onSelect(m); onClose(); }}
              style={{ ...s.card, padding: "14px 16px", textAlign: "left", cursor: "pointer", border: `1px solid ${C.border}`,
                display: "block", width: "100%", fontFamily: "inherit", transition: "border-color 0.15s", position: "relative" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = C.accent}
              onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
              <div style={{ fontWeight: 600, fontSize: 13, color: C.text, marginBottom: 4, paddingRight: 24 }}>{m.meeting_title || "Untitled Meeting"}</div>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 8, display: "flex", gap: 8 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Calendar size={10}/>{m.meeting_date || "No date"}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 3 }}><CheckSquare size={10}/>{m.action_items?.length || 0} tasks</span>
              </div>
              <p style={{ margin: 0, fontSize: 12, color: C.muted, lineHeight: 1.5, overflow: "hidden",
                display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                {m.summary}
              </p>
              {/* Delete button */}
              <button onClick={e => handleDelete(e, m._id)}
                style={{ position: "absolute", top: 10, right: 10, background: "none", border: "none",
                  color: C.muted, cursor: "pointer", padding: 4, display: "flex", alignItems: "center" }}>
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Main App ───────────────────────────────────── */
export default function App() {
  const [view, setView] = useState("input");
  const [meetingData, setMeetingData] = useState(null);
  const [rawText, setRawText] = useState("");
  const [saved, setSaved] = useState([]);
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    getSavedMeetings()
      .then(meetings => setSaved(meetings))
      .catch(() => setSaved([]));
  }, []);

  const handleProcess = (data, text) => {
    setMeetingData(data);
    setRawText(text);
    getSavedMeetings()
      .then(meetings => setSaved(meetings))
      .catch(() => {});
    setView("dashboard");
  };

  const handleExport = () => {
    if (!meetingData) return;
    const md = [
      `# ${meetingData.meeting_title || "Meeting Notes"}`,
      meetingData.meeting_date ? `**Date:** ${meetingData.meeting_date}` : "",
      meetingData.participants?.length ? `**Participants:** ${meetingData.participants.join(", ")}` : "",
      "",
      "## Summary",
      meetingData.summary,
      "",
      "## Action Items",
      ...(meetingData.action_items || []).map(a =>
        `- [ ] **${a.description}**  \n  Assignee: ${a.assignee}${a.deadline ? `  \n  Due: ${a.deadline}` : ""}`),
      "",
      "## Key Decisions",
      ...(meetingData.decisions || []).map(d => `- ${d}`),
      "",
      meetingData.key_topics?.length ? `## Topics\n${meetingData.key_topics.map(t => `- ${t}`).join("\n")}` : "",
    ].filter(l => l !== undefined).join("\n");

    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${(meetingData.meeting_title || "meeting").toLowerCase().replace(/\s+/g, "-")}.md`;
    a.click(); URL.revokeObjectURL(url);
  };

  // ── CHANGED: SavedPanel now loads from MongoDB, no local meetings prop needed ──
  const handleSelectSaved = (m) => {
    setMeetingData(m);
    setRawText(m.transcript || "");
    setView("dashboard");
  };

  return (
    <div style={s.app}>
      {view === "input" && (
        <InputScreen
          onProcess={handleProcess}
          savedCount={saved.length}
          onShowSaved={() => setShowSaved(true)}
        />
      )}
      {view === "dashboard" && meetingData && (
        <DashboardScreen
          data={meetingData}
          rawText={rawText}
          onChat={() => setView("chat")}
          onBack={() => setView("input")}
          onExport={handleExport}
        />
      )}
      {view === "chat" && meetingData && (
        <ChatScreen data={meetingData} rawText={rawText} onBack={() => setView("dashboard")} />
      )}
      {showSaved && (
        <SavedPanel
          onSelect={handleSelectSaved}
          onClose={() => setShowSaved(false)}
        />
      )}
    </div>
  );
}