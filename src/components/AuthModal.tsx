import { useState } from "react";
import { X, Check, AlertCircle } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

type Tab = "login" | "register";
type Step = "main" | "google-phone";
type Gender = "female" | "male";
type AgeGroup = "adult" | "child";

interface AuthModalProps {
  onClose: () => void;
}

function getDiceBearUrl(name: string, gender: Gender, ageGroup: AgeGroup): string {
  const seed = encodeURIComponent(name || "User");
  const bgColor =
    gender === "female"
      ? ageGroup === "child" ? "ffc8d6,ffaec0,ffe0e9" : "f9a8d4,fbcfe8,fce7f3"
      : ageGroup === "child" ? "93c5fd,bfdbfe,dbeafe" : "7dd3fc,bae6fd,e0f2fe";
  return `https://api.dicebear.com/9.x/lorelei/svg?seed=${seed}&backgroundColor=${bgColor}&backgroundType=gradientLinear`;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone: string): boolean {
  return /^\d{10}$/.test(phone);
}

function formatPhone(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 10);
}

const inp: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.11)",
  borderRadius: 7,
  padding: "8px 12px",
  fontSize: 12,
  color: "#fff",
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.2s",
};

const lbl: React.CSSProperties = {
  fontSize: 10,
  color: "rgba(255,255,255,0.38)",
  letterSpacing: "0.07em",
  marginBottom: 4,
  display: "block",
  textTransform: "uppercase",
};

const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

function PhoneField({ value, onChange, valid, touched, autoFocus }: {
  value: string; onChange: (v: string) => void; valid: boolean; touched: boolean; autoFocus?: boolean;
}) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <label style={lbl}>Phone Number</label>
        <span style={{ fontSize: 10, color: touched ? (valid ? "#4ade80" : "rgba(255,100,100,0.7)") : "rgba(255,255,255,0.25)" }}>
          {value.length}/10
        </span>
      </div>
      <div style={{ position: "relative" }}>
        <input
          className="auth-input"
          style={{
            ...inp,
            paddingRight: 32,
            borderColor: touched ? (valid ? "rgba(74,222,128,0.4)" : "rgba(255,100,100,0.4)") : "rgba(255,255,255,0.11)",
          }}
          type="tel"
          inputMode="numeric"
          placeholder="0798776867"
          value={value}
          onChange={(e) => onChange(formatPhone(e.target.value))}
          maxLength={10}
          autoFocus={autoFocus}
        />
        {touched && (
          <div style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)" }}>
            {valid ? <Check size={13} color="#4ade80" /> : <AlertCircle size={13} color="rgba(255,100,100,0.7)" />}
          </div>
        )}
      </div>
      {touched && !valid && (
        <p style={{ fontSize: 10, color: "rgba(255,100,100,0.7)", margin: "3px 0 0", letterSpacing: "0.03em" }}>Must be exactly 10 digits</p>
      )}
    </div>
  );
}

function EmailField({ value, onChange, valid, touched, label = "Email", placeholder = "you@example.com" }: {
  value: string; onChange: (v: string) => void; valid: boolean; touched: boolean; label?: string; placeholder?: string;
}) {
  return (
    <div>
      <label style={lbl}>{label}</label>
      <div style={{ position: "relative" }}>
        <input
          className="auth-input"
          style={{
            ...inp,
            paddingRight: 32,
            borderColor: touched ? (valid ? "rgba(74,222,128,0.4)" : "rgba(255,100,100,0.4)") : "rgba(255,255,255,0.11)",
          }}
          type="email"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        {touched && (
          <div style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)" }}>
            {valid ? <Check size={13} color="#4ade80" /> : <AlertCircle size={13} color="rgba(255,100,100,0.7)" />}
          </div>
        )}
      </div>
      {touched && !valid && (
        <p style={{ fontSize: 10, color: "rgba(255,100,100,0.7)", margin: "3px 0 0", letterSpacing: "0.03em" }}>Enter a valid email address</p>
      )}
    </div>
  );
}

function GenderSelect({ value, onChange }: { value: Gender; onChange: (g: Gender) => void }) {
  return (
    <div>
      <label style={lbl}>I am a</label>
      <div style={{ display: "flex", gap: 6 }}>
        {([
          { value: "female" as Gender, label: "Girl / Woman", emoji: "👩" },
          { value: "male" as Gender, label: "Boy / Man", emoji: "👨" },
        ]).map((opt) => (
          <button key={opt.value} type="button" onClick={() => onChange(opt.value)}
            style={{
              flex: 1, padding: "7px 6px", borderRadius: 7,
              border: value === opt.value ? `1.5px solid ${opt.value === "female" ? "#f472b6" : "#60a5fa"}` : "1px solid rgba(255,255,255,0.09)",
              background: value === opt.value ? (opt.value === "female" ? "rgba(244,114,182,0.09)" : "rgba(96,165,250,0.09)") : "rgba(255,255,255,0.03)",
              color: value === opt.value ? (opt.value === "female" ? "#f9a8d4" : "#93c5fd") : "rgba(255,255,255,0.4)",
              fontSize: 11, cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 2, transition: "all 0.15s",
            }}>
            <span style={{ fontSize: 16 }}>{opt.emoji}</span>
            <span style={{ fontWeight: value === opt.value ? 600 : 400 }}>{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function AgeGroupSelect({ value, onChange }: { value: AgeGroup; onChange: (a: AgeGroup) => void }) {
  return (
    <div>
      <label style={lbl}>Age Group</label>
      <div style={{ display: "flex", gap: 6 }}>
        {([
          { value: "adult" as AgeGroup, label: "Adult", emoji: "🧑" },
          { value: "child" as AgeGroup, label: "Child", emoji: "🧒" },
        ]).map((opt) => (
          <button key={opt.value} type="button" onClick={() => onChange(opt.value)}
            style={{
              flex: 1, padding: "7px 6px", borderRadius: 7,
              border: value === opt.value ? "1.5px solid #00a9f5" : "1px solid rgba(255,255,255,0.09)",
              background: value === opt.value ? "rgba(0,169,245,0.09)" : "rgba(255,255,255,0.03)",
              color: value === opt.value ? "#7dd3fc" : "rgba(255,255,255,0.4)",
              fontSize: 11, cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 2, transition: "all 0.15s",
            }}>
            <span style={{ fontSize: 16 }}>{opt.emoji}</span>
            <span style={{ fontWeight: value === opt.value ? 600 : 400 }}>{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function AuthModal({ onClose }: AuthModalProps) {
  const { loginWithEmail, registerWithEmail, loginWithGoogle, completeGoogleRegistration } = useAuth();

  const [tab, setTab] = useState<Tab>("login");
  const [step, setStep] = useState<Step>("main");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [gender, setGender] = useState<Gender>("female");

  const [googlePhone, setGooglePhone] = useState("");
  const [googleGender, setGoogleGender] = useState<Gender>("female");
  const [googleAgeGroup, setGoogleAgeGroup] = useState<AgeGroup>("adult");
  const [googleUserName, setGoogleUserName] = useState("");
  const [googleUserEmail, setGoogleUserEmail] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const emailTouched = regEmail.length > 0;
  const emailValid = isValidEmail(regEmail);
  const phoneTouched = regPhone.length > 0;
  const phoneValid = isValidPhone(regPhone);
  const loginEmailTouched = loginEmail.length > 0;
  const loginEmailValid = isValidEmail(loginEmail);
  const googlePhoneTouched = googlePhone.length > 0;
  const googlePhoneValid = isValidPhone(googlePhone);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!loginEmailValid) { setError("Enter a valid email address."); return; }
    if (!loginPassword.trim()) { setError("Please enter your password."); return; }
    setLoading(true);
    try {
      await loginWithEmail(loginEmail, loginPassword);
      onClose();
    } catch (err: any) {
      setError(err.message?.includes("invalid-credential") ? "Invalid email or password." : (err.message || "Login failed."));
    }
    setLoading(false);
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!firstName.trim() || !lastName.trim()) { setError("Enter your first and last name."); return; }
    if (!phoneValid) { setError("Enter a valid 10-digit phone number."); return; }
    if (!emailValid) { setError("Enter a valid email address."); return; }
    if (regPassword.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true);
    try {
      const name = `${firstName} ${lastName}`;
      const avatar = getDiceBearUrl(name, gender, "adult");
      await registerWithEmail(regEmail, regPassword, name, regPhone, gender, avatar);
      onClose();
    } catch (err: any) {
      setError(err.message?.includes("email-already-in-use") ? "Email already in use." : (err.message || "Registration failed."));
    }
    setLoading(false);
  }

  async function handleGoogleLogin() {
    setLoading(true);
    setError("");
    try {
      const result = await loginWithGoogle();
      if (result.needsPhone) {
        setGoogleUserName(result.user.displayName || "Google User");
        setGoogleUserEmail(result.user.email || "");
        setStep("google-phone");
      } else {
        onClose();
      }
    } catch (err: any) {
      setError(err.message || "Google sign-in failed.");
    }
    setLoading(false);
  }

  async function handleGooglePhoneSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!googlePhoneValid) { setError("Enter a valid 10-digit phone number."); return; }
    setLoading(true);
    try {
      const avatar = getDiceBearUrl(googleUserName, googleGender, googleAgeGroup);
      await completeGoogleRegistration(googlePhone, googleGender, avatar);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to complete registration.");
    }
    setLoading(false);
  }

  const btn: React.CSSProperties = {
    width: "100%",
    padding: "9px",
    borderRadius: 7,
    background: "linear-gradient(90deg,#00a9f5,#0076d6)",
    color: "#fff",
    fontSize: 12,
    fontWeight: 700,
    border: "none",
    cursor: loading ? "not-allowed" : "pointer",
    letterSpacing: "0.07em",
    opacity: loading ? 0.7 : 1,
  };

  const gBtn: React.CSSProperties = {
    width: "100%",
    padding: "8px",
    borderRadius: 7,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  };

  const avatarPreviewUrl =
    step === "google-phone"
      ? getDiceBearUrl(googleUserName || "User", googleGender, googleAgeGroup)
      : tab === "register"
      ? getDiceBearUrl(firstName ? `${firstName} ${lastName}` : "User", gender, "adult")
      : null;

  const divider = (
    <div style={{ display: "flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,0.2)", fontSize: 10 }}>
      <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
      OR
      <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
    </div>
  );

  return (
    <div
      className="auth-modal-overlay"
      style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "flex-start", justifyContent: "flex-end", paddingTop: 66, paddingRight: 14 }}
      onClick={onClose}
    >
      <div
        className="auth-modal-box"
        style={{
          background: "#141414",
          border: "1px solid rgba(255,255,255,0.09)",
          borderRadius: 12,
          width: 320,
          maxHeight: "calc(100vh - 84px)",
          overflowY: "auto",
          boxShadow: "0 16px 48px rgba(0,0,0,0.75)",
          animation: "authSlide 0.16s ease",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <style>{`
          @keyframes authSlide { from { opacity: 0; transform: translateY(-8px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
          .auth-input:focus { border-color: rgba(0,169,245,0.55) !important; }
          .auth-goog:hover { background: rgba(255,255,255,0.08) !important; }
        `}</style>

        <div style={{ padding: "14px 16px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {step === "google-phone" ? (
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Almost there!</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 1 }}>Personalise your avatar</div>
            </div>
          ) : (
            <div style={{ display: "flex" }}>
              {(["login", "register"] as Tab[]).map((t) => (
                <button key={t} onClick={() => { setTab(t); setError(""); }}
                  style={{
                    padding: "0 14px 10px", fontSize: 13,
                    fontWeight: tab === t ? 700 : 400,
                    color: tab === t ? "#fff" : "rgba(255,255,255,0.32)",
                    background: "transparent", border: "none",
                    borderBottom: tab === t ? "2px solid #00a9f5" : "2px solid transparent",
                    cursor: "pointer", transition: "all 0.15s",
                  }}>
                  {t === "login" ? "Log In" : "Register"}
                </button>
              ))}
            </div>
          )}
          <button onClick={onClose}
            style={{ background: "rgba(255,255,255,0.06)", border: "none", borderRadius: "50%", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.45)", flexShrink: 0 }}>
            <X size={12} />
          </button>
        </div>

        <div style={{ padding: "12px 16px 18px" }}>
          {error && (
            <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 6, padding: "6px 10px", fontSize: 11, color: "#fca5a5", marginBottom: 10 }}>
              {error}
            </div>
          )}

          {avatarPreviewUrl && (
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
              <div style={{ position: "relative" }}>
                <img src={avatarPreviewUrl} alt="Avatar preview"
                  style={{ width: 56, height: 56, borderRadius: "50%", border: "2px solid rgba(0,169,245,0.35)", background: "#1a1a1a" }} />
                <div style={{
                  position: "absolute", bottom: 0, right: 0, background: "#00a9f5", borderRadius: "50%",
                  width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 9, border: "1.5px solid #141414",
                }}>✨</div>
              </div>
            </div>
          )}

          {step === "google-phone" && (
            <form onSubmit={handleGooglePhoneSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: "rgba(255,255,255,0.03)", borderRadius: 7 }}>
                <GoogleIcon />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>{googleUserName}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{googleUserEmail}</div>
                </div>
              </div>
              <GenderSelect value={googleGender} onChange={setGoogleGender} />
              <AgeGroupSelect value={googleAgeGroup} onChange={setGoogleAgeGroup} />
              <PhoneField value={googlePhone} onChange={setGooglePhone} valid={googlePhoneValid} touched={googlePhoneTouched} />
              <button type="submit" style={btn} disabled={loading}>{loading ? "Saving..." : "Complete Registration"}</button>
            </form>
          )}

          {step === "main" && tab === "login" && (
            <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <EmailField
                value={loginEmail}
                onChange={setLoginEmail}
                valid={loginEmailValid}
                touched={loginEmailTouched}
                label="Email"
                placeholder="you@example.com"
              />
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <label style={lbl}>Password</label>
                </div>
                <input className="auth-input" style={inp} type="password" placeholder="••••••••" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} />
              </div>
              <button type="submit" style={btn} disabled={loading}>{loading ? "Signing in..." : "SIGN IN"}</button>
              {divider}
              <button type="button" className="auth-goog" style={gBtn} onClick={handleGoogleLogin} disabled={loading}>
                <GoogleIcon /> Continue with Google
              </button>
              <p style={{ textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.28)", margin: 0 }}>
                No account?{" "}
                <button type="button" onClick={() => { setTab("register"); setError(""); }} style={{ background: "none", border: "none", color: "#00a9f5", cursor: "pointer", fontSize: 11, padding: 0 }}>
                  Register
                </button>
              </p>
            </form>
          )}

          {step === "main" && tab === "register" && (
            <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <GenderSelect value={gender} onChange={setGender} />
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <label style={lbl}>First Name</label>
                  <input className="auth-input" style={inp} type="text" placeholder="John" value={firstName} onChange={(e) => setFirstName(e.target.value)} autoFocus />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={lbl}>Last Name</label>
                  <input className="auth-input" style={inp} type="text" placeholder="Doe" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </div>
              </div>
              <PhoneField value={regPhone} onChange={setRegPhone} valid={phoneValid} touched={phoneTouched} />
              <EmailField value={regEmail} onChange={setRegEmail} valid={emailValid} touched={emailTouched} />
              <div>
                <label style={lbl}>Password</label>
                <input className="auth-input" style={inp} type="password" placeholder="Min 6 characters" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} />
              </div>
              <button type="submit" style={{ ...btn, marginTop: 2 }} disabled={loading}>{loading ? "Creating..." : "CREATE ACCOUNT"}</button>
              {divider}
              <button type="button" className="auth-goog" style={gBtn} onClick={handleGoogleLogin} disabled={loading}>
                <GoogleIcon /> Sign up with Google
              </button>
              <p style={{ textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.28)", margin: 0 }}>
                Have an account?{" "}
                <button type="button" onClick={() => { setTab("login"); setError(""); }} style={{ background: "none", border: "none", color: "#00a9f5", cursor: "pointer", fontSize: 11, padding: 0 }}>
                  Log in
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
