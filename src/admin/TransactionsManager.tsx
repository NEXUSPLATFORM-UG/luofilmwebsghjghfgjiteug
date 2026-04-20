import { useState, useEffect } from "react";
import { Search, Download, ReceiptText, ChevronDown, Trash2 } from "lucide-react";
import { api } from "./api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { filterByPeriod, periodLabel, drawBankHeader, drawBankFooter, drawBankSummaryBlock, Period } from "./pdfUtils";

const inp = {
  width: "100%", boxSizing: "border-box" as const, background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 12px",
  color: "#fff", fontSize: 13, outline: "none"
};

const TYPE_COLORS: Record<string, string> = {
  subscription: "#6366f1", withdrawal: "#ef4444", topup: "#10b981",
  refund: "#f59e0b", adjustment: "#8b5cf6",
};

function Badge({ c, label }: { c: string; label: string }) {
  return <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, background: `${c}22`, color: c, textTransform: "capitalize" }}>{label}</span>;
}

function fmtUGX(amount: number) {
  return `${amount > 0 ? "+" : ""}UGX ${Math.abs(amount).toLocaleString()}`;
}

async function buildTransactionPDF(records: any[], period: Period) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();

  const totalIn = records.filter(t => Number(t.amount) > 0).reduce((s, t) => s + Number(t.amount), 0);
  const totalOut = records.filter(t => Number(t.amount) < 0).reduce((s, t) => s + Math.abs(Number(t.amount)), 0);
  const net = totalIn - totalOut;

  const startY = await drawBankHeader(
    doc,
    "TRANSACTION STATEMENT",
    "Official Financial Record — LUOFILM.SITE",
    period,
    records.length,
    [
      `Credits (In):   UGX ${totalIn.toLocaleString()}     Debits (Out): UGX ${totalOut.toLocaleString()}     Net Balance: UGX ${net.toLocaleString()}`,
    ]
  );

  autoTable(doc, {
    head: [["#", "Date & Time", "Account Holder", "Phone", "Type", "Reference", "Amount (UGX)", "Status"]],
    body: records.map((t, i) => [
      i + 1,
      new Date(t.createdAt).toLocaleString(),
      `${t.userName || "System"}\n${t.userEmail || ""}`,
      t.userPhone || "-",
      (t.type || "-").toUpperCase(),
      t.reference || `#${(t.id || "").slice(0, 8)}`,
      `${Number(t.amount) > 0 ? "+" : ""}${Number(Math.abs(t.amount)).toLocaleString()}`,
      (t.status || "-").toUpperCase(),
    ]),
    startY,
    styles: { fontSize: 7, cellPadding: [1.5, 2], textColor: [15, 23, 42], lineColor: [226, 232, 240], lineWidth: 0.2 },
    headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: "bold", fontSize: 7, cellPadding: [2.5, 2] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    bodyStyles: { valign: "middle" },
    columnStyles: {
      0: { cellWidth: 7, halign: "center" as const, fontStyle: "bold" },
      1: { cellWidth: 30 },
      2: { cellWidth: 45 },
      3: { cellWidth: 22 },
      4: { cellWidth: 22 },
      5: { cellWidth: 22 },
      6: { cellWidth: 26, halign: "right" as const, fontStyle: "bold" },
      7: { cellWidth: 22, halign: "center" as const },
    },
    didParseCell: (data: any) => {
      if (data.section === "body" && data.column.index === 6) {
        const val = String(data.cell.raw || "");
        data.cell.styles.textColor = val.startsWith("+") ? [5, 150, 105] : [220, 38, 38];
      }
      if (data.section === "body" && data.column.index === 7) {
        const val = String(data.cell.raw || "").toLowerCase();
        data.cell.styles.textColor = val === "COMPLETED" || val === "completed" ? [5, 150, 105] : val === "PENDING" || val === "pending" ? [245, 158, 11] : [100, 116, 139];
      }
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
    "FINANCIAL SUMMARY",
    [
      `Total Credits:    UGX ${totalIn.toLocaleString()}`,
      `Total Debits:     UGX ${totalOut.toLocaleString()}`,
      `Closing Balance:  UGX ${net.toLocaleString()}`,
      `Transactions:     ${records.length} record(s)`,
    ],
    `TXN-${Date.now()}`
  );

  doc.save(`luofilm-transactions-${period}-${new Date().toISOString().slice(0, 10)}.pdf`);
}

export default function TransactionsManager() {
  const [txs, setTxs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [exportDropdown, setExportDropdown] = useState(false);

  const load = () => {
    setLoading(true);
    api.transactions.list({ type, status, search }).then(d => {
      setTxs(d.transactions || []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [search, type, status]);

  const del = async (id: string) => {
    if (!confirm("Delete this transaction? This cannot be undone.")) return;
    await api.transactions.delete(id);
    load();
  };

  const doExport = async (period: Period) => {
    setExportDropdown(false);
    const filtered = filterByPeriod(txs, period);
    await buildTransactionPDF(filtered, period);
  };

  const totalIn = txs.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const totalOut = txs.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#fff", margin: 0 }}>Transactions</h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>{txs.length} records — UGX currency</p>
        </div>
        <div style={{ position: "relative" }}>
          <button onClick={() => setExportDropdown(!exportDropdown)} style={{ padding: "8px 18px", background: "#10b981", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
            <Download size={15} /> Export PDF <ChevronDown size={13} />
          </button>
          {exportDropdown && (
            <>
              <div style={{ position: "fixed", inset: 0, zIndex: 49 }} onClick={() => setExportDropdown(false)} />
              <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 50, background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, overflow: "hidden", minWidth: 180, boxShadow: "0 8px 28px rgba(0,0,0,0.5)" }}>
                {([
                  { period: "all" as Period, label: "All Records", icon: "📋" },
                  { period: "today" as Period, label: "Today", icon: "📅" },
                  { period: "week" as Period, label: "This Week", icon: "🗓️" },
                  { period: "month" as Period, label: "This Month", icon: "📆" },
                ]).map(opt => (
                  <button key={opt.period} onClick={() => doExport(opt.period)}
                    style={{ width: "100%", padding: "11px 16px", background: "transparent", border: "none", color: "#fff", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 10, textAlign: "left" as const, transition: "background 0.15s" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(16,185,129,0.15)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <span>{opt.icon}</span> {opt.label} ({filterByPeriod(txs, opt.period).length})
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total In", value: `UGX ${totalIn.toLocaleString()}`, color: "#10b981" },
          { label: "Total Out", value: `UGX ${totalOut.toLocaleString()}`, color: "#ef4444" },
          { label: "Net Balance", value: `UGX ${(totalIn - totalOut).toLocaleString()}`, color: totalIn - totalOut >= 0 ? "#10b981" : "#ef4444" },
          { label: "Today's Txns", value: filterByPeriod(txs, "today").length, color: "#6366f1" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: "#111118", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "16px 20px" }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <div style={{ flex: 1, position: "relative" }}>
          <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)" }} />
          <input style={{ ...inp, paddingLeft: 36 }} placeholder="Search by user, email, phone or description..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select style={{ ...inp, width: 150 }} value={type} onChange={e => setType(e.target.value)}>
          <option value="">All Types</option>
          <option value="subscription">Subscription</option>
          <option value="withdrawal">Withdrawal</option>
          <option value="topup">Top Up</option>
          <option value="refund">Refund</option>
          <option value="adjustment">Adjustment</option>
        </select>
        <select style={{ ...inp, width: 140 }} value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div style={{ background: "#111118", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              {["Date & Time", "User Name", "Email", "Phone", "User ID", "Plan", "Type", "Amount (UGX)", "Status", "Description", "Reference", ""].map(h => (
                <th key={h} style={{ padding: "12px 12px", textAlign: "left", color: "rgba(255,255,255,0.45)", fontWeight: 600, fontSize: 11, whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={12} style={{ padding: 40, textAlign: "center", color: "rgba(255,255,255,0.3)" }}>Loading...</td></tr>
            ) : txs.length === 0 ? (
              <tr><td colSpan={12} style={{ padding: 40, textAlign: "center", color: "rgba(255,255,255,0.3)" }}>
                <ReceiptText size={32} style={{ margin: "0 auto 10px", display: "block", opacity: 0.3 }} />
                No transactions found
              </td></tr>
            ) : txs.map(t => (
              <tr key={t.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <td style={{ padding: "10px 12px", color: "rgba(255,255,255,0.45)", whiteSpace: "nowrap", fontSize: 12 }}>{new Date(t.createdAt).toLocaleString()}</td>
                <td style={{ padding: "10px 12px" }}>
                  <div style={{ color: "#fff", fontWeight: 600 }}>{t.userName || "System"}</div>
                </td>
                <td style={{ padding: "10px 12px", color: "rgba(255,255,255,0.5)", fontSize: 12 }}>{t.userEmail || "-"}</td>
                <td style={{ padding: "10px 12px", color: "rgba(255,255,255,0.5)" }}>{t.userPhone || "-"}</td>
                <td style={{ padding: "10px 12px", color: "rgba(255,255,255,0.3)", fontSize: 11, fontFamily: "monospace" }}>
                  {(t.userId || "-")?.toString().slice(0, 12)}
                </td>
                <td style={{ padding: "10px 12px", color: "rgba(255,255,255,0.5)", fontSize: 12 }}>{t.plan || "-"}</td>
                <td style={{ padding: "10px 12px" }}><Badge c={TYPE_COLORS[t.type] || "#6366f1"} label={t.type} /></td>
                <td style={{ padding: "10px 12px", fontWeight: 700, color: t.amount > 0 ? "#10b981" : "#ef4444", whiteSpace: "nowrap" }}>
                  {fmtUGX(t.amount)}
                </td>
                <td style={{ padding: "10px 12px" }}>
                  <Badge c={t.status === "completed" ? "#10b981" : t.status === "pending" ? "#f59e0b" : "#ef4444"} label={t.status || "unknown"} />
                </td>
                <td style={{ padding: "10px 12px", color: "rgba(255,255,255,0.5)", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.description || "-"}</td>
                <td style={{ padding: "10px 12px", color: "rgba(255,255,255,0.3)", fontSize: 11 }}>{t.reference || `#${t.id?.slice(0, 8)}`}</td>
                <td style={{ padding: "10px 12px" }}>
                  <button onClick={() => del(t.id)} title="Delete" style={{ padding: "3px 7px", background: "#ef444422", border: "none", borderRadius: 5, color: "#f87171", cursor: "pointer", display: "flex", alignItems: "center" }}>
                    <Trash2 size={12} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
