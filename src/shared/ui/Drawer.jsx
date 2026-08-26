import { useEffect, useId, useRef } from 'react';
import { cva } from 'class-variance-authority';
import { CloseCircle } from 'reicon-react';
import { cn } from '@/shared/lib/cn';
import { Icon } from './Icon.jsx';

const drawerVariants = cva(
  'flex h-full w-full flex-col border-l border-[var(--border-strong)] bg-[var(--card)] shadow-[var(--shadow-panel)]',
  {
    variants: {
      size: {
        sm: 'max-w-[360px]',
        md: 'max-w-[440px]',
        lg: 'max-w-[640px]',
      },
    },
    defaultVariants: { size: 'md' },
  },
);

export function Drawer({ open, onClose, title, description, children, className, size }) {
  const drawerRef = useRef(null);
  const closeButtonRef = useRef(null);
  const previousActiveElementRef = useRef(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return undefined;

    previousActiveElementRef.current = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
      if (event.key !== 'Tab' || !drawerRef.current) return;

      const focusable = drawerRef.current.querySelectorAll(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);

    const timer = window.setTimeout(() => closeButtonRef.current?.focus(), 0);
    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
      previousActiveElementRef.current?.focus?.();
    };
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-[var(--overlay)]"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && onClose?.()}
    >
      <aside
        ref={drawerRef}
        className={cn(drawerVariants({ size }), className)}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
      >
        <header className="flex items-start justify-between border-b border-[var(--border)] px-6 py-5">
          <div>
            <h2
              id={titleId}
              className="text-[length:var(--font-size-subtitle1)] font-bold text-[color:var(--foreground)]"
            >
              {title}
            </h2>
            {description && (
              <p
                id={descriptionId}
                className="mt-1 text-[length:var(--font-size-meta)] text-[color:var(--muted-foreground)]"
              >
                {description}
              </p>
            )}
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className="rounded-md p-2 text-[color:var(--muted-foreground)] hover:bg-[var(--primary-soft)] hover:text-[color:var(--primary)]"
            onClick={onClose}
            aria-label="상세 닫기"
          >
            <Icon icon={CloseCircle} size={19} />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-auto px-6 py-5">{children}</div>
      </aside>
    </div>
  );
}

export { drawerVariants };
