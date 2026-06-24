import type { ReactNode } from "react";

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField: keyof T & string;
  emptyMessage?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyField,
  emptyMessage = "No records found",
}: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-[var(--text-muted)]">{emptyMessage}</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-[var(--border-default)]">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`pb-3 pr-4 font-medium text-[var(--text-muted)] ${col.className ?? ""}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr
              key={String(row[keyField])}
              className="border-b border-[var(--border-subtle)] transition-colors hover:bg-[var(--bg-muted)]/50"
            >
              {columns.map((col) => (
                <td key={col.key} className={`py-3.5 pr-4 ${col.className ?? ""}`}>
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
