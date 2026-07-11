import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";
import type { getBankBookReport, getCashBookReport } from "./banking-reports.service.js";

export type BankBookDetail = Awaited<ReturnType<typeof getBankBookReport>>;
export type CashBookDetail = Awaited<ReturnType<typeof getCashBookReport>>;

function inr(v: string | number) {
  return `Rs. ${Number(v).toLocaleString("en-IN")}`;
}

function tableHeaderRow(doc: PDFKit.PDFDocument, startX: number, y: number, cols: { label: string; w: number }[]) {
  doc.font("Helvetica-Bold").fontSize(8);
  let cx = startX;
  cols.forEach((c) => {
    doc.rect(cx, y, c.w, 18).stroke();
    doc.text(c.label, cx + 2, y + 5, { width: c.w - 4 });
    cx += c.w;
  });
  return y + 18;
}

function tableDataRow(doc: PDFKit.PDFDocument, startX: number, y: number, cols: { w: number }[], values: (string | number)[]) {
  doc.font("Helvetica").fontSize(8);
  let cx = startX;
  values.forEach((v, i) => {
    doc.rect(cx, y, cols[i].w, 16).stroke();
    doc.text(String(v), cx + 2, y + 4, { width: cols[i].w - 4 });
    cx += cols[i].w;
  });
  return y + 16;
}

export async function generateBankBookPdf(report: BankBookDetail, companyName: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 36 });
    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

    doc.fontSize(15).font("Helvetica-Bold").text(companyName, { align: "center" });
    doc.fontSize(12).text("BANK BOOK", { align: "center" });
    doc.moveDown(0.3);
    doc.fontSize(9).font("Helvetica").text(`${report.account.bankName} — ${report.account.accountNumber}${report.account.nickname ? ` (${report.account.nickname})` : ""}`, { align: "center" });
    doc.moveDown(0.6);

    doc.fontSize(9).text(`Opening Balance: ${inr(report.openingBalance)}    Closing Balance: ${inr(report.closingBalance)}`, { align: "center" });
    doc.moveDown(0.6);

    const cols = [
      { label: "Date", w: pageWidth * 0.09 },
      { label: "Description", w: pageWidth * 0.24 },
      { label: "Reference", w: pageWidth * 0.13 },
      { label: "Category", w: pageWidth * 0.12 },
      { label: "Status", w: pageWidth * 0.13 },
      { label: "Deposit", w: pageWidth * 0.11 },
      { label: "Withdrawal", w: pageWidth * 0.09 },
      { label: "Balance", w: pageWidth * 0.09 },
    ];

    const startX = doc.x;
    let y = tableHeaderRow(doc, startX, doc.y, cols);

    report.entries.forEach((e) => {
      if (y > doc.page.height - 80) {
        doc.addPage({ size: "A4", layout: "landscape", margin: 36 });
        y = tableHeaderRow(doc, startX, doc.y, cols);
      }
      y = tableDataRow(doc, startX, y, cols, [
        e.transactionDate,
        e.description || "-",
        e.referenceNumber || "-",
        e.category || "-",
        e.allocationStatus,
        e.deposit !== "0" ? inr(e.deposit) : "-",
        e.withdrawal !== "0" ? inr(e.withdrawal) : "-",
        inr(e.balance),
      ]);
    });

    doc.y = y + 20;
    doc.fontSize(8).fillColor("#666666").text(`Generated: ${new Date().toLocaleString()}`, startX, doc.y);

    doc.end();
  });
}

export async function generateBankBookExcel(report: BankBookDetail): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "AP OS";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Bank Book");
  sheet.columns = [{ width: 12 }, { width: 30 }, { width: 16 }, { width: 14 }, { width: 16 }, { width: 14 }, { width: 14 }, { width: 14 }];

  const boldRow = (values: (string | number)[]) => {
    const row = sheet.addRow(values);
    row.font = { bold: true };
    return row;
  };

  boldRow([`Bank Book — ${report.account.bankName} (${report.account.accountNumber})`]);
  sheet.addRow(["Opening Balance", report.openingBalance, "Closing Balance", report.closingBalance]);
  sheet.addRow(["Total Deposits", report.totalDeposits, "Total Withdrawals", report.totalWithdrawals]);
  sheet.addRow([]);

  boldRow(["Date", "Description", "Reference", "Category", "Status", "Deposit", "Withdrawal", "Balance"]);
  report.entries.forEach((e) => sheet.addRow([e.transactionDate, e.description, e.referenceNumber, e.category, e.allocationStatus, e.deposit, e.withdrawal, e.balance]));

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export async function generateCashBookPdf(report: CashBookDetail, companyName: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 36 });
    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

    doc.fontSize(15).font("Helvetica-Bold").text(companyName, { align: "center" });
    doc.fontSize(12).text("CASH BOOK", { align: "center" });
    doc.moveDown(0.6);
    doc.fontSize(9).font("Helvetica").text(`Opening Balance: ${inr(report.openingBalance)}    Closing Balance: ${inr(report.closingBalance)}`, { align: "center" });
    doc.moveDown(0.6);

    const cols = [
      { label: "Date", w: pageWidth * 0.1 },
      { label: "Type", w: pageWidth * 0.22 },
      { label: "Reference", w: pageWidth * 0.38 },
      { label: "Received", w: pageWidth * 0.15 },
      { label: "Paid", w: pageWidth * 0.15 },
    ];

    const startX = doc.x;
    let y = tableHeaderRow(doc, startX, doc.y, cols);

    report.entries.forEach((e) => {
      if (y > doc.page.height - 80) {
        doc.addPage({ size: "A4", layout: "landscape", margin: 36 });
        y = tableHeaderRow(doc, startX, doc.y, cols);
      }
      y = tableDataRow(doc, startX, y, cols, [e.date, e.type, e.reference, e.received !== "0.00" ? inr(e.received) : "-", e.paid !== "0.00" ? inr(e.paid) : "-"]);
    });

    doc.y = y + 20;
    doc.fontSize(8).fillColor("#666666").text(`Generated: ${new Date().toLocaleString()}`, startX, doc.y);

    doc.end();
  });
}

export async function generateCashBookExcel(report: CashBookDetail): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "AP OS";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Cash Book");
  sheet.columns = [{ width: 12 }, { width: 22 }, { width: 36 }, { width: 14 }, { width: 14 }, { width: 14 }];

  const boldRow = (values: (string | number)[]) => {
    const row = sheet.addRow(values);
    row.font = { bold: true };
    return row;
  };

  boldRow(["Cash Book"]);
  sheet.addRow(["Opening Balance", report.openingBalance, "Closing Balance", report.closingBalance]);
  sheet.addRow(["Total Received", report.totalReceived, "Total Paid", report.totalPaid]);
  sheet.addRow([]);

  boldRow(["Date", "Type", "Reference", "Received", "Paid", "Balance"]);
  report.entries.forEach((e) => sheet.addRow([e.date, e.type, e.reference, e.received, e.paid, e.balance]));

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
