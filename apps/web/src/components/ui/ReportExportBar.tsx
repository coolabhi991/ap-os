import { useState } from "react";
import { FileDown, FileSpreadsheet, Printer } from "lucide-react";
import { exportReportPdf, exportReportExcel, printReport } from "../../lib/report-export";
import type { ReportExportInput } from "../../lib/report-export";

interface Props {
  input: ReportExportInput;
}

/** The standard Export PDF / Export Excel / Print bar — drop into any report page with its {title, columns, rows}. */
export default function ReportExportBar({ input }: Props) {
  const [exporting, setExporting] = useState<"pdf" | "excel" | null>(null);

  const handleExport = async (format: "pdf" | "excel") => {
    try {
      setExporting(format);
      await (format === "pdf" ? exportReportPdf(input) : exportReportExcel(input));
    } catch {
      alert(`Failed to export ${format === "pdf" ? "PDF" : "Excel"}.`);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="flex gap-2 print:hidden">
      <button
        onClick={() => handleExport("pdf")}
        disabled={exporting !== null}
        className="flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm hover:bg-slate-50 disabled:opacity-60"
      >
        <FileDown className="h-4 w-4" /> {exporting === "pdf" ? "Exporting..." : "Export PDF"}
      </button>
      <button
        onClick={() => handleExport("excel")}
        disabled={exporting !== null}
        className="flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm hover:bg-slate-50 disabled:opacity-60"
      >
        <FileSpreadsheet className="h-4 w-4" /> {exporting === "excel" ? "Exporting..." : "Export Excel"}
      </button>
      <button onClick={printReport} className="flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm hover:bg-slate-50">
        <Printer className="h-4 w-4" /> Print
      </button>
    </div>
  );
}
