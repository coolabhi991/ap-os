import nodemailer from "nodemailer";

export interface MailAttachment {
  filename: string;
  content: Buffer;
}

export interface SendMailInput {
  to: string;
  subject: string;
  text?: string;
  attachments?: MailAttachment[];
}

/** Shared SMTP transporter — every module that emails a generated document (DPR, Measurement Book, ...) reuses this instead of configuring its own. */
function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !port || !user || !pass) {
    throw new Error(
      "SMTP is not configured — set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS (and optionally SMTP_FROM, SMTP_SECURE) in apps/api/.env before sending emails."
    );
  }

  return nodemailer.createTransport({
    host,
    port: Number(port),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user, pass },
  });
}

export async function sendMail(input: SendMailInput) {
  const transporter = getTransporter();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  await transporter.sendMail({ from, to: input.to, subject: input.subject, text: input.text, attachments: input.attachments });
}
