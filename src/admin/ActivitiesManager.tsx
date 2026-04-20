import { useState, useEffect } from "react";
import { Search, Download, Activity, Clock, ChevronDown, Trash2 } from "lucide-react";
import { api } from "./api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { filterByPeriod, periodLabel, drawBankHeader, drawBankFooter, drawBankSummaryBlock, Period } from "./pdfUtils";

const inp = {
  width: "100%", boxSizing: "border-box" as const, background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 12px",
  color: "#fff", fontSize: 13, outline: "none"
};

const ACTION_COLORS: Record<string, string> = {
  page_view: "#6366f1", content_play: "#10b981", content_click: "#3b82f6",
  search: "#f59e0b", login: "#8b5cf6", logout: "#6b7280", signup: "#ec4899",
  subscription_view: "#0ea5e9", subscription_purchase: "#10b981",
  profile_update: "#f97316", watchlist_add: "#06b6d4", watchlist_remove: "#ef4444",
  episode_play: "#84cc16", trailer_play: "#a855f7",
};
const ACTION_TYPES = Object.keys(ACTION_COLORS);

function Badge({ c, label }: { c: string; label: string }) {
  return <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 600, background: `${c}22`, color: c, textTransform: "capitalize" }}>{label?.replace(/_/g, " ")}</span>;
}

async function buildActivityPDF(records: any[], period: Period) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const uniqueUsers = new Set(records.map(a => a.userId || a.anonId).filter(Boolean)).size;
  const uniqueIPs = new Set(records.map(a => a.ipAddress).filter(Boolean)).size;
  const loginCount = records.filter(a => a.actionType === "login" || a.actionType === "register").length;

  const startY = await drawBankHeader(
    doc,
    "ACTIVITY AUDIT LOG",
    "Platform Engagement & Behaviour Analytics",
    period,
    records.length,
    [
      `Unique Users: ${uniqueUsers}   |   Unique IPs: ${uniqueIPs}   |   Auth Events: ${loginCount}   |   Total Events: ${records.length}`,
    ]
  );

  autoTable(doc, {
    head: [["#", "Date & Time", "User (Email / Phone)", "IP Address", "Action", "Page", "Content / Details"]],
    body: records.map((a, i) => [
      i + 1,
      new Date(a.createdAt).toLocaleString(),
      `${a.userName || "Guest"}\n${a.userEmail || ""}\n${a.userPhone || ""}`,
      a.ipAddress || "-",
      (a.actionType || "-").replace(/_/g, " ").toUpperCase(),
      a.page || "-",
      a.contentTitle || a.details || "-",
    ]),
    startY,
    styles: { fontSize: 7, cellPadding: [1.5, 2], textColor: [15, 23, 42], lineColor: [226, 232, 240], lineWidth: 0.2 },
    headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: "bold", fontSize: 7, cellPadding: [2.5, 2] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    bodyStyles: { valign: "middle" },
    columnStyles: {
      0: { cellWidth: 7, halign: "center" as const, fontStyle: "bold" },
      1: { cellWidth: 30 },
      2: { cellWidth: 48 },
      3: { cellWidth: 28 },
      4: { cellWidth: 30 },
      5: { cellWidth: 22 },
      6: { cellWidth: 32 },
    },
    margin: { left: 6, right: 6 },
    didDrawPage: (data: any) => {
      const pageCount = (doc as any).internal.getNumberOfPages();
      drawBankFooter(doc, data.pageNumber, pageCount);
    },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;
  const H = doc.internal.pageSize.getHeight();
  const sigY = Math.min(finalY, H - 44);

  drawBankSummaryBlock(
    doc,
    sigY,
    "AUDIT SUMMARY",
    [
      `Total Events:    ${records.length}`,
      `Unique Users:    ${uniqueUsers}`,
      `Unique IPs:      ${uniqueIPs}`,
      `Report Period:   ${periodLabel(period)}`,
    ],
    `ACT-${Date.now()}`
  );

  doc.save(`luofilm-activity-${period}-${new Date().toISOString().slice(0, 10)}.pdf`);
}

export default function ActivitiesManager() {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionType, setActionType] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [exportDropdown, setExportDropdown] = useState(false);

  const load = () => {
    api.activities.list({ search, actionType, limit: "500" }).then(d => setActivities(d.activities || [])).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [search, actionType]);
  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(load, 10000);
    return () => clearInterval(id);
  }, [autoRefresh, search, actionType]);

  const doExport = async (period: Period) => {
    setExportDropdown(false);
    const filtered = filterByPeriod(activities, period);
    await buildActivityPDF(filtered, period);
  };

  const actionCounts = activities.reduce((acc, a) => {
    acc[a.actionType] = (acc[a.actionType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const topActions = Object.entries(actionCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#fff", margin: 0 }}>Activity Log</h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>{activities.length} records — Full user interaction tracking</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button onClick={() => setAutoRefresh(!autoRefresh)} style={{ padding: "8px 16px", background: autoRefresh ? "#10b98122" : "rgba(255,255,255,0.06)", color: autoRefresh ? "#34d399" : "#fff", border: `1px solid ${autoRefresh ? "#10b98144" : "rgba(255,255,255,0.1)"}`, borderRadius: 8, fontSize: 13, cursor: "pointer" }}>
            {autoRefresh ? "● Live" : "Auto-Refresh"}
          </button>
          <button onClick={load} style={{ padding: "8px 14px", background: "rgba(255,255,255,0.06)", color: "#fff", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>Refresh</button>
          <div style={{ position: "relative" }}>
            <button onClick={() => setExportDropdown(!exportDropdown)} style={{ padding: "8px 16px", background: "#10b981", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              <Download size={14} /> Export PDF <ChevronDown size={13} />
            </button>
            {exportDropdown && (
              <>
                <div style={{ position: "fixed", inset: 0, zIndex: 49 }} onClick={() => setExportDropdown(false)} />
                <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 50, background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, overflow: "hidden", minWidth: 170, boxShadow: "0 8px 28px rgba(0,0,0,0.5)" }}>
                  {([
                    { period: "all" as Period, label: "All Records", icon: "📋" },
                    { period: "today" as Period, label: "Today", icon: "📅" },
                    { period: "week" as Period, label: "This Week", icon: "🗓️" },
                    { period: "month" as Period, label: "This Month", icon: "📆" },
                  ]).map(opt => (
                    <button key={opt.period} onClick={() => doExport(opt.period)}
                      style={{ width: "100%", padding: "11px 16px", background: "transparent", border: "none", color: "#fff", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 10, textAlign: "left", transition: "background 0.15s" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(99,102,241,0.15)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      <span>{opt.icon}</span> {opt.label} ({filterByPeriod(activities, opt.period).length})
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 20, marginBottom: 24 }}>
        <div style={{ background: "#111118", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 20 }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: "#fff", margin: "0 0 14px" }}>Top Actions</h3>
          {topActions.map(([action, count]) => (
            <div key={action} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, alignItems: "center" }}>
              <Badge c={ACTION_COLORS[action] || "#6366f1"} label={action} />
              <span style={{ fontSize: 12, color: "#fff", fontWeight: 600 }}>{count as number}</span>
            </div>
          ))}
          {topActions.length === 0 && <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>No data yet</p>}
        </div>
        <div style={{ background: "#111118", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 20 }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: "#fff", margin: "0 0 14px" }}>Quick Stats</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
            {[
              { label: "Total Events", value: activities.length, color: "#6366f1" },
              { label: "Today", value: filterByPeriod(activities, "today").length, color: "#10b981" },
              { label: "This Week", value: filterByPeriod(activities, "week").length, color: "#f59e0b" },
              { label: "Unique Users", value: new Set(activities.filter(a => a.userId).map(a => a.userId)).size, color: "#ec4899" },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "12px 14px" }}>
                <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <div style={{ flex: 1, position: "relative" }}>
          <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)" }} />
          <input style={{ ...inp, paddingLeft: 36 }} placeholder="Search by user, email, phone, content or page..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select style={{ ...inp, width: 180 }} value={actionType} onChange={e => setActionType(e.target.value)}>
          <option value="">All Action Types</option>
          {ACTION_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
        </select>
      </div>

      <div style={{ background: "#111118", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              {["Time", "User Name", "Email", "Phone", "User ID", "Action", "Page", "Content", "IP", "Details"].map(h => (
                <th key={h} style={{ padding: "10px 12px", textAlign: "left", color: "rgba(255,255,255,0.45)", fontWeight: 600, fontSize: 11, whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10} style={{ padding: 40, textAlign: "center", color: "rgba(255,255,255,0.3)" }}>Loading activities...</td></tr>
            ) : activities.length === 0 ? (
              <tr><td colSpan={10} style={{ padding: 60, textAlign: "center", color: "rgba(255,255,255,0.3)" }}>
                <Activity size={32} style={{ margin: "0 auto 10px", display: "block", opacity: 0.3 }} />
                No activities recorded yet.
              </td></tr>
            ) : activities.map(a => (
              <tr key={a.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <td style={{ padding: "8px 12px", color: "rgba(255,255,255,0.4)", whiteSpace: "nowrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}><Clock size={10} />{new Date(a.createdAt).toLocaleString()}</div>
                </td>
                <td style={{ padding: "8px 12px" }}>
                  <div style={{ color: "#fff", fontWeight: 600 }}>{a.userName || "Guest"}</div>
                </td>
                <td style={{ padding: "8px 12px", color: "rgba(255,255,255,0.5)" }}>{a.userEmail || "-"}</td>
                <td style={{ padding: "8px 12px", color: "rgba(255,255,255,0.5)" }}>{a.userPhone || "-"}</td>
                <td style={{ padding: "8px 12px", color: "rgba(255,255,255,0.3)", fontSize: 11, fontFamily: "monospace" }}>
                  {(a.userId || a.anonId || "-")?.toString().slice(0, 14)}
                </td>
                <td style={{ padding: "8px 12px" }}><Badge c={ACTION_COLORS[a.actionType] || "#6366f1"} label={a.actionType} /></td>
                <td style={{ padding: "8px 12px", color: "rgba(255,255,255,0.4)", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.page || "-"}</td>
                <td style={{ padding: "8px 12px", color: "rgba(255,255,255,0.5)", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.contentTitle || "-"}</td>
                <td style={{ padding: "8px 12px", color: "rgba(255,255,255,0.3)", fontFamily: "monospace", fontSize: 11 }}>{a.ipAddress || "-"}</td>
                <td style={{ padding: "8px 12px", color: "rgba(255,255,255,0.35)", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.details || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
