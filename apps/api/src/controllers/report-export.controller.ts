import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import prisma from "../config/prisma.js";
import { buildReportPdf, buildReportExcel } from "../services/report-export.service.js";
import type { ReportExportInput } from "../services/report-export.service.js";

export const exportReportHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const { format, title, subtitle, columns, rows, totals } = req.body as ReportExportInput & { format: string };
    if (!title?.trim()) throw new Error("Report title is required");
    if (!Array.isArray(columns) || !columns.length) throw new Error("Report columns are required");
    if (!Array.isArray(rows)) throw new Error("Report rows are required");

    const company = await prisma.company.findUnique({ where: { id: companyId }, select: { name: true, logo: true } });

    const input: ReportExportInput = {
      title,
      subtitle,
      columns,
      rows,
      totals,
      companyName: company?.name,
      companyLogoDataUri: company?.logo ?? undefined,
      generatedAt: new Date().toLocaleString("en-IN"),
    };
    const safeName = title.replace(/[^a-z0-9]+/gi, "-").toLowerCase();

    if (format === "pdf") {
      const buffer = await buildReportPdf(input);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${safeName}.pdf"`);
      res.status(200).send(buffer);
      return;
    }

    if (format === "excel") {
      const buffer = await buildReportExcel(input);
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename="${safeName}.xlsx"`);
      res.status(200).send(buffer);
      return;
    }

    res.status(400).json({ success: false, message: "format must be 'pdf' or 'excel'" });
  } catch (error) {
    res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Failed to export report" });
  }
};
