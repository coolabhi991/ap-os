import { generateBankBookPdf, generateCashBookPdf } from "./banking-export.service.js";
import type { BankBookDetail, CashBookDetail } from "./banking-export.service.js";
import { sendMail } from "./mailer.service.js";

export interface EmailRecipient {
  label: string;
  email: string;
}

export interface SendBankingReportEmailInput {
  recipients: EmailRecipient[];
  message?: string;
}

function validateRecipients(recipients: EmailRecipient[] | undefined) {
  if (!recipients?.length) throw new Error("At least one recipient is required");
  for (const r of recipients) {
    if (!r.email?.trim()) throw new Error("Every recipient must have an email address");
  }
}

/** Emails the Bank Book as a PDF attachment — reuses mailer.service.ts exactly like DPR/MB/Running Bill emails. */
export async function sendBankBookEmail(input: SendBankingReportEmailInput, report: BankBookDetail, companyName: string) {
  validateRecipients(input.recipients);
  const pdf = await generateBankBookPdf(report, companyName);

  await sendMail({
    to: input.recipients.map((r) => r.email).join(", "),
    subject: `Bank Book — ${report.account.bankName} (${report.account.accountNumber})`,
    text: input.message || `Please find attached the Bank Book for ${report.account.bankName} — ${report.account.accountNumber}. Closing Balance: Rs. ${Number(report.closingBalance).toLocaleString("en-IN")}.`,
    attachments: [{ filename: `bank-book-${report.account.accountNumber}.pdf`, content: pdf }],
  });
}

/** Emails the Cash Book as a PDF attachment. */
export async function sendCashBookEmail(input: SendBankingReportEmailInput, report: CashBookDetail, companyName: string) {
  validateRecipients(input.recipients);
  const pdf = await generateCashBookPdf(report, companyName);

  await sendMail({
    to: input.recipients.map((r) => r.email).join(", "),
    subject: "Cash Book",
    text: input.message || `Please find attached the Cash Book. Closing Balance: Rs. ${Number(report.closingBalance).toLocaleString("en-IN")}.`,
    attachments: [{ filename: "cash-book.pdf", content: pdf }],
  });
}
