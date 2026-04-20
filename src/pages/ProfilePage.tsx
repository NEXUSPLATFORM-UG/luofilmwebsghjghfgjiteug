import { useState, useEffect } from "react";
import { Link } from "wouter";
import { User, Mail, Phone, Crown, Clock, Bookmark, Download, Edit2, Check, X, LogOut, Shield, ChevronRight } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { fbApi } from "../lib/firebaseApi";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";

function formatDate(ms: number) {
  return new Date(ms).toLocaleDateString("en-UG", { day: "numeric", month: "long", year: "numeric" });
}

function formatUGX(n: number) {
  return "UGX " + n.toLocaleString();
}

export default function ProfilePage() {
  const { user, profile, logout } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [subscription, setSubscription] = useState<any>(null);
  const [subLoading, setSubLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setPhone(profile.phone || "");
    }
  }, [profile]);

  useEffect(() => {
    if (!user) return;
    setSubLoading(true);
    fbApi.subscriptions.list().then(({ subscriptions }) => {
      const now = Date.now();
      const active = subscriptions
        .filter((s: any) => s.userId === user.uid && s.status === "active")
        .find((s: any) => {
          const exp = typeof s.expiresAt === "number" ? s.expiresAt : 0;
          return exp > now;
        });
      setSubscription(active || null);
    }).catch(() => {}).finally(() => setSubLoading(false));
  }, [user]);

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        name: name.trim(),
        phone: phone.trim(),
        updatedAt: serverTimestamp(),
      });
      setSaveMsg("Profile updated!");
      setEditing(false);
      setTimeout(() => setSaveMsg(""), 3000);
    } catch {
      setSaveMsg("Failed to save. Try again.");
    } finally {
      setSaving(false);
    }
  }

  if (!user) {
    return (
      <div style={{ minHeight: "100vh", background: "#0e0e0e", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
        <User size={48} color="rgba(255,255,255,0.15)" />
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 15 }}>Please log in to view your profile.</p>
        <Link href="/">
          <button style={{ padding: "10px 24px", borderRadius: 20, background: "#00a9f5", border: "none", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            Go Home
          </button>
        </Link>
      </div>
    );
  }

  const avatarUrl = profile?.avatar || user.photoURL || `https://api.dicebear.com/9.x/lorelei/svg?seed=${user.uid}`;
  const expiresAt = subscription ? (typeof subscription.expiresAt === "number" ? subscription.expiresAt : 0) : 0;
  const daysLeft = expiresAt ? Math.max(0, Math.ceil((expiresAt - Date.now()) / (1000 * 60 * 60 * 24))) : 0;

  return (
    <div style={{ minHeight: "100vh", background: "#0e0e0e", color: "#fff" }}>
      <div style={{ height: 54 }} />
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "32px 16px 80px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 28 }}>
          <div style={{ width: 3, height: 18, borderRadius: 2, background: "#00a9f5" }} />
          <span style={{ fontSize: 18, fontWeight: 700 }}>My Profile</span>
        </div>

        {/* Avatar + name card */}
        <div style={{ background: "linear-gradient(135deg,#1a1a2e 0%,#16213e 100%)", borderRadius: 16, padding: "28px 24px", marginBottom: 16, display: "flex", alignItems: "center", gap: 20, border: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <img src={avatarUrl} alt="avatar"
              style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", border: "2.5px solid rgba(0,169,245,0.5)", background: "#222" }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {profile?.name || user.displayName || "User"}
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 10 }}>
              {profile?.email || user.email}
            </div>
            {!subLoading && subscription ? (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(245,200,66,0.12)", border: "1px solid rgba(245,200,66,0.3)", borderRadius: 20, padding: "3px 10px" }}>
                <Crown size={12} color="#ffc552" />
                <span style={{ fontSize: 11, fontWeight: 700, color: "#ffc552" }}>VIP ACTIVE</span>
                <span style={{ fontSize: 10, color: "rgba(255,197,82,0.6)" }}>· {daysLeft}d left</span>
              </div>
            ) : !subLoading ? (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "3px 10px" }}>
                <User size={11} color="rgba(255,255,255,0.35)" />
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>Free Account</span>
              </div>
            ) : null}
          </div>
        </div>

        {/* Subscription card */}
        {!subLoading && (
          <div style={{ background: "#141414", borderRadius: 12, padding: "18px 20px", marginBottom: 16, border: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <Crown size={15} color="#ffc552" />
              <span style={{ fontSize: 13, fontWeight: 700 }}>Subscription</span>
            </div>
            {subscription ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[
                  { label: "Plan", value: subscription.planLabel || subscription.plan || "VIP" },
                  { label: "Status", value: "Active" },
                  { label: "Amount Paid", value: formatUGX(subscription.amount || 0) },
                  { label: "Expires", value: expiresAt ? formatDate(expiresAt) : "—" },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: label === "Status" ? "#4ade80" : "#fff" }}>{value}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>No active subscription</span>
                <Link href="/">
                  <button style={{ padding: "7px 16px", borderRadius: 20, background: "linear-gradient(90deg,#f5c842,#e8a800)", border: "none", color: "#3d2200", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                    Get VIP
                  </button>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Edit profile card */}
        <div style={{ background: "#141414", borderRadius: 12, padding: "18px 20px", marginBottom: 16, border: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Edit2 size={15} color="rgba(255,255,255,0.5)" />
              <span style={{ fontSize: 13, fontWeight: 700 }}>Account Details</span>
            </div>
            {!editing && (
              <button onClick={() => setEditing(true)}
                style={{ padding: "5px 12px", borderRadius: 8, background: "rgba(0,169,245,0.1)", border: "1px solid rgba(0,169,245,0.3)", color: "#00a9f5", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                Edit
              </button>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Name */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <User size={12} color="rgba(255,255,255,0.35)" />
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Display Name</span>
              </div>
              {editing ? (
                <input value={name} onChange={(e) => setName(e.target.value)}
                  style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(0,169,245,0.4)", borderRadius: 8, padding: "9px 12px", color: "#fff", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
              ) : (
                <div style={{ fontSize: 14, color: "#fff", fontWeight: 500 }}>{profile?.name || user.displayName || "—"}</div>
              )}
            </div>

            {/* Email */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <Mail size={12} color="rgba(255,255,255,0.35)" />
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Email</span>
              </div>
              <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)" }}>{profile?.email || user.email || "—"}</div>
            </div>

            {/* Phone */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <Phone size={12} color="rgba(255,255,255,0.35)" />
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Phone</span>
              </div>
              {editing ? (
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+256..."
                  style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(0,169,245,0.4)", borderRadius: 8, padding: "9px 12px", color: "#fff", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
              ) : (
                <div style={{ fontSize: 14, color: profile?.phone ? "#fff" : "rgba(255,255,255,0.3)", fontWeight: 500 }}>{profile?.phone || "Not set"}</div>
              )}
            </div>

            {/* Role */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <Shield size={12} color="rgba(255,255,255,0.35)" />
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Account Type</span>
              </div>
              <div style={{ fontSize: 14, color: "#fff", fontWeight: 500, textTransform: "capitalize" }}>{profile?.role || "viewer"}</div>
            </div>
          </div>

          {editing && (
            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              <button onClick={handleSave} disabled={saving}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 8, background: "#00a9f5", border: "none", color: "#fff", fontSize: 12, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
                <Check size={13} /> {saving ? "Saving..." : "Save Changes"}
              </button>
              <button onClick={() => { setEditing(false); setName(profile?.name || ""); setPhone(profile?.phone || ""); }}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", borderRadius: 8, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", fontSize: 12, cursor: "pointer" }}>
                <X size={13} /> Cancel
              </button>
            </div>
          )}

          {saveMsg && (
            <div style={{ marginTop: 12, padding: "8px 12px", borderRadius: 8, background: saveMsg.includes("Failed") ? "rgba(255,80,80,0.1)" : "rgba(74,222,128,0.1)", border: `1px solid ${saveMsg.includes("Failed") ? "rgba(255,80,80,0.3)" : "rgba(74,222,128,0.3)"}`, color: saveMsg.includes("Failed") ? "#f87171" : "#4ade80", fontSize: 12 }}>
              {saveMsg}
            </div>
          )}
        </div>

        {/* Quick links */}
        <div style={{ background: "#141414", borderRadius: 12, overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)", marginBottom: 16 }}>
          {[
            { label: "Watch History", icon: <Clock size={14} color="rgba(255,255,255,0.5)" />, href: "/history" },
            { label: "My Watchlist", icon: <Bookmark size={14} color="rgba(255,255,255,0.5)" />, href: "/watchlist" },
            { label: "Downloads", icon: <Download size={14} color="rgba(255,255,255,0.5)" />, href: "/downloads" },
          ].map(({ label, icon, href }) => (
            <Link key={label} href={href}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {icon}
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>{label}</span>
                </div>
                <ChevronRight size={14} color="rgba(255,255,255,0.25)" />
              </div>
            </Link>
          ))}
        </div>

        {/* Log out */}
        <button onClick={logout}
          style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "13px", borderRadius: 12, background: "rgba(255,100,100,0.08)", border: "1px solid rgba(255,100,100,0.2)", color: "#ff6b6b", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          <LogOut size={15} />
          Log Out
        </button>
      </div>
    </div>
  );
}
