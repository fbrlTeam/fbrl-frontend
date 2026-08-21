import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';

interface Column<T> {
  key: string;
  header: string;
  render: (item: T) => ReactNode;
  /** 금액·수량 등 우측 정렬이 필요한 열 */
  align?: 'left' | 'right';
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  page: number;
  totalPages: number;
  totalElements: number;
  onPageChange: (page: number) => void;
  onRowClick?: (item: T) => void;
  loading?: boolean;
  emptyMessage?: string;
}

export default function DataTable<T>({
  columns,
  data,
  page,
  totalPages,
  totalElements,
  onPageChange,
  onRowClick,
  loading = false,
  emptyMessage = '데이터가 없습니다',
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="panel p-14 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-navy-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="panel p-14 text-center">
        <p className="text-[13px] text-ink-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="panel overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-canvas border-b border-line">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-2.5 text-[11px] font-semibold text-ink-500 whitespace-nowrap ${
                    col.align === 'right' ? 'text-right' : 'text-left'
                  } ${col.className || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, idx) => (
              <tr
                key={idx}
                onClick={onRowClick ? () => onRowClick(item) : undefined}
                className={`border-b border-line-soft last:border-0 transition-colors duration-100 ${
                  onRowClick ? 'cursor-pointer hover:bg-navy-50/40' : 'hover:bg-canvas/60'
                }`}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-4 py-3 text-[12.5px] text-ink-700 ${
                      col.align === 'right' ? 'text-right' : 'text-left'
                    } ${col.className || ''}`}
                  >
                    {col.render(item)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between px-4 py-2.5 border-t border-line bg-canvas/50">
        <span className="text-[11.5px] text-ink-500">
          전체 <span className="font-semibold text-ink-700 tnum">{totalElements.toLocaleString()}</span>건
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 0}
            className="w-7 h-7 flex items-center justify-center rounded border border-line text-ink-500 hover:bg-white hover:text-ink-800 disabled:opacity-35 disabled:hover:bg-transparent transition-colors duration-150"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="text-[11.5px] text-ink-600 px-2.5 min-w-[60px] text-center tnum">
            {page + 1} / {totalPages || 1}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages - 1}
            className="w-7 h-7 flex items-center justify-center rounded border border-line text-ink-500 hover:bg-white hover:text-ink-800 disabled:opacity-35 disabled:hover:bg-transparent transition-colors duration-150"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
