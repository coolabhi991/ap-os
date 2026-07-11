import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";
import type { getMBById } from "./measurement-book.service.js";
import { MB_STATUS_LABELS } from "./measurement-book.service.js";

export type MBDetail = Awaited<ReturnType<typeof getMBById>>;

function inr(v: string | number) {
  return `Rs. ${Number(v).toLocaleString("en-IN")}`;
}

/** Renders the MB header + Abstract Sheet as a landscape PDF — many columns, so landscape keeps it legible. */
export async function generateMBPdf(mb: MBDetail, companyName: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 36 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

    doc.fontSize(15).font("Helvetica-Bold").text(companyName, { align: "center" });
    doc.fontSize(12).text("MEASUREMENT BOOK — ABSTRACT SHEET", { align: "center" });
    doc.moveDown(0.4);
    doc
      .fontSize(9)
      .font("Helvetica-Bold")
      .text(`MB No: ${mb.mbNumber}`, { continued: true })
      .font("Helvetica")
      .text(`      Date: ${mb.mbDate}      Status: ${MB_STATUS_LABELS[mb.status] ?? mb.status}`);
    doc.moveDown(0.5);

    const half = pageWidth / 2;
    const kv = (label: string, value: string, x: number, y: number, width: number) => {
      doc.fontSize(8.5).font("Helvetica-Bold").text(`${label}: `, x, y, { continued: true, width });
      doc.font("Helvetica").text(value || "-");
    };
    let y = doc.y;
    kv("Project", mb.project?.name ?? "", doc.x, y, half - 10);
    kv("Site", mb.site, doc.x + half, y, half - 10);
    y = doc.y;
    kv("Sub Work", mb.subWork?.name ?? "-", doc.x, y, half - 10);
    kv("Engineer", mb.engineer?.name ?? "-", doc.x + half, y, half - 10);
    y = doc.y;
    kv("Contractor", mb.contractor?.name ?? "-", doc.x, y, half - 10);
    if (mb.remarks) kv("Remarks", mb.remarks, doc.x + half, y, half - 10);
    doc.moveDown(0.8);

    const cols = [
      { label: "Item No.", w: pageWidth * 0.07 },
      { label: "Description", w: pageWidth * 0.22 },
      { label: "Unit", w: pageWidth * 0.05 },
      { label: "Length", w: pageWidth * 0.07 },
      { label: "Breadth", w: pageWidth * 0.07 },
      { label: "Height", w: pageWidth * 0.07 },
      { label: "Quantity", w: pageWidth * 0.08 },
      { label: "BOQ Rate", w: pageWidth * 0.09 },
      { label: "Payment %", w: pageWidth * 0.07 },
      { label: "Eff. Rate", w: pageWidth * 0.09 },
      { label: "Amount", w: pageWidth * 0.12 },
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
    mb.items.forEach((item) => {
      cx = startX;
      const values = [
        item.boqItemNo,
        item.boqDescription,
        item.unit,
        item.length || "-",
        item.breadth || "-",
        item.height || "-",
        item.quantity,
        inr(item.boqRate),
        `${item.paymentPercent}%`,
        inr(item.effectiveRate),
        inr(item.amount),
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
    doc.text(mb.totalQuantity, cx + 2, cy + 5, { width: cols[6].w - 4 });
    cx += cols[6].w;
    doc.rect(cx, cy, cols[7].w, 18).stroke();
    cx += cols[7].w;
    doc.rect(cx, cy, cols[8].w, 18).stroke();
    cx += cols[8].w;
    doc.rect(cx, cy, cols[9].w, 18).stroke();
    cx += cols[9].w;
    doc.rect(cx, cy, cols[10].w, 18).stroke();
    doc.text(inr(mb.totalAmount), cx + 2, cy + 5, { width: cols[10].w - 4 });

    doc.y = cy + 30;
    doc.font("Helvetica").fontSize(8).fillColor("#666666").text(`Prepared by: ${mb.createdBy?.name ?? "-"}    |    Generated: ${new Date().toLocaleString()}`, startX, doc.y);

    doc.end();
  });
}

/** Exports the MB header + Abstract Sheet as a single-sheet .xlsx workbook. */
export async function generateMBExcel(mb: MBDetail): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "AP OS";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Abstract Sheet");
  sheet.columns = [
    { width: 12 }, { width: 30 }, { width: 8 }, { width: 10 }, { width: 10 }, { width: 10 },
    { width: 12 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 14 },
  ];

  const boldRow = (values: (string | number)[]) => {
    const row = sheet.addRow(values);
    row.font = { bold: true };
    return row;
  };

  boldRow([`Measurement Book — ${mb.mbNumber}`]);
  sheet.addRow(["Date", mb.mbDate, "Status", MB_STATUS_LABELS[mb.status] ?? mb.status]);
  sheet.addRow(["Project", mb.project?.name ?? "", "Site", mb.site]);
  sheet.addRow(["Sub Work", mb.subWork?.name ?? "-", "Engineer", mb.engineer?.name ?? "-"]);
  sheet.addRow(["Contractor", mb.contractor?.name ?? "-", "Remarks", mb.remarks || "-"]);
  sheet.addRow([]);

  boldRow(["Item No.", "Description", "Unit", "Length", "Breadth", "Height", "Quantity", "BOQ Rate", "Payment %", "Effective Rate", "Amount"]);
  mb.items.forEach((item) =>
    sheet.addRow([
      item.boqItemNo,
      item.boqDescription,
      item.unit,
      item.length || "",
      item.breadth || "",
      item.height || "",
      item.quantity,
      item.boqRate,
      item.paymentPercent,
      item.effectiveRate,
      item.amount,
    ])
  );

  sheet.addRow([]);
  boldRow(["", "", "", "", "", "TOTAL", mb.totalQuantity, "", "", "", mb.totalAmount]);

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
