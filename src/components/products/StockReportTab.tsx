import ErrorBanner from "@/components/ErrorBanner";
import TableSkeleton from "@/components/skeletons/TableSkeleton";
import { useStockReport } from "@/hooks/use-products";

export function StockReportTab() {
  const { data, isPending, error } = useStockReport();

  if (isPending) return <TableSkeleton rows={4} />;
  if (error) return <ErrorBanner error={error} fallbackMessage="Failed to load stock report" />;

  const items = (Array.isArray(data) ? data : []) as Array<{
    productId: number;
    productName: string;
    currentStock: number;
  }>;

  if (items.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No stock report data available.
      </p>
    );
  }

  return (
    <div className="data-table-container">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/30">
            <th className="px-6 py-3 text-left font-medium text-muted-foreground">Product</th>
            <th className="px-6 py-3 text-right font-medium text-muted-foreground">
              Current Stock
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.productId} className="border-b last:border-0 hover:bg-muted/20">
              <td className="px-6 py-3 font-medium">{item.productName}</td>
              <td className="px-6 py-3 text-right">{item.currentStock}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
