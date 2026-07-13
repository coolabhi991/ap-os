import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";
import type { getMBById } from "./measurement-book.service.js";
import { MB_STATUS_LABELS } from "./measurement-book.service.js";

export type MBDetail = Awaited<ReturnType<typeof getMBById>>;

function inr(v: string | number) {
  return `Rs. ${Number(v).toLocaleString("en-IN")}`;
}

/**
 * Renders the MB header + Form 58 Abstract Sheet as a landscape, multi-page-safe PDF.
 *
 * Never call `.font("Helvetica-Bold")` (or any other AFM bold/oblique variant) anywhere in this
 * function — on this environment's Node/pdfkit combination that call hangs the entire server
 * process synchronously, not just the request. Emphasis is done with plain "Helvetica" at a
 * larger size / with color instead. This mirrors the same constraint already documented and
 * worked around in report-export.service.ts.
 */
export async function generateMBPdf(mb: MBDetail, companyName: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 40, bufferPages: true });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const startX = doc.page.margins.left;
    const bottomLimit = doc.page.height - doc.page.margins.bottom - 24;

    doc.font("Helvetica");

    doc.fontSize(15).text(companyName, { align: "center" });
    doc.fontSize(12).fillColor("#333333").text("MEASUREMENT BOOK — ABSTRACT SHEET (FORM 58)", { align: "center" });
    doc.fillColor("#000000");
    doc.moveDown(0.4);
    doc.fontSize(9).text(`MB No: ${mb.mbNumber}      Date: ${mb.mbDate}      Status: ${MB_STATUS_LABELS[mb.status] ?? mb.status}`);
    doc.moveDown(0.5);

    const half = pageWidth / 2;
    const kv = (label: string, value: string, x: number, y: number, width: number) => {
      doc.fontSize(8.5).text(`${label}: ${value || "-"}`, x, y, { width });
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
      { label: "Sr No", key: "boqItemNo", w: pageWidth * 0.06, align: "left" as const },
      { label: "Item of Work", key: "boqDescription", w: pageWidth * 0.28, align: "left" as const },
      { label: "Qty", key: "totalQuantity", w: pageWidth * 0.09, align: "right" as const },
      { label: "Unit", key: "unit", w: pageWidth * 0.07, align: "left" as const },
      { label: "Rate", key: "effectiveRate", w: pageWidth * 0.12, align: "right" as const },
      { label: "Up To Date Amount", key: "totalAmount", w: pageWidth * 0.14, align: "right" as const },
      { label: "Since Previous", key: "previousAmount", w: pageWidth * 0.12, align: "right" as const },
      { label: "Now To Pay", key: "amount", w: pageWidth * 0.12, align: "right" as const },
    ];

    let cy = doc.y;

    const drawTableHeader = () => {
      let cx = startX;
      doc.font("Helvetica").fontSize(7.5).fillColor("#000000");
      cols.forEach((c) => {
        doc.rect(cx, cy, c.w, 18).fillAndStroke("#e2e8f0", "#94a3b8");
        doc.fillColor("#000000").text(c.label, cx + 3, cy + 5, { width: c.w - 6, align: c.align });
        cx += c.w;
      });
      cy += 18;
    };

    const ensureSpace = (rowHeight: number) => {
      if (cy + rowHeight > bottomLimit) {
        doc.addPage();
        cy = doc.page.margins.top;
        drawTableHeader();
      }
    };

    drawTableHeader();
    doc.font("Helvetica").fontSize(7.5);

    if (mb.items.length === 0) {
      ensureSpace(16);
      doc.text("No BOQ rows recorded.", startX + 3, cy + 4, { width: pageWidth - 6 });
      cy += 16;
    }

    mb.items.forEach((item) => {
      ensureSpace(16);
      let cx = startX;
      const values: (string | number)[] = [
        item.boqItemNo,
        item.boqDescription,
        Number(item.totalQuantity).toFixed(4),
        item.unit,
        inr(item.effectiveRate),
        inr(item.totalAmount),
        inr(item.previousAmount),
        inr(item.amount),
      ];
      values.forEach((v, i) => {
        doc.rect(cx, cy, cols[i].w, 16).stroke("#cbd5e1");
        doc.text(String(v), cx + 3, cy + 4, { width: cols[i].w - 6, align: cols[i].align });
        cx += cols[i].w;
      });
      cy += 16;
    });

    // Form 58 footer — Total Amount -> Above/Below -> Net Value -> GST -> Grand Total.
    const footerLabelWidth = pageWidth * 0.75;
    const footerValueWidth = pageWidth * 0.25;
    const footerRow = (label: string, value: string, emphasize = false) => {
      ensureSpace(18);
      doc.fontSize(emphasize ? 9 : 8).fillColor("#000000");
      doc.text(label, startX, cy + 4, { width: footerLabelWidth, align: "right" });
      doc.text(value, startX + footerLabelWidth, cy + 4, { width: footerValueWidth - 4, align: "right" });
      cy += 18;
    };

    cy += 6;
    footerRow("Total Amount", inr(mb.form58.totalNowToPay));
    footerRow(`Above / Below (${Number(mb.aboveBelowPercent) >= 0 ? "+" : ""}${mb.aboveBelowPercent}%) — Amount`, inr(mb.form58.aboveBelowAmount));
    footerRow("Net Value", inr(mb.form58.netValue), true);
    footerRow(`GST (${mb.gstPercent}%)`, inr(mb.form58.gstAmount));
    footerRow("Grand Total", inr(mb.form58.grandTotal), true);

    cy += 12;
    ensureSpace(20);
    doc.fontSize(8).fillColor("#666666").text(`Prepared by: ${mb.createdBy?.name ?? "-"}    |    Generated: ${new Date().toLocaleString()}`, startX, cy);
    doc.fillColor("#000000");

    // Page numbers — added last, after every page already exists.
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      doc.fontSize(7).fillColor("#888888").text(
        `Page ${i - range.start + 1} of ${range.count}`,
        startX,
        doc.page.height - doc.page.margins.bottom + 10,
        { width: pageWidth, align: "center" }
      );
    }

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
