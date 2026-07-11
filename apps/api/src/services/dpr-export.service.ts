import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";
import type { getDPRById } from "./dpr.service.js";

export type DPRDetail = Awaited<ReturnType<typeof getDPRById>>;

const VISITOR_TYPE_LABELS: Record<string, string> = {
  EXECUTIVE_ENGINEER: "Executive Engineer",
  DEPUTY_ENGINEER: "Deputy Engineer",
  ASSISTANT_ENGINEER: "Assistant Engineer",
  JUNIOR_ENGINEER: "Junior Engineer",
  CONSULTANT: "Consultant",
  CLIENT: "Client",
  OTHER: "Other",
};

const SITE_PROBLEM_TYPE_LABELS: Record<string, string> = {
  RAIN: "Rain",
  LABOUR_SHORTAGE: "Labour Shortage",
  MATERIAL_SHORTAGE: "Material Shortage",
  MACHINERY_BREAKDOWN: "Machinery Breakdown",
  DRAWING_PENDING: "Drawing Pending",
  OTHER: "Other",
};

function inr(v: string | number) {
  return `Rs. ${Number(v).toLocaleString("en-IN")}`;
}

/** Renders a professional, government-style Daily Progress Report as a PDF buffer. */
export async function generateDPRPdf(dpr: DPRDetail, companyName: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 40 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

    const sectionHeader = (title: string) => {
      doc.moveDown(0.6);
      doc.rect(doc.x, doc.y, pageWidth, 20).fill("#1e3a5f");
      doc.fillColor("#ffffff").fontSize(11).font("Helvetica-Bold").text(title, doc.x + 6, doc.y + 5);
      doc.fillColor("#000000").font("Helvetica");
      doc.moveDown(0.9);
    };

    const kvRow = (label: string, value: string, colWidth = pageWidth / 2) => {
      doc.fontSize(9).font("Helvetica-Bold").text(`${label}:`, { continued: false, width: colWidth });
      doc.font("Helvetica");
    };

    const kvGrid = (pairs: Array<[string, string]>) => {
      const half = pageWidth / 2;
      for (let i = 0; i < pairs.length; i += 2) {
        const startY = doc.y;
        const [l1, v1] = pairs[i];
        doc.fontSize(9).font("Helvetica-Bold").text(`${l1}: `, doc.x, startY, { continued: true, width: half - 10 });
        doc.font("Helvetica").text(v1 || "-");
        if (pairs[i + 1]) {
          const [l2, v2] = pairs[i + 1];
          doc.fontSize(9).font("Helvetica-Bold").text(`${l2}: `, doc.x + half, startY, { continued: true, width: half - 10 });
          doc.font("Helvetica").text(v2 || "-");
        }
        doc.moveDown(0.3);
      }
    };

    const table = (headers: string[], rows: string[][], colWidths: number[]) => {
      const startX = doc.x;
      let y = doc.y;
      doc.font("Helvetica-Bold").fontSize(8.5);
      let x = startX;
      headers.forEach((h, i) => {
        doc.rect(x, y, colWidths[i], 18).stroke();
        doc.text(h, x + 3, y + 5, { width: colWidths[i] - 6 });
        x += colWidths[i];
      });
      y += 18;
      doc.font("Helvetica").fontSize(8.5);
      rows.forEach((row) => {
        x = startX;
        row.forEach((cell, i) => {
          doc.rect(x, y, colWidths[i], 16).stroke();
          doc.text(cell, x + 3, y + 4, { width: colWidths[i] - 6 });
          x += colWidths[i];
        });
        y += 16;
      });
      doc.y = y + 6;
    };

    // Header
    doc.fontSize(16).font("Helvetica-Bold").text(companyName, { align: "center" });
    doc.fontSize(13).text("DAILY PROGRESS REPORT", { align: "center" });
    doc.fontSize(9).font("Helvetica").text("Official Site Diary", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(10).font("Helvetica-Bold").text(`DPR No: ${dpr.dprNumber}`, { continued: true }).font("Helvetica").text(`      Date: ${dpr.reportDate}      Shift: ${dpr.shift}`);
    doc.moveDown(0.3);

    sectionHeader("GENERAL INFORMATION");
    kvGrid([
      ["Project", dpr.project?.name ?? ""],
      ["Site", dpr.site ?? ""],
      ["Sub Work", dpr.subWork?.name ?? "-"],
      ["Engineer", dpr.engineer?.name ?? "-"],
      ["Contractor", dpr.contractor?.name ?? "-"],
      ["Weather", dpr.weather || "-"],
    ]);
    if (dpr.remarks) {
      doc.fontSize(9).font("Helvetica-Bold").text("Remarks: ", { continued: true }).font("Helvetica").text(dpr.remarks);
    }

    sectionHeader("WORK PROGRESS");
    doc.fontSize(9).font("Helvetica-Bold").text("Work Done Today:", { continued: false });
    doc.font("Helvetica").text(dpr.workDone || "-");
    doc.moveDown(0.3);
    doc.font("Helvetica-Bold").text("Planned Work:", { continued: false });
    doc.font("Helvetica").text(dpr.plannedWork || "-");
    doc.moveDown(0.3);
    kvGrid([
      ["Physical Progress Update", dpr.physicalProgressUpdate !== null ? `${dpr.physicalProgressUpdate}%` : "-"],
      ["Delay Reason", dpr.delayReason || "-"],
    ]);
    if (dpr.instructions) {
      doc.font("Helvetica-Bold").text("Instructions: ", { continued: true }).font("Helvetica").text(dpr.instructions);
    }

    sectionHeader("LABOUR SUMMARY");
    table(
      ["Skilled", "Unskilled", "Supervisor", "Operator", "Total"],
      [[String(dpr.labourSkilled), String(dpr.labourUnskilled), String(dpr.labourSupervisor), String(dpr.labourOperator), String(dpr.labourTotal)]],
      [pageWidth / 5, pageWidth / 5, pageWidth / 5, pageWidth / 5, pageWidth / 5]
    );

    sectionHeader("MACHINERY SUMMARY");
    const machineryRows = [
      ...dpr.machinerySummary.map((m) => [m.machineType || "-", m.hours, inr(m.amount), "Auto (Site Expense)"]),
      ...(dpr.manualMachineryEntries ?? []).map((m) => [m.machineType, String(m.hours), inr(m.amount), "Manual"]),
    ];
    if (machineryRows.length) {
      table(["Machine Type", "Hours", "Amount", "Source"], machineryRows, [pageWidth * 0.3, pageWidth * 0.2, pageWidth * 0.25, pageWidth * 0.25]);
    } else {
      doc.fontSize(9).text("No machinery usage recorded for this date.");
      doc.moveDown(0.5);
    }

    sectionHeader("MATERIAL SUMMARY");
    doc.fontSize(9).font("Helvetica-Bold").text("Material Received Today");
    doc.font("Helvetica");
    if (dpr.materialSummary.materialReceivedToday.length) {
      table(
        ["Receipt #", "Item", "Qty", "Unit"],
        dpr.materialSummary.materialReceivedToday.map((r) => [r.receiptNumber, r.itemName, r.quantity, r.unit ?? ""]),
        [pageWidth * 0.25, pageWidth * 0.4, pageWidth * 0.2, pageWidth * 0.15]
      );
    } else {
      doc.text("None.");
      doc.moveDown(0.3);
    }
    doc.fontSize(9).font("Helvetica-Bold").text("Material Issued Today");
    doc.font("Helvetica");
    if (dpr.materialSummary.materialIssuedToday.length) {
      table(
        ["Issue #", "Item", "Qty", "Unit"],
        dpr.materialSummary.materialIssuedToday.map((i) => [i.issueNumber, i.itemName, i.quantity, i.unit ?? ""]),
        [pageWidth * 0.25, pageWidth * 0.4, pageWidth * 0.2, pageWidth * 0.15]
      );
    } else {
      doc.text("None.");
      doc.moveDown(0.3);
    }
    doc.fontSize(9).font("Helvetica-Bold").text("Major Materials Used");
    doc.font("Helvetica");
    if (dpr.materialSummary.majorMaterialsUsed.length) {
      table(
        ["Item", "Quantity", "Unit"],
        dpr.materialSummary.majorMaterialsUsed.map((m) => [m.itemName, m.quantity, m.unit]),
        [pageWidth * 0.5, pageWidth * 0.3, pageWidth * 0.2]
      );
    } else {
      doc.text("None.");
      doc.moveDown(0.3);
    }

    if (dpr.visitors.length) {
      sectionHeader("VISITORS");
      table(
        ["Type", "Name", "Remarks"],
        dpr.visitors.map((v) => [VISITOR_TYPE_LABELS[v.visitorType] ?? v.visitorType, v.name || "-", v.remarks || "-"]),
        [pageWidth * 0.3, pageWidth * 0.3, pageWidth * 0.4]
      );
    }

    if (dpr.siteProblems.length) {
      sectionHeader("SITE PROBLEMS");
      table(
        ["Problem", "Description"],
        dpr.siteProblems.map((p) => [SITE_PROBLEM_TYPE_LABELS[p.problemType] ?? p.problemType, p.description || "-"]),
        [pageWidth * 0.3, pageWidth * 0.7]
      );
    }

    doc.moveDown(1);
    doc.fontSize(8).fillColor("#666666").text(`Prepared by: ${dpr.createdBy?.name ?? "-"}    |    Generated: ${new Date().toLocaleString()}`, { align: "left" });

    doc.end();
  });
}

/** Exports the same DPR data as a structured, multi-section .xlsx workbook. */
export async function generateDPRExcel(dpr: DPRDetail): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "AP OS";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("DPR");
  sheet.columns = [{ width: 24 }, { width: 24 }, { width: 24 }, { width: 24 }];

  const boldRow = (values: string[]) => {
    const row = sheet.addRow(values);
    row.font = { bold: true };
    return row;
  };

  boldRow([`Daily Progress Report — ${dpr.dprNumber}`]);
  sheet.addRow([]);

  boldRow(["General Information"]);
  sheet.addRow(["Date", dpr.reportDate, "Shift", dpr.shift]);
  sheet.addRow(["Project", dpr.project?.name ?? "", "Site", dpr.site ?? ""]);
  sheet.addRow(["Sub Work", dpr.subWork?.name ?? "-", "Engineer", dpr.engineer?.name ?? "-"]);
  sheet.addRow(["Contractor", dpr.contractor?.name ?? "-", "Weather", dpr.weather || "-"]);
  sheet.addRow(["Remarks", dpr.remarks || "-"]);
  sheet.addRow([]);

  boldRow(["Work Progress"]);
  sheet.addRow(["Work Done Today", dpr.workDone || "-"]);
  sheet.addRow(["Planned Work", dpr.plannedWork || "-"]);
  sheet.addRow(["Physical Progress Update", dpr.physicalProgressUpdate !== null ? `${dpr.physicalProgressUpdate}%` : "-"]);
  sheet.addRow(["Delay Reason", dpr.delayReason || "-"]);
  sheet.addRow(["Instructions", dpr.instructions || "-"]);
  sheet.addRow([]);

  boldRow(["Labour Summary"]);
  boldRow(["Skilled", "Unskilled", "Supervisor", "Operator", "Total"]);
  sheet.addRow([dpr.labourSkilled, dpr.labourUnskilled, dpr.labourSupervisor, dpr.labourOperator, dpr.labourTotal]);
  sheet.addRow([]);

  boldRow(["Machinery Summary"]);
  boldRow(["Machine Type", "Hours", "Amount", "Source"]);
  dpr.machinerySummary.forEach((m) => sheet.addRow([m.machineType || "-", m.hours, m.amount, "Auto (Site Expense)"]));
  (dpr.manualMachineryEntries ?? []).forEach((m) => sheet.addRow([m.machineType, m.hours, m.amount, "Manual"]));
  sheet.addRow([]);

  boldRow(["Material Received Today"]);
  boldRow(["Receipt #", "Item", "Qty", "Unit"]);
  dpr.materialSummary.materialReceivedToday.forEach((r) => sheet.addRow([r.receiptNumber, r.itemName, r.quantity, r.unit ?? ""]));
  sheet.addRow([]);

  boldRow(["Material Issued Today"]);
  boldRow(["Issue #", "Item", "Qty", "Unit"]);
  dpr.materialSummary.materialIssuedToday.forEach((i) => sheet.addRow([i.issueNumber, i.itemName, i.quantity, i.unit ?? ""]));
  sheet.addRow([]);

  boldRow(["Major Materials Used"]);
  boldRow(["Item", "Quantity", "Unit"]);
  dpr.materialSummary.majorMaterialsUsed.forEach((m) => sheet.addRow([m.itemName, m.quantity, m.unit]));
  sheet.addRow([]);

  if (dpr.visitors.length) {
    boldRow(["Visitors"]);
    boldRow(["Type", "Name", "Remarks"]);
    dpr.visitors.forEach((v) => sheet.addRow([VISITOR_TYPE_LABELS[v.visitorType] ?? v.visitorType, v.name || "-", v.remarks || "-"]));
    sheet.addRow([]);
  }

  if (dpr.siteProblems.length) {
    boldRow(["Site Problems"]);
    boldRow(["Problem", "Description"]);
    dpr.siteProblems.forEach((p) => sheet.addRow([SITE_PROBLEM_TYPE_LABELS[p.problemType] ?? p.problemType, p.description || "-"]));
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
