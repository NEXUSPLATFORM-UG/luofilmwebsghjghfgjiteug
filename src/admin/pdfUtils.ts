import jsPDF from "jspdf";

let _logoCache: string | null = null;

export async function getLogoBase64(): Promise<string | null> {
  if (_logoCache) return _logoCache;
  try {
    const resp = await fetch("/logo.png");
    const blob = await resp.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => { _logoCache = reader.result as string; resolve(_logoCache); };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch { return null; }
}

export type Period = "all" | "today" | "week" | "month";

export function periodLabel(period: Period): string {
  if (period === "today") return "Today — " + new Date().toLocaleDateString();
  if (period === "week") return "This Week — " + new Date(Date.now() - 7 * 86400000).toLocaleDateString() + " to " + new Date().toLocaleDateString();
  if (period === "month") return "This Month — " + new Date().toLocaleString("default", { month: "long", year: "numeric" });
  return "All Time";
}

export function filterByPeriod(items: any[], period: Period): any[] {
  if (period === "all") return items;
  const now = new Date();
  const start = new Date();
  if (period === "today") { start.setHours(0, 0, 0, 0); }
  else if (period === "week") { start.setDate(now.getDate() - 7); start.setHours(0, 0, 0, 0); }
  else if (period === "month") { start.setDate(1); start.setHours(0, 0, 0, 0); }
  return items.filter((i) => new Date(i.createdAt) >= start);
}

export async function drawBankHeader(
  doc: jsPDF,
  title: string,
  subtitle: string,
  period: Period,
  recordCount: number,
  summaryLines: string[]
): Promise<number> {
  const W = doc.internal.pageSize.getWidth();

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, W, 38, "F");

  const logo = await getLogoBase64();
  if (logo) {
    doc.addImage(logo, "PNG", 8, 5, 20, 20);
  }

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 60, 60);
  doc.text("LUOFILM.SITE", logo ? 32 : 8, 14);

  doc.setFontSize(6.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(148, 163, 184);
  doc.text("luofilm.site  |  VJ PAUL FREE DOWNLOAD", logo ? 32 : 8, 21);
  doc.text("admin@luofilm.site", logo ? 32 : 8, 27);

  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text(title, W - 8, 14, { align: "right" });

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(148, 163, 184);
  doc.text(subtitle, W - 8, 21, { align: "right" });
  doc.text(`Generated: ${new Date().toLocaleString()}`, W - 8, 27, { align: "right" });

  doc.setDrawColor(99, 102, 241);
  doc.setLineWidth(0.8);
  doc.line(0, 38, W, 38);

  let y = 44;

  doc.setFillColor(248, 250, 252);
  doc.rect(6, y, W - 12, 7 + summaryLines.length * 5.5, "F");
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.rect(6, y, W - 12, 7 + summaryLines.length * 5.5);

  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  doc.text(`STATEMENT PERIOD: ${periodLabel(period).toUpperCase()}   |   TOTAL RECORDS: ${recordCount}`, 10, y + 5);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(30, 41, 59);
  summaryLines.forEach((line, i) => {
    doc.text(line, 10, y + 10 + i * 5.5);
  });

  y += 9 + summaryLines.length * 5.5 + 4;
  return y;
}

export function drawBankFooter(doc: jsPDF, pageNum: number, totalPages: number) {
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(6, H - 12, W - 6, H - 12);

  doc.setFontSize(6.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("LUOFILM.SITE — Confidential & Official Statement", 8, H - 7);
  doc.text(`Page ${pageNum} of ${totalPages}  |  luofilm.site`, W - 8, H - 7, { align: "right" });
}

export function drawBankSummaryBlock(
  doc: jsPDF,
  y: number,
  leftTitle: string,
  leftLines: string[],
  docId: string
) {
  const W = doc.internal.pageSize.getWidth();
  const blockH = 8 + leftLines.length * 6 + 6;

  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.setLineWidth(0.3);
  doc.roundedRect(6, y, W - 12, blockH, 2, 2, "FD");

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(99, 102, 241);
  doc.text(leftTitle, 12, y + 6);

  doc.setFont("courier", "normal");
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(7);
  leftLines.forEach((line, i) => {
    doc.text(line, 12, y + 12 + i * 6);
  });

  const midX = W / 2 + 10;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(99, 102, 241);
  doc.setFontSize(7.5);
  doc.text("AUTHORIZED SIGNATURE", midX, y + 6);

  doc.setDrawColor(180, 190, 210);
  doc.setLineWidth(0.3);
  doc.line(midX, y + 20, W - 14, y + 20);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(6.5);
  doc.text("Chief Executive Officer — LUOFILM.SITE", midX, y + 25);
  doc.text(`Doc ID: ${docId}`, midX, y + 31);
}

export function drawYOUKUHeader(
  doc: jsPDF,
  reportTitle: string,
  reportSubtitle: string,
  period: Period,
  recordCount: number,
  extraLine?: string
): Promise<void> {
  return drawBankHeader(doc, reportTitle, reportSubtitle, period, recordCount, extraLine ? [extraLine] : []).then(() => {});
}

export function drawYOUKUFooter(doc: jsPDF, pageNum: number, totalPages: number) {
  drawBankFooter(doc, pageNum, totalPages);
}

export function drawSignatureBlock(
  doc: jsPDF,
  sigY: number,
  leftTitle: string,
  leftLines: string[],
  docId: string
) {
  drawBankSummaryBlock(doc, sigY, leftTitle, leftLines, docId);
}
