import { useState, useEffect, useRef } from "react";
import { fbApi } from "../lib/firebaseApi";
import { paymentApi, PaymentStatus } from "../lib/paymentApi";
import { useAuth } from "../contexts/AuthContext";

const DEFAULT_PLANS = [
  { id: "day1", label: "1 Day Pass", tag: "TRY IT", tagColor: "#888", price: 2500, days: 1 },
  { id: "day3", label: "3 Days Pass", tag: "POPULAR", tagColor: "#f5a623", price: 5000, days: 3 },
  { id: "week1", label: "1 Week Pass", tag: "GREAT VALUE", tagColor: "#e05a7a", price: 10000, days: 7 },
  { id: "month1", label: "1 Month Pass", tag: "BEST DEAL", tagColor: "#059669", price: 20000, days: 30 },
];

const BENEFITS = [
  { icon: "★", color: "#f5c842", title: "Members Access", desc: "Enjoy VIP exclusive content/episodes" },
  { icon: "▶", color: "#00a9f5", title: "Multi-Device Access", desc: "One account on phone, PC, and TV" },
  { icon: "HD", color: "#ff4d4d", title: "High Resolution", desc: "Watch 1080P videos" },
  { icon: "⚡", color: "#00c48c", title: "Early Access", desc: "VIP members watch new episodes first" },
  { icon: "↓", color: "#f5c842", title: "Fast Download", desc: "Boost up to 5 videos at once" },
  { icon: "AD", color: "#00a9f5", title: "Pre-roll Ad Free", desc: "Enjoy a clean, ad-free experience" },
];

function formatUGX(amount: number) {
  return "UGX " + amount.toLocaleString();
}

interface VIPModalProps {
  onClose: () => void;
  onSubscribed?: () => void;
  onOpenAuth?: () => void;
}

export default function VIPModal({ onClose, onSubscribed, onOpenAuth }: VIPModalProps) {
  const { user, profile } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState("day3");
  const [plans, setPlans] = useState(DEFAULT_PLANS);
  const [plansLoaded, setPlansLoaded] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [phone, setPhone] = useState("");
  const [payStatus, setPayStatus] = useState<PaymentStatus>("idle");
  const [error, setError] = useState("");
  const [pollCount, setPollCount] = useState(0);
  const internalRef = useRef<string>("");
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const subscriptionRef = useRef<string>("");
  const activatedRef = useRef<boolean>(false);

  useEffect(() => {
    fbApi.settings.get().then((s: any) => {
      if (s) {
        setPlans([
          { id: "day1", label: "1 Day Pass", tag: "TRY IT", tagColor: "#888", price: Number(s.plan1DayPrice ?? 2500), days: 1 },
          { id: "day3", label: "3 Days Pass", tag: "POPULAR", tagColor: "#f5a623", price: Number(s.plan3DaysPrice ?? 5000), days: 3 },
          { id: "week1", label: "1 Week Pass", tag: "GREAT VALUE", tagColor: "#e05a7a", price: Number(s.plan1WeekPrice ?? 10000), days: 7 },
          { id: "month1", label: "1 Month Pass", tag: "BEST DEAL", tagColor: "#059669", price: Number(s.plan1MonthPrice ?? 20000), days: 30 },
        ]);
      }
    }).catch(() => {}).finally(() => setPlansLoaded(true));
    if (profile?.phone) setPhone(profile.phone);
  }, [profile]);

  useEffect(() => {
    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
    };
  }, []);

  const plan = plans.find(p => p.id === selectedPlan) || plans[1];

  const handlePayClick = () => {
    if (!user) { onClose(); onOpenAuth?.(); return; }
    setError("");
    setStep(2);
  };

  const stopPolling = () => {
    if (pollTimer.current) { clearInterval(pollTimer.current); pollTimer.current = null; }
  };

  const activateInFirebase = async (txData: any) => {
    if (!user) return;
    if (activatedRef.current) return;
    activatedRef.current = true;
    const expiresAt = Date.now() + plan.days * 24 * 60 * 60 * 1000;
    await fbApi.subscriptions.create({
      userId: user.uid,
      userEmail: user.email || profile?.email || "",
      userName: profile?.name || user.displayName || "",
      userPhone: phone.trim(),
      plan: plan.id,
      planLabel: plan.label,
      amount: plan.price,
      phone: phone.trim(),
      status: "active",
      paymentMethod: "mobile_money",
      expiresAt,
      reference: subscriptionRef.current,
      providerTxId: txData?.provider_transaction_id || null,
      provider: txData?.provider || null,
      paidAt: txData?.completed_at || null,
    });
    await fbApi.activities.log({
      userId: user.uid,
      userName: profile?.name || user.displayName || "",
      userEmail: user.email || profile?.email || "",
      userPhone: phone.trim(),
      actionType: "subscription",
      page: window.location.pathname,
      metadata: JSON.stringify({ plan: plan.id, planLabel: plan.label, amount: plan.price, provider: txData?.provider }),
    });
  };

  const startPolling = () => {
    let attempts = 0;
    const MAX_ATTEMPTS = 120;

    pollTimer.current = setInterval(async () => {
      attempts++;
      setPollCount(attempts);
      try {
        const result = await paymentApi.checkStatus(internalRef.current);
        const status = result?.request_status || result?.status;

        if (status === "success" || (result?.success === true && status === "success")) {
          stopPolling();
          await activateInFirebase(result);
          setPayStatus("success");
          setStep(3);
          onSubscribed?.();
          return;
        }

        if (status === "failed" || status === "cancelled" || status === "rejected") {
          stopPolling();
          setPayStatus("failed");
          setError("Payment was declined or cancelled. Please try again.");
          return;
        }

        if (attempts >= MAX_ATTEMPTS) {
          stopPolling();
          setPayStatus("failed");
          setError("Payment timed out. If you approved the prompt, please contact support.");
        }
      } catch {
        if (attempts >= MAX_ATTEMPTS) {
          stopPolling();
          setPayStatus("failed");
          setError("Could not verify payment status. Please contact support if funds were deducted.");
        }
      }
    }, 1000);
  };

  const handleActivate = async () => {
    if (!phone.trim()) { setError("Please enter your Mobile Money phone number."); return; }
    if (!user) { onClose(); onOpenAuth?.(); return; }
    setError("");
    setPayStatus("validating");

    try {
      const validResult = await paymentApi.validatePhone(phone.trim());
      console.log("[VIPModal] Phone validation result:", validResult);
    } catch (e: any) {
      console.warn("[VIPModal] Phone validation failed (proceeding anyway):", e.message);
    }

    setPayStatus("pending");
    activatedRef.current = false;
    const reference = `SUB-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    subscriptionRef.current = reference;

    let depositResult: any;
    try {
      depositResult = await paymentApi.deposit(
        phone.trim(),
        plan.price,
        `VIP Subscription — ${plan.label}`,
        reference
      );
    } catch (e: any) {
      setPayStatus("idle");
      setError(e.message || "Could not initiate payment. Please try again.");
      return;
    }

    const intRef = depositResult?.internal_reference || depositResult?.data?.internal_reference;
    if (!intRef) {
      setPayStatus("idle");
      setError("Payment could not be initiated. Please try again.");
      return;
    }

    internalRef.current = intRef;
    setPayStatus("polling");
    setPollCount(0);
    startPolling();
  };

  const isProcessing = payStatus === "validating" || payStatus === "pending" || payStatus === "polling";

  const statusLabel = () => {
    if (payStatus === "validating") return "Validating phone number…";
    if (payStatus === "pending") return "Sending payment request…";
    if (payStatus === "polling") return "Waiting for your approval on your phone…";
    return "Confirm & Pay";
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={e => { if (e.target === e.currentTarget && !isProcessing) onClose(); }}
    >
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.72)", backdropFilter: "blur(3px)" }} />

      <div className="vip-modal-container" style={{ position: "relative", width: 820, maxWidth: "95vw", maxHeight: "90vh", overflowY: "auto", borderRadius: 16, background: "#fff", display: "flex", boxShadow: "0 20px 60px rgba(0,0,0,0.5)", color: "#1a1a1a" }}>

        {/* Left panel */}
        <div className="vip-modal-left" style={{ flex: 1, padding: "24px 24px 28px", minWidth: 0, borderRight: "1px solid #f0f0f0" }}>
          <button onClick={() => { if (!isProcessing) onClose(); }} style={{ position: "absolute", top: 14, right: 14, width: 28, height: 28, borderRadius: "50%", background: "rgba(220,38,38,0.12)", border: "1.5px solid rgba(220,38,38,0.3)", cursor: isProcessing ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "#ef4444", lineHeight: 1 }}>×</button>

          <div className="vip-user-info" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, paddingLeft: 4 }}>
            <img
              src={profile?.avatar || user?.photoURL || `https://api.dicebear.com/9.x/lorelei/svg?seed=${user?.uid || "guest"}`}
              alt="avatar"
              className="vip-user-avatar"
              style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", background: "#f0e0c0", border: "2px solid rgba(245,166,35,0.3)", flexShrink: 0 }}
            />
            {user ? (
              <div style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a" }}>
                {profile?.name || user.email}
                <div style={{ fontSize: 11, color: "#999", fontWeight: 400 }}>{user.email}</div>
              </div>
            ) : (
              <span style={{ fontSize: 15, fontWeight: 600, color: "#1a1a1a" }}>
                Log in to subscribe <span style={{ fontSize: 13, color: "#999" }}>&gt;</span>
              </span>
            )}
          </div>

          {/* Plan cards */}
          <div className="vip-plan-cards-row" style={{ display: "flex", gap: 10, marginBottom: 14, overflowX: "auto", paddingBottom: 4, scrollbarWidth: "none" }}>
            {!plansLoaded ? (
              [1,2,3,4].map(i => (
                <div key={i} style={{ flexShrink: 0, width: 130, height: 88, borderRadius: 12, background: "#f0f0f0", animation: "pulse 1.2s ease-in-out infinite" }} />
              ))
            ) : plans.map(p => (
              <button
                key={p.id}
                className="vip-plan-card"
                onClick={() => { if (!isProcessing) { setSelectedPlan(p.id); if (step === 2) setStep(1); } }}
                style={{
                  flexShrink: 0, width: 130, padding: "14px 10px 16px", borderRadius: 12,
                  border: selectedPlan === p.id ? "2px solid #f5a623" : "2px solid #eee",
                  background: selectedPlan === p.id ? "linear-gradient(160deg,#fff9ee 0%,#fff3d0 100%)" : "#fafafa",
                  cursor: isProcessing ? "not-allowed" : "pointer", textAlign: "center", position: "relative", transition: "all 0.15s",
                }}
              >
                <div style={{ position: "absolute", top: -1, left: -1, background: p.tagColor, color: "#fff", fontSize: 8, fontWeight: 700, padding: "1px 5px", borderRadius: "10px 0 10px 0", letterSpacing: "0.03em" }}>{p.tag}</div>
                <div className="vip-plan-label" style={{ fontSize: 12, fontWeight: 600, color: selectedPlan === p.id ? "#c07800" : "#666", marginBottom: 10, marginTop: 12, lineHeight: 1.4 }}>{p.label}</div>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 2, marginBottom: 4 }}>
                  <span className="vip-plan-ugx" style={{ fontSize: 11, fontWeight: 700, color: selectedPlan === p.id ? "#c07800" : "#888" }}>UGX</span>
                  <span className="vip-plan-price" style={{ fontSize: 22, fontWeight: 900, color: selectedPlan === p.id ? "#c07800" : "#333", lineHeight: 1 }}>
                    {p.price >= 1000 ? `${(p.price / 1000).toFixed(0)}K` : p.price.toLocaleString()}
                  </span>
                </div>
                <div className="vip-plan-full" style={{ fontSize: 10, color: selectedPlan === p.id ? "#d4a000" : "#bbb" }}>{p.price.toLocaleString()} UGX</div>
              </button>
            ))}
          </div>

          <div className="vip-affordable" style={{ fontSize: 12, color: "#f5a623", marginBottom: 22, paddingLeft: 2, display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ fontSize: 14 }}>•</span>
            Affordable access — start watching in seconds!
          </div>

          <div className="vip-benefits-title" style={{ fontWeight: 700, fontSize: 17, marginBottom: 16 }}>VIP Membership Benefits</div>
          <div className="vip-benefits-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 20px" }}>
            {BENEFITS.map(b => (
              <div key={b.title} className="vip-benefit-item" style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <div className="vip-benefit-icon" style={{ width: 34, height: 34, borderRadius: 8, background: b.color + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: b.icon.length > 1 ? 10 : 16, fontWeight: 900, color: b.color, flexShrink: 0 }}>{b.icon}</div>
                <div>
                  <div className="vip-benefit-name" style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a" }}>{b.title}</div>
                  <div className="vip-benefit-desc" style={{ fontSize: 11, color: "#999", marginTop: 2, lineHeight: 1.4 }}>{b.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div className="vip-modal-right" style={{ width: 240, flexShrink: 0, padding: "20px 20px 24px", display: "flex", flexDirection: "column", background: "#fff", borderRadius: "0 16px 16px 0" }}>

          {step === 3 ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: 16 }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#059669", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>✓</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#059669" }}>Subscription Activated!</div>
              <div style={{ fontSize: 13, color: "#555", lineHeight: 1.5 }}>
                Your <strong>{plan.label}</strong> is now active.<br />
                Enjoy full access to all content!
              </div>
              <div style={{ fontSize: 11, color: "#aaa" }}>
                Expires in {plan.days} day{plan.days > 1 ? "s" : ""}
              </div>
              <button
                onClick={onClose}
                style={{ width: "100%", padding: "12px", borderRadius: 30, background: "#059669", border: "none", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", marginTop: 8 }}
              >
                Start Watching
              </button>
            </div>
          ) : step === 2 ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 0 }}>
              <button onClick={() => { if (!isProcessing) { setStep(1); setError(""); setPayStatus("idle"); stopPolling(); } }} style={{ background: "none", border: "none", color: "#888", fontSize: 12, cursor: isProcessing ? "not-allowed" : "pointer", textAlign: "left", marginBottom: 14, padding: 0 }}>← Back</button>

              <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a", marginBottom: 4 }}>Complete Payment</div>

              <div style={{ background: "#fffdf5", border: "1px solid #f5e0a0", borderRadius: 10, padding: "12px 14px", marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: "#999", marginBottom: 2 }}>Selected Plan</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#c07800" }}>{plan.label}</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#1a1a1a", lineHeight: 1.2 }}>{formatUGX(plan.price)}</div>
                <div style={{ fontSize: 10, color: "#aaa", marginTop: 4 }}>Valid for {plan.days} day{plan.days > 1 ? "s" : ""}</div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <img src="https://www.galaxyfm.co.ug/wp-content/uploads/2018/05/Airtel-MTN-Money-logo-horz-.jpg" alt="Mobile Money" style={{ width: "100%", maxWidth: 160, height: "auto", objectFit: "contain", borderRadius: 4, display: "block", margin: "0 auto 8px" }} />
                <div style={{ fontSize: 11, color: "#888", textAlign: "center" }}>Pay via Airtel Money or MTN Mobile Money</div>
              </div>

              <label style={{ fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 5, display: "block" }}>
                Mobile Money Number
              </label>
              <input
                type="tel"
                placeholder="e.g. 0770 123 456"
                value={phone}
                onChange={e => { if (!isProcessing) { setPhone(e.target.value); setError(""); } }}
                style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 8, border: (error && !isProcessing) ? "1.5px solid #ef4444" : "1.5px solid #e0c87a", fontSize: 14, outline: "none", color: "#1a1a1a", background: "#fffef8", marginBottom: 6 }}
                autoFocus
                disabled={isProcessing}
              />

              {payStatus === "polling" && (
                <div style={{ background: "#fff9e6", border: "1px solid #f5c842", borderRadius: 8, padding: "10px 12px", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Spinner />
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#c07800" }}>Awaiting your approval</div>
                      <div style={{ fontSize: 11, color: "#a06000", marginTop: 2 }}>Check your phone for a payment prompt and approve it.</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 10, color: "#bbb", marginTop: 6 }}>Checking status… ({Math.min(pollCount * 5, 120)}s)</div>
                </div>
              )}

              {payStatus === "validating" && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <Spinner small />
                  <span style={{ fontSize: 11, color: "#888" }}>Validating phone number…</span>
                </div>
              )}

              {payStatus === "pending" && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <Spinner small />
                  <span style={{ fontSize: 11, color: "#888" }}>Sending payment request…</span>
                </div>
              )}

              {error && payStatus !== "polling" && (
                <div style={{ fontSize: 11, color: "#ef4444", marginBottom: 8 }}>{error}</div>
              )}
              {error && payStatus === "failed" && (
                <div style={{ fontSize: 11, color: "#ef4444", marginBottom: 8 }}>{error}</div>
              )}

              <div style={{ fontSize: 10, color: "#aaa", marginBottom: 14, lineHeight: 1.5 }}>
                You'll receive a payment prompt on your phone. Approve it to activate your subscription.
              </div>

              <div style={{ flex: 1 }} />

              {payStatus === "failed" ? (
                <button
                  onClick={() => { setPayStatus("idle"); setError(""); }}
                  style={{ width: "100%", padding: "13px", borderRadius: 30, background: "#ef4444", border: "none", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer" }}
                >
                  Try Again
                </button>
              ) : (
                <button
                  onClick={handleActivate}
                  disabled={isProcessing}
                  style={{ width: "100%", padding: "13px", borderRadius: 30, background: isProcessing ? "#e5c87a" : "linear-gradient(90deg,#f5c842 0%,#ffdd9a 50%,#e8a800 100%)", border: "none", color: "#3d2200", fontSize: 14, fontWeight: 800, cursor: isProcessing ? "not-allowed" : "pointer", boxShadow: "0 4px 16px rgba(245,200,66,0.4)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                >
                  {isProcessing && <Spinner small />}
                  {statusLabel()}
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="vip-qr-block" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 22, paddingBottom: 18, borderBottom: "1px dashed #e8e8e8" }}>
                <button style={{ flex: 1, padding: "8px 10px", borderRadius: 8, border: "1.5px solid #ff6b35", background: "#fff", color: "#ff6b35", fontSize: 12, fontWeight: 600, cursor: "pointer", lineHeight: 1.3, textAlign: "center" }}>
                  Pay with the<br />LUO FILM APP
                </button>
                <div style={{ width: 44, height: 44, background: "#f5f5f5", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
                  <QRPattern />
                </div>
              </div>

              <div className="vip-right-price-block" style={{ textAlign: "center", marginBottom: 10 }}>
                <div className="vip-right-plan-name" style={{ fontSize: 12, fontWeight: 700, color: "#999", marginBottom: 4, letterSpacing: "0.05em" }}>{plan.label.toUpperCase()}</div>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 4, flexWrap: "wrap" }}>
                  <span className="vip-right-ugx" style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a" }}>UGX</span>
                  <span className="vip-right-price" style={{ fontSize: 42, fontWeight: 900, color: "#1a1a1a", lineHeight: 1 }}>{plan.price.toLocaleString()}</span>
                </div>
                <div style={{ marginTop: 8 }}>
                  <span style={{ display: "inline-block", padding: "3px 14px", borderRadius: 20, background: plan.tagColor, color: "#fff", fontSize: 11, fontWeight: 700 }}>{plan.tag}</span>
                </div>
              </div>

              <div className="vip-right-divider" style={{ borderTop: "1px dashed #e8e8e8", margin: "14px 0" }} />

              <div className="vip-payment-title" style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: "#1a1a1a" }}>Choose Payment Method</div>

              <div className="vip-payment-method" style={{ border: "2px solid #f5a623", borderRadius: 10, padding: "10px 12px", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, marginBottom: 8, position: "relative", background: "#fffdf5", cursor: "pointer" }}>
                <img src="https://www.galaxyfm.co.ug/wp-content/uploads/2018/05/Airtel-MTN-Money-logo-horz-.jpg" alt="Airtel Money & MTN Mobile Money" style={{ width: "100%", maxWidth: 160, height: "auto", objectFit: "contain", borderRadius: 4 }} />
                <div style={{ fontSize: 10, color: "#999" }}>Mobile Money · Instant Activation</div>
                <div style={{ position: "absolute", bottom: -1, right: -1, width: 18, height: 18, borderRadius: "50%", background: "#f5a623", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#fff", fontWeight: 700 }}>✓</div>
              </div>

              {error && <div style={{ fontSize: 11, color: "#ef4444", margin: "6px 0" }}>{error}</div>}

              <div style={{ flex: 1 }} />

              <button
                className="vip-pay-btn"
                onClick={handlePayClick}
                style={{ width: "100%", padding: "14px", borderRadius: 30, background: "linear-gradient(90deg,#f5c842 0%,#ffdd9a 50%,#e8a800 100%)", border: "none", color: "#3d2200", fontSize: 15, fontWeight: 800, cursor: "pointer", marginTop: 18, boxShadow: "0 4px 16px rgba(245,200,66,0.45)", transition: "filter 0.2s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.filter = "brightness(1.06)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.filter = "brightness(1)"; }}
              >
                Pay {formatUGX(plan.price)}
              </button>

              <div className="vip-terms" style={{ marginTop: 12, textAlign: "center", fontSize: 10, color: "#1677ff", lineHeight: 1.6 }}>
                <button style={{ background: "none", border: "none", color: "#1677ff", fontSize: 10, cursor: "pointer", textDecoration: "underline" }}>VIP Membership Terms</button>
                {" "}
                <button style={{ background: "none", border: "none", color: "#1677ff", fontSize: 10, cursor: "pointer", textDecoration: "underline" }}>Privacy Policy</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Spinner({ small }: { small?: boolean }) {
  const size = small ? 12 : 18;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ animation: "spin 0.9s linear infinite", flexShrink: 0 }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <circle cx="12" cy="12" r="10" stroke="#c07800" strokeWidth="3" fill="none" strokeDasharray="31.4 31.4" strokeLinecap="round" />
    </svg>
  );
}

function QRPattern() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <rect x="2" y="2" width="14" height="14" rx="1" fill="#1a1a1a" />
      <rect x="4" y="4" width="10" height="10" rx="0.5" fill="#fff" />
      <rect x="6" y="6" width="6" height="6" rx="0.5" fill="#1a1a1a" />
      <rect x="24" y="2" width="14" height="14" rx="1" fill="#1a1a1a" />
      <rect x="26" y="4" width="10" height="10" rx="0.5" fill="#fff" />
      <rect x="28" y="6" width="6" height="6" rx="0.5" fill="#1a1a1a" />
      <rect x="2" y="24" width="14" height="14" rx="1" fill="#1a1a1a" />
      <rect x="4" y="26" width="10" height="10" rx="0.5" fill="#fff" />
      <rect x="6" y="28" width="6" height="6" rx="0.5" fill="#1a1a1a" />
      <rect x="20" y="20" width="3" height="3" fill="#1a1a1a" /><rect x="24" y="20" width="3" height="3" fill="#1a1a1a" />
      <rect x="28" y="20" width="3" height="3" fill="#1a1a1a" /><rect x="32" y="20" width="3" height="3" fill="#1a1a1a" />
      <rect x="20" y="24" width="3" height="3" fill="#1a1a1a" /><rect x="28" y="24" width="3" height="3" fill="#1a1a1a" />
      <rect x="32" y="24" width="3" height="3" fill="#1a1a1a" /><rect x="24" y="28" width="3" height="3" fill="#1a1a1a" />
      <rect x="28" y="28" width="3" height="3" fill="#1a1a1a" /><rect x="20" y="32" width="3" height="3" fill="#1a1a1a" />
      <rect x="24" y="32" width="3" height="3" fill="#1a1a1a" /><rect x="32" y="32" width="3" height="3" fill="#1a1a1a" />
    </svg>
  );
}
