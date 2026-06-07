import type { ReactNode } from 'react';

interface Column<T> {
  key: string;
  title: string;
  render?: (value: unknown, record: T, index: number) => ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey?: string | ((record: T) => string);
  className?: string;
  striped?: boolean;
  hoverable?: boolean;
  compact?: boolean;
}

export default function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  rowKey = 'id',
  className = '',
  striped = true,
  hoverable = true,
  compact = false,
}: DataTableProps<T>) {
  const getRowKey = (record: T, index: number): string => {
    if (typeof rowKey === 'function') {
      return rowKey(record);
    }
    return (record[rowKey] as string) || String(index);
  };

  const getCellValue = (record: T, key: string): unknown => {
    return key.split('.').reduce((obj, k) => {
      if (obj && typeof obj === 'object') {
        return (obj as Record<string, unknown>)[k];
      }
      return undefined;
    }, record as unknown);
  };

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`
                  ${compact ? 'px-3 py-2' : 'px-4 py-3'}
                  text-xs font-medium text-gray-500 uppercase tracking-wider
                  ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}
                `}
                style={{ width: col.width }}
              >
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.map((record, index) => (
            <tr
              key={getRowKey(record, index)}
              className={`
                ${striped && index % 2 === 1 ? 'bg-gray-50/50' : ''}
                ${hoverable ? 'hover:bg-gray-50 transition-colors' : ''}
              `}
            >
              {columns.map((col) => {
                const value = getCellValue(record, col.key);
                return (
                  <td
                    key={col.key}
                    className={`
                      ${compact ? 'px-3 py-2' : 'px-4 py-3'}
                      text-sm text-gray-900
                      ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}
                    `}
                  >
                    {col.render ? col.render(value, record, index) : String(value ?? '-')}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
