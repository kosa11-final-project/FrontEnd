import { useState } from 'react';
import {
  ArrowDown2,
  ArrowUp2,
  CircleSortV,
} from 'reicon-react';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { cn } from '@/shared/lib/cn';
import { Icon } from './Icon.jsx';
import { Table, TableElement } from './Table.jsx';

const headerCellClass = 'border-b border-[var(--border)] bg-[var(--surface-subtle)] px-4 py-3 text-left align-middle text-[var(--font-size-meta)] font-[var(--font-weight-semibold)] text-[var(--text-muted)]';
const bodyCellClass = 'border-b border-[var(--border)] px-4 py-3 align-middle text-[var(--font-size-body-sm)] text-[var(--text-body)]';

const alignClasses = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

function getColumnMeta(column) {
  return column.columnDef.meta ?? {};
}
function getAlignClass(align) {
  return alignClasses[align] ?? alignClasses.left;
}

function SortIcon({ direction }) {
  if (direction === 'asc') return <Icon icon={ArrowUp2} size={14} aria-hidden="true" />;
  if (direction === 'desc') return <Icon icon={ArrowDown2} size={14} aria-hidden="true" />;
  return <Icon icon={CircleSortV} size={14} aria-hidden="true" />;
}

function SortButton({ column, children }) {
  const direction = column.getIsSorted();
  const label = direction === 'asc' ? '오름차순 정렬 해제' : direction === 'desc' ? '내림차순 정렬 해제' : '오름차순 정렬';

  return (
    <button
      type="button"
      className="inline-flex min-h-7 items-center gap-1 rounded-[var(--radius-control)] px-1.5 -mx-1.5 text-left transition-colors hover:bg-[var(--primary-soft)] hover:text-[var(--primary-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
      onClick={column.getToggleSortingHandler()}
      aria-label={`${column.columnDef.header ?? column.id} ${label}`}
    >
      <span>{children}</span>
      <SortIcon direction={direction} />
    </button>
  );
}

/**
 * TanStack Table 기반의 표현 전용 테이블입니다.
 * 컬럼 정의와 데이터는 호출부에서 주입하므로 도메인별 표를 같은 껍데기로 구성할 수 있습니다.
 */
export function DataTable({
  columns = [],
  data = [],
  density = 'default',
  surface = 'bordered',
  layout = 'auto',
  caption,
  ariaLabel,
  getRowId,
  enableSorting = true,
  manualSorting = false,
  sorting,
  initialSorting = [],
  onSortingChange,
  loading = false,
  error = null,
  emptyMessage = '표시할 데이터가 없습니다.',
  loadingMessage = '데이터를 불러오는 중입니다.',
  errorMessage = '데이터를 불러오지 못했습니다.',
  onRowClick,
  rowClassName,
  className,
}) {
  const [internalSorting, setInternalSorting] = useState(initialSorting);
  const sortingState = sorting ?? internalSorting;

  const handleSortingChange = (updater) => {
    const nextSorting = typeof updater === 'function' ? updater(sortingState) : updater;
    if (sorting === undefined) setInternalSorting(nextSorting);
    onSortingChange?.(nextSorting);
  };

  const table = useReactTable({
    data,
    columns,
    state: { sorting: sortingState },
    onSortingChange: handleSortingChange,
    getRowId,
    enableSorting,
    sortDescFirst: false,
    manualSorting,
    getCoreRowModel: getCoreRowModel(),
    ...(manualSorting ? {} : { getSortedRowModel: getSortedRowModel() }),
  });

  const headerGroups = table.getHeaderGroups();
  const rows = table.getRowModel().rows;
  const columnCount = Math.max(headerGroups[0]?.headers.length ?? columns.length, 1);
  const stateMessage = error ? (typeof error === 'string' ? error : errorMessage) : loading ? loadingMessage : emptyMessage;
  const isEmpty = !loading && !error && rows.length === 0;

  return (
    <Table density={density} surface={surface} className={cn('overflow-hidden', className)}>
      <TableElement layout={layout} aria-label={ariaLabel}>
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <thead>
          {headerGroups.map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const meta = getColumnMeta(header.column);
                const align = getAlignClass(meta.align);
                return (
                  <th
                    key={header.id}
                    scope="col"
                    className={cn(headerCellClass, align, meta.headerClassName)}
                    style={meta.width ? { width: meta.width } : undefined}
                    colSpan={header.colSpan}
                    aria-sort={header.column.getIsSorted() === 'asc' ? 'ascending' : header.column.getIsSorted() === 'desc' ? 'descending' : 'none'}
                  >
                    {header.isPlaceholder ? null : header.column.getCanSort() ? (
                      <SortButton column={header.column}>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </SortButton>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {loading || error || isEmpty ? (
            <tr>
              <td colSpan={columnCount} className="px-4 py-12 text-center text-[var(--font-size-body-sm)] text-[var(--text-muted)]" aria-live="polite">
                {stateMessage}
              </td>
            </tr>
          ) : (
            rows.map((row, rowIndex) => {
              const clickable = Boolean(onRowClick);
              return (
                <tr
                  key={row.id}
                  className={cn(
                    'transition-colors last:[&>td]:border-b-0',
                    clickable && 'cursor-pointer hover:bg-[var(--primary-faint)] focus-within:bg-[var(--primary-faint)]',
                    rowClassName?.(row, rowIndex),
                  )}
                  tabIndex={clickable ? 0 : undefined}
                  onClick={clickable ? () => onRowClick(row.original, row) : undefined}
                  onKeyDown={clickable ? (event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      onRowClick(row.original, row);
                    }
                  } : undefined}
                >
                  {row.getVisibleCells().map((cell) => {
                    const meta = getColumnMeta(cell.column);
                    return (
                      <td key={cell.id} className={cn(bodyCellClass, getAlignClass(meta.align), meta.cellClassName)}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    );
                  })}
                </tr>
              );
            })
          )}
        </tbody>
      </TableElement>
    </Table>
  );
}
