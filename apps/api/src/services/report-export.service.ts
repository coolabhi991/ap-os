import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";

export interface ReportColumn {
  key: string;
  label: string;
  align?: "left" | "right";
}

export interface ReportExportInput {
  title: string;
  subtitle?: string;
  columns: ReportColumn[];
  rows: Record<string, string | number>[];
  totals?: Record<string, string | number>;
  companyName?: string;
  companyLogoDataUri?: string;
  generatedAt?: string;
}

function logoBuffer(dataUri: string | undefined): Buffer | null {
  if (!dataUri) return null;
  const match = /^data:image\/(?:png|jpe?g);base64,(.+)$/.exec(dataUri);
  if (!match) return null;
  try {
    return Buffer.from(match[1], "base64");
  } catch {
    return null;
  }
}

/**
 * The standard report export mechanism for AP OS — every report page hands over its already-
 * rendered {columns, rows} (plus optional totals) and gets back a PDF or Excel buffer, instead of
 * writing its own pdfkit/exceljs layout code. Every export carries the same standard header
 * (logo + company name + report title + applied filters + generated timestamp) and footer (page
 * numbers), and an optional Totals row.
 */
export async function buildReportPdf(input: ReportExportInput): Promise<Buffer> {
  const { title, subtitle, columns, rows, totals, companyName, companyLogoDataUri, generatedAt } = input;
  const logo = logoBuffer(companyLogoDataUri);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", layout: columns.length > 6 ? "landscape" : "portrait", margin: 36, bufferPages: true });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const startX = doc.page.margins.left;

    // NOTE: standard "Helvetica-Bold" (and other bold/oblique AFM variants) trigger a
    // pathological hang in pdfkit's font-metrics parsing on some Node versions — plain
    // "Helvetica" at a larger size is used everywhere instead for visual emphasis.
    if (logo) {
      try {
        doc.image(logo, startX, doc.y, { width: 36, height: 36 });
      } catch {
        // Corrupt/unsupported image data — skip it rather than fail the whole export.
      }
    }
    const headerX = logo ? startX + 46 : startX;
    const headerWidth = logo ? pageWidth - 46 : pageWidth;
    if (companyName) {
      doc.fontSize(13).font("Helvetica").text(companyName, headerX, doc.y, { width: headerWidth });
    }
    doc.fontSize(16).font("Helvetica").text(title, headerX, doc.y, { width: headerWidth });
    if (subtitle) {
      doc.fontSize(9).font("Helvetica").fillColor("#555555").text(subtitle, headerX, doc.y, { width: headerWidth });
    }
    doc.fillColor("#000000").fontSize(8).font("Helvetica").text(`Generated: ${generatedAt ?? new Date().toLocaleString()}`, headerX, doc.y, { width: headerWidth });
    doc.moveDown(0.8);

    let y = doc.y;

    const drawHeaderRow = () => {
      const colWidth = pageWidth / columns.length;
      doc.fontSize(9).font("Helvetica");
      columns.forEach((col, i) => {
        doc.text(col.label, startX + i * colWidth, y, { width: colWidth - 4, align: col.align ?? "left" });
      });
      y += 16;
      doc.moveTo(startX, y - 2).lineTo(startX + pageWidth, y - 2).strokeColor("#cccccc").stroke();
    };

    const colWidth = pageWidth / columns.length;
    drawHeaderRow();
    doc.font("Helvetica").fontSize(8);

    for (const row of rows) {
      if (y > doc.page.height - doc.page.margins.bottom - 40) {
        doc.addPage();
        y = doc.page.margins.top;
        drawHeaderRow();
        doc.font("Helvetica").fontSize(8);
      }
      columns.forEach((col, i) => {
        const value = row[col.key];
        doc.text(value === undefined || value === null ? "" : String(value), startX + i * colWidth, y, {
          width: colWidth - 4,
          align: col.align ?? "left",
        });
      });
      y += 14;
    }

    if (totals) {
      if (y > doc.page.height - doc.page.margins.bottom - 40) {
        doc.addPage();
        y = doc.page.margins.top;
        drawHeaderRow();
      }
      doc.moveTo(startX, y).lineTo(startX + pageWidth, y).strokeColor("#333333").stroke();
      y += 4;
      doc.font("Helvetica").fontSize(9);
      columns.forEach((col, i) => {
        const value = totals[col.key];
        doc.text(value === undefined || value === null ? "" : String(value), startX + i * colWidth, y, {
          width: colWidth - 4,
          align: col.align ?? "left",
        });
      });
      y += 16;
    }

    // Page numbers — requires bufferPages so every page can be revisited before the stream ends.
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      doc.fontSize(7).fillColor("#888888").text(
        `Page ${i - range.start + 1} of ${range.count}`,
        startX,
        doc.page.height - doc.page.margins.bottom + 12,
        { width: pageWidth, align: "center" }
      );
    }

    doc.end();
  });
}

export async function buildReportExcel(input: ReportExportInput): Promise<Buffer> {
  const { title, subtitle, columns, rows, totals, companyName, generatedAt } = input;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "AP OS";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(title.slice(0, 31) || "Report");

  // Column widths only — set before any rows exist so it never disturbs cell values, and
  // deliberately without `header`/`key` so it doesn't also try to render its own header row
  // (the manual info rows + header row below are the only header content we want).
  sheet.columns = columns.map((c) => ({ width: Math.max(14, c.label.length + 4) }));

  const addInfoRow = (text: string, bold = false) => {
    const row = sheet.addRow([text]);
    if (bold) row.font = { bold: true };
  };
  if (companyName) addInfoRow(companyName, true);
  addInfoRow(title, true);
  if (subtitle) addInfoRow(subtitle);
  addInfoRow(`Generated: ${generatedAt ?? new Date().toLocaleString()}`);
  sheet.addRow([]);

  const headerRow = sheet.addRow(columns.map((c) => c.label));
  headerRow.font = { bold: true };
  headerRow.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } };
  });

  for (const row of rows) {
    sheet.addRow(columns.map((c) => row[c.key] ?? ""));
  }

  if (totals) {
    const totalsRow = sheet.addRow(columns.map((c) => totals[c.key] ?? ""));
    totalsRow.font = { bold: true };
    totalsRow.eachCell((cell) => {
      cell.border = { top: { style: "thin" } };
    });
  }

  columns.forEach((c, i) => {
    if (c.align === "right") sheet.getColumn(i + 1).alignment = { horizontal: "right" };
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
