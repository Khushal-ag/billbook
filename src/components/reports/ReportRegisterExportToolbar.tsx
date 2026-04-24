"use client";

import { useState } from "react";
import { FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { downloadReportFile } from "@/api";
import { Button } from "@/components/ui/button";
import { ReportCsvButton } from "@/components/reports/ReportCsvButton";
import { cn } from "@/lib/core/utils";
import {
  downloadReportExcel,
  downloadReportPdf,
  type ClientReportTableExport,
} from "@/lib/reports/report-table-export";
import { showErrorToast } from "@/lib/ui/toast-helpers";

export type { ClientReportTableExport };

export type ReportRegisterExportQuery = Record<
  string,
  string | number | boolean | undefined | null
>;

/**
 * CSV via API; PDF and Excel from the optional `clientTableExport` (current on-screen rows) or API `format=` when omitted.
 */
export function ReportRegisterExportToolbar({
  reportPath,
  query,
  csvFilename,
  pdfFilename,
  xlsxFilename,
  clientTableExport,
  disabled,
  className,
}: {
  reportPath: string;
  query: ReportRegisterExportQuery;
  csvFilename: string;
  pdfFilename: string;
  xlsxFilename: string;
  /** When set, PDF/XLSX are generated in the browser from these rows (matches filters shown in the table). */
  clientTableExport?: ClientReportTableExport | null;
  disabled?: boolean;
  className?: string;
}) {
  const [pdfLoading, setPdfLoading] = useState(false);
  const [xlsxLoading, setXlsxLoading] = useState(false);

  const run = async (format: "pdf" | "xlsx") => {
    const setLoading = format === "pdf" ? setPdfLoading : setXlsxLoading;
    setLoading(true);
    try {
      if (clientTableExport) {
        const base = {
          reportTitle: clientTableExport.reportTitle,
          subtitle: clientTableExport.subtitle,
          headers: clientTableExport.headers,
          rows: clientTableExport.rows,
        };
        if (format === "pdf") {
          downloadReportPdf({ ...base, filename: pdfFilename });
        } else {
          downloadReportExcel({ ...base, filename: xlsxFilename });
        }
        return;
      }
      const fallback = format === "pdf" ? pdfFilename : xlsxFilename;
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
