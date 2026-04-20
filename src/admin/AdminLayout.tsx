import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, Film, Users, CreditCard, Wallet,
  ReceiptText, Activity, Image, LogOut, Menu, X,
  ChevronRight, Bell, Settings, Shield
} from "lucide-react";

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
  { icon: Film, label: "Content", path: "/admin/content" },
  { icon: Image, label: "Carousel & Featured", path: "/admin/carousel" },
  { icon: Users, label: "Users", path: "/admin/users" },
  { icon: CreditCard, label: "Subscriptions", path: "/admin/subscriptions" },
  { icon: Wallet, label: "Wallet", path: "/admin/wallet" },
  { icon: ReceiptText, label: "Transactions", path: "/admin/transactions" },
  { icon: Activity, label: "Activities", path: "/admin/activities" },
  { icon: Settings, label: "Settings", path: "/admin/settings" },
];

const S = {
  container: {
    display: "flex",
    minHeight: "100vh",
    background: "#0a0a0f",
    color: "#e2e8f0",
    fontFamily: "'Inter', system-ui, sans-serif",
  } as React.CSSProperties,
  sidebar: (open: boolean): React.CSSProperties => ({
    width: open ? 240 : 0,
    minWidth: open ? 240 : 0,
    background: "#111118",
    borderRight: "1px solid rgba(255,255,255,0.06)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    transition: "all 0.25s ease",
    flexShrink: 0,
    position: "relative" as const,
  }),
  logo: {
    padding: "20px 20px 16px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    display: "flex",
    alignItems: "center",
    gap: 10,
  } as React.CSSProperties,
  nav: { flex: 1, padding: "12px 8px", overflowY: "auto" as const },
  navItem: (active: boolean): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "9px 12px",
    borderRadius: 8,
    marginBottom: 2,
    cursor: "pointer",
    transition: "all 0.15s",
    background: active ? "rgba(99,102,241,0.15)" : "transparent",
    color: active ? "#818cf8" : "rgba(255,255,255,0.55)",
    fontWeight: active ? 600 : 400,
    fontSize: 14,
    textDecoration: "none",
    borderLeft: active ? "3px solid #6366f1" : "3px solid transparent",
  }),
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column" as const,
    overflow: "hidden",
  },
  topbar: {
    height: 56,
    background: "#111118",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    display: "flex",
    alignItems: "center",
    padding: "0 20px",
    gap: 12,
    flexShrink: 0,
  } as React.CSSProperties,
  content: {
    flex: 1,
    overflow: "auto",
    padding: "24px",
  } as React.CSSProperties,
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [location] = useLocation();

  return (
    <div style={S.container}>
      <div style={S.sidebar(sidebarOpen)}>
        <div style={S.logo}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <Shield size={16} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>ADMIN</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>Control Panel</div>
          </div>
        </div>
        <nav style={S.nav}>
          {NAV_ITEMS.map(({ icon: Icon, label, path }) => {
            const active = path === "/admin" ? location === "/admin" : location.startsWith(path);
            return (
              <Link key={path} href={path}>
                <div style={S.navItem(active)}>
                  <Icon size={16} />
                  <span style={{ flex: 1, whiteSpace: "nowrap" }}>{label}</span>
                  {active && <ChevronRight size={13} />}
                </div>
              </Link>
            );
          })}
        </nav>
        <div style={{ padding: "12px 8px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <Link href="/">
            <div style={{ ...S.navItem(false), color: "rgba(255,100,100,0.7)" }}>
              <LogOut size={16} />
              <span>Back to Site</span>
            </div>
          </Link>
        </div>
      </div>

      <div style={S.main}>
        <div style={S.topbar}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", padding: 4 }}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 14, color: "rgba(255,255,255,0.5)" }}>
              {NAV_ITEMS.find(n => n.path === "/admin" ? location === "/admin" : location.startsWith(n.path))?.label || "Admin"}
            </span>
          </div>
          <button style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer" }}>
            <Bell size={18} />
          </button>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 700
          }}>A</div>
        </div>
        <style>{`
          .admin-content select,
          .admin-content select option {
            background-color: #1a1a2e !important;
            color: #e2e8f0 !important;
          }
          .admin-content select {
            appearance: none;
            -webkit-appearance: none;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23a0aec0' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E") !important;
            background-repeat: no-repeat !important;
            background-position: right 10px center !important;
            padding-right: 32px !important;
            cursor: pointer;
          }
          .admin-content select:focus {
            outline: none;
            border-color: rgba(99,102,241,0.6) !important;
            box-shadow: 0 0 0 2px rgba(99,102,241,0.15);
          }
          .admin-content select option:hover,
          .admin-content select option:checked {
            background-color: #2d2d4e !important;
            color: #a5b4fc !important;
          }
        `}</style>
        <div className="admin-content" style={S.content}>
          {children}
        </div>
      </div>
    </div>
  );
}
