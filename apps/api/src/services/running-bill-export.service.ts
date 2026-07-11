import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";
import type { getRunningBillById } from "./running-bill.service.js";
import { RB_STATUS_LABELS, BILL_TYPE_LABELS, DEDUCTION_TYPE_LABELS } from "./running-bill.service.js";

export type RunningBillDetail = Awaited<ReturnType<typeof getRunningBillById>>;

function inr(v: string | number) {
  return `Rs. ${Number(v).toLocaleString("en-IN")}`;
}

/** Renders the Running Bill header + Abstract + Deductions as a landscape PDF — many columns, so landscape keeps it legible. */
export async function generateRunningBillPdf(bill: RunningBillDetail, companyName: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 36 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

    doc.fontSize(15).font("Helvetica-Bold").text(companyName, { align: "center" });
    doc.fontSize(12).text(`RUNNING BILL — ${BILL_TYPE_LABELS[bill.billType] ?? bill.billType}`, { align: "center" });
    doc.moveDown(0.4);
    doc
      .fontSize(9)
      .font("Helvetica-Bold")
      .text(`Bill No: ${bill.billNumber}`, { continued: true })
      .font("Helvetica")
      .text(`      Date: ${bill.billDate}      Status: ${RB_STATUS_LABELS[bill.status] ?? bill.status}`);
    doc.moveDown(0.5);

    const half = pageWidth / 2;
    const kv = (label: string, value: string, x: number, y: number, width: number) => {
      doc.fontSize(8.5).font("Helvetica-Bold").text(`${label}: `, x, y, { continued: true, width });
      doc.font("Helvetica").text(value || "-");
    };
    let y = doc.y;
    kv("Project", bill.project?.name ?? "", doc.x, y, half - 10);
    kv("Site", bill.site, doc.x + half, y, half - 10);
    y = doc.y;
    kv("Sub Work", bill.subWork?.name ?? "-", doc.x, y, half - 10);
    kv("Measurement Book", bill.measurementBook?.mbNumber ?? "-", doc.x + half, y, half - 10);
    y = doc.y;
    kv("Bill Period", bill.billPeriodFrom && bill.billPeriodTo ? `${bill.billPeriodFrom} to ${bill.billPeriodTo}` : "-", doc.x, y, half - 10);
    if (bill.remarks) kv("Remarks", bill.remarks, doc.x + half, y, half - 10);
    doc.moveDown(0.8);

    const cols = [
      { label: "Item No.", w: pageWidth * 0.07 },
      { label: "Description", w: pageWidth * 0.19 },
      { label: "Unit", w: pageWidth * 0.04 },
      { label: "Prev Qty", w: pageWidth * 0.07 },
      { label: "Curr Qty", w: pageWidth * 0.07 },
      { label: "Total Qty", w: pageWidth * 0.07 },
      { label: "Eff. Rate", w: pageWidth * 0.08 },
      { label: "Prev Amt", w: pageWidth * 0.1 },
      { label: "Curr Amt", w: pageWidth * 0.1 },
      { label: "Total Amt", w: pageWidth * 0.1 },
    ];

    const startX = doc.x;
    let cy = doc.y;
    doc.font("Helvetica-Bold").fontSize(7.5);
    let cx = startX;
    cols.forEach((c) => {
      doc.rect(cx, cy, c.w, 18).stroke();
      doc.text(c.label, cx + 2, cy + 5, { width: c.w - 4 });
      cx += c.w;
    });
    cy += 18;

    doc.font("Helvetica").fontSize(7.5);
    bill.items.forEach((item) => {
      cx = startX;
      const values = [
        item.boqItemNo,
        item.boqDescription,
        item.unit,
        item.previousQuantity,
        item.currentQuantity,
        item.totalQuantity,
        inr(item.effectiveRate),
        inr(item.previousAmount),
        inr(item.currentAmount),
        inr(item.totalAmount),
      ];
      values.forEach((v, i) => {
        doc.rect(cx, cy, cols[i].w, 16).stroke();
        doc.text(String(v), cx + 2, cy + 4, { width: cols[i].w - 4 });
        cx += cols[i].w;
      });
      cy += 16;
    });

    // Totals row
    doc.font("Helvetica-Bold");
    cx = startX;
    const totalsLabelWidth = cols.slice(0, 6).reduce((s, c) => s + c.w, 0);
    doc.rect(cx, cy, totalsLabelWidth, 18).stroke();
    doc.text("TOTAL", cx + 2, cy + 5);
    cx += totalsLabelWidth;
    doc.rect(cx, cy, cols[6].w, 18).stroke();
    cx += cols[6].w;
    doc.rect(cx, cy, cols[7].w, 18).stroke();
    doc.text(inr(bill.previousCertifiedAmount), cx + 2, cy + 5, { width: cols[7].w - 4 });
    cx += cols[7].w;
    doc.rect(cx, cy, cols[8].w, 18).stroke();
    doc.text(inr(bill.currentCertifiedAmount), cx + 2, cy + 5, { width: cols[8].w - 4 });
    cx += cols[8].w;
    doc.rect(cx, cy, cols[9].w, 18).stroke();
    doc.text(inr(bill.totalCertifiedAmount), cx + 2, cy + 5, { width: cols[9].w - 4 });

    cy += 30;

    if (bill.deductions.length) {
      doc.font("Helvetica-Bold").fontSize(9).text("Deductions", startX, cy);
      cy = doc.y + 4;
      doc.fontSize(8);
      bill.deductions.forEach((d) => {
        doc.font("Helvetica").text(`${DEDUCTION_TYPE_LABELS[d.type] ?? d.label}${d.label && d.label !== DEDUCTION_TYPE_LABELS[d.type] ? ` (${d.label})` : ""}`, startX, cy, { continued: true, width: 300 });
        doc.text(inr(d.amount), { align: "right", width: 150 });
        cy = doc.y + 2;
      });
      cy += 8;
    }

    doc.font("Helvetica-Bold").fontSize(9);
    const summaryLines: [string, string][] = [
      ["Current Certified Amount", inr(bill.currentCertifiedAmount)],
      ["Total Deductions", inr(bill.totalDeductions)],
      ["Net Payable", inr(bill.netPayable)],
      ["Amount Received", inr(bill.amountReceived)],
      ["Outstanding Amount", inr(bill.outstandingAmount)],
    ];
    summaryLines.forEach(([label, value]) => {
      doc.text(label, startX, cy, { continued: true, width: 300 });
      doc.text(value, { align: "right", width: 150 });
      cy = doc.y + 2;
    });

    doc.y = cy + 20;
    doc.font("Helvetica").fontSize(8).fillColor("#666666").text(`Prepared by: ${bill.createdBy?.name ?? "-"}    |    Generated: ${new Date().toLocaleString()}`, startX, doc.y);

    doc.end();
  });
}

/** Exports the Running Bill header + Abstract + Deductions as a single-sheet .xlsx workbook. */
export async function generateRunningBillExcel(bill: RunningBillDetail): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "AP OS";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Running Bill");
  sheet.columns = [
    { width: 12 }, { width: 28 }, { width: 8 }, { width: 12 }, { width: 12 },
    { width: 12 }, { width: 12 }, { width: 14 }, { width: 14 }, { width: 14 },
  ];

  const boldRow = (values: (string | number)[]) => {
    const row = sheet.addRow(values);
    row.font = { bold: true };
    return row;
  };

  boldRow([`Running Bill — ${bill.billNumber}`]);
  sheet.addRow(["Date", bill.billDate, "Status", RB_STATUS_LABELS[bill.status] ?? bill.status]);
  sheet.addRow(["Project", bill.project?.name ?? "", "Site", bill.site]);
  sheet.addRow(["Sub Work", bill.subWork?.name ?? "-", "Measurement Book", bill.measurementBook?.mbNumber ?? "-"]);
  sheet.addRow(["Bill Type", BILL_TYPE_LABELS[bill.billType] ?? bill.billType, "Remarks", bill.remarks || "-"]);
  sheet.addRow([]);

  boldRow(["Item No.", "Description", "Unit", "Prev Qty", "Curr Qty", "Total Qty", "Eff. Rate", "Prev Amount", "Curr Amount", "Total Amount"]);
  bill.items.forEach((item) =>
    sheet.addRow([
      item.boqItemNo,
      item.boqDescription,
      item.unit,
      item.previousQuantity,
      item.currentQuantity,
      item.totalQuantity,
      item.effectiveRate,
      item.previousAmount,
      item.currentAmount,
      item.totalAmount,
    ])
  );
  sheet.addRow([]);
  boldRow(["", "", "", "", "", "TOTAL", "", bill.previousCertifiedAmount, bill.currentCertifiedAmount, bill.totalCertifiedAmount]);
  sheet.addRow([]);

  if (bill.deductions.length) {
    boldRow(["Deductions"]);
    boldRow(["Type", "Label", "Amount", "Remarks"]);
    bill.deductions.forEach((d) => sheet.addRow([d.type, d.label, d.amount, d.remarks]));
    sheet.addRow([]);
  }

  boldRow(["Summary"]);
  sheet.addRow(["Current Certified Amount", bill.currentCertifiedAmount]);
  sheet.addRow(["Total Deductions", bill.totalDeductions]);
  sheet.addRow(["Net Payable", bill.netPayable]);
  sheet.addRow(["Amount Received", bill.amountReceived]);
  sheet.addRow(["Outstanding Amount", bill.outstandingAmount]);

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
