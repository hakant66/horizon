import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export type Column<T> = {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  /** If true this column is hidden on mobile (<640px) */
  hideOnMobile?: boolean;
};

/**
 * DataTable renders a scrollable table on md+ screens.
 * On mobile it renders a stacked card list for each row instead,
 * using only the visible columns.
 */
export function DataTable<T>({ data, columns }: { data: T[]; columns: Column<T>[] }) {
  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-400">
        No data
      </div>
    );
  }

  return (
    <>
      {/* ── Table — visible on sm+ ── */}
      <div className="hidden sm:block overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.key} className={column.hideOnMobile ? "hidden md:table-cell" : ""}>
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, index) => (
              <TableRow key={index}>
                {columns.map((column) => (
                  <TableCell
                    key={`${column.key}-${index}`}
                    className={column.hideOnMobile ? "hidden md:table-cell" : ""}
                  >
                    {column.render(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* ── Card list — visible on xs only ── */}
      <div className="sm:hidden space-y-2">
        {data.map((row, index) => (
          <div key={index} className="rounded-lg border border-slate-200 bg-white p-3 space-y-1.5">
            {columns.map((column) => (
              <div key={column.key} className="flex items-start justify-between gap-2 text-sm">
                <span className="shrink-0 text-xs text-slate-500 min-w-20">{column.header}</span>
                <span className="text-right text-slate-800">{column.render(row)}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}
