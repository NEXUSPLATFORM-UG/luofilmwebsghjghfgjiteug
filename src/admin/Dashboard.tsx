import { useState, useEffect } from "react";
import { Users, Film, CreditCard, Activity, TrendingUp, DollarSign, Clock, Wifi } from "lucide-react";
import { api } from "./api";
import { paymentApi } from "../lib/paymentApi";

function StatCard({ icon: Icon, label, value, color, sub }: { icon: typeof Users; label: string; value: string | number; color: string; sub?: string }) {
  return (
    <div style={{
      background: "#111118", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12,
      padding: "20px 24px", display: "flex", gap: 16, alignItems: "center"
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: 12,
        background: `${color}22`, display: "flex", alignItems: "center", justifyContent: "center"
      }}>
        <Icon size={22} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 26, fontWeight: 700, color: "#fff" }}>{value}</div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color, marginTop: 4 }}>{sub}</div>}
      </div>
    </div>
  );
}

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span style={{
      padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600,
      background: `${color}22`, color
    }}>{children}</span>
  );
}

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [apiBalance, setApiBalance] = useState<any>(null);
  const [apiBalanceLoading, setApiBalanceLoading] = useState(true);

  useEffect(() => {
    api.stats().then(setData).catch(console.error).finally(() => setLoading(false));
    paymentApi.walletBalance()
      .then(setApiBalance)
      .catch(() => setApiBalance(null))
      .finally(() => setApiBalanceLoading(false));
  }, []);

  if (loading) return <div style={{ color: "rgba(255,255,255,0.4)", padding: 40 }}>Loading dashboard...</div>;

  const stats = data?.stats || {};

  const liveApiBalance = apiBalanceLoading
    ? "Loading…"
    : apiBalance
      ? `UGX ${Number(apiBalance.balance ?? apiBalance.available_balance ?? 0).toLocaleString()}`
      : "N/A";

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#fff", margin: 0 }}>Dashboard Overview</h1>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>Welcome back, Admin. Here's what's happening.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 16, marginBottom: 20 }}>
        <StatCard icon={Users} label="Total Users" value={stats.totalUsers ?? 0} color="#6366f1" sub="Registered accounts" />
        <StatCard icon={Film} label="Total Content" value={stats.totalContent ?? 0} color="#10b981" sub="Movies & Series" />
        <StatCard icon={CreditCard} label="Active Subscriptions" value={stats.activeSubscriptions ?? 0} color="#f59e0b" sub="Currently active" />
        <StatCard icon={DollarSign} label="Firebase Revenue" value={`UGX ${(stats.totalRevenue ?? 0).toLocaleString()}`} color="#ef4444" sub="From subscriptions" />
        <StatCard icon={Activity} label="Total Activities" value={stats.totalActivities ?? 0} color="#8b5cf6" sub="User interactions" />
      </div>

      {/* Live API balance banner */}
      <div style={{ background: "linear-gradient(90deg,#0f1929,#0a1520)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 12, padding: "16px 24px", marginBottom: 28, display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ width: 44, height: 44, borderRadius: 10, background: "#10b98122", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Wifi size={20} color="#10b981" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 2 }}>Live Payment Gateway Balance</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#10b981" }}>{liveApiBalance}</div>
        </div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", textAlign: "right" }}>
          <div>Firebase: <span style={{ color: "#6366f1" }}>UGX {(stats.totalRevenue ?? 0).toLocaleString()}</span></div>
          <div style={{ marginTop: 3 }}>Source: Relworx API</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div style={{ background: "#111118", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: "#fff", margin: "0 0 16px" }}>Recent Transactions</h3>
          {(data?.recentTxs || []).length === 0
            ? <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>No transactions yet</p>
            : (data?.recentTxs || []).map((tx: any) => (
              <div key={tx.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <div>
                  <div style={{ fontSize: 13, color: "#fff" }}>{tx.description || tx.type}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{tx.userName || "System"} · {new Date(tx.createdAt).toLocaleDateString()}</div>
                </div>
                <span style={{ fontWeight: 700, color: tx.amount > 0 ? "#10b981" : "#ef4444" }}>
                  {tx.amount > 0 ? "+" : ""}UGX {Math.abs(tx.amount).toLocaleString()}
                </span>
              </div>
            ))}
        </div>

        <div style={{ background: "#111118", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: "#fff", margin: "0 0 16px" }}>Recent Users</h3>
          {(data?.recentUsers || []).length === 0
            ? <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>No users yet</p>
            : (data?.recentUsers || []).map((u: any) => (
              <div key={u.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>
                    {u.name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, color: "#fff" }}>{u.name}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{u.email}</div>
                  </div>
                </div>
                <Badge color={u.status === "active" ? "#10b981" : "#ef4444"}>{u.status}</Badge>
              </div>
            ))}
        </div>

        <div style={{ background: "#111118", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 20, gridColumn: "1 / -1" }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: "#fff", margin: "0 0 16px" }}>Recent Activities</h3>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  {["Time", "User", "Action", "Page", "Content"].map(h => (
                    <th key={h} style={{ padding: "6px 12px", textAlign: "left", color: "rgba(255,255,255,0.4)", fontWeight: 600, fontSize: 12 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(data?.recentActivities || []).length === 0
                  ? <tr><td colSpan={5} style={{ padding: 20, color: "rgba(255,255,255,0.3)", textAlign: "center" }}>No activities yet</td></tr>
                  : (data?.recentActivities || []).map((a: any) => (
                    <tr key={a.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <td style={{ padding: "8px 12px", color: "rgba(255,255,255,0.4)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <Clock size={11} />
                          {new Date(a.createdAt).toLocaleString()}
                        </div>
                      </td>
                      <td style={{ padding: "8px 12px", color: "#fff" }}>{a.userName || "Guest"}</td>
                      <td style={{ padding: "8px 12px" }}><Badge color="#6366f1">{a.actionType}</Badge></td>
                      <td style={{ padding: "8px 12px", color: "rgba(255,255,255,0.5)" }}>{a.page || "-"}</td>
                      <td style={{ padding: "8px 12px", color: "rgba(255,255,255,0.5)" }}>{a.contentTitle || "-"}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
