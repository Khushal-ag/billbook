"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadReportCsv } from "@/api";
import { buildQueryString } from "@/lib/core/utils";
import { showErrorToast } from "@/lib/ui/toast-helpers";

type ReportCsvButtonProps = {
  /** e.g. `/reports/receipt-register` */
  reportPath: string;
  query: Record<string, string | number | boolean | undefined | null>;
  filename: string;
  disabled?: boolean;
};

export function ReportCsvButton({ reportPath, query, filename, disabled }: ReportCsvButtonProps) {
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    setLoading(true);
    try {
      const qs = buildQueryString({ ...query, format: "csv" });
      await downloadReportCsv(`${reportPath}?${qs}`, filename);
    } catch (e) {
      showErrorToast(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handle}
      disabled={disabled || loading}
    >
      {loading ? (
        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
      ) : (
        <Download className="mr-2 h-3.5 w-3.5" />
      )}
      Download CSV
    </Button>
  );
}
