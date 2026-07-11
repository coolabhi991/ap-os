import prisma from "../config/prisma.js";
import { Prisma } from "@prisma/client";
import { generateRunningBillPdf, generateRunningBillExcel } from "./running-bill-export.service.js";
import type { RunningBillDetail } from "./running-bill-export.service.js";
import { sendMail } from "./mailer.service.js";

export interface EmailRecipient {
  label: string;
  email: string;
}

export interface SendRunningBillEmailInput {
  recipients: EmailRecipient[];
  includeExcel?: boolean;
  message?: string;
}

function toLogDTO(log: {
  id: string;
  recipients: Prisma.JsonValue;
  includedExcel: boolean;
  sentAt: Date;
  status: string;
  errorMessage: string | null;
}) {
  return {
    id: log.id,
    recipients: (log.recipients as unknown as EmailRecipient[]) ?? [],
    includedExcel: log.includedExcel,
    sentAt: log.sentAt.toISOString(),
    status: log.status,
    errorMessage: log.errorMessage ?? "",
  };
}

/** Sends the Running Bill by email with the PDF (always) and Excel (optional) attached, then logs the attempt. */
export async function sendRunningBillEmail(
  billId: string,
  companyId: string,
  sentById: string,
  input: SendRunningBillEmailInput,
  bill: RunningBillDetail,
  companyName: string
) {
  if (!input.recipients?.length) throw new Error("At least one recipient is required");
  for (const r of input.recipients) {
    if (!r.email?.trim()) throw new Error("Every recipient must have an email address");
  }

  const recipientsJson = input.recipients as unknown as Prisma.InputJsonValue;

  try {
    const pdfBuffer = await generateRunningBillPdf(bill, companyName);
    const attachments: { filename: string; content: Buffer }[] = [{ filename: `${bill.billNumber}.pdf`, content: pdfBuffer }];

    if (input.includeExcel) {
      const excelBuffer = await generateRunningBillExcel(bill);
      attachments.push({ filename: `${bill.billNumber}.xlsx`, content: excelBuffer });
    }

    await sendMail({
      to: input.recipients.map((r) => r.email).join(", "),
      subject: `Running Bill — ${bill.billNumber} (${bill.billDate})`,
      text: input.message || `Please find attached the Running Bill for ${bill.project?.name ?? "the project"} dated ${bill.billDate}. Net Payable: Rs. ${Number(bill.netPayable).toLocaleString("en-IN")}.`,
      attachments,
    });

    const log = await prisma.runningBillEmailLog.create({
      data: { companyId, runningBillId: billId, recipients: recipientsJson, includedExcel: !!input.includeExcel, sentById, status: "SENT" },
    });
    return toLogDTO(log);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send Running Bill email";
    await prisma.runningBillEmailLog.create({
      data: { companyId, runningBillId: billId, recipients: recipientsJson, includedExcel: !!input.includeExcel, sentById, status: "FAILED", errorMessage: message },
    });
    throw new Error(message);
  }
}

export async function listRunningBillEmailLogs(billId: string, companyId: string) {
  const logs = await prisma.runningBillEmailLog.findMany({ where: { runningBillId: billId, companyId }, orderBy: { sentAt: "desc" } });
  return logs.map(toLogDTO);
}
