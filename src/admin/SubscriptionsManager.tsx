import { useState, useEffect, useRef } from "react";
import { Plus, Edit, Trash2, Search, CheckCircle, XCircle } from "lucide-react";
import { api } from "./api";

const inp = {
  width: "100%", boxSizing: "border-box" as const, background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 12px",
  color: "#fff", fontSize: 13, outline: "none"
};

const PLANS = [
  { id: "day1", label: "1 Day Pass", days: 1, price: 2500 },
  { id: "day3", label: "3 Days Pass", days: 3, price: 5000 },
  { id: "week1", label: "1 Week Pass", days: 7, price: 10000 },
  { id: "month1", label: "1 Month Pass", days: 30, price: 20000 },
];

const PLAN_MAP: Record<string, { label: string; days: number; price: number }> = Object.fromEntries(PLANS.map(p => [p.id, p]));

const STATUS_COLORS: Record<string, string> = {
  active: "#10b981", inactive: "#6b7280", expired: "#f59e0b", cancelled: "#ef4444", pending: "#3b82f6",
};

function Badge({ c, label }: { c: string; label: string }) {
  return <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, background: `${c}22`, color: c, textTransform: "capitalize" }}>{label}</span>;
}

function Modal({ title, onClose, children }: any) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
      <div style={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, width: "100%", maxWidth: 560, maxHeight: "90vh", overflow: "auto" }}>
        <div style={{ padding: "18px 24px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", justifyContent: "space-between" }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#fff" }}>{title}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: 20 }}>×</button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  );
}

function UserSearch({ value, onChange }: { value: any; onChange: (user: any) => void }) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    api.users.list({ search: q }).then((d: any) => {
      setResults((d.users || []).slice(0, 8));
    }).catch(() => {}).finally(() => setLoading(false));
  };

  const handleInput = (val: string) => {
    setSearch(val);
    setOpen(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => doSearch(val), 300);
  };

  const select = (u: any) => {
    onChange(u);
    setSearch(u.name || u.email || "");
    setOpen(false);
  };

  return (
    <div style={{ position: "relative" }}>
      <input
        style={inp}
        placeholder="Search user by name or email…"
        value={value ? (value.name || value.email || search) : search}
        onChange={e => { onChange(null); handleInput(e.target.value); }}
        onFocus={() => { if (!value) setOpen(true); }}
      />
      {open && (search.length > 0) && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 100, background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, overflow: "hidden", boxShadow: "0 8px 24px rgba(0,0,0,0.6)" }}>
          {loading && <div style={{ padding: "10px 14px", color: "rgba(255,255,255,0.4)", fontSize: 12 }}>Searching…</div>}
          {!loading && results.length === 0 && <div style={{ padding: "10px 14px", color: "rgba(255,255,255,0.4)", fontSize: 12 }}>No users found</div>}
          {results.map(u => (
            <button key={u.id} onClick={() => select(u)} style={{ width: "100%", padding: "10px 14px", background: "transparent", border: "none", color: "#fff", cursor: "pointer", textAlign: "left", display: "flex", flexDirection: "column", gap: 2 }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(99,102,241,0.2)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              <span style={{ fontSize: 13, fontWeight: 600 }}>{u.name || "No name"}</span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{u.email} · {u.phone || "no phone"}</span>
            </button>
          ))}
        </div>
      )}
      {value && (
        <div style={{ marginTop: 6, padding: "8px 12px", background: "#10b98115", borderRadius: 6, border: "1px solid #10b98133", fontSize: 12, color: "#34d399" }}>
          ✓ Selected: <strong>{value.name || value.email}</strong> {value.phone ? `· ${value.phone}` : ""}
        </div>
      )}
    </div>
  );
}

function AddSubForm({ onSave, onClose, settings }: any) {
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedPlan, setSelectedPlan] = useState(PLANS[1]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    if (!selectedUser) { setError("Please select a user."); return; }
    setError("");
    setSaving(true);
    try {
      const planInfo = selectedPlan;
      const now = Date.now();
      const expiresAt = now + planInfo.days * 24 * 60 * 60 * 1000;
      const price = settings?.[`plan${planInfo.id.charAt(0).toUpperCase() + planInfo.id.slice(1)}Price`] || planInfo.price;
      await api.subscriptions.create({
        userId: selectedUser.id,
        userEmail: selectedUser.email || "",
        userName: selectedUser.name || "",
        userPhone: selectedUser.phone || "",
        plan: planInfo.id,
        planLabel: planInfo.label,
        amount: price,
        phone: selectedUser.phone || "",
        status: "active",
        paymentMethod: "admin_manual",
        expiresAt,
        createdAt: now,
        activatedBy: "Admin",
        reference: `ADMIN-${Date.now()}`,
      });
      onSave();
    } catch (e: any) {
      setError(e.message || "Failed to create subscription.");
    }
    setSaving(false);
  };

  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <label style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 6, fontWeight: 600 }}>Select User *</label>
        <UserSearch value={selectedUser} onChange={setSelectedUser} />
      </div>

      <div style={{ marginBottom: 18 }}>
        <label style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 6, fontWeight: 600 }}>Select Plan *</label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {PLANS.map(p => (
            <button key={p.id} onClick={() => setSelectedPlan(p)}
              style={{ padding: "12px 14px", borderRadius: 10, border: selectedPlan.id === p.id ? "2px solid #6366f1" : "1px solid rgba(255,255,255,0.1)", background: selectedPlan.id === p.id ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.03)", cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: selectedPlan.id === p.id ? "#818cf8" : "#fff" }}>{p.label}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 3 }}>UGX {p.price.toLocaleString()} · {p.days} day{p.days > 1 ? "s" : ""}</div>
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: "12px 16px", background: "rgba(99,102,241,0.1)", borderRadius: 8, border: "1px solid rgba(99,102,241,0.2)", marginBottom: 18 }}>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>Activation Summary</div>
        <div style={{ fontSize: 14, color: "#fff", fontWeight: 600 }}>
          {selectedUser ? (selectedUser.name || selectedUser.email) : "No user selected"} — {selectedPlan.label}
        </div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
          Amount: UGX {selectedPlan.price.toLocaleString()} · Expires in {selectedPlan.days} day{selectedPlan.days > 1 ? "s" : ""}
        </div>
      </div>

      {error && <div style={{ padding: "8px 12px", background: "#ef444415", borderRadius: 6, border: "1px solid #ef444433", color: "#f87171", fontSize: 12, marginBottom: 14 }}>{error}</div>}

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button onClick={onClose} style={{ ...inp, width: "auto", cursor: "pointer" }}>Cancel</button>
        <button onClick={save} disabled={saving} style={{ padding: "8px 20px", background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer" }}>
          {saving ? "Activating…" : "Activate Subscription"}
        </button>
      </div>
    </div>
  );
}

function EditSubForm({ initial, onSave, onClose }: any) {
  const [form, setForm] = useState({
    status: initial?.status || "active",
    activatedBy: initial?.activatedBy || "Admin",
    notes: initial?.notes || "",
  });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      await api.subscriptions.update(initial.id, { ...initial, ...form });
      onSave();
    } catch (e) { alert(String(e)); }
    setSaving(false);
  };

  return (
    <div>
      <div style={{ padding: "12px 16px", background: "rgba(255,255,255,0.04)", borderRadius: 8, marginBottom: 18 }}>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>Subscription</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{initial.planLabel || initial.plan}</div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{initial.userName} · {initial.userEmail}</div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 5, fontWeight: 600 }}>Status</label>
        <select style={inp} value={form.status} onChange={e => set("status", e.target.value)}>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="expired">Expired</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 5, fontWeight: 600 }}>Activated By</label>
        <input style={inp} value={form.activatedBy} onChange={e => set("activatedBy", e.target.value)} />
      </div>
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 5, fontWeight: 600 }}>Notes</label>
        <textarea style={{ ...inp, minHeight: 60, resize: "vertical" }} value={form.notes} onChange={e => set("notes", e.target.value)} />
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button onClick={onClose} style={{ ...inp, width: "auto", cursor: "pointer" }}>Cancel</button>
        <button onClick={save} style={{ padding: "8px 20px", background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          {saving ? "Saving..." : "Update"}
        </button>
      </div>
    </div>
  );
}

export default function SubscriptionsManager() {
  const [subs, setSubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [modal, setModal] = useState<null | "create" | any>(null);
  const [settings, setSettings] = useState<any>(null);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.subscriptions.list({ status: statusFilter, plan: planFilter }),
      api.settings.get(),
    ]).then(([d, s]: [any, any]) => {
      let res = d.subscriptions || [];
      if (search) {
        const q = search.toLowerCase();
        res = res.filter((x: any) =>
          (x.userName || "").toLowerCase().includes(q) ||
          (x.userEmail || "").toLowerCase().includes(q) ||
          (x.userPhone || "").includes(q)
        );
      }
      setSubs(res);
      setSettings(s);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [search, statusFilter, planFilter]);

  const quickAction = async (id: string, newStatus: string) => {
    const sub = subs.find(s => s.id === id);
    if (!sub) return;
    await api.subscriptions.update(id, { status: newStatus, activatedBy: "Admin" });
    load();
  };

  const del = async (id: string) => {
    if (!confirm("Delete this subscription?")) return;
    await api.subscriptions.delete(id);
    load();
  };

  const now = Date.now();
  const activeCount = subs.filter(s => s.status === "active" && (s.expiresAt || 0) > now).length;
  const expiredCount = subs.filter(s => (s.expiresAt || 0) < now && s.status === "active").length;

  const fmtDate = (ts: number | undefined) => ts ? new Date(ts).toLocaleDateString() : "-";
  const fmtAmount = (amt: number | undefined) => amt ? `UGX ${Number(amt).toLocaleString()}` : "-";

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#fff", margin: 0 }}>Subscriptions</h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>{activeCount} active · {expiredCount} expired · {subs.length} total</p>
        </div>
        <button onClick={() => setModal("create")} style={{ padding: "8px 16px", background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
          <Plus size={15} /> Add Subscription
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        {PLANS.map(p => {
          const count = subs.filter(s => s.plan === p.id && s.status === "active").length;
          return (
            <div key={p.id} style={{ background: "#111118", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "14px 18px" }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#6366f1" }}>{count}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{p.label}</div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <div style={{ flex: 1, position: "relative" }}>
          <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)" }} />
          <input style={{ ...inp, paddingLeft: 36 }} placeholder="Search by user name, email or phone…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select style={{ ...inp, width: 140 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="expired">Expired</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select style={{ ...inp, width: 160 }} value={planFilter} onChange={e => setPlanFilter(e.target.value)}>
          <option value="">All Plans</option>
          {PLANS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
        </select>
      </div>

      <div style={{ background: "#111118", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                {["User", "Phone", "Plan", "Status", "Price", "Start", "End", "Activated By", "Actions"].map(h => (
                  <th key={h} style={{ padding: "12px 14px", textAlign: "left", color: "rgba(255,255,255,0.45)", fontWeight: 600, fontSize: 12, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} style={{ padding: 40, textAlign: "center", color: "rgba(255,255,255,0.3)" }}>Loading...</td></tr>
              ) : subs.length === 0 ? (
                <tr><td colSpan={9} style={{ padding: 40, textAlign: "center", color: "rgba(255,255,255,0.3)" }}>No subscriptions found</td></tr>
              ) : subs.map(s => {
                const isExpired = s.status === "active" && (s.expiresAt || 0) < now;
                const displayStatus = isExpired ? "expired" : s.status;
                return (
                  <tr key={s.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding: "10px 14px" }}>
                      <div style={{ color: "#fff", fontWeight: 500 }}>{s.userName || `User`}</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{s.userEmail || "-"}</div>
                    </td>
                    <td style={{ padding: "10px 14px", color: "rgba(255,255,255,0.6)" }}>{s.userPhone || "-"}</td>
                    <td style={{ padding: "10px 14px" }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#818cf8" }}>{s.planLabel || s.plan || "-"}</div>
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <Badge c={STATUS_COLORS[displayStatus] || "#6b7280"} label={displayStatus} />
                    </td>
                    <td style={{ padding: "10px 14px", color: "#10b981", fontWeight: 600, whiteSpace: "nowrap" }}>
                      {fmtAmount(s.amount)}
                    </td>
                    <td style={{ padding: "10px 14px", color: "rgba(255,255,255,0.4)", whiteSpace: "nowrap" }}>
                      {fmtDate(s.createdAt)}
                    </td>
                    <td style={{ padding: "10px 14px", color: isExpired ? "#f59e0b" : "rgba(255,255,255,0.4)", whiteSpace: "nowrap", fontWeight: isExpired ? 600 : 400 }}>
                      {fmtDate(s.expiresAt)}
                    </td>
                    <td style={{ padding: "10px 14px", color: "rgba(255,255,255,0.4)" }}>
                      {s.activatedBy || (s.paymentMethod === "admin_manual" ? "Admin" : "Self")}
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {displayStatus !== "active" && (
                          <button onClick={() => quickAction(s.id, "active")} title="Activate" style={{ padding: "3px 7px", background: "#10b98122", border: "none", borderRadius: 5, color: "#34d399", cursor: "pointer", display: "flex", alignItems: "center", gap: 3, fontSize: 11 }}>
                            <CheckCircle size={11} /> Activate
                          </button>
                        )}
                        {displayStatus === "active" && (
                          <button onClick={() => quickAction(s.id, "inactive")} title="Deactivate" style={{ padding: "3px 7px", background: "#ef444422", border: "none", borderRadius: 5, color: "#f87171", cursor: "pointer", display: "flex", alignItems: "center", gap: 3, fontSize: 11 }}>
                            <XCircle size={11} /> Deactivate
                          </button>
                        )}
                        <button onClick={() => setModal(s)} style={{ padding: "3px 7px", background: "#6366f122", border: "none", borderRadius: 5, color: "#818cf8", cursor: "pointer" }}>
                          <Edit size={11} />
                        </button>
                        <button onClick={() => del(s.id)} style={{ padding: "3px 7px", background: "#ef444422", border: "none", borderRadius: 5, color: "#f87171", cursor: "pointer" }}>
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {modal === "create" && (
        <Modal title="Add Subscription" onClose={() => setModal(null)}>
          <AddSubForm settings={settings} onSave={() => { setModal(null); load(); }} onClose={() => setModal(null)} />
        </Modal>
      )}

      {modal && modal !== "create" && (
        <Modal title="Edit Subscription" onClose={() => setModal(null)}>
          <EditSubForm initial={modal} onSave={() => { setModal(null); load(); }} onClose={() => setModal(null)} />
        </Modal>
      )}
    </div>
  );
}
