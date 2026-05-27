import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export type Column<T> = {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  hideOnMobile?: boolean;
};

function rowKey<T>(row: T, index: number): string {
  if (row && typeof row === "object" && "id" in row && typeof (row as Record<string, unknown>).id === "string") {
    return (row as Record<string, unknown>).id as string;
  }
  return String(index);
}

export function DataTable<T>({ data, columns }: { data: T[]; columns: Column<T>[] }) {
  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-400">
        No data to display
      </div>
    );
  }

  return (
    <>
      {/* ── Table (sm+) ── */}
      <div className="hidden sm:block overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.key} className={col.hideOnMobile ? "hidden md:table-cell" : ""}>
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, index) => (
              <TableRow key={rowKey(row, index)}>
                {columns.map((col) => (
                  <TableCell key={col.key} className={col.hideOnMobile ? "hidden md:table-cell" : ""}>
                    {col.render(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* ── Stacked cards (xs only) ── */}
      <div className="sm:hidden space-y-2">
        {data.map((row, index) => (
          <div key={rowKey(row, index)} className="rounded-lg border border-slate-200 bg-white p-3 space-y-1.5">
            {columns.map((col) => (
              <div key={col.key} className="flex items-start justify-between gap-2 text-sm">
                <span className="shrink-0 text-xs text-slate-500 min-w-20">{col.header}</span>
                <span className="text-right text-slate-800">{col.render(row)}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}
