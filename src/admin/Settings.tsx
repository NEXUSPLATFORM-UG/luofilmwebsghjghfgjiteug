import { useState, useEffect } from "react";
import { Save, Shield, Globe, Database, Bell, Loader, ImageIcon, CreditCard } from "lucide-react";
import { api } from "./api";
import { auth } from "../lib/firebase";
import { clearPaymentBaseCache } from "../lib/paymentApi";
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";

const TIMEZONES = [
  "Africa/Kampala","Africa/Nairobi","Africa/Lagos","Africa/Accra",
  "Africa/Dar_es_Salaam","Africa/Kigali","UTC","Europe/London","America/New_York","Asia/Shanghai",
];

const DEFAULT_SETTINGS = {
  siteName: "LUO FILM.SITE",
  siteDescription: "Premium streaming platform for Asian content",
  contactEmail: "admin@luofilm.site",
  supportPhone: "+256 700 000000",
  timezone: "Africa/Kampala",
  maintenanceMode: false,
  userRegistration: true,
  emailVerification: false,
  freeTrialDays: 7,
  plan1DayPrice: 2500,
  plan3DaysPrice: 5000,
  plan1WeekPrice: 10000,
  plan1MonthPrice: 20000,
  maxDevices: 3,
  watermarkEnabled: true,
  analyticsEnabled: true,
  twoFactor: false,
  floatBannerUrl: "",
  floatBannerLink: "https://pub-4810ad32eae44d3db8b886164bf3650f.r2.dev/luofilm.apk",
  paymentBackendUrl: "https://function-bun-production-37b5.up.railway.app",
};

const inp: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 12px",
  color: "#fff", fontSize: 13, outline: "none",
};

function Section({ title, icon: Icon, children }: any) {
  return (
    <div style={{ background: "#111118", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 24, marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: "#6366f122", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={16} color="#818cf8" />
        </div>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: "#fff", margin: 0 }}>{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Field({ label, hint, children }: any) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 5, fontWeight: 600 }}>{label}</label>
      {children}
      {hint && <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: "4px 0 0" }}>{hint}</p>}
    </div>
  );
}

function Toggle({ checked, onChange, label, hint }: any) {
  return (
    <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", userSelect: "none" as const }}>
      <div onClick={() => onChange(!checked)} style={{ marginTop: 2, width: 38, height: 22, borderRadius: 11, background: checked ? "#6366f1" : "rgba(255,255,255,0.12)", position: "relative", flexShrink: 0, cursor: "pointer", transition: "background 0.2s" }}>
        <div style={{ position: "absolute", top: 3, left: checked ? 19 : 3, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.3)" }} />
      </div>
      <div>
        <div style={{ fontSize: 13, color: "#fff", fontWeight: 500 }}>{label}</div>
        {hint && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2, lineHeight: 1.4 }}>{hint}</div>}
      </div>
    </label>
  );
}

const VIP_PLANS = [
  { key: "plan1DayPrice", label: "1 Day Pass", tag: "TRY IT", tagColor: "#888" },
  { key: "plan3DaysPrice", label: "3 Days Pass", tag: "POPULAR", tagColor: "#f5a623" },
  { key: "plan1WeekPrice", label: "1 Week Pass", tag: "GREAT VALUE", tagColor: "#e05a7a" },
  { key: "plan1MonthPrice", label: "1 Month Pass", tag: "BEST DEAL", tagColor: "#059669" },
];

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [statusMsg, setStatusMsg] = useState("");
  const [settings, setSettings] = useState({ ...DEFAULT_SETTINGS });
  const [pwForm, setPwForm] = useState({ current: "", newPw: "", confirm: "" });
  const [pwStatus, setPwStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [pwMsg, setPwMsg] = useState("");

  useEffect(() => {
    api.settings.get().then((data: any) => {
      if (data) setSettings(s => ({ ...s, ...data }));
    }).finally(() => setLoading(false));
  }, []);

  const set = (k: string, v: any) => setSettings(s => ({ ...s, [k]: v }));

  const save = async () => {
    setSaving(true);
    setStatus("idle");
    try {
      await api.settings.save({ ...settings, currency: "UGX" });
      clearPaymentBaseCache();
      setStatus("saved");
      setStatusMsg("Settings saved successfully!");
      setTimeout(() => setStatus("idle"), 3000);
    } catch (e: any) {
      setStatus("error");
      setStatusMsg("Failed to save: " + (e.message || "Unknown error"));
      setTimeout(() => setStatus("idle"), 4000);
    }
    setSaving(false);
  };

  const changePassword = async () => {
    if (!pwForm.newPw || pwForm.newPw !== pwForm.confirm) {
      setPwStatus("error"); setPwMsg("Passwords do not match."); return;
    }
    if (pwForm.newPw.length < 6) {
      setPwStatus("error"); setPwMsg("Password must be at least 6 characters."); return;
    }
    const user = auth.currentUser;
    if (!user?.email) {
      setPwStatus("error"); setPwMsg("No authenticated admin user found."); return;
    }
    setPwStatus("saving");
    try {
      await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, pwForm.current));
      await updatePassword(user, pwForm.newPw);
      setPwStatus("saved"); setPwMsg("Password updated successfully!");
      setPwForm({ current: "", newPw: "", confirm: "" });
      setTimeout(() => setPwStatus("idle"), 3000);
    } catch (e: any) {
      setPwStatus("error");
      setPwMsg(
        e.code === "auth/wrong-password" ? "Current password is incorrect." :
        e.code === "auth/too-many-requests" ? "Too many attempts. Try again later." :
        "Failed: " + (e.message || "Unknown error")
      );
      setTimeout(() => setPwStatus("idle"), 4000);
    }
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200, gap: 12 }}>
      <Loader size={20} color="#818cf8" />
      <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>Loading settings...</span>
    </div>
  );

  return (
    <div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#fff", margin: 0 }}>Settings</h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>Configure platform settings and preferences</p>
        </div>
        <button
          onClick={save} disabled={saving}
          style={{ padding: "9px 22px", background: status === "saved" ? "#10b981" : status === "error" ? "#ef4444" : "#6366f1", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 8, opacity: saving ? 0.7 : 1, transition: "background 0.3s" }}
        >
          {saving ? <Loader size={15} style={{ animation: "spin 1s linear infinite" }} /> : <Save size={15} />}
          {saving ? "Saving..." : status === "saved" ? "Saved!" : status === "error" ? "Error!" : "Save Settings"}
        </button>
      </div>

      {statusMsg && status !== "idle" && (
        <div style={{ padding: "10px 16px", borderRadius: 8, marginBottom: 18, background: status === "saved" ? "#10b98122" : "#ef444422", border: `1px solid ${status === "saved" ? "#10b981" : "#ef4444"}44`, color: status === "saved" ? "#10b981" : "#f87171", fontSize: 13 }}>
          {statusMsg}
        </div>
      )}

      <Section title="General" icon={Globe}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Field label="Site Name"><input style={inp} value={settings.siteName} onChange={e => set("siteName", e.target.value)} /></Field>
          <Field label="Contact Email"><input style={inp} type="email" value={settings.contactEmail} onChange={e => set("contactEmail", e.target.value)} /></Field>
          <Field label="Support Phone"><input style={inp} value={settings.supportPhone} onChange={e => set("supportPhone", e.target.value)} placeholder="+256 700 000000" /></Field>
          <Field label="Currency">
            <div style={{ ...inp, cursor: "not-allowed", color: "#fbbf24", fontWeight: 600, background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.25)", display: "flex", alignItems: "center", gap: 8 }}>
              <span>🇺🇬</span> UGX — Ugandan Shilling
            </div>
          </Field>
          <Field label="Timezone">
            <select style={inp} value={settings.timezone} onChange={e => set("timezone", e.target.value)}>
              {TIMEZONES.map(z => <option key={z} value={z}>{z}</option>)}
            </select>
          </Field>
          <Field label="Site Description"><input style={inp} value={settings.siteDescription} onChange={e => set("siteDescription", e.target.value)} /></Field>
        </div>
        <div style={{ display: "flex", gap: 28, marginTop: 12, flexWrap: "wrap" as const }}>
          <Toggle checked={settings.maintenanceMode} onChange={(v: boolean) => set("maintenanceMode", v)} label="Maintenance Mode" hint="Block all users from accessing the site" />
          <Toggle checked={settings.userRegistration} onChange={(v: boolean) => set("userRegistration", v)} label="Allow Registration" hint="Allow new users to sign up" />
          <Toggle checked={settings.emailVerification} onChange={(v: boolean) => set("emailVerification", v)} label="Email Verification" hint="Require email verification on signup" />
        </div>
      </Section>

      <Section title="VIP Subscription Plans" icon={Database}>
        <div style={{ marginBottom: 14, padding: "10px 14px", background: "rgba(245,166,35,0.08)", borderRadius: 8, border: "1px solid rgba(245,166,35,0.25)" }}>
          <span style={{ fontSize: 12, color: "#fbbf24" }}>
            🇺🇬 All plans priced in <strong>UGX (Ugandan Shilling)</strong> — changes here update the VIP modal prices in real time
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
          {VIP_PLANS.map(p => (
            <div key={p.key} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: 14, position: "relative" }}>
              <div style={{ position: "absolute", top: -1, left: -1, background: p.tagColor, color: "#fff", fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: "9px 0 9px 0", letterSpacing: "0.04em" }}>{p.tag}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.5)", marginBottom: 8, marginTop: 12 }}>{p.label}</div>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.35)", fontSize: 11, fontWeight: 600 }}>UGX</span>
                <input
                  style={{ ...inp, paddingLeft: 42, fontWeight: 700, fontSize: 15, color: "#fbbf24" }}
                  type="number"
                  step="100"
                  min="0"
                  value={(settings as any)[p.key]}
                  onChange={e => set(p.key, Number(e.target.value))}
                />
              </div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 6, textAlign: "center" as const }}>
                UGX {Number((settings as any)[p.key]).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
        <Field label="Free Trial (Days)">
          <input style={{ ...inp, width: 120 }} type="number" value={settings.freeTrialDays} onChange={e => set("freeTrialDays", Number(e.target.value))} />
        </Field>
        <Field label="Max Devices per Account" hint="How many devices can stream simultaneously on one subscription">
          <input style={{ ...inp, width: 120 }} type="number" value={settings.maxDevices} onChange={e => set("maxDevices", Number(e.target.value))} />
        </Field>
      </Section>

      <Section title="Content Settings" icon={Bell}>
        <div style={{ display: "flex", gap: 28, flexWrap: "wrap" as const }}>
          <Toggle checked={settings.watermarkEnabled} onChange={(v: boolean) => set("watermarkEnabled", v)} label="Enable Watermark" hint="Show platform watermark on videos" />
          <Toggle checked={settings.analyticsEnabled} onChange={(v: boolean) => set("analyticsEnabled", v)} label="Track Analytics" hint="Track and record user activity" />
        </div>
      </Section>

      <Section title="Float Banner (Welcome Modal)" icon={ImageIcon}>
        <div style={{ marginBottom: 14, padding: "10px 14px", background: "rgba(99,102,241,0.08)", borderRadius: 8, border: "1px solid rgba(99,102,241,0.25)" }}>
          <span style={{ fontSize: 12, color: "#818cf8" }}>
            The banner image shown automatically when visitors land on the site. Paste an image URL below — leave blank to use the default local image.
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
          <Field label="Banner Image URL" hint="Direct image URL (JPG, PNG, AVIF, WebP)">
            <input
              style={inp}
              value={(settings as any).floatBannerUrl || ""}
              onChange={e => set("floatBannerUrl", e.target.value)}
              placeholder="https://example.com/my-banner.png"
            />
          </Field>
          <Field label="Click Destination URL" hint="Where to send users when they click the banner">
            <input
              style={inp}
              value={(settings as any).floatBannerLink || ""}
              onChange={e => set("floatBannerLink", e.target.value)}
              placeholder="https://pub-xxx.r2.dev/luofilm.apk"
            />
          </Field>
        </div>
        {(settings as any).floatBannerUrl && (
          <div style={{ marginTop: 4 }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 8 }}>Preview:</div>
            <img
              src={(settings as any).floatBannerUrl}
              alt="Banner preview"
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
              style={{ maxWidth: 320, borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", display: "block" }}
            />
          </div>
        )}
      </Section>

      <Section title="Payment Backend" icon={CreditCard}>
        <div style={{ marginBottom: 14, padding: "10px 14px", background: "rgba(16,185,129,0.08)", borderRadius: 8, border: "1px solid rgba(16,185,129,0.25)" }}>
          <span style={{ fontSize: 12, color: "#10b981" }}>
            Set the base URL of your payment backend server. All payment requests (deposits, withdrawals, status checks) will be sent to this URL. Leave as default if unchanged.
          </span>
        </div>
        <Field label="Payment Backend URL" hint="e.g. https://your-payment-server.railway.app — no trailing slash">
          <input
            style={inp}
            value={(settings as any).paymentBackendUrl || ""}
            onChange={e => set("paymentBackendUrl", e.target.value)}
            placeholder="https://function-bun-production-37b5.up.railway.app"
          />
        </Field>
        {(settings as any).paymentBackendUrl && (
          <div style={{ marginTop: 4, padding: "8px 12px", borderRadius: 6, background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.18)", fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
            Active endpoint: <span style={{ color: "#34d399", fontWeight: 600 }}>{(settings as any).paymentBackendUrl}</span>
          </div>
        )}
      </Section>

      <Section title="Security" icon={Shield}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 14 }}>Change Admin Password</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, maxWidth: 620 }}>
            <Field label="Current Password">
              <input style={inp} type="password" value={pwForm.current} onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))} placeholder="••••••••" />
            </Field>
            <Field label="New Password">
              <input style={inp} type="password" value={pwForm.newPw} onChange={e => setPwForm(f => ({ ...f, newPw: e.target.value }))} placeholder="••••••••" />
            </Field>
            <Field label="Confirm New Password" hint="Leave blank to keep current password">
              <input style={inp} type="password" value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} placeholder="••••••••" />
            </Field>
          </div>
          {pwMsg && pwStatus !== "idle" && (
            <div style={{ padding: "8px 12px", borderRadius: 6, marginBottom: 10, background: pwStatus === "saved" ? "#10b98122" : "#ef444422", border: `1px solid ${pwStatus === "saved" ? "#10b981" : "#ef4444"}44`, color: pwStatus === "saved" ? "#10b981" : "#f87171", fontSize: 12, maxWidth: 620 }}>
              {pwMsg}
            </div>
          )}
          <button
            onClick={changePassword}
            disabled={pwStatus === "saving" || (!pwForm.current && !pwForm.newPw)}
            style={{ padding: "8px 18px", background: pwStatus === "saved" ? "#10b981" : pwStatus === "error" ? "#ef4444" : "#6366f1", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: pwStatus === "saving" ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 8, opacity: (!pwForm.current && !pwForm.newPw) ? 0.4 : 1 }}
          >
            {pwStatus === "saving" ? <Loader size={14} style={{ animation: "spin 1s linear infinite" }} /> : null}
            {pwStatus === "saving" ? "Updating..." : pwStatus === "saved" ? "Updated!" : "Update Password"}
          </button>
        </div>
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 16, marginTop: 4 }}>
          <Toggle checked={settings.twoFactor} onChange={(v: boolean) => set("twoFactor", v)} label="Two-Factor Authentication" hint="Add an extra layer of security to your admin account" />
        </div>
      </Section>
    </div>
  );
}
