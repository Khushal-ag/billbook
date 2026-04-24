"use client";

import { useState } from "react";
import { FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { downloadReportFile } from "@/api";
import { Button } from "@/components/ui/button";
import { ReportCsvButton } from "@/components/reports/ReportCsvButton";
import { cn } from "@/lib/core/utils";
import { showErrorToast } from "@/lib/ui/toast-helpers";

export type ReportRegisterExportQuery = Record<
  string,
  string | number | boolean | undefined | null
>;

/**
 * CSV + PDF + Excel for report registers. PDF/XLSX call the same path with `format=` (when the API supports it).
 */
export function ReportRegisterExportToolbar({
  reportPath,
  query,
  csvFilename,
  pdfFilename,
  xlsxFilename,
  disabled,
  className,
}: {
  reportPath: string;
  query: ReportRegisterExportQuery;
  csvFilename: string;
  pdfFilename: string;
  xlsxFilename: string;
  disabled?: boolean;
  className?: string;
}) {
  const [pdfLoading, setPdfLoading] = useState(false);
  const [xlsxLoading, setXlsxLoading] = useState(false);

  const run = async (format: "pdf" | "xlsx") => {
    const fallback = format === "pdf" ? pdfFilename : xlsxFilename;
    const setLoading = format === "pdf" ? setPdfLoading : setXlsxLoading;
    setLoading(true);
    try {
      await downloadReportFile(reportPath, query, format, fallback);
    } catch (e) {
      showErrorToast(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-wrap items-center justify-end gap-2", className)}>
      <ReportCsvButton
        reportPath={reportPath}
        query={query}
        filename={csvFilename}
        disabled={disabled}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled || pdfLoading}
        onClick={() => run("pdf")}
      >
        {pdfLoading ? (
          <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
        ) : (
          <FileText className="mr-2 h-3.5 w-3.5" />
        )}
        Download PDF
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled || xlsxLoading}
        onClick={() => run("xlsx")}
      >
        {xlsxLoading ? (
          <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
        ) : (
          <FileSpreadsheet className="mr-2 h-3.5 w-3.5" />
        )}
        Download Excel
      </Button>
    </div>
  );
}
