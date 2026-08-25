import { ChevronDown, ChevronUp, CircleSortV } from 'reicon-react';

export function SortIcon({ direction }) {
  if (direction === 'asc') {
    return <ChevronUp size={13} aria-hidden="true" className="text-[color:var(--primary)]" />;
  }
  if (direction === 'desc') {
    return <ChevronDown size={13} aria-hidden="true" className="text-[color:var(--primary)]" />;
  }
  return <CircleSortV size={13} aria-hidden="true" className="text-gray-400 opacity-60" />;
}

export function SortHeaderButton({ label, field, currentSort, onSortChange, align = 'left' }) {
  const [currentField, currentDir] = (currentSort || '').split(',');
  const isSorted = currentField === field ? currentDir : false;
  const defaultDirection =
    field === 'riskGrade' || field === 'shortageYn' || field === 'nearestExpiryDays' ? 'asc' : 'desc';

  const handleToggle = () => {
    if (!isSorted) {
      onSortChange?.(`${field},${defaultDirection}`);
    } else if (isSorted === 'desc') {
      onSortChange?.(`${field},asc`);
    } else {
      onSortChange?.(`${field},desc`);
    }
  };

  const justifyClass = align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start';
  const nextDirection = isSorted ? (isSorted === 'desc' ? 'asc' : 'desc') : defaultDirection;

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={`${label} ${nextDirection === 'asc' ? '오름차순' : '내림차순'} 정렬`}
      aria-pressed={Boolean(isSorted)}
      title={`${label} 정렬: ${nextDirection === 'asc' ? '오름차순' : '내림차순'}으로 변경`}
      className={`-mx-1.5 inline-flex min-h-7 items-center gap-1 whitespace-nowrap rounded-[var(--radius-control,0.375rem)] px-1.5 transition-colors hover:bg-[var(--primary-soft)] hover:text-[color:var(--primary-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] ${justifyClass} ${
        isSorted ? 'text-[color:var(--primary-strong)] font-bold' : 'text-gray-500 font-semibold'
      }`}
    >
      <span>{label}</span>
      <SortIcon direction={isSorted} />
    </button>
  );
}
