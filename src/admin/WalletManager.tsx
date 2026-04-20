import { useState, useEffect } from "react";
import { Wallet, TrendingUp, TrendingDown, ArrowDownCircle, Plus, RefreshCw, Wifi } from "lucide-react";
import { api } from "./api";
import { paymentApi } from "../lib/paymentApi";

const CURRENCY_SYMBOLS: Record<string, string> = {
  UGX: "UGX", USD: "$", EUR: "€", GBP: "£", KES: "KES",
  NGN: "₦", GHS: "GH₵", ZAR: "R", TZS: "TZS", RWF: "RWF",
};

const inp = {
  width: "100%", boxSizing: "border-box" as const, background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 12px",
  color: "#fff", fontSize: 13, outline: "none"
};

function Modal({ title, onClose, children }: any) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
      <div style={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, width: "100%", maxWidth: 440 }}>
        <div style={{ padding: "18px 24px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", justifyContent: "space-between" }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#fff" }}>{title}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: 20 }}>×</button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" style={{ animation: "wspin 0.9s linear infinite" }}>
      <style>{`@keyframes wspin { to { transform: rotate(360deg); } }`}</style>
      <circle cx="12" cy="12" r="10" stroke="#fff" strokeWidth="3" fill="none" strokeDasharray="31.4 31.4" strokeLinecap="round" />
    </svg>
  );
}

export default function WalletManager() {
  const [wallet, setWallet] = useState<any>(null);
  const [apiBalance, setApiBalance] = useState<any>(null);
  const [apiBalanceLoading, setApiBalanceLoading] = useState(true);
  const [modal, setModal] = useState<"withdraw" | "topup" | null>(null);
  const [form, setForm] = useState({ amount: "", description: "", phone: "", accountDetails: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [withdrawStatus, setWithdrawStatus] = useState<"idle" | "processing" | "polling" | "success" | "failed">("idle");
  const [withdrawError, setWithdrawError] = useState("");
  const [platformCurrency, setPlatformCurrency] = useState("UGX");

  const loadFirebase = () => {
    return Promise.all([
      api.wallet.get(),
      api.settings.get(),
    ]).then(([walletData, settingsData]: [any, any]) => {
      setWallet(walletData);
      if (settingsData?.currency) setPlatformCurrency(settingsData.currency);
    });
  };

  const loadApiBalance = () => {
    setApiBalanceLoading(true);
    paymentApi.walletBalance()
      .then(setApiBalance)
      .catch(() => setApiBalance(null))
      .finally(() => setApiBalanceLoading(false));
  };

  const load = () => {
    setLoading(true);
    Promise.all([loadFirebase(), loadApiBalance()])
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const currSym = CURRENCY_SYMBOLS[platformCurrency] || platformCurrency;
  const fmt = (v: number) => `${currSym} ${v.toLocaleString()}`;

  const withdraw = async () => {
    if (!form.amount || Number(form.amount) <= 0) { setWithdrawError("Please enter a valid amount."); return; }
    if (!form.phone.trim()) { setWithdrawError("Please enter the Mobile Money phone number to send funds to."); return; }

    setSaving(true);
    setWithdrawError("");
    setWithdrawStatus("processing");

    const amount = Number(form.amount);
    const reference = `WD-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    try {
      const result = await paymentApi.withdraw(
        form.phone.trim(),
        amount,
        form.description || "Admin withdrawal",
        reference
      );

      const intRef = result?.internal_reference || result?.data?.internal_reference;
      if (!intRef) throw new Error("No internal reference returned from payment API.");

      setWithdrawStatus("polling");

      let attempts = 0;
      const MAX = 20;
      const poll = setInterval(async () => {
        attempts++;
        try {
          const status = await paymentApi.checkStatus(intRef);
          const reqStatus = status?.request_status || status?.status;

          if (reqStatus === "success" || (status?.success === true && reqStatus === "success")) {
            clearInterval(poll);
            await api.wallet.withdraw({ amount, description: form.description || "Admin withdrawal (Mobile Money)", note: reference });
            setWithdrawStatus("success");
            setSaving(false);
            loadFirebase();
            return;
          }

          if (reqStatus === "failed" || reqStatus === "cancelled" || reqStatus === "rejected") {
            clearInterval(poll);
            setWithdrawStatus("failed");
            setWithdrawError("Payment was declined or failed. Please try again.");
            setSaving(false);
            return;
          }

          if (attempts >= MAX) {
            clearInterval(poll);
            setWithdrawStatus("failed");
            setWithdrawError("Payment timed out. Please check payment status manually.");
            setSaving(false);
          }
        } catch {
          if (attempts >= MAX) {
            clearInterval(poll);
            setWithdrawStatus("failed");
            setWithdrawError("Could not verify payment. Please check manually.");
            setSaving(false);
          }
        }
      }, 5000);
    } catch (e: any) {
      setWithdrawStatus("failed");
      setWithdrawError(e.message || "Withdrawal failed. Please try again.");
      setSaving(false);
    }
  };

  const topup = async () => {
    setSaving(true);
    try {
      await api.wallet.topup({ amount: Number(form.amount), description: form.description });
      setModal(null);
      setForm({ amount: "", description: "", phone: "", accountDetails: "" });
      loadFirebase();
    } catch (e) { alert(String(e)); }
    setSaving(false);
  };

  if (loading) return <p style={{ color: "rgba(255,255,255,0.4)" }}>Loading...</p>;

  return (
    <div>
      <div style={{ marginBottom: 28, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#fff", margin: 0 }}>Wallet Management</h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>Manage your platform wallet and withdrawals</p>
        </div>
        <button onClick={load} style={{ padding: "8px 16px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "rgba(255,255,255,0.6)", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Firebase wallet stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 16 }}>
        {[
          { icon: Wallet, label: "Firebase Balance", value: fmt(wallet?.balance || 0), color: "#6366f1", sub: "From subscriptions" },
          { icon: TrendingUp, label: "Total Earned", value: fmt(wallet?.totalEarned || 0), color: "#10b981", sub: "All time" },
          { icon: TrendingDown, label: "Total Withdrawn", value: fmt(wallet?.totalWithdrawn || 0), color: "#ef4444", sub: "All time" },
        ].map(({ icon: Icon, label, value, color, sub }) => (
          <div key={label} style={{ background: "#111118", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "24px 28px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: `${color}22`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={20} color={color} />
              </div>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.45)" }}>{label}</span>
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, color, marginBottom: 4 }}>{value}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Real API balance card */}
      <div style={{ background: "#0f1929", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 12, padding: "20px 24px", marginBottom: 32, display: "flex", alignItems: "center", gap: 20 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: "#10b98122", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Wifi size={22} color="#10b981" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>Live Payment Gateway Balance</div>
          {apiBalanceLoading ? (
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.4)" }}>Loading live balance…</div>
          ) : apiBalance ? (
            <div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#10b981" }}>
                {apiBalance.currency || "UGX"} {Number(apiBalance.balance ?? apiBalance.available_balance ?? 0).toLocaleString()}
              </div>
              {(apiBalance.available_balance !== undefined || apiBalance.ledger_balance !== undefined) && (
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>
                  {apiBalance.ledger_balance !== undefined && `Ledger: UGX ${Number(apiBalance.ledger_balance).toLocaleString()}`}
                </div>
              )}
            </div>
          ) : (
            <div style={{ fontSize: 13, color: "#ef4444" }}>Could not load live balance</div>
          )}
        </div>
        <button
          onClick={loadApiBalance}
          style={{ padding: "6px 14px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}
        >
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 32 }}>
        <button onClick={() => { setModal("withdraw"); setWithdrawStatus("idle"); setWithdrawError(""); }} style={{ padding: "10px 24px", background: "#ef4444", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
          <ArrowDownCircle size={16} /> Withdraw Funds
        </button>
        <button onClick={() => setModal("topup")} style={{ padding: "10px 24px", background: "#10b981", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
          <Plus size={16} /> Add Funds (Manual)
        </button>
      </div>

      <div style={{ background: "#111118", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 24 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: "#fff", margin: "0 0 16px" }}>Wallet Summary</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>Firebase Balance</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "#10b981" }}>{fmt(wallet?.balance || 0)}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>Live API Balance</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "#6366f1" }}>
              {apiBalanceLoading ? "…" : apiBalance ? `UGX ${Number(apiBalance.balance ?? apiBalance.available_balance ?? 0).toLocaleString()}` : "N/A"}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>Last Updated</div>
            <div style={{ fontSize: 14, color: "#fff" }}>{wallet?.updatedAt ? new Date(wallet.updatedAt).toLocaleString() : "-"}</div>
          </div>
        </div>
      </div>

      {modal === "withdraw" && (
        <Modal title="Withdraw Funds via Mobile Money" onClose={() => { if (!saving) { setModal(null); setWithdrawStatus("idle"); setWithdrawError(""); setForm({ amount: "", description: "", phone: "", accountDetails: "" }); } }}>
          {withdrawStatus === "success" ? (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#10b981", marginBottom: 8 }}>Withdrawal Successful!</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 20 }}>Funds have been sent to {form.phone}.</div>
              <button onClick={() => { setModal(null); setWithdrawStatus("idle"); setWithdrawError(""); setForm({ amount: "", description: "", phone: "", accountDetails: "" }); }} style={{ padding: "10px 24px", background: "#10b981", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Done</button>
            </div>
          ) : withdrawStatus === "polling" ? (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <svg width="40" height="40" viewBox="0 0 24 24" style={{ animation: "wspin 0.9s linear infinite", marginBottom: 16 }}>
                <circle cx="12" cy="12" r="10" stroke="#6366f1" strokeWidth="3" fill="none" strokeDasharray="31.4 31.4" strokeLinecap="round" />
              </svg>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 8 }}>Processing Withdrawal…</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>Verifying payment status with the gateway. Please wait.</div>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 5, fontWeight: 600 }}>Amount (UGX)</label>
                <input style={inp} type="number" step="1" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0" disabled={saving} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 5, fontWeight: 600 }}>Send to Mobile Money Number</label>
                <input style={inp} type="tel" placeholder="e.g. 0770 123 456" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} disabled={saving} />
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>Airtel or MTN Uganda number</div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 5, fontWeight: 600 }}>Description (optional)</label>
                <input style={inp} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Reason for withdrawal" disabled={saving} />
              </div>

              {withdrawError && (
                <div style={{ padding: "10px 14px", background: "#ef444411", borderRadius: 8, border: "1px solid #ef444433", marginBottom: 14 }}>
                  <span style={{ fontSize: 12, color: "#f87171" }}>{withdrawError}</span>
                </div>
              )}

              <div style={{ padding: "10px 14px", background: "#ef444411", borderRadius: 8, border: "1px solid #ef444433", marginBottom: 20 }}>
                <span style={{ fontSize: 12, color: "#f87171" }}>Firebase balance: {fmt(wallet?.balance || 0)} · API balance: {apiBalanceLoading ? "…" : apiBalance ? `UGX ${Number(apiBalance.balance ?? 0).toLocaleString()}` : "N/A"}</span>
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button onClick={() => { setModal(null); setWithdrawStatus("idle"); setWithdrawError(""); }} style={{ ...inp, width: "auto", cursor: "pointer" }} disabled={saving}>Cancel</button>
                <button onClick={withdraw} disabled={saving} style={{ padding: "8px 20px", background: "#ef4444", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                  {saving && <Spinner />}
                  {saving ? "Processing…" : "Send via Mobile Money"}
                </button>
              </div>
            </>
          )}
        </Modal>
      )}

      {modal === "topup" && (
        <Modal title="Add Funds (Manual)" onClose={() => setModal(null)}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 5, fontWeight: 600 }}>Amount ({platformCurrency})</label>
            <input style={inp} type="number" step="1" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0" />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 5, fontWeight: 600 }}>Description</label>
            <input style={inp} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Source of funds" />
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button onClick={() => setModal(null)} style={{ ...inp, width: "auto", cursor: "pointer" }}>Cancel</button>
            <button onClick={topup} disabled={saving} style={{ padding: "8px 20px", background: "#10b981", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              {saving ? "Processing..." : "Add Funds"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
