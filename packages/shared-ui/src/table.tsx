import React, { type ReactNode, type TableHTMLAttributes } from 'react';
import { cn } from '@shared/utils';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (item: T) => ReactNode;
  className?: string;
  headerClassName?: string;
}

interface TableProps<T> extends TableHTMLAttributes<HTMLTableElement> {
  columns: Column<T>[];
  data: T[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  onRowClick?: (item: T) => void;
  emptyState?: ReactNode;
  isLoading?: boolean;
  rowKey: (item: T) => string;
}

export function Table<T>({
  columns,
  data,
  sortBy,
  sortOrder = 'asc',
  onSort,
  onRowClick,
  emptyState,
  isLoading,
  rowKey,
  className,
  ...props
}: TableProps<T>) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn('min-w-full divide-y divide-gray-200', className)} {...props}>
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500',
                  col.sortable && 'cursor-pointer select-none hover:text-gray-700',
                  col.headerClassName,
                )}
                onClick={() => col.sortable && onSort?.(col.key)}
              >
                <div className="flex items-center gap-1">
                  {col.header}
                  {col.sortable && (
                    <span className="inline-flex flex-col">
                      {sortBy === col.key ? (
                        sortOrder === 'asc' ? (
                          <ChevronUp size={14} />
                        ) : (
                          <ChevronDown size={14} />
                        )
                      ) : (
                        <ChevronsUpDown size={14} className="text-gray-400" />
                      )}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, idx) => (
              <tr key={`skeleton-${idx}`}>
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3">
                    <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-sm text-gray-500">
                {emptyState || 'No data available'}
              </td>
            </tr>
          ) : (
            data.map((item) => (
              <tr
                key={rowKey(item)}
                className={cn(
                  'transition-colors',
                  onRowClick && 'cursor-pointer hover:bg-gray-50',
                )}
                onClick={() => onRowClick?.(item)}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn('whitespace-nowrap px-4 py-3 text-sm text-gray-900', col.className)}
                  >
                    {col.render ? col.render(item) : (item as Record<string, unknown>)[col.key] as ReactNode}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
