import api from "../services/api";

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
}

async function downloadReport(format: "pdf" | "excel", input: ReportExportInput) {
  const response = await api.post("/reports/export", { ...input, format }, { responseType: "blob" });
  const ext = format === "pdf" ? "pdf" : "xlsx";
  const safeName = input.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `${safeName}.${ext}`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

/** The standard export mechanism for AP OS reports — PDF/Excel generated server-side from the same {columns, rows} already on screen; Print uses the browser's own print dialog on the visible page. */
export const exportReportPdf = (input: ReportExportInput) => downloadReport("pdf", input);
export const exportReportExcel = (input: ReportExportInput) => downloadReport("excel", input);
export const printReport = () => window.print();
