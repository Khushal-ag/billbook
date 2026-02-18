interface ProductSalesRow {
  productId: number;
  productName: string;
  totalQuantity: string | number;
  totalAmount: string;
}

export function ProductSalesTable({ rows }: { rows: ProductSalesRow[] }) {
  return (
    <div className="data-table-container">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/30">
            <th className="px-6 py-3 text-left font-medium text-muted-foreground">Product</th>
            <th className="px-3 py-3 text-right font-medium text-muted-foreground">Qty Sold</th>
            <th className="px-6 py-3 text-right font-medium text-muted-foreground">Total Amount</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.productId} className="border-b last:border-0 hover:bg-muted/20">
              <td className="px-6 py-3 font-medium">{row.productName}</td>
              <td className="px-3 py-3 text-right">{row.totalQuantity}</td>
              <td className="px-6 py-3 text-right font-medium">₹{row.totalAmount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
