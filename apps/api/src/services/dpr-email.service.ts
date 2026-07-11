import prisma from "../config/prisma.js";
import { Prisma } from "@prisma/client";
import { generateDPRPdf, generateDPRExcel } from "./dpr-export.service.js";
import type { DPRDetail } from "./dpr-export.service.js";
import { sendMail } from "./mailer.service.js";

export interface EmailRecipient {
  label: string;
  email: string;
}

export interface SendDPREmailInput {
  recipients: EmailRecipient[];
  includeExcel?: boolean;
  message?: string;
}

/** Recipient "roles" the UI can one-click select — resolved to an actual address by the caller (e.g. from Project/Vendor/User contact fields) or typed as a custom email. */
export const DPR_RECIPIENT_ROLES = ["EXECUTIVE_ENGINEER", "DEPUTY_ENGINEER", "ASSISTANT_ENGINEER", "JUNIOR_ENGINEER", "CLIENT", "CUSTOM"];

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

/** Sends the DPR by email with the PDF (always) and Excel (optional) attached, then logs the attempt. */
export async function sendDPREmail(
  dprId: string,
  companyId: string,
  sentById: string,
  input: SendDPREmailInput,
  dpr: DPRDetail,
  companyName: string
) {
  if (!input.recipients?.length) throw new Error("At least one recipient is required");
  for (const r of input.recipients) {
    if (!r.email?.trim()) throw new Error("Every recipient must have an email address");
  }

  const recipientsJson = input.recipients as unknown as Prisma.InputJsonValue;

  try {
    const pdfBuffer = await generateDPRPdf(dpr, companyName);
    const attachments: { filename: string; content: Buffer }[] = [{ filename: `${dpr.dprNumber}.pdf`, content: pdfBuffer }];

    if (input.includeExcel) {
      const excelBuffer = await generateDPRExcel(dpr);
      attachments.push({ filename: `${dpr.dprNumber}.xlsx`, content: excelBuffer });
    }

    await sendMail({
      to: input.recipients.map((r) => r.email).join(", "),
      subject: `Daily Progress Report — ${dpr.dprNumber} (${dpr.reportDate})`,
      text: input.message || `Please find attached the Daily Progress Report for ${dpr.project?.name ?? "the project"} dated ${dpr.reportDate}.`,
      attachments,
    });

    const log = await prisma.dPREmailLog.create({
      data: { companyId, dprId, recipients: recipientsJson, includedExcel: !!input.includeExcel, sentById, status: "SENT" },
    });
    return toLogDTO(log);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send DPR email";
    await prisma.dPREmailLog.create({
      data: { companyId, dprId, recipients: recipientsJson, includedExcel: !!input.includeExcel, sentById, status: "FAILED", errorMessage: message },
    });
    throw new Error(message);
  }
}

export async function listDPREmailLogs(dprId: string, companyId: string) {
  const logs = await prisma.dPREmailLog.findMany({ where: { dprId, companyId }, orderBy: { sentAt: "desc" } });
  return logs.map(toLogDTO);
}
