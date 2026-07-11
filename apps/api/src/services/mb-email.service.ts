import prisma from "../config/prisma.js";
import { Prisma } from "@prisma/client";
import { generateMBPdf, generateMBExcel } from "./mb-export.service.js";
import type { MBDetail } from "./mb-export.service.js";
import { sendMail } from "./mailer.service.js";

export interface EmailRecipient {
  label: string;
  email: string;
}

export interface SendMBEmailInput {
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

/** Sends the MB Abstract Sheet by email with the PDF (always) and Excel (optional) attached, then logs the attempt. */
export async function sendMBEmail(
  mbId: string,
  companyId: string,
  sentById: string,
  input: SendMBEmailInput,
  mb: MBDetail,
  companyName: string
) {
  if (!input.recipients?.length) throw new Error("At least one recipient is required");
  for (const r of input.recipients) {
    if (!r.email?.trim()) throw new Error("Every recipient must have an email address");
  }

  const recipientsJson = input.recipients as unknown as Prisma.InputJsonValue;

  try {
    const pdfBuffer = await generateMBPdf(mb, companyName);
    const attachments: { filename: string; content: Buffer }[] = [{ filename: `${mb.mbNumber}.pdf`, content: pdfBuffer }];

    if (input.includeExcel) {
      const excelBuffer = await generateMBExcel(mb);
      attachments.push({ filename: `${mb.mbNumber}.xlsx`, content: excelBuffer });
    }

    await sendMail({
      to: input.recipients.map((r) => r.email).join(", "),
      subject: `Measurement Book — ${mb.mbNumber} (${mb.mbDate})`,
      text: input.message || `Please find attached the Measurement Book Abstract Sheet for ${mb.project?.name ?? "the project"} dated ${mb.mbDate}.`,
      attachments,
    });

    const log = await prisma.mBEmailLog.create({
      data: { companyId, measurementBookId: mbId, recipients: recipientsJson, includedExcel: !!input.includeExcel, sentById, status: "SENT" },
    });
    return toLogDTO(log);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send Measurement Book email";
    await prisma.mBEmailLog.create({
      data: { companyId, measurementBookId: mbId, recipients: recipientsJson, includedExcel: !!input.includeExcel, sentById, status: "FAILED", errorMessage: message },
    });
    throw new Error(message);
  }
}

export async function listMBEmailLogs(mbId: string, companyId: string) {
  const logs = await prisma.mBEmailLog.findMany({ where: { measurementBookId: mbId, companyId }, orderBy: { sentAt: "desc" } });
  return logs.map(toLogDTO);
}
