import { useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { DayPicker } from '@daypicker/react';
import { ko } from '@daypicker/react/locale';
import '@daypicker/react/style.css';
import { Calendar, ChevronDown } from 'reicon-react';
import { formatDate } from '@/shared/lib/format';
import { Button, Icon } from '@/shared/ui';
import { MAX_STATISTICS_RANGE_DAYS } from '../model/statisticsModel.js';

function parseDateOnly(value) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatDateOnly(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toDateRange(range) {
  return {
    from: parseDateOnly(range.from),
    to: parseDateOnly(range.to),
  };
}

function getInclusiveDayCount(range) {
  if (!range?.from || !range?.to) return 0;
  const from = Date.UTC(range.from.getFullYear(), range.from.getMonth(), range.from.getDate());
  const to = Date.UTC(range.to.getFullYear(), range.to.getMonth(), range.to.getDate());
  return Math.floor(Math.abs(to - from) / 86_400_000) + 1;
}

export function StatisticsDateRangePicker({ range, maxDate, onChange }) {
  const [open, setOpen] = useState(false);
  const [draftRange, setDraftRange] = useState(() => toDateRange(range));
  const draftDayCount = getInclusiveDayCount(draftRange);
  const isRangeValid = Boolean(draftRange?.from && draftRange?.to && draftDayCount <= MAX_STATISTICS_RANGE_DAYS);

  function changeOpen(nextOpen) {
    setOpen(nextOpen);
    if (nextOpen) setDraftRange(toDateRange(range));
  }

  function applyRange() {
    if (!draftRange?.from || !draftRange?.to) return;
    onChange({ from: formatDateOnly(draftRange.from), to: formatDateOnly(draftRange.to) });
    setOpen(false);
  }

  return (
    <Popover.Root open={open} onOpenChange={changeOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label="통계 조회 기간 선택"
          className="flex h-11 min-w-[292px] items-center gap-3 rounded-[var(--radius-control)] border border-[var(--input)] bg-[var(--surface-subtle)] px-3 text-left outline-none transition-[background-color,border-color,box-shadow] hover:bg-[var(--card)] focus-visible:border-[var(--ring)] focus-visible:ring-2 focus-visible:ring-[var(--ring-soft)] data-[state=open]:border-[var(--ring)] data-[state=open]:bg-[var(--card)] data-[state=open]:ring-2 data-[state=open]:ring-[var(--ring-soft)]"
        >
          <span className="grid size-7 shrink-0 place-items-center rounded-[var(--radius-control)] bg-[var(--primary-soft)] text-[color:var(--primary)]">
            <Icon icon={Calendar} size={15} aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[10px] font-[var(--font-weight-medium)] text-[color:var(--text-muted)]">
              조회 기간
            </span>
            <strong className="mt-0.5 block whitespace-nowrap text-[length:var(--font-size-meta)] text-[color:var(--text-heading)]">
              {formatDate(range.from)} — {formatDate(range.to)}
            </strong>
          </span>
          <Icon icon={ChevronDown} size={15} className="shrink-0 text-[color:var(--text-muted)]" aria-hidden="true" />
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={8}
          collisionPadding={12}
          className="z-50 rounded-[var(--radius-panel)] border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow-panel)] outline-none"
        >
          <div className="mb-3">
            <strong className="block text-[length:var(--font-size-body)] text-[color:var(--text-heading)]">
              조회 기간 선택
            </strong>
            <span className="mt-1 block text-[length:var(--font-size-meta)] text-[color:var(--text-muted)]">
              시작일과 종료일을 선택해 주세요. 최대 1년까지 조회할 수 있습니다.
            </span>
          </div>

          <DayPicker
            mode="range"
            locale={ko}
            selected={draftRange}
            onSelect={setDraftRange}
            max={MAX_STATISTICS_RANGE_DAYS}
            defaultMonth={draftRange?.from}
            disabled={maxDate ? { after: parseDateOnly(maxDate) } : undefined}
            numberOfMonths={2}
            resetOnSelect
            showOutsideDays
            fixedWeeks
            className="statistics-range-calendar"
          />

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-3">
            <span className="text-[length:var(--font-size-meta)] font-[var(--font-weight-semibold)] text-[color:var(--text-heading)]">
              {draftRange?.from ? formatDate(formatDateOnly(draftRange.from)) : '시작일 선택'}
              {' — '}
              {draftRange?.to ? formatDate(formatDateOnly(draftRange.to)) : '종료일 선택'}
            </span>
            <div className="flex gap-2">
              <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
                취소
              </Button>
              <Button type="button" size="sm" disabled={!isRangeValid} onClick={applyRange}>
                적용
              </Button>
            </div>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
