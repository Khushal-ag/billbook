import { History } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useIsSimpleMode } from "@/hooks/use-simple-mode";
import { formatDate } from "@/lib/utils";
import type { AuditLog } from "@/types/audit-log";

interface InvoiceAuditHistoryProps {
  logs: AuditLog[];
}

export function InvoiceAuditHistory({ logs }: InvoiceAuditHistoryProps) {
  const isSimpleMode = useIsSimpleMode();

  // Hide in simple mode
  if (isSimpleMode) return null;

  if (!logs.length) return null;
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <History className="h-4 w-4" />
          Audit History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {logs.map((log) => (
            <div
              key={log.id}
              className="flex items-start gap-3 border-b pb-3 last:border-0 last:pb-0"
            >
              <Badge
                variant={log.action === "DELETE" ? "destructive" : "default"}
                className="mt-0.5 whitespace-nowrap text-xs"
              >
                {log.action}
              </Badge>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{formatDate(log.createdAt)}</p>
                {log.actorRole && (
                  <p className="text-xs text-muted-foreground">By {log.actorRole}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
