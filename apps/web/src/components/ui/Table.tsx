import type { ReactNode } from "react";

interface TableColumn<T> {
  header: string;
  accessor: (item: T) => ReactNode;
}

interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
}

export default function Table<T>({ columns, data }: TableProps<T>) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            {columns.map((column) => (
              <th key={column.header} className="px-4 py-3 text-left font-semibold text-slate-700">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {data.map((row, index) => (
            <tr key={index} className="hover:bg-slate-50">
              {columns.map((column) => (
                <td key={column.header} className="px-4 py-3 text-slate-600">
                  {column.accessor(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
